import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findMany: vi.fn(),
  headers: vi.fn(),
  updateMany: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("@/lib/db", () => ({
  db: { session: { findFirst: mocks.findFirst, findMany: mocks.findMany, updateMany: mocks.updateMany } },
}));

import {
  findCurrentSessionId,
  listManagedSessions,
  recordCurrentSessionActivity,
  summarizeSessionUserAgent,
} from "./session-management";

const session = { user: { id: "user-1" }, expires: "2030-01-01T00:00:00.000Z" };

describe("session management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findFirst.mockResolvedValue({ id: "current" });
    mocks.headers.mockResolvedValue(new Headers({ "user-agent": "Mozilla iPhone Safari" }));
    mocks.updateMany.mockResolvedValue({ count: 1 });
  });

  it("stores only a normalized device summary and throttled activity update", async () => {
    expect(summarizeSessionUserAgent("Mozilla iPhone Safari")).toBe("Safari on iOS");
    await recordCurrentSessionActivity(session);
    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: "current", userId: "user-1", OR: expect.any(Array) }),
      data: expect.objectContaining({ userAgentSummary: "Safari on iOS" }),
    }));
  });

  it("resolves the current session only within the authenticated user's rows", async () => {
    await expect(findCurrentSessionId("user-1", session.expires)).resolves.toBe("current");
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: { userId: "user-1", expires: new Date(session.expires) },
      select: { id: true },
    });
  });

  it("marks the exact current session without exposing tokens", async () => {
    mocks.findMany.mockResolvedValue([
      { id: "current", createdAt: new Date(), expires: new Date("2030-01-01"), lastActiveAt: new Date(), userAgentSummary: "Safari on iOS" },
      { id: "other", createdAt: new Date(), expires: new Date("2030-02-01"), lastActiveAt: new Date(), userAgentSummary: null },
    ]);
    const result = await listManagedSessions(session);
    expect(result).toEqual([
      expect.objectContaining({ id: "current", isCurrent: true }),
      expect.objectContaining({ id: "other", isCurrent: false, userAgentSummary: "Unknown device" }),
    ]);
    expect(JSON.stringify(result)).not.toContain("sessionToken");
  });
});
