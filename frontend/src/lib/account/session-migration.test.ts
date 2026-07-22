import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("session activity migration", () => {
  const sql = readFileSync(resolve(process.cwd(), "prisma/migrations/20260725000000_add_session_activity_metadata/migration.sql"), "utf8");
  it("adds bounded session metadata without changing session tokens", () => {
    expect(sql).toContain('ADD COLUMN "createdAt"');
    expect(sql).toContain('ADD COLUMN "lastActiveAt"');
    expect(sql).toContain('ADD COLUMN "userAgentSummary"');
    expect(sql).toContain('CREATE INDEX "Session_userId_expires_idx"');
    expect(sql).not.toMatch(/ALTER COLUMN "sessionToken"/);
  });
});
