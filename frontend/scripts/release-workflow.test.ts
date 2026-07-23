import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(process.cwd(), "..");
const productionWorkflowPath = resolve(
  repositoryRoot,
  ".github/workflows/production-release.yml",
);
const ciWorkflow = readFileSync(
  resolve(repositoryRoot, ".github/workflows/ci.yml"),
  "utf8",
);
const packageConfiguration = JSON.parse(
  readFileSync(resolve(repositoryRoot, "frontend/package.json"), "utf8"),
);
const releaseChecklist = readFileSync(
  resolve(repositoryRoot, "frontend/docs/release-checklist.md"),
  "utf8",
);
const vercelConfiguration = JSON.parse(
  readFileSync(resolve(repositoryRoot, "frontend/vercel.json"), "utf8"),
);

describe("alpha release safeguards", () => {
  it("uses Vercel Git integration instead of a GitHub production workflow", () => {
    expect(existsSync(productionWorkflowPath)).toBe(false);
    expect(vercelConfiguration).toMatchObject({
      git: { deploymentEnabled: { main: true } },
    });
  });

  it("keeps production credentials and migrations out of pull-request validation", () => {
    const qualityJob = ciWorkflow.slice(
      ciWorkflow.indexOf("  quality:"),
      ciWorkflow.indexOf("  migration-history:"),
    );

    expect(qualityJob).not.toContain("secrets.");
    expect(qualityJob).not.toContain("prisma:deploy");
    expect(ciWorkflow).toContain(
      "if: github.event_name == 'push' && github.ref == 'refs/heads/main'",
    );
  });

  it("replays migrations only against disposable PostgreSQL in main CI", () => {
    const migrationJob = ciWorkflow.slice(
      ciWorkflow.indexOf("  migration-history:"),
    );

    expect(migrationJob).toContain("image: postgres:17");
    expect(migrationJob).toContain("npm run prisma:deploy");
    expect(migrationJob).not.toContain("secrets.");
    expect(migrationJob).not.toContain("PRODUCTION_DATABASE_URL");
    expect(migrationJob).not.toContain("PRODUCTION_DIRECT_URL");
  });

  it("keeps migrations out of the Vercel build command", () => {
    expect(packageConfiguration.scripts.build).toBe(
      "prisma generate && next build",
    );
    expect(packageConfiguration.scripts.build).not.toContain("migrate deploy");
    expect(packageConfiguration.scripts.build).not.toContain("db push");
  });

  it("documents the manual migration-before-deployment sequence", () => {
    expect(releaseChecklist).toContain("Vercel Git integration");
    expect(releaseChecklist).toContain("npx prisma migrate deploy");
    expect(releaseChecklist).toMatch(
      /before merging the code that\s+depends on it to `main`/,
    );
    expect(releaseChecklist).not.toContain("VERCEL_TOKEN");
    expect(releaseChecklist).not.toContain("VERCEL_ORG_ID");
    expect(releaseChecklist).not.toContain("VERCEL_PROJECT_ID");
    expect(releaseChecklist).not.toContain("PRODUCTION_DATABASE_URL");
    expect(releaseChecklist).not.toContain("PRODUCTION_DIRECT_URL");
  });

  it("never uses destructive or development-only Prisma commands in CI", () => {
    expect(ciWorkflow).not.toContain("prisma migrate dev");
    expect(ciWorkflow).not.toContain("prisma db push");
    expect(ciWorkflow).not.toContain("prisma migrate reset");
  });
});
