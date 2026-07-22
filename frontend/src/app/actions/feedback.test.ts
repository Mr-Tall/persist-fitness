import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUserId: vi.fn(), requireAdminUser: vi.fn(), query: vi.fn(), execute: vi.fn(),
  upload: vi.fn(), remove: vi.fn(), createUrl: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/require-user", () => ({ requireUserId: mocks.requireUserId }));
vi.mock("@/lib/auth/admin", () => ({ requireAdminUser: mocks.requireAdminUser }));
vi.mock("@/lib/db", () => ({ db: { $queryRaw: mocks.query, $executeRaw: mocks.execute } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "user-agent": "Mozilla/5.0 (iPhone) Safari/605" }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
vi.mock("@/lib/feedback/storage", () => ({
  uploadFeedbackScreenshot: mocks.upload,
  deleteFeedbackScreenshot: mocks.remove,
  createFeedbackScreenshotUrl: mocks.createUrl,
}));
import { deleteFeedback, getSignedFeedbackScreenshot, submitFeedback, updateFeedbackStatus } from "./feedback";

function form() {
  const data = new FormData();
  data.set("category", "bug");
  data.set("message", "The workout screen stopped responding.");
  data.set("route", "/workouts/example");
  data.set("errorReference", "ABC123");
  return data;
}

describe("submitFeedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserId.mockResolvedValue("opaque-user");
    mocks.requireAdminUser.mockResolvedValue("opaque-admin");
    mocks.query.mockResolvedValue([{ count: BigInt(0) }]);
    mocks.execute.mockResolvedValue(1);
    mocks.remove.mockResolvedValue(undefined);
  });
  it("authenticates and persists only bounded safe metadata", async () => {
    const result = await submitFeedback({ status: "idle", message: "", submittedAt: null }, form());
    expect(mocks.requireUserId).toHaveBeenCalledOnce();
    expect(mocks.execute).toHaveBeenCalledOnce();
    expect(result).toMatchObject({ status: "success", submittedCategory: "bug", screenshotAttached: false });
  });
  it("rejects excessive messages before persistence", async () => {
    const data = form(); data.set("message", "x".repeat(2001));
    const result = await submitFeedback({ status: "idle", message: "", submittedAt: null }, data);
    expect(result.status).toBe("error");
    expect(mocks.execute).not.toHaveBeenCalled();
  });
  it("removes an uploaded screenshot if feedback persistence fails", async () => {
    const data = form(); data.set("screenshot", new File(["image"], "issue.png", { type: "image/png" }));
    mocks.upload.mockResolvedValue("opaque-user/generated.png");
    mocks.execute.mockRejectedValue(new Error("database unavailable"));
    await submitFeedback({ status: "idle", message: "", submittedAt: null }, data);
    expect(mocks.remove).toHaveBeenCalledWith("opaque-user/generated.png");
  });
  it("rate limits repeated submissions before upload or persistence", async () => {
    mocks.query.mockResolvedValue([{ count: BigInt(5) }]);
    const result = await submitFeedback({ status: "idle", message: "", submittedAt: null }, form());
    expect(result).toMatchObject({ status: "error", code: "RATE_LIMITED" });
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.execute).not.toHaveBeenCalled();
  });
  it("authorizes status changes and validates the reviewed status allowlist", async () => {
    const data = new FormData();
    data.set("feedbackId", "123e4567-e89b-12d3-a456-426614174000");
    data.set("status", "reviewing");
    await updateFeedbackStatus(data);
    expect(mocks.requireAdminUser).toHaveBeenCalledOnce();
    expect(mocks.execute).toHaveBeenCalledOnce();
  });
  it("deletes private screenshots before deleting their feedback record", async () => {
    mocks.query.mockResolvedValue([{ screenshotPath: "opaque-user/generated.png" }]);
    const data = new FormData();
    data.set("feedbackId", "123e4567-e89b-12d3-a456-426614174000");
    await deleteFeedback(data);
    expect(mocks.requireAdminUser).toHaveBeenCalledOnce();
    expect(mocks.remove).toHaveBeenCalledWith("opaque-user/generated.png");
    expect(mocks.execute).toHaveBeenCalledOnce();
  });
  it("authorizes temporary screenshot access", async () => {
    mocks.query.mockResolvedValue([{ screenshotPath: "opaque-user/generated.png" }]);
    mocks.createUrl.mockResolvedValue("https://storage.example/signed");
    await expect(getSignedFeedbackScreenshot("123e4567-e89b-12d3-a456-426614174000"))
      .resolves.toBe("https://storage.example/signed");
    expect(mocks.requireAdminUser).toHaveBeenCalledOnce();
    expect(mocks.createUrl).toHaveBeenCalledWith("opaque-user/generated.png");
  });
});
