import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("feedback admin inbox", () => {
  const source = readFileSync(
    resolve(process.cwd(), "src/app/(app)/admin/feedback/page.tsx"),
    "utf8",
  );

  it("keeps filtering allowlisted, newest-first, and paginated", () => {
    expect(source).toContain("feedbackStatuses.some");
    expect(source).toContain("feedbackCategories.some");
    expect(source).toContain('ORDER BY "createdAt" DESC');
    expect(source).toContain("LIMIT ${PAGE_SIZE}");
    expect(source).toContain("OFFSET ${(page - 1) * PAGE_SIZE}");
  });

  it("authorizes the server page before querying feedback", () => {
    expect(source.indexOf("await requireAdminUser()"))
      .toBeLessThan(source.indexOf("await db.$queryRaw"));
  });
});
