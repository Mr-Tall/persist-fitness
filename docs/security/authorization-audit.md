# Authorization Inventory and Ownership Audit

## Executive summary

This document inventories the authorization boundary as implemented today. It is descriptive only; it does not change or approve the current behavior.

Persist Fitness has two public pages, eleven authenticated application pages, five server-action modules, twenty-five exported server actions, and twenty-three explicit runtime Prisma mutation call sites. Auth.js also performs account, session, and verification-token mutations through `PrismaAdapter`; those framework-managed writes are not authored directly in this repository.

All current application pages under the `(app)` route group perform an authentication check in the page itself. The `(app)` layout renders authenticated navigation but does not enforce authentication. Every exported application server action obtains the current user from the server-side Auth.js session before it mutates data. No mutation accepts a client-provided `userId`.

Workout and routine ownership is generally enforced correctly. No confirmed cross-user mutation exploit was identified. The main risks are inconsistency and regression potential:

- Authentication helpers are duplicated in `routines.ts`, `favorite-exercises.ts`, and `profile.ts` instead of consistently using `src/lib/auth/require-user.ts`.
- Some writes include `userId` in the mutation predicate, while others perform a separate ownership lookup and then mutate by globally unique ID.
- Child-resource mutations frequently trust a client-provided parent ID, verify the parent, and then separately confirm the child belongs to that parent. This is currently sound but needs cross-user regression tests.
- Several multi-step mutations have race or partial-write risk and should eventually use transactions or database constraints.
- The route group itself is not an authorization boundary; adding a future `(app)` page without a page-level check would expose it.
- `getSetPrStatuses` performs a current-workout-exercise lookup without a `userId` condition. Its current caller first loads an owned workout, so no current exploit was found, but the helper is unsafe to reuse without that precondition.

## Authorization primitives

| Primitive | Location | Current behavior |
| --- | --- | --- |
| Auth.js session callback | `frontend/src/auth.ts` | Copies the adapter user's database ID to `session.user.id`. |
| `requireUserId` | `frontend/src/lib/auth/require-user.ts` | Calls `auth()`, redirects unauthenticated callers to `/login`, and returns the session user ID. |
| `requireUserSession` | `frontend/src/lib/auth/require-user.ts` | Calls `auth()`, redirects unauthenticated callers to `/login`, and returns the session. |
| `verifyWorkoutOwner` | `frontend/src/lib/auth/workout-access.ts` | Queries `Workout` by both `id` and `userId`; throws `Workout not found` when absent. |
| Local action helper | `frontend/src/app/actions/routines.ts` | Duplicates `requireUserId`. |
| Local action helper | `frontend/src/app/actions/favorite-exercises.ts` | Duplicates `requireUserId`. |
| Inline session check | `frontend/src/app/actions/profile.ts` | Calls `auth()` directly and redirects to `/login`. |
| `verifyRoutineOwner` | `frontend/src/app/actions/routines.ts` | Queries `WorkoutTemplate` by both `id` and `userId`; throws `Routine not found` when absent. |

## Route inventory

### Public routes

| Route | File | Authentication behavior | Database access |
| --- | --- | --- | --- |
| `/` | `frontend/src/app/(public)/page.tsx` | Public. | None. |
| `/login` | `frontend/src/app/(public)/login/page.tsx` | Calls `auth()` and redirects an already authenticated user to `/dashboard`. | Auth.js may read session data. |
| `/api/auth/[...nextauth]` | `frontend/src/app/api/auth/[...nextauth]/route.ts` | Auth.js GET/POST handlers. | `PrismaAdapter` manages users, linked accounts, sessions, and verification tokens. |

### Protected application routes

