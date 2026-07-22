# Native iOS and TestFlight foundation

Persist Fitness remains a Next.js application deployed to Vercel. It uses server components, Auth.js, server actions, and Prisma, so it cannot be converted to a static Capacitor bundle without a separate client/data-access migration. Capacitor therefore wraps the existing secure HTTPS deployment for Phase 1. Capacitor documents `server.url` primarily as a live-reload feature; this hosted-origin approach is suitable for internal TestFlight validation but is an explicit App Store review risk and must be reassessed before public submission.

## Workflows

Requirements: Node 22+, macOS, Xcode 26+, an Apple developer team, and iOS 15+.

Development:

1. Run `npm run dev`.
2. For the simulator, run `npm run native:sync:ios:dev`; it defaults to `http://localhost:3000`.
3. For a physical device, set `CAPACITOR_SERVER_URL` to an HTTPS development origin reachable by the device, then sync.
4. Run `npm run native:open:ios` and select the signing team/simulator in Xcode.

Production/TestFlight:

1. Deploy and smoke-test the exact web release first.
2. Set `CAPACITOR_BUILD_MODE=production` and `CAPACITOR_SERVER_URL=https://<production-origin>`.
3. Run `npm run native:sync:ios:production`.
4. Open Xcode, confirm bundle identifier `com.persistfitness.app`, signing, version/build number, dependency privacy manifests, HealthKit capability, and production `capacitor.config.json`.
5. Archive and upload through Xcode. Never archive a localhost or cleartext configuration.

Normal `npm run dev`, `npm run build`, and Vercel deployment do not invoke Capacitor and remain unchanged.

## Architecture boundaries

Only `src/lib/native/capacitor-bridge.ts` imports Capacitor APIs. React mounts `NativeLifecycleBoundary`, which consumes the internal `NativeBridge` interface. The same boundary translates app foreground/background, launch URL, and runtime URL events into existing web/domain operations.

An optional native plugin named `PersistHealth` is adapted into the existing `window.PersistHealthBridge` contract only when Capacitor reports that plugin as installed. The generated Phase 1 Xcode project contains the entitlement and usage descriptions, but not a live HealthKit plugin implementation; health UI remains unavailable rather than falsely requesting access until that reviewed Swift implementation is added.

Backgrounding flushes the allowlisted PostHog client queue. A true background-to-resume transition emits one offline-resume event and one health-queue refresh event. The offline workout provider retains its own single-flight protection. Health exports remain manual: resume refreshes availability but never uploads health data automatically.

Deep links support the placeholder `persistfitness://app/<route>` scheme and same-origin web links. `/api/*`, login, and authentication callback links are deliberately rejected until the authentication-link milestone.

Google OAuth commonly rejects embedded web views. System-browser authentication plus a verified universal/custom callback is therefore a release blocker for onboarding new external TestFlight users; it is intentionally not bypassed in this phase because authentication deep links are out of scope.

## Permissions

`NativePermissionManager` recognizes health, notifications, camera, and photos. Only health has an adapter. Missing adapters return `unavailable`, so Phase 1 cannot accidentally request notification, camera, or photo access. Add the corresponding plugin, Info.plist explanation, adapter, tests, and user-triggered UI together when a feature actually needs one.

## Storage behavior

- IndexedDB stores active workout snapshots and mutations in WKWebView. It remains origin-scoped; changing `CAPACITOR_SERVER_URL` creates a different storage partition.
- Service-worker cache support in WKWebView and remote-origin navigation must be verified on each supported iOS release. IndexedDB remains the authoritative offline queue.
- Health preferences and failed export receipts use origin-scoped localStorage. They are cleared on sign-out/account deletion.
- iOS can purge web storage under device pressure. Before public launch, evaluate moving queue metadata to a native durable store while preserving the existing repository interfaces.
- Native sync must never switch production origins without an explicit data-migration plan.

## Assets, privacy, and startup

The generated icon and splash resources are placeholders. `resources/README.md` defines the future source files; replace them only during the branding milestone. Capacitor dependencies provide their own privacy manifests, and HealthKit usage descriptions plus an entitlement placeholder are included. Do not add an inaccurate empty app privacy manifest: App Store privacy answers, first-party collection declarations, and required-reason APIs need a final release audit against the shipping analytics and crash-reporting configuration.

Sentry initializes through the existing Next.js client entry. Native bridge/startup failures are captured through the same sanitized handled-error boundary when a DSN is configured. Crashes before JavaScript initialization still require a future native Sentry SDK.
