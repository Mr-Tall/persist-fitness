import type {
  HealthConnectionStatus,
  HealthPermissionRequest,
  HealthProvider,
} from "./types";

export class HealthPermissionManager {
  constructor(private readonly provider: HealthProvider) {}

  getStatus(): Promise<HealthConnectionStatus> {
    return this.provider.getStatus();
  }

  request(request: HealthPermissionRequest): Promise<HealthConnectionStatus> {
    return this.provider.requestPermissions({
      read: [...new Set(request.read)],
      write: [...new Set(request.write)],
    });
  }
}
