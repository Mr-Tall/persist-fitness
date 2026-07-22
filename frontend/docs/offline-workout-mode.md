# Offline workout mode

Phase 1 caches only an already-open active workout and its add, edit, and delete
set mutations. Workout snapshots and queues live in IndexedDB under a composite
user/workout key. A snapshot expires seven days after its last confirmed online
render. Expired snapshots, data belonging to another signed-in user, completed
workouts, and sign-out data are removed.

The service worker caches static Next.js assets plus an active workout document
only after the active workout provider explicitly requests it. It does not cache
API/auth responses, dashboard or Progress data, completed history, profiles,
routines, programs, or arbitrary navigations.

The server remains authoritative. Queue entries are processed by client
timestamp and mutation ID. Each successful write and its mutation receipt commit
in the same Serializable transaction. The receipt makes a replay after a lost
response idempotent. Conflicts retain the queue entry and local snapshot until
the user retries or the expiration/cleanup policy applies.
