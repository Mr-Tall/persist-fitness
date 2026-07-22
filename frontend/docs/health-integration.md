# Native health integration boundary

Persist Fitness treats Apple Health and Health Connect as optional synchronization targets. Web components never call a native SDK. A native shell injects `window.PersistHealthBridge`, dispatches `persist-health-bridge-ready` if injection occurs after hydration, and the platform-neutral `HealthProvider` adapters are the only code allowed to call it.

Permissions are requested by data category. Reading body weight, completed workouts, active energy, or walking/running distance is separate from writing completed strength workouts. There is no automatic or background sync in Phase 1.

Imported records are returned in memory to the explicit manual-sync caller. They are not written to Persist's database, workout history, analytics domain, offline workout queue, local storage, Sentry, PostHog, or feedback payloads. Failed strength-workout exports may be kept in a dedicated local queue containing only workout identity, title, timestamps, and duration. Disconnecting clears that queue and the local preference/status timestamps.

The native implementations must map platform authorization statuses to the shared contract, avoid logging health payloads, and keep permission prompts user initiated. Live HealthKit and Health Connect SDKs are intentionally outside the web bundle and are replaced by bridge fakes in tests.
