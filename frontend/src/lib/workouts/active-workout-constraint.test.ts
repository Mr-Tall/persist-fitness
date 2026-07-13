import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const indexName = "Workout_one_active_per_user_key";
const migrationDirectory =
  "20260713020000_add_one_active_workout_per_user";

describe("one active workout database invariant", () => {
  it("creates only the intended partial unique index", () => {
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
        `CREATE UNIQUE INDEX "${indexName}"`,
        'ON "Workout"("userId")',
        'WHERE "status" = \'active\';',
      ].join("\n")
    );
    expect(migration).not.toMatch(/\b(?:UPDATE|DELETE)\b/i);
  });

  it("keeps the CI catalog assertion aligned with the migration", () => {
    const workflow = readFileSync(
      join(process.cwd(), "..", ".github", "workflows", "ci.yml"),
      "utf8"
    );
    const normalizedWorkflow = workflow.replace(/\s+/g, " ");

    expect(workflow).toContain(indexName);
    expect(workflow).toContain("table_data.relname = 'Workout'");
    expect(workflow).toContain("index_data.indisunique");
    expect(workflow).toContain("ARRAY['userId']::name[]");
    expect(normalizedWorkflow).toContain(
      "pg_get_expr(index_data.indpred, index_data.indrelid) = " +
        "'(status = ''active''::text)'"
    );
  });
});
