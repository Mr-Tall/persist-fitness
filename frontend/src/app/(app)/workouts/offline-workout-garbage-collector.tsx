"use client";

import { useEffect } from "react";
import { removeInactiveWorkoutData } from "@/lib/offline-workout/storage";

export function OfflineWorkoutGarbageCollector({
  userId,
  activeWorkoutIds,
}: {
  userId: string;
  activeWorkoutIds: string[];
}) {
  useEffect(() => {
    void removeInactiveWorkoutData(userId, activeWorkoutIds);
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.ready.then((registration) => {
        registration.active?.postMessage({
          type: "PRUNE_ACTIVE_WORKOUTS",
          workoutIds: activeWorkoutIds,
        });
      });
    }
  }, [activeWorkoutIds, userId]);
  return null;
}
