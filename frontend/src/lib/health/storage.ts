import type { HealthProviderKind, HealthStrengthWorkout } from "./types";

const PREFERENCE_KEY = "persist.health.preference.v1";
const SYNC_STATE_KEY = "persist.health.sync-state.v1";
const EXPORT_QUEUE_KEY = "persist.health.export-queue.v1";

export type HealthPreference = {
  provider: Exclude<HealthProviderKind, "unavailable">;
  showWorkoutPrompt: boolean;
};

export type HealthSyncState = { lastSyncAt: string | null };

export interface HealthStorage {
  getPreference(): HealthPreference | null;
  setPreference(preference: HealthPreference): void;
  getSyncState(): HealthSyncState;
  setSyncState(state: HealthSyncState): void;
  getExportQueue(): HealthStrengthWorkout[];
  setExportQueue(queue: HealthStrengthWorkout[]): void;
  clear(): void;
}

function parse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function createLocalHealthStorage(
  storage: Storage | undefined = typeof window === "undefined" ? undefined : window.localStorage,
): HealthStorage {
  const get = (key: string) => {
    try {
      return storage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  };
  const set = (key: string, value: unknown) => {
    try {
      storage?.setItem(key, JSON.stringify(value));
    } catch {
      // Native health availability must never make the web app unusable.
    }
  };
  const remove = (key: string) => {
    try {
      storage?.removeItem(key);
    } catch {
      // Best-effort cleanup for restricted browser storage.
    }
  };

  return {
    getPreference: () =>
      parse<HealthPreference | null>(get(PREFERENCE_KEY), null),
    setPreference: (value) => set(PREFERENCE_KEY, value),
    getSyncState: () =>
      parse<HealthSyncState>(get(SYNC_STATE_KEY), { lastSyncAt: null }),
    setSyncState: (value) => set(SYNC_STATE_KEY, value),
    getExportQueue: () =>
      parse<HealthStrengthWorkout[]>(get(EXPORT_QUEUE_KEY), []),
    setExportQueue: (value) => set(EXPORT_QUEUE_KEY, value),
    clear: () => {
      remove(PREFERENCE_KEY);
      remove(SYNC_STATE_KEY);
      remove(EXPORT_QUEUE_KEY);
    },
  };
}

export function clearLocalHealthData() {
  createLocalHealthStorage().clear();
}
