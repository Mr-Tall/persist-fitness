# Production observability and beta feedback

## Runtime configuration

Every integration is optional. Missing variables leave that integration disabled.

- Sentry: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`,
  `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_RELEASE`, and optional
  `SENTRY_TRACES_SAMPLE_RATE` (default `0.05`). Release names should use the
  deployed Git SHA. Source maps upload only when the auth token is present.
- PostHog: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, and
  `NEXT_PUBLIC_POSTHOG_REPLAY_ENABLED`. Replay is off in development and can be
  disabled independently by setting the replay flag to anything except `true`.
- Shared release metadata: `NEXT_PUBLIC_APP_VERSION` and optional
  `NEXT_PUBLIC_APP_ENVIRONMENT`. Values are bounded before feedback storage;
  client Sentry reports use the same public release/environment labels.
- Private screenshots: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and
  `BETA_FEEDBACK_BUCKET`. The bucket must be private. Never expose the service
  role variable to the browser.

## Privacy boundaries

Sentry strips request headers, cookies, bodies, credentials, connection strings,
emails, notes, and set-like values. Reports identify a signed-in person only by
the opaque internal user ID. Feedback routes replace resource identifiers with
`:id` before persistence. PostHog autocapture, page capture, and page-leave
capture are disabled. Only the event allowlist in `src/lib/analytics/events.ts`
may be emitted.

Replay masks all inputs and `[data-sensitive]`/`[data-ph-mask]` content. It blocks
images, video, screenshot previews, feedback forms, workout inputs, profile
fields, notes, and offline conflict data. Do not remove these privacy attributes
when refactoring those screens.

## Event taxonomy and dashboards

Permitted properties are encoded by `ProductEventMap`; IDs, names, free text,
set values, and exact timestamps are prohibited. Create these PostHog views:

- Activation: `account_signed_in` → `onboarding_completed` → `workout_started`
  → `workout_completed`.
- Workout: `workout_started` → safe set-recorded event when added →
  `workout_completed`.
- Retention: users completing another workout within seven days of a completion.
- Feature use: program enrollment/workouts, favorites, rest timer, offline mode.
- Reliability: offline conflicts, workout abandonment, and feedback submission.

## Feedback operations

Feedback is authenticated and limited to five submissions per user per ten
minutes. Admin access requires `User.role = 'admin'` and is checked on every
server read, mutation, and signed screenshot request. Provision roles through a
reviewed database operation; never infer them from email.

Recommended beta retention:

- resolved feedback: 90 days;
- dismissed feedback: 30 days;
- screenshots: 30 days or earlier after resolution;
- new/reviewing feedback: retain while actionable, review every 90 days.

Deletion removes the private screenshot before its database record. Automated
retention is intentionally deferred until a reviewed scheduler exists. Offline
mutation receipts follow their separate offline-workout policy.

## Incident triage and cost controls

Start with the support reference in Feedback, search the same reference in
Sentry, confirm release/environment, reproduce without reading unrelated user
data, then update feedback status. Monitor Sentry errors/traces, PostHog events
and replay quotas, Supabase storage, and feedback volume weekly. Keep the trace
sample rate conservative, replay opt-in by environment, screenshots at 3 MB,
and analytics explicitly allowlisted. Disable Sentry by removing its DSNs,
PostHog by removing its key/host, replay with its dedicated flag, and screenshots
by removing any screenshot-storage variable.
