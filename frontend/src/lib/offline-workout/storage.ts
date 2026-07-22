import {
  OFFLINE_WORKOUT_SNAPSHOT_TTL_MS,
  snapshotKey,
  type OfflineWorkoutMutation,
  type OfflineWorkoutSnapshot,
} from "./types";

const DATABASE_NAME = "persist-fitness-offline-workouts";
const DATABASE_VERSION = 1;
const SNAPSHOTS = "snapshots";
const MUTATIONS = "mutations";
const memorySnapshots = new Map<string, OfflineWorkoutSnapshot>();
const memoryMutations = new Map<string, OfflineWorkoutMutation>();

function hasIndexedDb() {
  return typeof indexedDB !== "undefined";
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(SNAPSHOTS)) {
        database.createObjectStore(SNAPSHOTS, { keyPath: "key" });
      }
      if (!database.objectStoreNames.contains(MUTATIONS)) {
        const store = database.createObjectStore(MUTATIONS, {
          keyPath: "clientMutationId",
        });
        store.createIndex("workout", ["userId", "workoutId"]);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transact<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
) {
  const database = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(storeName, mode);
      const request = operation(transaction.objectStore(storeName));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}

export async function saveWorkoutSnapshot(snapshot: OfflineWorkoutSnapshot) {
  if (!hasIndexedDb()) {
    memorySnapshots.set(snapshot.key, snapshot);
    return;
  }
  await transact(SNAPSHOTS, "readwrite", (store) => store.put(snapshot));
}

export async function getWorkoutSnapshot(userId: string, workoutId: string) {
  if (!hasIndexedDb()) {
    const snapshot = memorySnapshots.get(snapshotKey(userId, workoutId)) ?? null;
    if (snapshot && snapshot.expiresAt <= Date.now()) {
      await removeWorkoutOfflineData(userId, workoutId);
      return null;
    }
    return snapshot;
  }
  const snapshot = await transact<OfflineWorkoutSnapshot | undefined>(
    SNAPSHOTS,
    "readonly",
    (store) => store.get(snapshotKey(userId, workoutId)),
  );
  if (!snapshot) return null;
  if (snapshot.expiresAt <= Date.now()) {
    await removeWorkoutOfflineData(userId, workoutId);
    return null;
  }
  return snapshot;
}

export async function enqueueWorkoutMutation(mutation: OfflineWorkoutMutation) {
  if (!hasIndexedDb()) {
    memoryMutations.set(mutation.clientMutationId, mutation);
    return;
  }
  await transact(MUTATIONS, "readwrite", (store) => store.put(mutation));
}

export async function listWorkoutMutations(userId: string, workoutId: string) {
  if (!hasIndexedDb()) {
    return orderWorkoutMutations(
      [...memoryMutations.values()].filter(
        (item) => item.userId === userId && item.workoutId === workoutId,
      ),
    );
  }
  const mutations = await transact<OfflineWorkoutMutation[]>(
    MUTATIONS,
    "readonly",
    (store) => store.getAll(),
  );
  return orderWorkoutMutations(
    mutations.filter((item) => item.userId === userId && item.workoutId === workoutId),
  );
}

export function orderWorkoutMutations(mutations: OfflineWorkoutMutation[]) {
  return [...mutations].sort(
      (left, right) =>
        left.clientTimestamp - right.clientTimestamp ||
        left.clientMutationId.localeCompare(right.clientMutationId),
    );
}

export async function removeWorkoutMutation(clientMutationId: string) {
  if (!hasIndexedDb()) {
    memoryMutations.delete(clientMutationId);
    return;
  }
  await transact(MUTATIONS, "readwrite", (store) =>
    store.delete(clientMutationId),
  );
}

export async function replaceWorkoutMutation(mutation: OfflineWorkoutMutation) {
  await enqueueWorkoutMutation(mutation);
}

export async function reconcileQueuedMutationTargets(
  userId: string,
  workoutId: string,
  temporarySetId: string,
  serverSetId: string,
) {
  const mutations = await listWorkoutMutations(userId, workoutId);
  await Promise.all(
    mutations
      .filter((mutation) => mutation.targetSetId === temporarySetId)
      .map((mutation) =>
        replaceWorkoutMutation({ ...mutation, targetSetId: serverSetId }),
      ),
  );
}

export async function removeWorkoutOfflineData(userId: string, workoutId: string) {
  const mutations = await listWorkoutMutations(userId, workoutId);
  if (!hasIndexedDb()) {
    memorySnapshots.delete(snapshotKey(userId, workoutId));
    mutations.forEach((mutation) => memoryMutations.delete(mutation.clientMutationId));
    return;
  }
  await Promise.all([
    transact(SNAPSHOTS, "readwrite", (store) =>
      store.delete(snapshotKey(userId, workoutId)),
    ),
    ...mutations.map((mutation) =>
      removeWorkoutMutation(mutation.clientMutationId),
    ),
  ]);
}

export async function removeOtherUsersWorkoutData(userId: string) {
  if (!hasIndexedDb()) {
    for (const [key, snapshot] of memorySnapshots) {
      if (snapshot.userId !== userId) memorySnapshots.delete(key);
    }
    for (const [key, mutation] of memoryMutations) {
      if (mutation.userId !== userId) memoryMutations.delete(key);
    }
    return;
  }
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(
        [SNAPSHOTS, MUTATIONS],
        "readwrite",
      );
      for (const storeName of [SNAPSHOTS, MUTATIONS]) {
        const store = transaction.objectStore(storeName);
        const request = store.openCursor();
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) return;
          if ((cursor.value as { userId: string }).userId !== userId) {
            cursor.delete();
          }
          cursor.continue();
        };
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}

export async function removeInactiveWorkoutData(
  userId: string,
  activeWorkoutIds: string[],
) {
  const active = new Set(activeWorkoutIds);
  const snapshots = !hasIndexedDb()
    ? [...memorySnapshots.values()]
    : await transact<OfflineWorkoutSnapshot[]>(SNAPSHOTS, "readonly", (store) =>
        store.getAll(),
      );
  await Promise.all(
    snapshots
      .filter(
        (snapshot) =>
          snapshot.userId === userId && !active.has(snapshot.workoutId),
      )
      .map((snapshot) =>
        removeWorkoutOfflineData(snapshot.userId, snapshot.workoutId),
      ),
  );
}

export function createSnapshotExpiration(savedAt = Date.now()) {
  return savedAt + OFFLINE_WORKOUT_SNAPSHOT_TTL_MS;
}

export function clearOfflineWorkoutDatabase() {
  if (!hasIndexedDb()) {
    memorySnapshots.clear();
    memoryMutations.clear();
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });
}
