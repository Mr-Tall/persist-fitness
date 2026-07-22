import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("universal exercise tracking schema", () => {
  it("keeps all tracking metrics on the existing WorkoutSet model", () => {
    const schema = readFileSync(
      join(process.cwd(), "prisma", "schema.prisma"),
      "utf8",
    );
    const workoutSet = schema.match(/model WorkoutSet \{[\s\S]*?\n\}/)?.[0];

    expect(workoutSet).toContain("durationSeconds   Int?");
    expect(workoutSet).toContain("distance          Float?");
    expect(workoutSet).toContain("distanceUnit      String?");
    expect(schema).not.toMatch(/model (?:TimedSet|DistanceSet)/);
  });

  it("adds nullable columns and normalizes the legacy reps-only label", () => {
    const migration = readFileSync(
      join(
        process.cwd(),
        "prisma",
        "migrations",
        "20260722000000_add_universal_exercise_tracking",
        "migration.sql",
      ),
      "utf8",
    );

    expect(migration).toContain('ADD COLUMN "durationSeconds" INTEGER');
    expect(migration).toContain('ADD COLUMN "distance" DOUBLE PRECISION');
    expect(migration).toContain('ADD COLUMN "distanceUnit" TEXT');
    expect(migration).toContain("SET \"trackingType\" = 'reps_only'");
  });
});
