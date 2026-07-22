import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireUserId: vi.fn(), query: vi.fn(), redirect: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("./require-user", () => ({ requireUserId: mocks.requireUserId }));
vi.mock("@/lib/db", () => ({ db: { $queryRaw: mocks.query } }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
import { requireAdminUser } from "./admin";

describe("requireAdminUser", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.requireUserId.mockResolvedValue("opaque-user"); });
  it("permits a server-confirmed admin role", async () => {
    mocks.query.mockResolvedValue([{ role: "admin" }]);
    await expect(requireAdminUser()).resolves.toBe("opaque-user");
  });
  it("rejects ordinary users without inspecting email", async () => {
    mocks.query.mockResolvedValue([{ role: "user" }]);
    await requireAdminUser();
    expect(mocks.redirect).toHaveBeenCalledWith("/dashboard");
  });
});
