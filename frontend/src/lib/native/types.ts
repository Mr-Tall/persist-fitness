export type NativePlatform = "web" | "ios";

export type NativeLifecycleEvent =
  | { type: "background" }
  | { type: "foreground" }
  | { type: "resume" }
  | { type: "terminate" }
  | { type: "url_open"; url: string };

export type NativeListener = (event: NativeLifecycleEvent) => void | Promise<void>;

export interface NativeBridge {
  readonly platform: NativePlatform;
  readonly isNative: boolean;
  addLifecycleListener(listener: NativeListener): Promise<() => Promise<void>>;
  getLaunchUrl(): Promise<string | null>;
  hideSplash(): Promise<void>;
}

export type NativePermissionKind =
  | "notifications"
  | "health"
  | "camera"
  | "photos";

export type NativePermissionStatus =
  | "granted"
  | "denied"
  | "prompt"
  | "unavailable";

export interface NativePermissionAdapter<Request = void> {
  getStatus(): Promise<NativePermissionStatus>;
  request(request: Request): Promise<NativePermissionStatus>;
}
