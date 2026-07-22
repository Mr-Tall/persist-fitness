"use client";

import { useState } from "react";
import { useOfflineWorkout } from "./workout-experience-provider";
import { FeedbackDialog } from "@/components/feedback/feedback-dialog";

function conflictCategory(code?: string) {
  if (code === "WORKOUT_FINISHED") return "workout_finished";
  if (code === "SET_DELETED") return "set_deleted";
  if (code === "EXERCISE_DELETED") return "exercise_deleted";
  if (code === "INVALID_TRACKING") return "tracking_changed";
  return "unknown";
}

const labels = {
  saved: "Saved",
  saving: "Saving",
  offline: "Offline",
  pending: "Changes pending",
  syncing: "Syncing",
  issue: "Sync issue",
} as const;

export function WorkoutSyncIndicator() {
  const offline = useOfflineWorkout();
  const [hiddenConflicts, setHiddenConflicts] = useState<string[]>([]);
  if (!offline) return null;
  const visibleConflicts = offline.conflicts.filter(
    (mutation) => !hiddenConflicts.includes(mutation.clientMutationId),
  );

  return (
    <aside aria-label="Workout sync" className="mt-3 rounded-2xl border border-border bg-surface px-3 py-2.5">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <p aria-live="polite" aria-atomic="true" className="text-xs font-bold text-text-secondary">
          {labels[offline.status]}
          {offline.pendingCount > 0
            ? ` · ${offline.pendingCount} pending ${offline.pendingCount === 1 ? "change" : "changes"}`
            : ""}
        </p>
        {offline.pendingCount > 0 && offline.isOnline && offline.status !== "syncing" && (
          <button type="button" onClick={() => void offline.syncNow()} className="min-h-11 rounded-xl px-3 text-xs font-black text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            Sync now
          </button>
        )}
      </div>

      {visibleConflicts.map((mutation) => (
        <div key={mutation.clientMutationId} role="alert" data-sensitive data-ph-no-capture data-sentry-mask className="mt-2 border-t border-warning/20 pt-2 text-xs text-warning">
          <p>{mutation.conflict?.message}</p>
          <div className="mt-2 flex gap-2">
            <button type="button" className="min-h-11 rounded-xl border border-warning/30 px-3 font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" onClick={() => void offline.dismissConflict(mutation.clientMutationId)}>
              Retry
            </button>
            <button type="button" className="min-h-11 rounded-xl px-3 font-bold text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" onClick={() => setHiddenConflicts((current) => [...current, mutation.clientMutationId])}>
              Keep for later
            </button>
            <FeedbackDialog
              initialCategory="bug"
              conflictCategory={conflictCategory(mutation.conflict?.code)}
              triggerLabel="Report sync issue"
            />
          </div>
        </div>
      ))}
    </aside>
  );
}