| Route | File | User ID source | Ownership/data scope |
| --- | --- | --- | --- |
| `/dashboard` | `frontend/src/app/(app)/dashboard/page.tsx` | `requireUserSession()` | Profile, analytics, records, routine count, and active workout are scoped to the session user. |
| `/progress` | `frontend/src/app/(app)/progress/page.tsx` | `requireUserId()` | Analytics and personal-record helpers receive the authenticated user ID. |
| `/workouts` | `frontend/src/app/(app)/workouts/page.tsx` | `requireUserId()` | Workout query filters by `userId`. |
| `/workouts/new` | `frontend/src/app/(app)/workouts/new/page.tsx` | Direct `auth()` check | No owned record is read; creation action authenticates independently. |
| `/workouts/[workoutId]` | `frontend/src/app/(app)/workouts/[workoutId]/page.tsx` | `requireUserId()` | Primary workout query filters by both route ID and `userId`. Library exercises are global. Previous-performance and PR helpers receive `userId`. |
| `/routines` | `frontend/src/app/(app)/routines/page.tsx` | Direct `auth()` check | Routine query filters by `userId`. |
| `/routines/new` | `frontend/src/app/(app)/routines/new/page.tsx` | Direct `auth()` check | No owned record is read; creation action authenticates independently. |
| `/routines/[routineId]` | `frontend/src/app/(app)/routines/[routineId]/page.tsx` | Direct `auth()` check | Routine query filters by route ID and `userId`; favorites are scoped by user. Exercise catalog data is global. |
| `/exercises` | `frontend/src/app/(app)/exercises/page.tsx` | Direct `auth()` check | Exercise catalog is global; favorite relation is filtered by `userId`. |
| `/exercises/[exerciseId]` | `frontend/src/app/(app)/exercises/[exerciseId]/page.tsx` | Direct `auth()` check | Exercise catalog record is global; favorites and logged workout history are scoped to the authenticated user. |
| `/settings` | `frontend/src/app/(app)/settings/page.tsx` | Direct `auth()` check | Profile query uses the session user's unique `userId`. |

The authenticated layout at `frontend/src/app/(app)/layout.tsx` does not call `auth()`, `requireUserId()`, or `requireUserSession()`. Protection currently depends on every page continuing to enforce its own check.

## User ID read inventory

The current user ID enters application authorization through these paths:

1. `frontend/src/auth.ts` assigns the database adapter user ID to `session.user.id` in the Auth.js session callback.
2. `requireUserId()` and `requireUserSession()` read `session.user.id` for dashboard, progress, workout list, workout detail, and most workout actions.
3. Direct `auth()` checks read `session.user.id` in settings, exercises, routine pages, new-workout/new-routine pages, profile actions, and the login redirect.
4. Duplicated local `requireUserId()` functions read `session.user.id` in routine and favorite actions.

No page or action reads a `userId` from `FormData`, route parameters, query parameters, or other client input.

## Server action inventory

### Workout actions

| Exported action | Mutation | Client-provided IDs | Current authorization and ownership control |
| --- | --- | --- | --- |
| `createWorkout` | Creates `Workout`. | None. | `requireUserId`; server assigns `userId`. |
| `startTodaysWorkout` | Creates `Workout`. | None. | `requireUserId`; server assigns `userId`. |
| `updateWorkout` | Updates workout details through shared helper. | `workoutId` | `requireUserId`; `updateMany` filters by `id` and `userId`. |
| `updateWorkoutWithState` | Same mutation as `updateWorkout`. | `workoutId` | Same shared owner-scoped `updateMany`. |
| `finishWorkout` | Sets status and finish time. | `workoutId` | `requireUserId`; `updateMany` filters by `id` and `userId`. |
| `reopenWorkout` | Sets active status and clears finish time. | `workoutId` | `requireUserId`; `updateMany` filters by `id` and `userId`. |
| `deleteWorkout` | Deletes workout and cascaded children. | `workoutId` | `requireUserId`; calls `verifyWorkoutOwner`, then deletes by workout ID. |
| `repeatWorkout` | Reads an existing workout and creates a copy. | `workoutId` | Source query filters by `id` and `userId`; new record gets server user ID. |

`updateWorkout`/`updateWorkoutWithState` are two exported entry points to one mutation helper. They are counted as two server actions but one logical mutation path.

### Workout exercise and set actions

