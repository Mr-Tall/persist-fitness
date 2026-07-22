export const HEALTH_IMPORT_PERMISSIONS = [
  "body_weight",
  "completed_workouts",
  "active_energy",
  "walking_running_distance",
] as const;

export const HEALTH_EXPORT_PERMISSIONS = ["strength_workouts"] as const;

export type HealthImportPermission = (typeof HEALTH_IMPORT_PERMISSIONS)[number];
export type HealthExportPermission = (typeof HEALTH_EXPORT_PERMISSIONS)[number];
export type HealthPermission = HealthImportPermission | HealthExportPermission;
export type HealthPlatform = "web" | "ios" | "android";
export type HealthProviderKind = "apple_health" | "health_connect" | "unavailable";
export type HealthPermissionState = "granted" | "denied" | "not_determined";

export type HealthConnectionStatus = {
  connected: boolean;
  permissions: Partial<Record<HealthPermission, HealthPermissionState>>;
};

export type HealthPermissionRequest = {
  read: HealthImportPermission[];
  write: HealthExportPermission[];
};

export type HealthStrengthWorkout = {
  externalId: string;
  title: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
};

export type ImportedHealthRecord =
  | { type: "body_weight"; recordedAt: string; kilograms: number }
  | { type: "completed_workouts"; recordedAt: string; durationSeconds: number }
  | { type: "active_energy"; recordedAt: string; kilocalories: number }
  | { type: "walking_running_distance"; recordedAt: string; meters: number };

export interface HealthProvider {
  readonly kind: HealthProviderKind;
  readonly platform: HealthPlatform;
  readonly displayName: string;
  readonly available: boolean;
  getStatus(): Promise<HealthConnectionStatus>;
  requestPermissions(request: HealthPermissionRequest): Promise<HealthConnectionStatus>;
  readRecords(types: HealthImportPermission[]): Promise<ImportedHealthRecord[]>;
  writeStrengthWorkout(workout: HealthStrengthWorkout): Promise<void>;
  disconnect(): Promise<void>;
}

export type NativeHealthBridge = {
  platform: "ios" | "android";
  getStatus(): Promise<HealthConnectionStatus>;
  requestPermissions(request: HealthPermissionRequest): Promise<HealthConnectionStatus>;
  readRecords(types: HealthImportPermission[]): Promise<ImportedHealthRecord[]>;
  writeStrengthWorkout(workout: HealthStrengthWorkout): Promise<void>;
  disconnect(): Promise<void>;
};

declare global {
  interface Window {
    PersistHealthBridge?: NativeHealthBridge;
  }
}
