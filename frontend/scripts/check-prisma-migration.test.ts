import { describe, expect, it } from "vitest";
import { evaluateMigrationConsistency } from "./check-prisma-migration.mjs";

const baseSchema = `
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql" url = env("DATABASE_URL") }
model User { id String @id }
`;

describe("Prisma migration consistency check", () => {
  it("fails when database schema changes without migration SQL", () => {
    const result = evaluateMigrationConsistency({
      baseSchema,
      currentSchema: `${baseSchema}\nmodel Workout { id String @id }`,
      changedFiles: ["frontend/prisma/schema.prisma"],
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toContain("require a checked-in migration");
  });

  it("passes when schema and migration SQL change together", () => {
    const result = evaluateMigrationConsistency({
      baseSchema,
      currentSchema: `${baseSchema}\nmodel Workout { id String @id }`,
      changedFiles: [
        "frontend/prisma/schema.prisma",
        "frontend/prisma/migrations/20260726000000_add_workout/migration.sql",
      ],
    });

    expect(result.ok).toBe(true);
  });

  it("recognizes generator-only and formatting changes as non-migrating", () => {
    const result = evaluateMigrationConsistency({
      baseSchema,
      currentSchema: `
        generator client {
          provider = "prisma-client-js"
          engineType = "client"
        }
        datasource db { provider = "postgresql" url = env("DIRECT_URL") }
        // Formatting and comments do not change the database.
        model User {
          id String @id
        }
      `,
      changedFiles: ["frontend/prisma/schema.prisma"],
    });

    expect(result).toMatchObject({ ok: true });
    expect(result.reason).toContain("non-database");
  });

  it("requires a documented maintainer exception for other non-migrating edits", () => {
    const result = evaluateMigrationConsistency({
      baseSchema,
      currentSchema: `${baseSchema}\nmodel Workout { id String @id }`,
      changedFiles: ["frontend/prisma/schema.prisma"],
      override: true,
      justification: "Maintainer verified that this maps existing database state.",
    });

    expect(result).toMatchObject({ ok: true });
    expect(result.reason).toContain("Maintainer-approved");
  });
});
