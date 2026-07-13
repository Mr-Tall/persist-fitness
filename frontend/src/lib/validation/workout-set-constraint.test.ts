import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationDirectory =
  "20260712160000_add_unique_workout_set_number";

describe("workout set number database constraint", () => {
  it("declares composite uniqueness in the Prisma schema", () => {
    const schema = readFileSync(
      join(process.cwd(), "prisma", "schema.prisma"),
      "utf8"
    );
    const workoutSetModel = schema.match(
      /model WorkoutSet \{[\s\S]*?\n\}/
    )?.[0];

    expect(workoutSetModel).toContain(
      "@@unique([workoutExerciseId, setNumber])"
    );
  });

  it("creates only the intended Prisma-compatible unique index", () => {
    const migration = readFileSync(
      join(
        process.cwd(),
        "prisma",
        "migrations",
        migrationDirectory,
        "migration.sql"
      ),
      "utf8"
    ).replaceAll("\r\n", "\n");

    expect(migration.trim()).toBe(
      [
        "-- CreateIndex",
        'CREATE UNIQUE INDEX "WorkoutSet_workoutExerciseId_setNumber_key"',
        'ON "WorkoutSet"("workoutExerciseId", "setNumber");',
      ].join("\n")
    );
  });
});
