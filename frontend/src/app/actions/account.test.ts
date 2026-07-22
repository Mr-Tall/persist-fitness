import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  countEnrollments: vi.fn(),
  deleteSessions: vi.fn(),
  deleteUser: vi.fn(),
  findCurrentSessionId: vi.fn(),
  findFeedback: vi.fn(),
  removeScreenshot: vi.fn(),
  requireUserId: vi.fn(),
  requireUserSession: vi.fn(),
  setCookie: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@/lib/auth/require-user", () => ({
  requireUserId: mocks.requireUserId,
  requireUserSession: mocks.requireUserSession,
}));
vi.mock("@/lib/auth/session-management", () => ({
  findCurrentSessionId: mocks.findCurrentSessionId,
}));
vi.mock("@/lib/feedback/storage", () => ({
  deleteFeedbackScreenshot: mocks.removeScreenshot,
}));
vi.mock("@/lib/db", () => ({
  db: {
    feedback: { findMany: mocks.findFeedback },
    programEnrollment: { count: mocks.countEnrollments },
    session: { deleteMany: mocks.deleteSessions },
    user: { delete: mocks.deleteUser },
  },
}));

import {
  deleteAccountWithState,
  revokeSessionWithState,
  signOutOtherSessionsWithState,
} from "./account";

const idle = { status: "idle", message: "", submittedAt: null } as const;

describe("account security actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookies.mockResolvedValue({ set: mocks.setCookie });
    mocks.requireUserId.mockResolvedValue("user-1");
    mocks.requireUserSession.mockResolvedValue({ user: { id: "user-1" }, expires: "2030-01-01T00:00:00.000Z" });
    mocks.findCurrentSessionId.mockResolvedValue("current-session");
    mocks.countEnrollments.mockResolvedValue(0);
    mocks.findFeedback.mockResolvedValue([]);
    mocks.deleteSessions.mockResolvedValue({ count: 1 });
    mocks.deleteUser.mockResolvedValue({ id: "user-1" });
  });

  it("requires exact destructive confirmation", async () => {
    const data = new FormData();
    data.set("confirmation", "delete");
    const result = await deleteAccountWithState(idle, data);
    expect(result).toMatchObject({ status: "error", code: "VALIDATION_ERROR" });
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("removes owned screenshots before the cascading user deletion", async () => {
    mocks.findFeedback.mockResolvedValue([{ screenshotPath: "user-1/private.png" }]);
    const data = new FormData();
    data.set("confirmation", "DELETE");
    const result = await deleteAccountWithState(idle, data);
    expect(result.status).toBe("success");
    expect(mocks.removeScreenshot).toHaveBeenCalledWith("user-1/private.png");
    expect(mocks.removeScreenshot.mock.invocationCallOrder[0]!)
      .toBeLessThan(mocks.deleteUser.mock.invocationCallOrder[0]!);
    expect(mocks.deleteUser).toHaveBeenCalledWith({ where: { id: "user-1" } });
    expect(mocks.setCookie).toHaveBeenCalled();
  });

  it("protects other users when the account owns a shared program", async () => {
    mocks.countEnrollments.mockResolvedValue(1);
    const data = new FormData();
    data.set("confirmation", "DELETE");
    const result = await deleteAccountWithState(idle, data);
    expect(result).toMatchObject({ status: "error", code: "CONFLICT" });
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("scopes individual session revocation and refuses the current session", async () => {
    const data = new FormData();
    data.set("sessionId", "current-session");
    const current = await revokeSessionWithState(idle, data);
    expect(current).toMatchObject({ status: "error", code: "CONFLICT" });
    expect(mocks.deleteSessions).not.toHaveBeenCalled();

    data.set("sessionId", "other-session");
    const other = await revokeSessionWithState(idle, data);
    expect(other.status).toBe("success");
    expect(mocks.deleteSessions).toHaveBeenCalledWith({
      where: { id: "other-session", userId: "user-1" },
    });
  });

  it("preserves the verified current session when signing out other devices", async () => {
    const result = await signOutOtherSessionsWithState(idle, new FormData());
    expect(result.status).toBe("success");
    expect(mocks.deleteSessions).toHaveBeenCalledWith({
      where: { userId: "user-1", id: { not: "current-session" } },
    });
  });
});
