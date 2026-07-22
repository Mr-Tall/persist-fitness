import { beforeEach, describe, expect, it, vi } from "vitest";

const capacitorMocks = vi.hoisted(() => ({
  isNativePlatform: vi.fn(() => false),
  getPlatform: vi.fn(() => "web"),
  addListener: vi.fn(),
  getLaunchUrl: vi.fn(),
  hideSplash: vi.fn(),
  isPluginAvailable: vi.fn(() => false),
  registerPlugin: vi.fn(),
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: capacitorMocks.isNativePlatform,
    getPlatform: capacitorMocks.getPlatform,
    isPluginAvailable: capacitorMocks.isPluginAvailable,
  },
  registerPlugin: capacitorMocks.registerPlugin,
}));
vi.mock("@capacitor/app", () => ({
  App: {
    addListener: capacitorMocks.addListener,
    getLaunchUrl: capacitorMocks.getLaunchUrl,
  },
}));
vi.mock("@capacitor/splash-screen", () => ({
  SplashScreen: { hide: capacitorMocks.hideSplash },
}));

import { createNativeBridge, installCapacitorHealthBridge } from "./capacitor-bridge";
import { resolveNativeDeepLink } from "./deep-links";
import { NativeLifecycleCoordinator } from "./lifecycle";
import { NativePermissionManager } from "./permission-manager";
import { createHealthPermissionAdapter } from "./health-permission-adapter";
import { HealthPermissionManager } from "@/lib/health/permission-manager";
import type { HealthProvider } from "@/lib/health/types";
import type { NativeBridge, NativeLifecycleEvent } from "./types";

function lifecycleBridge(launchUrl: string | null = null) {
  let listener: ((event: NativeLifecycleEvent) => void | Promise<void>) | null = null;
  const remove = vi.fn().mockResolvedValue(undefined);
  const bridge: NativeBridge = {
    platform: "ios",
    isNative: true,
    addLifecycleListener: vi.fn(async (next) => {
      listener = next;
      return remove;
    }),
    getLaunchUrl: vi.fn().mockResolvedValue(launchUrl),
    hideSplash: vi.fn().mockResolvedValue(undefined),
  };
  return {
    bridge,
    emit: async (event: NativeLifecycleEvent) => listener?.(event),
    remove,
  };
}

describe("native platform bridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capacitorMocks.isNativePlatform.mockReturnValue(false);
    capacitorMocks.getPlatform.mockReturnValue("web");
    capacitorMocks.isPluginAvailable.mockReturnValue(false);
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
  });

  it("keeps browser lifecycle behavior when Capacitor is unavailable", async () => {
    const bridge = createNativeBridge();
    expect(bridge.platform).toBe("web");
    expect(bridge.isNative).toBe(false);
    const listener = vi.fn();
    const remove = await bridge.addLifecycleListener(listener);
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(listener).toHaveBeenCalledWith({ type: "background" });
    await remove();
  });

  it("selects the iOS adapter without exposing Capacitor to components", async () => {
    capacitorMocks.isNativePlatform.mockReturnValue(true);
    capacitorMocks.getPlatform.mockReturnValue("ios");
    capacitorMocks.addListener.mockResolvedValue({ remove: vi.fn() });
    capacitorMocks.getLaunchUrl.mockResolvedValue({ url: "persistfitness://app/workouts/1" });
    capacitorMocks.hideSplash.mockResolvedValue(undefined);
    const bridge = createNativeBridge();
    expect(bridge.platform).toBe("ios");
    expect(await bridge.getLaunchUrl()).toBe("persistfitness://app/workouts/1");
    await bridge.hideSplash();
    expect(capacitorMocks.hideSplash).toHaveBeenCalledOnce();
  });

  it("installs the optional native HealthKit plugin behind the existing health bridge", async () => {
    capacitorMocks.isNativePlatform.mockReturnValue(true);
    capacitorMocks.getPlatform.mockReturnValue("ios");
    capacitorMocks.isPluginAvailable.mockReturnValue(true);
    const plugin = {
      getStatus: vi.fn().mockResolvedValue({ connected: true, permissions: {} }),
      requestPermissions: vi.fn(),
      readRecords: vi.fn().mockResolvedValue({ records: [] }),
      writeStrengthWorkout: vi.fn(),
      disconnect: vi.fn(),
    };
    capacitorMocks.registerPlugin.mockReturnValue(plugin);
    const bridge = installCapacitorHealthBridge();
    expect(capacitorMocks.registerPlugin).toHaveBeenCalledWith("PersistHealth");
    await bridge?.readRecords(["body_weight"]);
    expect(plugin.readRecords).toHaveBeenCalledWith({ types: ["body_weight"] });
    delete window.PersistHealthBridge;
  });
});