| Exported action | Mutation | Client-provided IDs | Current authorization and ownership control |
| --- | --- | --- | --- |
| `addExerciseToWorkout` | Creates `WorkoutExercise`. | `workoutId`, optional global `exerciseId` | `requireUserId`; `verifyWorkoutOwner`; library exercise is validated globally. |
| `addExerciseToWorkoutWithState` | Same mutation as above. | Same | Same shared helper. |
| `addSetToExercise` | Creates `WorkoutSet`. | `workoutId`, `workoutExerciseId` | `requireUserId`; verifies workout owner; queries exercise by both child ID and workout ID. |
| `addSetToExerciseWithState` | Same mutation as above. | Same | Same shared helper. |
| `deleteExerciseFromWorkout` | Deletes a workout exercise and cascaded sets. | `workoutId`, `workoutExerciseId` | Verifies workout owner; `deleteMany` filters by both child ID and workout ID. |
| `deleteSetFromExercise` | Deletes a set and renumbers remaining sets. | `workoutId`, `workoutSetId` | Verifies workout owner; set lookup requires its exercise's workout ID to match the submitted workout ID. |
| `updateSetInExercise` | Updates a set through shared helper. | `workoutId`, `workoutSetId` | Verifies workout owner; set lookup requires its exercise's workout ID to match; update then uses set ID. |
| `updateSetInExerciseWithState` | Same mutation as above. | Same | Same shared helper. |

### Routine actions

| Exported action | Mutation | Client-provided IDs | Current authorization and ownership control |
| --- | --- | --- | --- |
| `createRoutine` | Creates `WorkoutTemplate`. | None. | Local `requireUserId`; server assigns `userId`. |
| `updateRoutine` | Updates `WorkoutTemplate`. | `routineId` | Local `requireUserId`; `verifyRoutineOwner`; update uses routine ID. |
| `deleteRoutine` | Deletes routine and cascaded template exercises. | `routineId` | Local `requireUserId`; `verifyRoutineOwner`; delete uses routine ID. |
| `addExerciseToRoutine` | Creates `TemplateExercise`. | `routineId`, optional global `exerciseId` | Verifies routine owner; library exercise is validated globally. |
| `updateExerciseInRoutine` | Updates `TemplateExercise`. | `routineId`, `templateExerciseId` | Verifies routine owner; `updateMany` also filters by template ID and template owner. |
| `deleteExerciseFromRoutine` | Deletes `TemplateExercise`. | `routineId`, `templateExerciseId` | Verifies routine owner; `deleteMany` filters by child ID and template ID. |
| `startRoutine` | Reads routine and creates workout with nested exercises. | `routineId` | Routine query filters by `id` and `userId`; new workout receives server user ID. |

### Profile and favorite actions

| Exported action | Mutation | Client-provided IDs | Current authorization and ownership control |
| --- | --- | --- | --- |
| `saveProfile` | Upserts `Profile`. | None. | Direct `auth()` check; both lookup and create use session user ID. |
| `toggleFavoriteExercise` | Deletes or creates `FavoriteExercise`. | Global `exerciseId` | Local `requireUserId`; lookup uses unique `(userId, exerciseId)` pair; create uses server user ID; delete uses the scoped result's ID. |

## Explicit database mutation inventory

| Model | Operation sites | Authorization scope |
| --- | --- | --- |
| `Workout` | Create manual workout; start today's workout; update details; finish; reopen; delete; repeat; start from routine. | New rows receive the session user ID. Updates to details/status use `id + userId`. Delete uses a prior owner check. Copy/start source records are queried with `userId`. |
| `WorkoutExercise` | Create exercise; delete exercise. | Parent workout ownership is verified. Child lookups/deletes also match `workoutId`. |
| `WorkoutSet` | Create set; update set; delete set; renumber remaining sets. | Parent workout ownership is verified and the selected set/exercise is tied to the submitted workout. Renumbering operates on the already verified set's `workoutExerciseId`. |
| `WorkoutTemplate` | Create, update, delete. | New rows receive session user ID. Updates/deletes follow `verifyRoutineOwner`. |
| `TemplateExercise` | Create, update, delete. | Parent routine ownership is verified. Update includes a nested template owner filter; create/delete rely on verified parent plus template ID. |
| `Profile` | Upsert. | Unique lookup/create use session user ID only. |
| `FavoriteExercise` | Create/delete toggle. | Unique lookup uses `(userId, exerciseId)`; mutation uses session user ID or ID returned from that scoped lookup. |

Additional database writers:

- `PrismaAdapter` in `frontend/src/auth.ts` implicitly manages `User`, `Account`, `Session`, and `VerificationToken` records for authentication. Authorization and token lifecycle behavior are owned by Auth.js/adapter configuration rather than repository-authored mutation functions.
- `frontend/prisma/seed.ts` is a maintenance script, not a request path. It finds exercises by name and updates or creates global `Exercise` rows. It has no user authorization boundary and must never be exposed as an application endpoint.

## Ownership verification matrix

