import { HealthPermissionManager } from "./permission-manager";
import { createLocalHealthStorage, type HealthStorage } from "./storage";
import type {
  HealthImportPermission,
  HealthPermissionRequest,
  HealthProvider,
  HealthStrengthWorkout,
  ImportedHealthRecord,
} from "./types";

export type ManualHealthSyncResult = {
  exportedWorkoutCount: number;
  importedRecords: ImportedHealthRecord[];
};

export class HealthSyncCoordinator {
  readonly permissions: HealthPermissionManager;

  constructor(
    readonly provider: HealthProvider,
    readonly storage: HealthStorage = createLocalHealthStorage(),
  ) {
    this.permissions = new HealthPermissionManager(provider);
  }

  connect(request: HealthPermissionRequest) {
    return this.permissions.request(request);
  }

  async syncCompletedWorkout(workout: HealthStrengthWorkout): Promise<void> {
    const queue = this.storage.getExportQueue();
    if (!queue.some((item) => item.externalId === workout.externalId)) {
      this.storage.setExportQueue([...queue, workout]);
    }
    await this.flushExports();
  }

  async manualSync(read: HealthImportPermission[]): Promise<ManualHealthSyncResult> {
    const exportedWorkoutCount = await this.flushExports();
    const importedRecords = read.length > 0 ? await this.provider.readRecords(read) : [];
    this.storage.setSyncState({ lastSyncAt: new Date().toISOString() });
    return { exportedWorkoutCount, importedRecords };
  }

  async disconnect(): Promise<void> {
    try {
      await this.provider.disconnect();
    } finally {
      this.storage.clear();
    }
  }

  private async flushExports(): Promise<number> {
    const queue = this.storage.getExportQueue();
    let exportedWorkoutCount = 0;
    for (const workout of queue) {
      try {
        await this.provider.writeStrengthWorkout(workout);
        exportedWorkoutCount += 1;
        this.storage.setExportQueue(
          this.storage.getExportQueue().filter((item) => item.externalId !== workout.externalId),
        );
      } catch (error) {
        if (exportedWorkoutCount > 0) {
          this.storage.setSyncState({ lastSyncAt: new Date().toISOString() });
        }
        throw error;
      }
    }
    if (exportedWorkoutCount > 0) {
      this.storage.setSyncState({ lastSyncAt: new Date().toISOString() });
    }
    return exportedWorkoutCount;
  }
}
