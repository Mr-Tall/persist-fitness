import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationDirectory = "20260721000000_add_training_programs";

describe("training program database model", () => {
  it("references routine templates instead of duplicating exercises", () => {
    const schema = readFileSync(
      join(process.cwd(), "prisma", "schema.prisma"),
      "utf8",
    );
    const programDay = schema.match(/model ProgramDay \{[\s\S]*?\n\}/)?.[0];

    expect(programDay).toContain("routineId");
    expect(programDay).toContain("routine         WorkoutTemplate");
    expect(programDay).not.toContain("TemplateExercise[]");
  });

  it("enforces one active enrollment per user without cleanup SQL", () => {
    const migration = readFileSync(
      join(
        process.cwd(),
        "prisma",
        "migrations",
        migrationDirectory,
        "migration.sql",
      ),
      "utf8",
    );

    expect(migration).toContain(
      'CREATE UNIQUE INDEX "ProgramEnrollment_one_active_per_user_key"',
    );
    expect(migration).toContain('ON "ProgramEnrollment"("userId")');
    expect(migration).toContain('WHERE "status" = \'active\';');
    expect(migration).not.toMatch(
      /(?:^|\n)\s*(?:UPDATE|DELETE|TRUNCATE)\b/im,
    );
  });

  it("verifies the unsupported partial index through the CI catalog", () => {
    const workflow = readFileSync(
      join(process.cwd(), "..", ".github", "workflows", "ci.yml"),
      "utf8",
    ).replace(/\s+/g, " ");

    expect(workflow).toContain("ProgramEnrollment_one_active_per_user_key");
    expect(workflow).toContain("table_data.relname = 'ProgramEnrollment'");
    expect(workflow).toContain("ARRAY['userId']::name[]");
    expect(workflow).toContain("'(status = ''active''::text)'");
  });

  it("keeps completed workout history independent from program ownership", () => {
    const schema = readFileSync(
      join(process.cwd(), "prisma", "schema.prisma"),
      "utf8",
    );
    const programWorkout = schema.match(
      /model ProgramWorkout \{[\s\S]*?\n\}/,
    )?.[0];

    expect(programWorkout).toContain("workoutId     String    @unique");
    expect(programWorkout).toContain("workout    Workout");
    expect(programWorkout).toContain("enrollment ProgramEnrollment");
  });
});