| Resource | Read ownership predicate | Mutation ownership predicate | Current confidence |
| --- | --- | --- | --- |
| Workout | `Workout.id + Workout.userId` | Direct `id + userId` for update/finish/reopen; prior `verifyWorkoutOwner` for delete and child mutations. | Strong, but mixed direct and check-then-act patterns. |
| Workout exercise | Parent workout is owned; child must match `workoutId`. | Create uses verified parent; delete uses child ID plus workout ID. | Strong under current call paths. |
| Workout set | Set query traverses `workoutExercise.workoutId`; parent workout is separately verified. | Update/delete uses set ID returned from the constrained lookup; renumber uses verified exercise ID. | Strong under current call paths; needs integration tests. |
| Routine | `WorkoutTemplate.id + userId` | Prior `verifyRoutineOwner`, except child update also includes nested owner filter. | Strong, but inconsistent. |
| Template exercise | Child must match submitted `routineId`; parent routine is owned. | Update includes child ID, template ID, and nested owner; delete includes child/template IDs after owner check. | Strong. |
| Profile | Unique `Profile.userId`. | Upsert key and created `userId` come from session. | Strong. |
| Favorite | Unique `(userId, exerciseId)`. | Create uses session ID; delete uses record returned from scoped lookup. | Strong, with toggle race risk rather than IDOR. |
| Global exercise catalog | Catalog IDs are not user-owned. | Users cannot mutate catalog through runtime actions; they can reference valid catalog IDs in owned records/favorites. | Intended global resource. |
| Auth records | Managed by Auth.js adapter. | Adapter/session token rules. | Requires separate Auth.js configuration/dependency review. |

## Client-provided identifier inventory

The following identifiers cross the client/server boundary and must remain untrusted:

- `workoutId`: update, finish, reopen, delete, repeat, add/delete workout exercise, and add/update/delete set.
- `workoutExerciseId`: add set and delete workout exercise.
- `workoutSetId`: update and delete set.
- `routineId`: update/delete/start routine and add/update/delete routine exercise.
- `templateExerciseId`: update/delete routine exercise.
- `exerciseId`: favorite toggle and optional global catalog selection when adding an exercise to a workout or routine.

No client-provided user ID is accepted. Hidden form fields are treated as client input and are covered by this inventory.

## Transaction candidates

| Priority | Logical operation | Current sequence | Risk | Recommended eventual boundary |
| --- | --- | --- | --- | --- |
| High | Delete and renumber workout set | Find set; delete; fetch remaining sets; update each number concurrently. | Partial renumbering, conflicting concurrent deletes, duplicate numbers. | One database transaction plus a uniqueness constraint on `(workoutExerciseId, setNumber)` or an ordering strategy that avoids mass renumbering. |
| High | Add workout set | Read all/current sets to calculate `length + 1`; create set. | Concurrent submissions can assign the same set number. | Transaction or atomic ordering allocator plus unique constraint. |
| High | Add workout exercise | Count exercises; create with `order = count`. | Concurrent additions can receive the same order. | Transaction or atomic ordering allocator plus unique constraint. |
| High | Add routine exercise | Verify/look up; count; create with `order = count`. | Concurrent additions can receive duplicate order; parent can change between reads. | Transaction plus `(templateId, order)` strategy. |
| High | Toggle favorite | Read existing; then delete or create. | Concurrent toggles can hit the unique constraint or produce unintuitive final state. | Transaction with defined toggle semantics, or separate idempotent add/remove actions. |
| Medium | Start routine | Read routine and exercises; nested-create workout/exercises. | Routine can change between read and copy. Nested create itself is atomic, but source snapshot is not explicit. | Interactive transaction if snapshot consistency is required. |
| Medium | Repeat workout | Read source workout/exercises; nested-create copy. | Source can change or be deleted between read and copy. | Transaction if snapshot consistency is required. |
| Medium | Update workout set | Verify parent; read set; update by set ID. | Set can be deleted/changed between lookup and update. | Prefer one owner-scoped update predicate; transaction only if additional dependent reads remain. |
| Medium | Update/delete routine | Verify owner; update/delete by ID. | Check-then-act pattern is harder to prove and can race deletion. | Prefer owner-scoped `updateMany`/`deleteMany`; transaction generally unnecessary after predicate consolidation. |
| Medium | Delete workout | Verify owner; delete by ID. | Check-then-act pattern and concurrent deletion. | Prefer owner-scoped delete pattern; transaction only if additional side effects are added. |
| Future invariant | Start today's/manual workout | Single create. | Double submission can create multiple active workouts. | Database-enforced one-active-workout policy and idempotency; transaction depending on chosen invariant. |

