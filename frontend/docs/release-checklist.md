# Persist Fitness production release checklist

## Release architecture and ownership

GitHub Actions is the only normal owner of production Prisma migrations. The
`Persist Fitness Production Release` workflow is serialized through one
production concurrency group and runs only after the `Persist Fitness CI`
workflow succeeds for a push to `main`.

The release order is:

1. validate the exact commit in CI;
2. replay all migrations against disposable PostgreSQL on `main`;
3. enter the protected GitHub `production` environment;
4. run `prisma migrate deploy` once against the production direct connection;
5. verify `prisma migrate status` succeeds;
6. deploy that exact commit to Vercel Production;
7. run read-only smoke tests against the production origin.

`frontend/vercel.json` disables automatic Git deployments for `main` while
leaving other branches eligible for Preview deployments. Vercel builds with
`npm run build`, which generates Prisma's client and builds Next.js but never
applies migrations. Confirm the Vercel dashboard has not overridden this
configuration. If Vercel automatically deploys `main`, application deployment
can race ahead of the migration workflow and this ordering is not guaranteed.

This is ordered, not atomic: a successful migration cannot be rolled back
automatically if the later application deployment fails. Production migrations
must therefore be backward-compatible with the currently deployed application.
Use expand-and-contract changes described below.

## Database connection roles

- `DATABASE_URL` is the pooled runtime application connection used by the
  deployed Next.js application.
- `DIRECT_URL` is the non-PgBouncer/direct or session-pooler connection used by
  Prisma CLI migration commands.
- The GitHub production workflow stores these as separate production secrets.
- PR CI uses syntactically valid placeholders and never connects to production.
- Main-branch migration-history CI uses a disposable PostgreSQL 17 service.

Never point PR CI or a Vercel Preview deployment at the production database
without an explicit, reviewed exception. Preview must not run migrations.

## Required configuration

### Local development variables

Keep values in an ignored local environment file. Required names are documented
in `.env.example`:

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `AUTH_URL` (or `NEXTAUTH_URL`)

Local developers may use `prisma migrate dev` only against their own development
database. Local production deployment is not the normal release path.

### GitHub production environment

Create an environment named `production`, ideally with required reviewer
approval. Configure these secrets by name only:

- `PRODUCTION_DATABASE_URL`
- `PRODUCTION_DIRECT_URL`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Configure this environment variable:

- `PRODUCTION_ORIGIN` — canonical HTTPS origin, without credentials or query
  parameters.

The workflow token has only `contents: read`. Database and Vercel secrets are
not available to pull-request workflows or forked pull requests.

### Vercel Production variables and settings

Configure these Production environment variables in Vercel:

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `AUTH_URL` (and `NEXTAUTH_URL` only if retained for compatibility)
- observability variables documented in `docs/production-observability.md`

Set the Vercel project Root Directory to `frontend`. The checked-in
`frontend/vercel.json` disables automatic `main` deployments so GitHub owns
production ordering while other branches can still receive previews. Do not
add `prisma migrate deploy` to the Vercel Build Command. Keep Preview database
and OAuth configuration separate from Production.

### Repository protection

- Require the `Persist Fitness CI / Code and schema validation` check before
  merging to `main`.
- Require pull requests for `main` and prevent force pushes.
- Limit the `prisma-no-migration` label to maintainers. It is the explicit
  escape hatch for a database-significant schema diff that intentionally maps
  existing database state; the pull request must explain why no SQL is needed.
- Protect the GitHub `production` environment with reviewers before TestFlight
  or App Store releases.

## Pre-release

- [ ] Confirm the pull request is merged and `main` is clean and current.
- [ ] Review every new `prisma/migrations/*/migration.sql` statement.
- [ ] Confirm a recent production backup or provider point-in-time recovery is
      available and document its timestamp.
- [ ] Confirm `DATABASE_URL` targets the pooled production application database.
- [ ] Confirm `DIRECT_URL` targets the same production database through a
      migration-capable direct/session connection.
- [ ] Confirm GitHub Actions is the sole production migration owner.
- [ ] Confirm automatic Vercel Production Git deployments remain disabled.
- [ ] Verify all required GitHub and Vercel variable names are configured.
- [ ] Verify Google OAuth authorized origins and callback URLs match Production.
- [ ] Run `npm run release:check` from `frontend/` and review the result.
- [ ] Review CI migration-history checks against disposable PostgreSQL.
- [ ] For native releases, verify iOS version and build numbers and the exact
      hosted production origin embedded in the candidate.

## Release

- [ ] Approve the protected GitHub `production` environment when prompted.
- [ ] Confirm the workflow runs `npm run prisma:deploy` and stops on failure.
- [ ] Confirm the post-deploy `npm run prisma:status` check succeeds.
- [ ] Confirm Vercel deploys the same commit SHA validated by CI.
- [ ] Confirm the automated production smoke test succeeds.
- [ ] Monitor Vercel build and function logs.
- [ ] Monitor Sentry for authentication, Prisma, and startup errors.
- [ ] Verify Google login manually in a fresh browser session.
- [ ] Verify Today/dashboard loads for a test account.
- [ ] Create and complete a workout with a dedicated test account.
- [ ] Verify Settings, session management, and feedback submission.
- [ ] Confirm no new Prisma missing-column, migration, or connection errors.

## Rollback and forward fixes

If migration, deployment, or smoke testing fails, stop the release and prevent
further promotions. Application code may be reverted when the previous version
remains compatible with the migrated schema.

Prisma production migrations are normally forward-only. Do not run
`prisma migrate reset` in production. Do not delete or edit production migration
records manually. If SQL has already been applied and needs correction, create,
review, and deploy a new forward corrective migration. Use `prisma migrate
resolve` only during an explicitly reviewed incident response where the database
state has been independently verified.

### Expand-and-contract pattern

For destructive or incompatible changes:

1. **Expand:** add nullable columns/tables/indexes without removing old fields.
2. Deploy code that can read old and new shapes and writes the new shape.
3. Backfill separately with bounded, observable operations when required.
4. Verify all production readers use the new shape.
5. **Contract:** remove old fields in a later release and migration.

Never combine a required data backfill, destructive column removal, and the code
that first depends on the new shape in one production release.

## Post-release

- [ ] Re-run or inspect `npm run prisma:status` in the release job.
- [ ] Record the deployed Git commit SHA.
- [ ] Record every migration directory applied by the release.
- [ ] Record the production smoke-test result.
- [ ] Monitor authentication and database errors through the agreed observation
      window.
- [ ] Confirm Google login and dashboard access remain healthy.
- [ ] Confirm the native/TestFlight candidate points at the verified release.

## Manual emergency commands

These are diagnostic or incident commands, not the normal release path. Run only
from `frontend/` after independently confirming the target database:

```bash
npm run prisma:status
npm run prisma:deploy
npm run release:smoke -- --origin https://production.example
```

Never use `prisma migrate dev`, `prisma db push`, or `prisma migrate reset`
against Production.
