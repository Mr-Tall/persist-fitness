"use client";

import { useMemo, useState } from "react";
import {
  HealthSyncCoordinator,
  createLocalHealthStorage,
  useHealthProvider,
  type HealthStrengthWorkout,
} from "@/lib/health";

export function WorkoutHealthSync({ workout }: { workout: HealthStrengthWorkout }) {
  const provider = useHealthProvider();
  const coordinator = useMemo(
    () => new HealthSyncCoordinator(provider, createLocalHealthStorage()),
    [provider],
  );
  const preference = coordinator.storage.getPreference();
  const [dismissed, setDismissed] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  if (
    dismissed ||
    !coordinator.provider.available ||
    preference?.showWorkoutPrompt === false
  ) return null;

  async function sync() {
    setPending(true);
    setMessage("");
    try {
      const status = await coordinator.permissions.getStatus();
      if (status.permissions.strength_workouts !== "granted") {
        const connected = await coordinator.connect({
          read: [],
          write: ["strength_workouts"],
        });
        if (connected.permissions.strength_workouts !== "granted") {
          throw new Error("Strength workout permission was not granted.");
        }
      }
      await coordinator.syncCompletedWorkout(workout);
      if (coordinator.provider.kind !== "unavailable") {
        coordinator.storage.setPreference({
          provider: coordinator.provider.kind,
          showWorkoutPrompt: true,
        });
      }
      setMessage(`Synced to ${coordinator.provider.displayName}.`);
    } catch {
      setMessage(
        `Could not sync to ${coordinator.provider.displayName}. The workout is queued locally for a manual retry.`,
      );
    } finally {
      setPending(false);
    }
  }

  function stopOffering() {
    if (coordinator.provider.kind !== "unavailable") {
      coordinator.storage.setPreference({
        provider: coordinator.provider.kind,
        showWorkoutPrompt: false,
      });
    }
    setDismissed(true);
  }

  return (
    <section
      aria-labelledby="workout-health-sync-heading"
      className="mt-4 rounded-2xl border border-border bg-surface p-4"
    >
      <h2 id="workout-health-sync-heading" className="text-base font-black text-white">
        Add this workout to {coordinator.provider.displayName}?
      </h2>
      <p className="mt-1 text-sm leading-6 text-text-muted">
        Sync is always manual. Persist will export only this completed strength workout.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => void sync()}
          className="min-h-12 rounded-xl bg-action px-4 font-black text-action-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60"
        >
          {pending ? "Syncing..." : `Sync to ${coordinator.provider.displayName}`}
        </button>
        <button
          type="button"
          onClick={stopOffering}
          className="min-h-12 rounded-xl px-4 font-bold text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          Don&apos;t offer again
        </button>
      </div>
      {message && (
        <p role="status" aria-live="polite" className="mt-3 text-sm font-bold text-text-secondary">
          {message}
        </p>
      )}
    </section>
  );
}
