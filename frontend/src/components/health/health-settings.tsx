"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HEALTH_IMPORT_PERMISSIONS,
  HealthSyncCoordinator,
  createLocalHealthStorage,
  useHealthProvider,
  type HealthConnectionStatus,
  type HealthImportPermission,
  type HealthPermissionRequest,
} from "@/lib/health";
import { HEALTH_RESUME_EVENT } from "@/lib/native/lifecycle";

const permissionLabels: Record<HealthImportPermission, string> = {
  body_weight: "Body weight",
  completed_workouts: "Completed workouts",
  active_energy: "Active energy",
  walking_running_distance: "Walking and running distance",
};

const EMPTY_STATUS: HealthConnectionStatus = { connected: false, permissions: {} };

export function HealthSettings() {
  const provider = useHealthProvider();
  const coordinator = useMemo(
    () => new HealthSyncCoordinator(provider, createLocalHealthStorage()),
    [provider],
  );
  const [status, setStatus] = useState(EMPTY_STATUS);
  const [selectedImports, setSelectedImports] = useState<HealthImportPermission[]>([]);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const nextStatus = await coordinator.permissions.getStatus();
    setStatus(nextStatus);
    setSelectedImports(
      HEALTH_IMPORT_PERMISSIONS.filter(
        (permission) => nextStatus.permissions[permission] === "granted",
      ),
    );
    setLastSyncAt(coordinator.storage.getSyncState().lastSyncAt);
  }, [coordinator]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void refresh().catch(() => {
        if (!cancelled) {
          setMessage("Health connection status is unavailable on this device.");
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  useEffect(() => {
    const refreshAfterResume = () => void refresh().catch(() => undefined);
    window.addEventListener(HEALTH_RESUME_EVENT, refreshAfterResume);
    return () => window.removeEventListener(HEALTH_RESUME_EVENT, refreshAfterResume);
  }, [refresh]);

  async function run(operation: () => Promise<void>) {
    setPending(true);
    setMessage("");
    try {
      await operation();
    } catch {
      setMessage("Health access could not be updated. Try again from this device.");
    } finally {
      setPending(false);
    }
  }

  function toggleImport(permission: HealthImportPermission) {
    setSelectedImports((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    );
  }

  async function connect() {
    await run(async () => {
      const request: HealthPermissionRequest = {
        read: selectedImports,
        write: ["strength_workouts"],
      };
      const nextStatus = await coordinator.connect(request);
      setStatus(nextStatus);
      if (coordinator.provider.kind !== "unavailable") {
        coordinator.storage.setPreference({
          provider: coordinator.provider.kind,
          showWorkoutPrompt: true,
        });
      }
      setMessage(
        nextStatus.connected
          ? `Connected to ${coordinator.provider.displayName}.`
          : `${coordinator.provider.displayName} permissions were not granted.`,
      );
    });
  }

  async function manualSync() {
    await run(async () => {
      const result = await coordinator.manualSync(selectedImports);
      const syncedAt = coordinator.storage.getSyncState().lastSyncAt;
      setLastSyncAt(syncedAt);
      setMessage(
        `Sync complete. ${result.exportedWorkoutCount} pending workout${
          result.exportedWorkoutCount === 1 ? "" : "s"
        } exported and ${result.importedRecords.length} health record${
          result.importedRecords.length === 1 ? "" : "s"
        } read locally.`,
      );
    });
  }

  async function disconnect() {
    await run(async () => {
      await coordinator.disconnect();
      setStatus(EMPTY_STATUS);
      setSelectedImports([]);
      setLastSyncAt(null);
      setMessage(`Disconnected from ${coordinator.provider.displayName}.`);
    });
  }

  const granted = Object.entries(status.permissions)
    .filter(([, value]) => value === "granted")
    .map(([key]) => key.replaceAll("_", " "));

  return (
    <section
      aria-labelledby="health-settings-heading"
      className="mt-5 rounded-[2rem] border border-border bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary">
            Native health
          </p>
          <h2 id="health-settings-heading" className="mt-1 text-lg font-black text-white">
            Health connection
          </h2>
          <p className="mt-1 text-sm leading-6 text-text-muted">
            Health data stays on this device unless you explicitly sync it.
          </p>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-xs font-bold text-text-secondary">
          {coordinator.provider.available
            ? status.connected
              ? "Connected"
              : "Not connected"
            : "Native app required"}
        </span>
      </div>

      {coordinator.provider.available ? (
        <>
          <fieldset className="mt-5">
            <legend className="text-sm font-black text-white">Import permissions</legend>
            <p className="mt-1 text-xs leading-5 text-text-muted">
              Choose each category you want Persist to read. Nothing is imported automatically.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {HEALTH_IMPORT_PERMISSIONS.map((permission) => (
                <label
                  key={permission}
                  className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-surface-elevated px-3 text-sm font-bold text-text-secondary focus-within:ring-2 focus-within:ring-focus"
                >
                  <input
                    type="checkbox"
                    checked={selectedImports.includes(permission)}
                    onChange={() => toggleImport(permission)}
                    className="h-5 w-5 accent-action"
                  />
                  {permissionLabels[permission]}
                </label>
              ))}
            </div>
          </fieldset>

          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-bold text-text-muted">Granted permissions</dt>
              <dd className="mt-1 text-text-primary">
                {granted.length > 0 ? granted.join(", ") : "None"}
              </dd>
            </div>
            <div>
              <dt className="font-bold text-text-muted">Last sync</dt>
              <dd className="mt-1 text-text-primary">
                {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : "Never"}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              disabled={pending}
              onClick={() => void connect()}
              className="min-h-12 rounded-xl bg-action px-4 font-black text-action-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60"
            >
              {pending ? "Updating..." : status.connected ? "Reconnect permissions" : `Connect ${coordinator.provider.displayName}`}
            </button>
            {status.connected && (
              <>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void manualSync()}
                  className="min-h-12 rounded-xl border border-border px-4 font-black text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60"
                >
                  Manual sync
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void disconnect()}
                  className="min-h-12 rounded-xl px-4 font-black text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60"
                >
                  Disconnect
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        <p className="mt-4 rounded-xl border border-info/20 bg-info-soft px-4 py-3 text-sm leading-6 text-info">
          Install the native iOS or Android app to connect Apple Health or Health Connect.
        </p>
      )}

      {message && (
        <p role="status" aria-live="polite" className="mt-4 text-sm font-bold text-text-secondary">
          {message}
        </p>
      )}
    </section>
  );
}
