import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("onboarding persistence migration", () => {
  it("backfills returning users while leaving future users incomplete by default", () => {
    const schema = readFileSync(
      path.join(process.cwd(), "prisma", "schema.prisma"),
      "utf8",
    );
    const migration = readFileSync(
      path.join(
        process.cwd(),
        "prisma",
        "migrations",
        "20260719000000_add_user_onboarding_completion",
        "migration.sql",
      ),
      "utf8",
    );

    expect(schema).toContain("onboardingCompletedAt DateTime?");
    expect(schema).not.toMatch(/onboardingCompletedAt\s+DateTime\?\s+@default/);
    expect(migration).toContain(
      'ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3)',
    );
    expect(migration).toContain(
      'SET "onboardingCompletedAt" = CURRENT_TIMESTAMP',
    );
  });
});
