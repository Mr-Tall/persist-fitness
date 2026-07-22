# Security and user-data review

## Reviewed boundaries

This review covers the authenticated layout, NextAuth database sessions, user-owned
server actions, workout ownership helpers, feedback administration, private
screenshots, error references, offline workout storage, export, and deletion.

## Current guarantees

- Protected application routes require a server-confirmed session. Mutating actions
  obtain the user ID from the session and scope ownership checks in the database.
- Admin feedback pages, mutations, and screenshot signing call the server-side role
  guard. Admin access is not inferred from an email address or client state.
- Feedback screenshots use server-generated private paths. Only an authorized admin
  can request a five-minute signed URL. Feedback deletion removes the object first.
- Error references contain a normalized short digest or random correlation value;
  they do not expose stacks, database identifiers, or request payloads.
- Session-management actions accept opaque session row IDs but always delete with
  both `id` and the authenticated `userId`. The current session cannot be revoked
  through the "other device" action.
- Personal-data export never includes session tokens, OAuth access/refresh tokens,
  storage service credentials, screenshot paths, or observability credentials.
- Account deletion validates an explicit confirmation, removes screenshot objects,
  then deletes the authenticated User. Existing foreign-key cascades remove accounts,
  sessions, profile, favorites, workouts, sets, routines, offline receipts, feedback,
  and program enrollments.
- A short-lived cleanup cookie causes IndexedDB and offline workout caches to be
  cleared immediately after deletion or on the next application launch.

## Data lifecycle

- JSON exports are generated on demand and returned with `private, no-store` cache
  controls. No export archive or reusable download URL is persisted by the app.
- Active sessions are limited to unexpired NextAuth database sessions. Device details
  are reduced to a browser/platform category; raw user-agent strings are not stored.
- Last-active writes are throttled to one update per fifteen minutes per session.
- Account deletion is permanent. Shared program ownership is checked first; deletion
  is refused if cascading it would remove another user's enrollment.
- Feedback and screenshot retention follows `production-observability.md` until an
  automated, reviewed retention job is available.

## Findings and follow-ups

### High priority before public launch

1. **External OAuth grant revocation:** local deletion removes NextAuth Account rows
   and tokens, but it does not revoke the user's Google grant at Google. Add provider
   revocation after confirming provider-specific failure and retry behavior.
2. **Legal review:** `/privacy`, `/terms`, and `/data-usage` are explicitly marked beta
   placeholders. Qualified counsel must replace them before App Store submission.
3. **Shared program ownership:** introduce an explicit transfer/system-ownership model
   before allowing ordinary users to publish programs. Current deletion safely blocks
   when another user is enrolled rather than deleting their data.

### Worthwhile hardening

1. Large-account exports are assembled in memory. Add a streamed or short-lived,
   encrypted export job only when real account sizes justify it.
2. Add a security audit log for admin status changes, screenshot access, session
   revocation, and account deletion without recording feedback text or workout data.
3. Add content-signature inspection and malware scanning if screenshot volume grows.
4. Add CSRF/origin regression tests around sensitive actions when NextAuth or Next.js
   server-action transport changes.
5. Review database role grants and private Storage bucket policies in production;
   service-role credentials must remain server-only and rotated on exposure.

## Supabase clarification

Supabase supplies PostgreSQL and optional private screenshot Storage. Authentication
currently uses NextAuth with Google and database sessions, not Supabase Auth. Account
deletion therefore removes NextAuth Account/Session rows; there is no separate
Supabase Auth identity to delete in the current architecture.
