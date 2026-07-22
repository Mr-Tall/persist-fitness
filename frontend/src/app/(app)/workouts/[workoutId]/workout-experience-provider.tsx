"use client";

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { syncOfflineWorkoutMutation } from "@/app/actions/offline-workout";
import {
  enqueueWorkoutMutation,
  getWorkoutSnapshot,
  listWorkoutMutations,
  removeOtherUsersWorkoutData,
  replaceWorkoutMutation,
  saveWorkoutSnapshot,
} from "@/lib/offline-workout/storage";
import {
  applyOptimisticDelete,
  applyOptimisticEdit,
  createOptimisticAdd,
} from "@/lib/offline-workout/optimistic";
import { synchronizeWorkoutQueue } from "@/lib/offline-workout/sync";
import {
  createOfflineId,
  type OfflineSetValues,
  type OfflineWorkoutMutation,
  type OfflineWorkoutSnapshot,
  type WorkoutSyncStatus,
} from "@/lib/offline-workout/types";
import { captureProductEvent } from "@/lib/analytics/client";
import { NATIVE_RESUME_EVENT } from "@/lib/native/lifecycle";

function mutationBucket(count: number) {
  if (count <= 1) return "1" as const;
  if (count <= 3) return "2-3" as const;
  if (count <= 10) return "4-10" as const;
  return "11+" as const;
}

type WorkoutTimerContextValue = {
  controlsOpen: boolean;
  isRunning: boolean;
  openControls: () => void;
  reset: () => void;
  secondsLeft: number;
  setControlsOpen: (open: boolean) => void;
  setPreset: (seconds: number) => void;
  toggleRunning: () => void;
};

const WorkoutTimerContext = createContext<WorkoutTimerContextValue | null>(null);

type WorkoutOfflineContextValue = {
  snapshot: OfflineWorkoutSnapshot | null;
  pendingCount: number;
  conflicts: OfflineWorkoutMutation[];
  status: WorkoutSyncStatus;
  isOnline: boolean;
  addSetOffline: (workoutExerciseId: string, values: OfflineSetValues) => Promise<number>;
  editSetOffline: (workoutExerciseId: string, setId: string, values: OfflineSetValues) => Promise<void>;
  deleteSetOffline: (workoutExerciseId: string, setId: string) => Promise<void>;
  dismissConflict: (clientMutationId: string) => Promise<void>;
  markSaving: () => void;
  markSaved: () => void;
  syncNow: () => Promise<void>;
};

const WorkoutOfflineContext = createContext<WorkoutOfflineContextValue | null>(null);

