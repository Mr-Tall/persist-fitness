import { beforeEach, describe, expect, it, vi } from "vitest";
import { HealthPermissionManager } from "./permission-manager";
import { detectPlatform } from "./platform";
import { selectHealthProvider } from "./providers";
import type { HealthPreference, HealthStorage, HealthSyncState } from "./storage";
import { HealthSyncCoordinator } from "./sync-coordinator";
import type {
  HealthConnectionStatus,
  HealthProvider,
  HealthStrengthWorkout,
  NativeHealthBridge,
} from "./types";

const status: HealthConnectionStatus = {
  connected: true,
  permissions: { strength_workouts: "granted" },
};

function createBridge(platform: "ios" | "android"): NativeHealthBridge {
  return {
    platform,
    getStatus: vi.fn().mockResolvedValue(status),
    requestPermissions: vi.fn().mockResolvedValue(status),
    readRecords: vi.fn().mockResolvedValue([]),
    writeStrengthWorkout: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
  };
}

function createMemoryStorage(): HealthStorage {
  let preference: HealthPreference | null = null;
  let syncState: HealthSyncState = { lastSyncAt: null };
  let queue: HealthStrengthWorkout[] = [];
  return {
    getPreference: () => preference,
    setPreference: (value) => { preference = value; },
    getSyncState: () => syncState,
    setSyncState: (value) => { syncState = value; },
    getExportQueue: () => queue,
    setExportQueue: (value) => { queue = value; },
    clear: () => {
      preference = null;
      syncState = { lastSyncAt: null };
      queue = [];
    },
  };
}

const workout: HealthStrengthWorkout = {
  externalId: "workout-1",
  title: "Strength day",
  startedAt: "2026-07-21T10:00:00.000Z",
  endedAt: "2026-07-21T11:00:00.000Z",
  durationSeconds: 3600,
};

describe("health platform abstraction", () => {
  beforeEach(() => {
    delete window.PersistHealthBridge;
  });

  it("selects an interchangeable provider only when a native bridge exists", () => {
    expect(detectPlatform()).toBe("web");
    expect(selectHealthProvider().available).toBe(false);

    const apple = selectHealthProvider(createBridge("ios"));
    const google = selectHealthProvider(createBridge("android"));
    expect([apple.kind, apple.displayName, apple.platform]).toEqual([
      "apple_health",
      "Apple Health",
      "ios",
    ]);
    expect([google.kind, google.displayName, google.platform]).toEqual([
      "health_connect",
      "Health Connect",
      "android",
    ]);
  });

  it("requests only the explicit granular permissions and removes duplicates", async () => {
    const bridge = createBridge("ios");
    const manager = new HealthPermissionManager(selectHealthProvider(bridge));
    await manager.request({
      read: ["body_weight", "body_weight", "active_energy"],
      write: ["strength_workouts", "strength_workouts"],
    });
    expect(bridge.requestPermissions).toHaveBeenCalledWith({
      read: ["body_weight", "active_energy"],
      write: ["strength_workouts"],
    });
  });
});

describe("health sync coordinator", () => {
  function provider(overrides: Partial<HealthProvider> = {}): HealthProvider {
    return {
      kind: "apple_health",
      platform: "ios",
      displayName: "Apple Health",
      available: true,
      getStatus: vi.fn().mockResolvedValue(status),
      requestPermissions: vi.fn().mockResolvedValue(status),
      readRecords: vi.fn().mockResolvedValue([]),
      writeStrengthWorkout: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      ...overrides,
    };
  }

  it("exports only after an explicit sync request and drains its separate queue", async () => {
    const selectedProvider = provider();
    const storage = createMemoryStorage();
    const coordinator = new HealthSyncCoordinator(selectedProvider, storage);
    expect(selectedProvider.writeStrengthWorkout).not.toHaveBeenCalled();
    await coordinator.syncCompletedWorkout(workout);
    expect(selectedProvider.writeStrengthWorkout).toHaveBeenCalledWith(workout);
    expect(storage.getExportQueue()).toEqual([]);
    expect(storage.getSyncState().lastSyncAt).not.toBeNull();
  });

  it("retains a failed export for a later manual retry without duplicating it", async () => {
    const write = vi.fn().mockRejectedValueOnce(new Error("native unavailable"));
    const selectedProvider = provider({ writeStrengthWorkout: write });
    const storage = createMemoryStorage();
    const coordinator = new HealthSyncCoordinator(selectedProvider, storage);
    await expect(coordinator.syncCompletedWorkout(workout)).rejects.toThrow();
    expect(storage.getExportQueue()).toEqual([workout]);

    write.mockResolvedValueOnce(undefined);
    await coordinator.manualSync([]);
    expect(write).toHaveBeenCalledTimes(2);
    expect(storage.getExportQueue()).toEqual([]);
  });

  it("keeps imported health values out of persistence and disconnect clears local state", async () => {
    const storage = createMemoryStorage();
    storage.setPreference({ provider: "apple_health", showWorkoutPrompt: true });
    const selectedProvider = provider({
      readRecords: vi.fn().mockResolvedValue([
        { type: "body_weight", recordedAt: "2026-07-21", kilograms: 80 },
      ]),
    });
    const coordinator = new HealthSyncCoordinator(selectedProvider, storage);
    const result = await coordinator.manualSync(["body_weight"]);
    expect(result.importedRecords).toEqual([
      { type: "body_weight", recordedAt: "2026-07-21", kilograms: 80 },
    ]);
    expect(JSON.stringify(storage.getSyncState())).not.toContain("kilograms");
    expect(JSON.stringify(storage.getExportQueue())).not.toContain("kilograms");

    await coordinator.disconnect();
    expect(selectedProvider.disconnect).toHaveBeenCalledOnce();
    expect(storage.getPreference()).toBeNull();
    expect(storage.getExportQueue()).toEqual([]);
  });
});
