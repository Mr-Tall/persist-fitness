# Playwright end-to-end tests

Persist Fitness uses Playwright for a small set of browser-level critical
journeys. Vitest remains responsible for validation edge cases and component
behavior.

## Safety model

The suite refuses to start unless `E2E_DATABASE_URL` points to PostgreSQL on a
loopback hostname and the database name contains `e2e` or `test`. Never point
this setting at Supabase, Preview, Staging, or Production.

Each test creates a unique user, a legitimate Auth.js database session, and a
unique exercise. The browser receives the normal `authjs.session-token` cookie,
so application authentication and ownership checks execute unchanged. Deleting
the test user after the test cascades through its workouts, routines, profile,
and session; the unique exercise is then removed separately.

The suite currently uses one worker. This is intentionally conservative while
all tests share one disposable database.

## Prerequisites

- Node 22
- A local PostgreSQL database reserved only for E2E tests
- The committed Prisma migrations applied to that database
- Chromium installed by Playwright

Create the local environment file:

```powershell
Copy-Item .env.e2e.example .env.e2e
```

Create the database, then apply migrations using the same disposable URL for
both Prisma variables:

```powershell
$env:DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5432/persist_fitness_e2e"
$env:DIRECT_URL = $env:DATABASE_URL
npm run db:migrate:deploy
```

Install the Chromium browser once:

```powershell
npx playwright install chromium
```

The Playwright web server supplies local placeholder Auth and OAuth values.
No Google login, production secret, or Supabase credential is required.

## Running tests

Run all Chromium desktop and mobile tests:

```powershell
npm run test:e2e
```

Run one file or one project:

```powershell
npx playwright test e2e/tests/workout-journey.e2e.ts
npx playwright test --project=mobile-chromium
```

Interactive and diagnostic modes:

```powershell
npm run test:e2e:ui
npm run test:e2e:headed
npm run test:e2e:debug
```

## Artifacts

- HTML report: `playwright-report/`
- Traces, screenshots, and retained failure videos: `test-results/playwright/`
- Traces are captured on the first retry.
- Screenshots are captured on failure.
- Videos are retained only on failure.

These directories and `.env.e2e` are ignored by Git.

## Covered journeys

- Protected-route redirect and authenticated dashboard access
- First-time onboarding completion and refresh persistence
- Empty dashboard and primary mobile navigation
- Workout creation, exercise selection, set logging/editing, completion, and
  completed-state persistence
- Routine creation, exercise planning, metadata editing, refresh persistence,
  and deletion
- Profile saving and refresh persistence
- Dialog focus entry, Escape close, trigger focus restoration, and a single
  exposed dialog
- Mobile workout dock, Add Set usability, sheet behavior, and completed history

## Known limitations

- Chromium is the only browser engine configured initially.
- Local E2E setup requires PostgreSQL; the suite never uses production secrets.
- Tests run with one worker until database isolation is proven safe under
  parallel execution.
- Google OAuth itself is not tested. Authentication coverage uses Auth.js's
  real database-session path after deterministic local session setup.