export function formatRestTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export function WorkoutExperienceProvider({
  children,
  initialSnapshot = null,
}: {
  children: ReactNode;
  initialSnapshot?: OfflineWorkoutSnapshot | null;
}) {
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [isRunning, setIsRunning] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [queue, setQueue] = useState<OfflineWorkoutMutation[]>([]);
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine,
  );
  const [syncStatus, setSyncStatus] = useState<WorkoutSyncStatus>("saved");
  const [offlineReady, setOfflineReady] = useState(initialSnapshot === null);
  const syncingRef = useRef(false);

  const refreshQueue = useCallback(async () => {
    if (!initialSnapshot) return [];
    const pending = await listWorkoutMutations(
      initialSnapshot.userId,
      initialSnapshot.workoutId,
    );
    setQueue(pending);
    return pending;
  }, [initialSnapshot]);

  const syncNow = useCallback(async () => {
    if (!snapshot || !navigator.onLine || syncingRef.current) return;
    syncingRef.current = true;
    setSyncStatus("syncing");
    try {
      const result = await synchronizeWorkoutQueue({
        snapshot,
        send: syncOfflineWorkoutMutation,
        onSnapshot: setSnapshot,
      });
      setSnapshot(result.snapshot);
      setQueue(result.remaining);
      const synchronizedCount = Math.max(0, queue.length - result.remaining.length);
      if (synchronizedCount > 0) {
        captureProductEvent("offline_changes_synced", {
          mutation_count: mutationBucket(synchronizedCount),
        });
      }
      const conflict = result.remaining.find((mutation) => mutation.conflict)?.conflict;
      if (conflict) {
        const categories = {
          WORKOUT_FINISHED: "workout_finished",
          SET_DELETED: "set_deleted",
          EXERCISE_DELETED: "exercise_deleted",
          INVALID_TRACKING: "tracking_changed",
          UNKNOWN: "unknown",
        } as const;
        captureProductEvent("offline_sync_conflict", {
          conflict_category: categories[conflict.code],
        });
      }
      setSyncStatus(
        result.remaining.some((mutation) => mutation.conflict)
          ? "issue"
          : result.remaining.length > 0
            ? "pending"
            : "saved",
      );
    } catch {
      setSyncStatus(navigator.onLine ? "issue" : "offline");
    } finally {
      syncingRef.current = false;
    }
  }, [queue, snapshot]);

  useEffect(() => {
    if (!initialSnapshot) return;
    let cancelled = false;
    void (async () => {
      await removeOtherUsersWorkoutData(initialSnapshot.userId);
      const pending = await refreshQueue();
      const cached = await getWorkoutSnapshot(
        initialSnapshot.userId,
        initialSnapshot.workoutId,
      );
      if (cancelled) return;
      if (pending.length > 0 && cached) setSnapshot(cached);
      else await saveWorkoutSnapshot(initialSnapshot);
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        registration.active?.postMessage({
          type: "CACHE_ACTIVE_WORKOUT",
          url: window.location.href,
          userScope: initialSnapshot.userId,
        });
      }
      if (pending.length > 0) setSyncStatus(navigator.onLine ? "pending" : "offline");
      setOfflineReady(true);
    })().catch(() => {
      if (!cancelled) {
        setSyncStatus("issue");
        setOfflineReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [initialSnapshot, refreshQueue]);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      setSyncStatus(queue.length > 0 ? "pending" : "saved");
    }
    function handleOffline() {
      setIsOnline(false);
      setSyncStatus("offline");
      captureProductEvent("offline_mode_entered", {}, {
        onceKey: initialSnapshot?.workoutId ?? "active-workout",
      });
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [initialSnapshot?.workoutId, queue.length]);

  useEffect(() => {
    if (!offlineReady || !isOnline || queue.length === 0 || queue.some((item) => item.conflict)) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void syncNow();
    });
    return () => {
      cancelled = true;
    };
  }, [isOnline, offlineReady, queue, syncNow]);

  useEffect(() => {
    const resumeSync = () => {
      if (navigator.onLine) void syncNow();
    };
    window.addEventListener(NATIVE_RESUME_EVENT, resumeSync);
    return () => window.removeEventListener(NATIVE_RESUME_EVENT, resumeSync);
  }, [syncNow]);

  const persistMutation = useCallback(async (
    nextSnapshot: OfflineWorkoutSnapshot,
    mutation: OfflineWorkoutMutation,
  ) => {
    setSnapshot(nextSnapshot);
    setQueue((current) => [...current, mutation]);
    setSyncStatus(navigator.onLine ? "pending" : "offline");
    await Promise.all([
      saveWorkoutSnapshot(nextSnapshot),
      enqueueWorkoutMutation(mutation),
    ]);
  }, []);

  const addSetOffline = useCallback(async (
    workoutExerciseId: string,
    values: OfflineSetValues,
  ) => {
    if (!snapshot) throw new Error("This workout is not available offline.");
    const optimistic = createOptimisticAdd(snapshot, workoutExerciseId, values);
    await persistMutation(optimistic.snapshot, optimistic.mutation);
    const exercise = optimistic.snapshot.exercises.find((item) => item.id === workoutExerciseId);
    return Math.max(...(exercise?.sets.map((set) => set.setNumber) ?? [1]));
  }, [persistMutation, snapshot]);

  const editSetOffline = useCallback(async (
    workoutExerciseId: string,
    setId: string,
    values: OfflineSetValues,
  ) => {
    if (!snapshot) throw new Error("This workout is not available offline.");
    const trackingType = snapshot.exercises.find(
      (item) => item.id === workoutExerciseId,
    )?.trackingType;
    if (!trackingType) throw new Error("This exercise is not available offline.");
    const mutation: OfflineWorkoutMutation = {
      clientMutationId: createOfflineId("mutation"), userId: snapshot.userId,
      workoutId: snapshot.workoutId, workoutExerciseId, trackingType, operation: "edit",
      targetSetId: setId, temporarySetId: null, values,
      clientTimestamp: Date.now(), baseUpdatedAt: snapshot.serverUpdatedAt,
      conflict: null, attempts: 0,
    };
    await persistMutation(
      applyOptimisticEdit(snapshot, workoutExerciseId, setId, values),
      mutation,
    );
  }, [persistMutation, snapshot]);

  const deleteSetOffline = useCallback(async (
    workoutExerciseId: string,
    setId: string,
  ) => {
    if (!snapshot) throw new Error("This workout is not available offline.");
    const trackingType = snapshot.exercises.find(
      (item) => item.id === workoutExerciseId,
    )?.trackingType;
    if (!trackingType) throw new Error("This exercise is not available offline.");
    const mutation: OfflineWorkoutMutation = {
      clientMutationId: createOfflineId("mutation"), userId: snapshot.userId,
      workoutId: snapshot.workoutId, workoutExerciseId, trackingType, operation: "delete",
      targetSetId: setId, temporarySetId: null, values: null,
      clientTimestamp: Date.now(), baseUpdatedAt: snapshot.serverUpdatedAt,
      conflict: null, attempts: 0,
    };
    await persistMutation(
      applyOptimisticDelete(snapshot, workoutExerciseId, setId),
      mutation,
    );
  }, [persistMutation, snapshot]);

  const dismissConflict = useCallback(async (clientMutationId: string) => {
    const mutation = queue.find((item) => item.clientMutationId === clientMutationId);
    if (!mutation) return;
    await replaceWorkoutMutation({ ...mutation, conflict: null });
    await refreshQueue();
    setSyncStatus(navigator.onLine ? "pending" : "offline");
  }, [queue, refreshQueue]);
  const markSaving = useCallback(() => setSyncStatus("saving"), []);
  const markSaved = useCallback(
    () => setSyncStatus(queue.length > 0 ? "pending" : "saved"),
    [queue.length],
  );

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          setIsRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning, secondsLeft]);

  function openControls() {
    setControlsOpen(true);
  }

  return (
    <WorkoutOfflineContext.Provider
      value={{
        snapshot,
        pendingCount: queue.length,
        conflicts: queue.filter((item) => item.conflict),
        status: syncStatus,
        isOnline,
        addSetOffline,
        editSetOffline,
        deleteSetOffline,
        dismissConflict,
        markSaving,
        markSaved,
        syncNow,
      }}
    >
    <WorkoutTimerContext.Provider
      value={{
        controlsOpen,
        isRunning,
        openControls,
        reset: () => {
          setSecondsLeft(120);
          setIsRunning(false);
        },
        secondsLeft,
        setControlsOpen,
        setPreset: (seconds) => {
          setSecondsLeft(seconds);
          setIsRunning(false);
        },
        toggleRunning: () => {
          if (secondsLeft === 0) {
            setSecondsLeft(120);
          }
          if (!isRunning) {
            captureProductEvent("rest_timer_started", {
              preset_bucket:
                secondsLeft < 60
                  ? "under_60s"
                  : secondsLeft <= 120
                    ? "60-120s"
                    : "over_120s",
            });
          }
          setIsRunning((current) => !current);
        },
      }}
    >
      {children}
    </WorkoutTimerContext.Provider>
    </WorkoutOfflineContext.Provider>
  );
}

export function useWorkoutTimer() {
  return useContext(WorkoutTimerContext);
}

export function useOfflineWorkout() {
  return useContext(WorkoutOfflineContext);
}
