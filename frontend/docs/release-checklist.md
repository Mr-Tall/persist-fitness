# Persist Fitness alpha release checklist

## Release architecture and ownership

During alpha, release ownership is intentionally simple:

- GitHub Actions validates pull requests and `main` without production database
  access.
- Main CI replays the complete migration history against disposable PostgreSQL
  and verifies database invariants and Prisma drift.
- Vercel Git integration deploys the application automatically when a reviewed
  commit reaches `main`.
- A release developer manually runs `npx prisma migrate deploy` for releases
  that contain Prisma migrations.

There is no GitHub-managed production deployment workflow and ordinary CI has
no production database or Vercel deployment credentials. Preview deployments
must never migrate Production. Vercel builds with `npm run build`, which
generates the Prisma client and builds Next.js but does not apply migrations.

For a release containing a migration, apply it before merging the code that
depends on it to `main`. This ensures the reviewed migration is complete before
Vercel starts the matching Git deployment. If release coordination requires the
operations to happen close together, apply the migration immediately before the
merge; never deploy dependent code first.

This process is ordered, not atomic. A successful migration cannot be rolled
back automatically if the later application deployment fails. Production
migrations must remain backward-compatible with the currently deployed
application by following the expand-and-contract guidance below.

## Database connection roles

- `DATABASE_URL` is the pooled runtime application connection used by the
  deployed Next.js application.
- `DIRECT_URL` is the non-PgBouncer direct or session-pooler connection used by
  Prisma CLI migration commands.
- The release developer supplies both values locally from an approved secret
  store. They must identify the same production database.
- Pull-request CI uses syntactically valid placeholders and never connects to
  production.
- Main-branch migration-history CI uses a disposable PostgreSQL 17 service.

Never put production connection strings in repository files, command output,
ordinary GitHub Actions configuration, or Vercel Preview environments. Keep
them in an ignored environment file or an approved local secret mechanism and
clear shell-scoped values after the release.

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
database.

### GitHub Actions

No GitHub production environment or Vercel deployment secrets are required for
the alpha release process. Keep the `Persist Fitness CI` workflow active:

- pull requests run code, schema, migration-presence, test, and build checks;
- pushes to `main` additionally replay migrations against disposable
  PostgreSQL and verify unsupported database indexes and Prisma drift;
- no job reads production database credentials or performs a production
  deployment.

### Vercel Production variables and settings

Configure these Production environment variables in Vercel:

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `AUTH_URL` (and `NEXTAUTH_URL` only if retained for compatibility)
- observability variables documented in `docs/production-observability.md`

Set the Vercel project Root Directory to `frontend` and keep Git integration
enabled for Production deployments from `main`. Do not add `prisma migrate
deploy` to the Vercel Build Command. Keep Preview database and OAuth
configuration separate from Production.

### Repository protection

- Require the `Persist Fitness CI / Code and schema validation` check before
  merging to `main`.
- Require pull requests for `main` and prevent force pushes.
- Limit the `prisma-no-migration` label to maintainers. It is the explicit
  escape hatch for a database-significant schema diff that intentionally maps
  existing database state; the pull request must explain why no SQL is needed.

## Pre-release

- [ ] Confirm the release branch is clean, reviewed, and based on current
      `main`.
- [ ] Confirm required CI checks pass for the exact release commit.
- [ ] Run `npm run release:check` from `frontend/` and review the result.
- [ ] Review every new `prisma/migrations/*/migration.sql` statement.
- [ ] Confirm main CI can replay the complete migration history against
      disposable PostgreSQL.
- [ ] For a migration release, confirm a recent production backup or provider
      point-in-time recovery is available and record its timestamp.
- [ ] Confirm `DATABASE_URL` targets the pooled production application database.
- [ ] Confirm `DIRECT_URL` targets the same production database through a
      migration-capable direct or session connection.
- [ ] Confirm no migration is destructive or required by the currently deployed
      application before it is safe to apply.
- [ ] Verify Google OAuth authorized origins and callback URLs match Production.
- [ ] For native releases, verify iOS version and build numbers and the exact
      hosted production origin embedded in the candidate.

## Release without Prisma migrations

1. Merge the reviewed release commit to `main`.
2. Confirm main CI succeeds.
3. Confirm Vercel Git integration deploys that `main` commit to Production.
4. Run the non-destructive smoke test and complete the post-release checks.

## Release with Prisma migrations

Run these commands only from `frontend/`, with locally supplied production
`DATABASE_URL` and `DIRECT_URL` values. Do not echo either value.

1. Confirm the reviewed release commit and its migration SQL are unchanged.
2. Confirm the production backup or recovery point.
3. Inspect current migration status:

   ```bash
   npx prisma migrate status
   ```

4. Apply the reviewed migration history:

   ```bash
   npx prisma migrate deploy
   ```

5. Confirm migration status is current:

   ```bash
   npx prisma migrate status
   ```

6. If and only if migration deployment succeeded, merge the exact reviewed
   commit to `main`. Vercel Git integration will begin the application
   deployment.
7. Confirm main CI and the Vercel Production deployment succeed for that commit.
8. Run the read-only smoke test:

   ```bash
   npm run release:smoke -- --origin https://production.example
   ```

If migration deployment fails, do not merge the dependent application code.
Investigate and use a reviewed forward fix; never force the application deploy
past an incomplete schema change.

## Production verification

- [ ] Confirm the Vercel deployment corresponds to the intended `main` commit.
- [ ] Monitor Vercel build and function logs.
- [ ] Monitor Sentry for authentication, Prisma, and startup errors.
- [ ] Verify Google login manually in a fresh browser session.
- [ ] Verify Today/dashboard loads for a test account.
- [ ] Create and complete a workout with a dedicated test account.
- [ ] Verify Settings, session management, and feedback submission.
- [ ] Confirm no new Prisma missing-column, migration, or connection errors.
- [ ] Record the deployed Git commit, applied migration directories, and smoke
      test result.

## Rollback and forward fixes

If migration, deployment, or smoke testing fails, stop the release. Application
code may be reverted when the previous version remains compatible with the
migrated schema.

Prisma production migrations are forward-only. Do not run `prisma migrate
reset` in production. Do not delete or edit production migration records
manually. If SQL has already been applied and needs correction, create, review,
and deploy a new forward corrective migration. Use `prisma migrate resolve`
only during an explicitly reviewed incident response where the database state
has been independently verified.

### Expand-and-contract pattern

For destructive or incompatible changes:

1. **Expand:** add nullable columns, tables, or indexes without removing old
   fields.
2. Deploy code that can read old and new shapes and writes the new shape.
3. Backfill separately with bounded, observable operations when required.
4. Verify all production readers use the new shape.
5. **Contract:** remove old fields in a later release and migration.

Never combine a required data backfill, destructive column removal, and the code
that first depends on the new shape in one production release.

## Prohibited production commands

Never use `prisma migrate dev`, `prisma db push`, or `prisma migrate reset`
against Production.
