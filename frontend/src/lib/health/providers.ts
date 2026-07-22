import type {
  HealthConnectionStatus,
  HealthImportPermission,
  HealthPermissionRequest,
  HealthProvider,
  HealthStrengthWorkout,
  ImportedHealthRecord,
  NativeHealthBridge,
} from "./types";

const DISCONNECTED: HealthConnectionStatus = {
  connected: false,
  permissions: {},
};

class NativeBridgeProvider implements HealthProvider {
  readonly available = true;

  constructor(
    private readonly bridge: NativeHealthBridge,
    readonly kind: "apple_health" | "health_connect",
    readonly platform: "ios" | "android",
    readonly displayName: string,
  ) {}

  getStatus() {
    return this.bridge.getStatus();
  }

  requestPermissions(request: HealthPermissionRequest) {
    return this.bridge.requestPermissions(request);
  }

  readRecords(types: HealthImportPermission[]): Promise<ImportedHealthRecord[]> {
    return this.bridge.readRecords(types);
  }

  writeStrengthWorkout(workout: HealthStrengthWorkout) {
    return this.bridge.writeStrengthWorkout(workout);
  }

  disconnect() {
    return this.bridge.disconnect();
  }
}

export function createAppleHealthProvider(bridge: NativeHealthBridge): HealthProvider {
  if (bridge.platform !== "ios") {
    throw new Error("Apple Health requires the iOS native bridge.");
  }
  return new NativeBridgeProvider(bridge, "apple_health", "ios", "Apple Health");
}

export function createHealthConnectProvider(bridge: NativeHealthBridge): HealthProvider {
  if (bridge.platform !== "android") {
    throw new Error("Health Connect requires the Android native bridge.");
  }
  return new NativeBridgeProvider(
    bridge,
    "health_connect",
    "android",
    "Health Connect",
  );
}

export const unavailableHealthProvider: HealthProvider = {
  kind: "unavailable",
  platform: "web",
  displayName: "Health integration",
  available: false,
  getStatus: async () => DISCONNECTED,
  requestPermissions: async () => DISCONNECTED,
  readRecords: async () => [],
  writeStrengthWorkout: async () => {
    throw new Error("Health integration is unavailable on this platform.");
  },
  disconnect: async () => undefined,
};

export function selectHealthProvider(
  bridge: NativeHealthBridge | undefined =
    typeof window === "undefined" ? undefined : window.PersistHealthBridge,
): HealthProvider {
  if (bridge?.platform === "ios") return createAppleHealthProvider(bridge);
  if (bridge?.platform === "android") return createHealthConnectProvider(bridge);
  return unavailableHealthProvider;
}
