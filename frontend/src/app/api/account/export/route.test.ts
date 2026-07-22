import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), createExport: vi.fn() }));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/account/data-export", () => ({ createPersonalDataExport: mocks.createExport }));

import { GET } from "./route";

describe("account export download", () => {
  it("rejects unauthenticated downloads", async () => {
    mocks.auth.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
    expect(mocks.createExport).not.toHaveBeenCalled();
  });

  it("returns an ephemeral JSON attachment for the authenticated user", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.createExport.mockResolvedValue({ formatVersion: 1, account: { id: "user-1" } });
    const response = await GET();
    expect(mocks.createExport).toHaveBeenCalledWith("user-1");
    expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
    expect(response.headers.get("content-disposition")).toMatch(/attachment; filename=/);
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });
});
