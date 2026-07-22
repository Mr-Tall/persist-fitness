import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("feedback migration", () => {
  const sql = readFileSync(resolve(process.cwd(), "prisma/migrations/20260724000000_add_feedback_and_admin_role/migration.sql"), "utf8");
  it("adds server roles, feedback ownership, and inbox indexes", () => {
    expect(sql).toContain('ADD COLUMN "role"');
    expect(sql).toContain('CREATE TABLE "Feedback"');
    expect(sql).toContain('Feedback_userId_fkey');
    for (const index of ["status", "category", "createdAt", "userId"]) expect(sql).toContain(`Feedback_${index}_idx`);
  });
});
