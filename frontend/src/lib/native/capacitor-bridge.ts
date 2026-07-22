import { App } from "@capacitor/app";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import type { NativeBridge, NativeLifecycleEvent, NativeListener } from "./types";
import type {
  HealthConnectionStatus,
  HealthImportPermission,
  HealthPermissionRequest,
  HealthStrengthWorkout,
  ImportedHealthRecord,
  NativeHealthBridge,
} from "@/lib/health/types";

type PersistHealthPlugin = {
  getStatus(): Promise<HealthConnectionStatus>;
  requestPermissions(request: HealthPermissionRequest): Promise<HealthConnectionStatus>;
  readRecords(options: {
    types: HealthImportPermission[];
  }): Promise<{ records: ImportedHealthRecord[] }>;
  writeStrengthWorkout(options: { workout: HealthStrengthWorkout }): Promise<void>;
  disconnect(): Promise<void>;
};

function createWebBridge(): NativeBridge {
  return {
    platform: "web",
    isNative: false,
    async addLifecycleListener(listener) {
      const onVisibility = () => {
        void listener({ type: document.hidden ? "background" : "resume" });
      };
      const onPageHide = () => void listener({ type: "terminate" });
      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("pagehide", onPageHide);
      return async () => {
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("pagehide", onPageHide);
      };
    },
    getLaunchUrl: async () => null,
    hideSplash: async () => undefined,
  };
}

function createIosBridge(): NativeBridge {
  return {
    platform: "ios",
    isNative: true,
    async addLifecycleListener(listener: NativeListener) {
      let active = true;
      const handles = await Promise.all([
        App.addListener("appStateChange", ({ isActive }) => {
          const event: NativeLifecycleEvent = {
            type: isActive ? "foreground" : "background",
          };
          void listener(event);
        }),
        App.addListener("resume", () => {
          void listener({ type: "resume" });
        }),
        App.addListener("appUrlOpen", ({ url }) => {
          void listener({ type: "url_open", url });
        }),
      ]);
      const onPageHide = () => {
        if (active) void listener({ type: "terminate" });
      };
      window.addEventListener("pagehide", onPageHide);
      return async () => {
        active = false;
        window.removeEventListener("pagehide", onPageHide);
        await Promise.all(handles.map((handle) => handle.remove()));
      };
    },
    async getLaunchUrl() {
      return (await App.getLaunchUrl())?.url ?? null;
    },
    async hideSplash() {
      await SplashScreen.hide();
    },
  };
}

export function createNativeBridge(): NativeBridge {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios"
    ? createIosBridge()
    : createWebBridge();
}

export function installCapacitorHealthBridge(): NativeHealthBridge | null {
  if (
    !Capacitor.isNativePlatform() ||
    Capacitor.getPlatform() !== "ios" ||
    !Capacitor.isPluginAvailable("PersistHealth")
  ) {
    return null;
  }
  const plugin = registerPlugin<PersistHealthPlugin>("PersistHealth");
  const bridge: NativeHealthBridge = {
    platform: "ios",
    getStatus: () => plugin.getStatus(),
    requestPermissions: (request) => plugin.requestPermissions(request),
    async readRecords(types) {
      return (await plugin.readRecords({ types })).records;
    },
    writeStrengthWorkout: (workout) => plugin.writeStrengthWorkout({ workout }),
    disconnect: () => plugin.disconnect(),
  };
  window.PersistHealthBridge = bridge;
  window.dispatchEvent(new Event("persist-health-bridge-ready"));
  return bridge;
}
