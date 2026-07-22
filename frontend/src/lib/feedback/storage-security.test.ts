import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { deleteFeedbackScreenshot } from "./storage";

describe("private screenshot deletion", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("fails closed rather than orphaning a known screenshot when storage is unavailable", async () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("BETA_FEEDBACK_BUCKET", "");
    await expect(deleteFeedbackScreenshot("opaque/private.png"))
      .rejects.toThrow("Screenshot storage is not configured.");
  });

  it("deletes only the server-known private path", async () => {
    vi.stubEnv("SUPABASE_URL", "https://storage.example");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role");
    vi.stubEnv("BETA_FEEDBACK_BUCKET", "private-feedback");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    await deleteFeedbackScreenshot("opaque/private.png");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://storage.example/storage/v1/object/private-feedback",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ prefixes: ["opaque/private.png"] }),
      }),
    );
  });
});
