import type { HealthPermissionManager } from "@/lib/health/permission-manager";
import type { HealthPermissionRequest } from "@/lib/health/types";
import type { NativePermissionAdapter, NativePermissionStatus } from "./types";

export function createHealthPermissionAdapter(
  manager: HealthPermissionManager,
): NativePermissionAdapter<HealthPermissionRequest> {
  return {
    async getStatus() {
      const status = await manager.getStatus();
      if (status.connected) return "granted";
      return Object.values(status.permissions).some((value) => value === "denied")
        ? "denied"
        : "prompt";
    },
    async request(request) {
      const status = await manager.request(request);
      const requested = [...request.read, ...request.write];
      const states = requested.map((permission) => status.permissions[permission]);
      const result: NativePermissionStatus =
        states.length > 0 && states.every((state) => state === "granted")
          ? "granted"
          : states.some((state) => state === "denied")
            ? "denied"
            : "prompt";
      return result;
    },
  };
}
