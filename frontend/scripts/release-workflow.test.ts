import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(process.cwd(), "..");
const releaseWorkflow = readFileSync(
  resolve(repositoryRoot, ".github/workflows/production-release.yml"),
  "utf8",
);
const ciWorkflow = readFileSync(
  resolve(repositoryRoot, ".github/workflows/ci.yml"),
  "utf8",
);
const vercelConfiguration = JSON.parse(
  readFileSync(resolve(repositoryRoot, "frontend/vercel.json"), "utf8"),
);

describe("production release workflow", () => {
  it("serializes releases and applies migrations before deploying the validated commit", () => {
    const migrationIndex = releaseWorkflow.indexOf("npm run prisma:deploy");
    const applicationDeployIndex = releaseWorkflow.indexOf(
      "vercel@56.5.0 deploy",
    );
    const smokeIndex = releaseWorkflow.indexOf("npm run release:smoke");

    expect(releaseWorkflow).toContain("cancel-in-progress: false");
    expect(releaseWorkflow).toContain("workflow_run.head_sha");
    expect(releaseWorkflow).toContain("npm run prisma:status");
    expect(releaseWorkflow).toContain("working-directory: .");
    expect(releaseWorkflow).toContain("githubDeployment=1");
    expect(migrationIndex).toBeGreaterThan(-1);
    expect(applicationDeployIndex).toBeGreaterThan(migrationIndex);
    expect(smokeIndex).toBeGreaterThan(applicationDeployIndex);
  });

  it("disables automatic main deployment while retaining preview branches", () => {
    expect(vercelConfiguration).toMatchObject({
      git: { deploymentEnabled: { main: false } },
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

  it("scopes production credentials to the steps that require them", () => {
    const jobEnvironment = releaseWorkflow.slice(
      releaseWorkflow.indexOf("    env:"),
      releaseWorkflow.indexOf("    steps:"),
    );
    const installStep = releaseWorkflow.slice(
      releaseWorkflow.indexOf("      - name: Install dependencies"),
      releaseWorkflow.indexOf("      - name: Generate and validate Prisma client"),
    );

    expect(jobEnvironment).not.toContain("PRODUCTION_DATABASE_URL");
    expect(jobEnvironment).not.toContain("VERCEL_TOKEN");
    expect(installStep).not.toContain("secrets.");
    expect(releaseWorkflow).toContain("secrets.PRODUCTION_DIRECT_URL");
    expect(releaseWorkflow).toContain("secrets.VERCEL_TOKEN");
  });

  it("never uses destructive or development-only Prisma deployment commands", () => {
    expect(releaseWorkflow).not.toContain("prisma migrate dev");
    expect(releaseWorkflow).not.toContain("prisma db push");
    expect(releaseWorkflow).not.toContain("prisma migrate reset");
  });
});
