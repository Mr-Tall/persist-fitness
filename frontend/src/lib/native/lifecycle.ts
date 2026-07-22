import type { NativeBridge, NativeLifecycleEvent } from "./types";

export const NATIVE_RESUME_EVENT = "persist:native-resume";
export const HEALTH_RESUME_EVENT = "persist:health-resume";

export type NativeLifecycleTasks = {
  flushAnalytics(): void | Promise<void>;
  resumeOfflineSync(): void | Promise<void>;
  resumeHealthQueue(): void | Promise<void>;
  openDeepLink(url: string): void | Promise<void>;
};

export class NativeLifecycleCoordinator {
  private removeListener: (() => Promise<void>) | null = null;
  private startWork: Promise<void> | null = null;
  private resumeWork: Promise<void> | null = null;
  private backgrounded = false;
  private stopping = false;

  constructor(
    private readonly bridge: NativeBridge,
    private readonly tasks: NativeLifecycleTasks,
  ) {}

  async start() {
    if (this.removeListener) return;
    if (this.startWork) return this.startWork;
    this.stopping = false;
    this.startWork = (async () => {
      const remove = await this.bridge.addLifecycleListener((event) =>
        this.handle(event),
      );
      if (this.stopping) {
        await remove();
        return;
      }
      this.removeListener = remove;
      const launchUrl = await this.bridge.getLaunchUrl();
      if (launchUrl) await this.tasks.openDeepLink(launchUrl);
      if (!this.stopping) await this.bridge.hideSplash();
    })();
    try {
      await this.startWork;
    } finally {
      this.startWork = null;
    }
  }

  async stop() {
    this.stopping = true;
    await this.startWork?.catch(() => undefined);
    const remove = this.removeListener;
    this.removeListener = null;
    await remove?.();
  }

  async handle(event: NativeLifecycleEvent): Promise<void> {
    if (event.type === "url_open") {
      await this.tasks.openDeepLink(event.url);
      return;
    }
    if (event.type === "background" || event.type === "terminate") {
      if (this.backgrounded) return;
      this.backgrounded = true;
      await this.tasks.flushAnalytics();
      return;
    }
    if (!this.backgrounded || this.resumeWork) return this.resumeWork ?? undefined;
    this.backgrounded = false;
    this.resumeWork = Promise.all([
      this.tasks.resumeOfflineSync(),
      this.tasks.resumeHealthQueue(),
    ]).then(() => undefined);
    try {
      await this.resumeWork;
    } finally {
      this.resumeWork = null;
    }
  }
}

export function dispatchNativeResumeEvents() {
  window.dispatchEvent(new Event(NATIVE_RESUME_EVENT));
  window.dispatchEvent(new Event(HEALTH_RESUME_EVENT));
}
