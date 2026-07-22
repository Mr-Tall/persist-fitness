import type { HealthPlatform, NativeHealthBridge } from "./types";

export function detectPlatform(
  bridge: NativeHealthBridge | undefined =
    typeof window === "undefined" ? undefined : window.PersistHealthBridge,
): HealthPlatform {
  return bridge?.platform ?? "web";
}
