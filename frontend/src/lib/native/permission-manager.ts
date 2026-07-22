import type {
  NativePermissionAdapter,
  NativePermissionKind,
  NativePermissionStatus,
} from "./types";

export class NativePermissionManager {
  private readonly adapters = new Map<
    NativePermissionKind,
    NativePermissionAdapter<unknown>
  >();

  register<Request>(
    permission: NativePermissionKind,
    adapter: NativePermissionAdapter<Request>,
  ) {
    this.adapters.set(permission, {
      getStatus: () => adapter.getStatus(),
      request: (request) => adapter.request(request as Request),
    });
    return this;
  }

  isSupported(permission: NativePermissionKind) {
    return this.adapters.has(permission);
  }

  async getStatus(permission: NativePermissionKind): Promise<NativePermissionStatus> {
    return (await this.adapters.get(permission)?.getStatus()) ?? "unavailable";
  }

  async request<Request>(
    permission: NativePermissionKind,
    request: Request,
  ): Promise<NativePermissionStatus> {
    const adapter = this.adapters.get(permission) as
      | NativePermissionAdapter<Request>
      | undefined;
    if (!adapter) return "unavailable";
    return adapter.request(request);
  }
}