describe("native lifecycle coordinator", () => {
  it("resumes offline and health work once after a real background transition", async () => {
    const native = lifecycleBridge();
    const tasks = {
      flushAnalytics: vi.fn().mockResolvedValue(undefined),
      resumeOfflineSync: vi.fn().mockResolvedValue(undefined),
      resumeHealthQueue: vi.fn().mockResolvedValue(undefined),
      openDeepLink: vi.fn().mockResolvedValue(undefined),
    };
    const coordinator = new NativeLifecycleCoordinator(native.bridge, tasks);
    await coordinator.start();
    await native.emit({ type: "resume" });
    expect(tasks.resumeOfflineSync).not.toHaveBeenCalled();

    await native.emit({ type: "background" });
    await native.emit({ type: "background" });
    await Promise.all([
      native.emit({ type: "resume" }),
      native.emit({ type: "resume" }),
    ]);
    expect(tasks.flushAnalytics).toHaveBeenCalledOnce();
    expect(tasks.resumeOfflineSync).toHaveBeenCalledOnce();
    expect(tasks.resumeHealthQueue).toHaveBeenCalledOnce();
    await coordinator.stop();
    expect(native.remove).toHaveBeenCalledOnce();
  });

  it("routes launch and runtime links through one callback", async () => {
    const native = lifecycleBridge("persistfitness://app/dashboard");
    const openDeepLink = vi.fn();
    const coordinator = new NativeLifecycleCoordinator(native.bridge, {
      flushAnalytics: vi.fn(),
      resumeOfflineSync: vi.fn(),
      resumeHealthQueue: vi.fn(),
      openDeepLink,
    });
    await coordinator.start();
    await native.emit({ type: "url_open", url: "persistfitness://app/workouts" });
    expect(openDeepLink).toHaveBeenNthCalledWith(1, "persistfitness://app/dashboard");
    expect(openDeepLink).toHaveBeenNthCalledWith(2, "persistfitness://app/workouts");
  });

  it("cleans up a listener even when unmounted during asynchronous startup", async () => {
    let release!: (remove: () => Promise<void>) => void;
    const remove = vi.fn().mockResolvedValue(undefined);
    const bridge: NativeBridge = {
      platform: "ios",
      isNative: true,
      addLifecycleListener: vi.fn(
        () => new Promise<() => Promise<void>>((resolve) => { release = resolve; }),
      ),
      getLaunchUrl: vi.fn(),
      hideSplash: vi.fn(),
    };
    const coordinator = new NativeLifecycleCoordinator(bridge, {
      flushAnalytics: vi.fn(),
      resumeOfflineSync: vi.fn(),
      resumeHealthQueue: vi.fn(),
      openDeepLink: vi.fn(),
    });
    const starting = coordinator.start();
    const stopping = coordinator.stop();
    release(remove);
    await Promise.all([starting, stopping]);
    expect(remove).toHaveBeenCalledOnce();
    expect(bridge.hideSplash).not.toHaveBeenCalled();
  });
});

describe("native permissions and deep links", () => {
  it("does not request future permissions until an adapter is registered", async () => {
    const health = {
      getStatus: vi.fn().mockResolvedValue("prompt" as const),
      request: vi.fn().mockResolvedValue("granted" as const),
    };
    const permissions = new NativePermissionManager().register("health", health);
    await expect(permissions.getStatus("notifications")).resolves.toBe("unavailable");
    await expect(permissions.request("camera", undefined)).resolves.toBe("unavailable");
    expect(health.request).not.toHaveBeenCalled();
    await expect(permissions.request("health", { write: true })).resolves.toBe("granted");
  });

  it("maps granular health permission results into the central permission contract", async () => {
    const provider: HealthProvider = {
      kind: "apple_health",
      platform: "ios",
      displayName: "Apple Health",
      available: true,
      getStatus: vi.fn().mockResolvedValue({ connected: false, permissions: {} }),
      requestPermissions: vi.fn().mockResolvedValue({
        connected: true,
        permissions: { body_weight: "granted", strength_workouts: "granted" },
      }),
      readRecords: vi.fn(),
      writeStrengthWorkout: vi.fn(),
      disconnect: vi.fn(),
    };
    const health = createHealthPermissionAdapter(
      new HealthPermissionManager(provider),
    );
    const permissions = new NativePermissionManager().register("health", health);
    await expect(
      permissions.request("health", {
        read: ["body_weight"],
        write: ["strength_workouts"],
      }),
    ).resolves.toBe("granted");
    expect(provider.requestPermissions).toHaveBeenCalledWith({
      read: ["body_weight"],
      write: ["strength_workouts"],
    });
  });

  it("accepts only internal app links and leaves authentication links unimplemented", () => {
    expect(
      resolveNativeDeepLink(
        "persistfitness://app/workouts/workout-1?view=summary",
        "https://persist.example",
      ),
    ).toBe("/workouts/workout-1?view=summary");
    expect(
      resolveNativeDeepLink("https://persist.example/progress", "https://persist.example"),
    ).toBe("/progress");
    expect(
      resolveNativeDeepLink("https://attacker.example/workouts/1", "https://persist.example"),
    ).toBeNull();
    expect(
      resolveNativeDeepLink("persistfitness://app/api/auth/callback", "https://persist.example"),
    ).toBeNull();
  });
});
