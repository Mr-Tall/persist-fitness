"use client";

import { useEffect } from "react";
import { removeWorkoutOfflineData } from "@/lib/offline-workout/storage";

export function OfflineWorkoutCleanup({
  userId,
  workoutId,
}: {
  userId: string;
  workoutId: string;
}) {
  useEffect(() => {
    void removeWorkoutOfflineData(userId, workoutId);
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.ready.then((registration) => {
        registration.active?.postMessage({
          type: "REMOVE_ACTIVE_WORKOUT",
          url: window.location.href,
        });
      });
    }
  }, [userId, workoutId]);
  return null;
}