Single Prisma nested creates used by `startRoutine` and `repeatWorkout` are atomic for the new parent and nested children. They are listed because the preceding source read is outside an explicit transaction.

## Potential IDOR risks

### Confirmed exploitable IDORs

None identified in the current authored server actions.

### Latent or regression risks

1. **Check-then-act mutations:** `deleteWorkout`, routine update/delete, and several child mutations first prove parent ownership and then issue a mutation without `userId` in the final write predicate. IDs are globally unique and ownership is stable today, so this is not a demonstrated bypass. Consolidating authorization into the mutation predicate would make the invariant easier to verify.
2. **Parent/child ID mixing:** Set and exercise actions accept both a parent ID and child ID. Current queries verify the relationship, but these are high-value regression targets. Tests must submit an owned parent with another user's child and the inverse combination.
3. **Unsafe helper reuse:** `getSetPrStatuses` queries the current exercise by workout ID/exercise identity without including `userId`. Its current page caller establishes ownership before calling it. The helper should document or enforce that precondition before reuse elsewhere.
4. **Route-group assumption:** The `(app)` folder name and app layout do not enforce authentication. Protection can be omitted accidentally on a new page.
5. **Duplicated authentication code:** Multiple implementations can drift in redirect behavior, error behavior, or session requirements.
6. **Framework-managed auth writes:** Auth.js adapter behavior has no repository integration tests covering account linking, session invalidation, or cross-account edge cases.
7. **Raw not-found errors:** Ownership helpers throw ordinary errors. State-returning actions can expose these messages. This is primarily error-handling leakage, but uniform not-found behavior is also part of preventing resource enumeration.

## Inconsistent patterns

- Central `requireUserId` versus duplicated local helpers versus inline `auth()` checks.
- Page-level route protection exists everywhere today, but no authenticated-layout guard exists.
- Direct owner-scoped `updateMany` for workouts versus owner-check-then-ID-write for deletes and routines.
- Routine child update includes a nested owner predicate, while routine child delete relies on the prior parent check.
- Some actions have a direct form variant and a state-returning variant that invoke the same private mutation helper.
- Some missing resources throw errors, some check mutation counts, and pages use `notFound()`.
- Global exercise IDs and user-owned resource IDs share generic string validation, making trust boundaries less obvious.

## Recommended standard authorization pattern

The target pattern for every authenticated mutation should be:

1. Obtain the authenticated user ID exclusively from a centralized server-only helper.
2. Parse and validate all client input before database work. Never accept `userId` from the client.
3. Express ownership in the database query or mutation predicate whenever Prisma supports it.
4. For child resources, scope through the complete ownership chain, for example set -> workout exercise -> workout -> user.
5. Treat unauthorized and nonexistent resources identically with a stable not-found result.
6. Check affected-row counts for `updateMany`/`deleteMany` operations and fail safely when zero.
7. Use a transaction when authorization/read state and multiple writes must remain consistent.
8. Enforce critical invariants with database constraints in addition to application checks.
9. Return curated action errors; log internal detail only on the server.
10. Maintain cross-user integration tests for every action accepting a resource ID.

For routes, the `(app)` layout should eventually enforce authentication as defense in depth, while each server action must continue to authenticate independently.

## Prioritized remediation list

1. Add guarded database-backed cross-user tests for workout, set, routine, profile, and favorite mutations.
2. Centralize authenticated app-route protection in the `(app)` layout without weakening server-action checks.
3. Replace duplicated action-level `requireUserId` implementations with the central helper.
4. Standardize owner-scoped mutation predicates and affected-row checks.
5. Add explicit child-resource ownership helpers or predicates covering the full relation chain.
6. Make set deletion/renumbering and order allocation transaction-safe and enforce ordering constraints.
7. Add idempotency and a database-backed active-workout invariant.
8. Make analytics/PR helpers enforce or explicitly document ownership preconditions.
9. Standardize unauthorized/not-found error mapping so it cannot reveal resource existence or internal details.
10. Add Auth.js integration tests for session creation, account linking, sign-out, expiration, and protected-route redirects.

