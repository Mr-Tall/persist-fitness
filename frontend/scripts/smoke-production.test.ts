import { describe, expect, it, vi } from "vitest";
import {
  checkEndpoint,
  normalizeProductionOrigin,
  runProductionSmokeTests,
} from "./smoke-production.mjs";

function response(status = 200, options: { location?: string; json?: boolean } = {}) {
  return new Response(options.json ? "{}" : "ok", {
    status,
    headers: {
      ...(options.location ? { location: options.location } : {}),
      "content-type": options.json ? "application/json" : "text/html",
    },
  });
}

describe("production smoke tests", () => {
  it("checks successful public endpoints without logging origin secrets", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response());
    const logger = { log: vi.fn() };

    await runProductionSmokeTests({
      origin: "https://persist.example/?token=must-not-log",
      endpoints: [{ path: "/privacy", label: "privacy page", contentType: "text" }],
      fetchImpl,
      logger,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      new URL("https://persist.example/privacy"),
      expect.objectContaining({ redirect: "manual" }),
    );
    expect(JSON.stringify(logger.log.mock.calls)).not.toContain("must-not-log");
  });

  it("fails clearly for unexpected status codes", async () => {
    await expect(
      checkEndpoint({
        origin: "https://persist.example",
        endpoint: { path: "/login", label: "login page", contentType: "text" },
        fetchImpl: vi.fn().mockResolvedValue(response(503)),
      }),
    ).rejects.toThrow("login page returned HTTP 503");
  });

  it("fails deterministically when a request times out", async () => {
    const fetchImpl = vi.fn((_url: URL | RequestInfo, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError")),
        );
      }),
    );

    await expect(
      checkEndpoint({
        origin: "https://persist.example",
        endpoint: { path: "/", label: "landing page", contentType: "text" },
        fetchImpl,
        timeoutMs: 5,
      }),
    ).rejects.toThrow("landing page timed out after 5ms");
  });

  it("follows bounded redirects and rejects redirect loops", async () => {
    const successFetch = vi
      .fn()
      .mockResolvedValueOnce(response(302, { location: "/login/continue" }))
      .mockResolvedValueOnce(response(200));
    await expect(
      checkEndpoint({
        origin: "https://persist.example",
        endpoint: { path: "/login", label: "login page", contentType: "text" },
        fetchImpl: successFetch,
      }),
    ).resolves.toMatchObject({ status: 200 });

    await expect(
      checkEndpoint({
        origin: "https://persist.example",
        endpoint: { path: "/login", label: "login page", contentType: "text" },
        fetchImpl: vi.fn().mockResolvedValue(response(302, { location: "/login" })),
      }),
    ).rejects.toThrow("redirect loop");
  });

  it("rejects redirects away from the configured production origin", async () => {
    await expect(
      checkEndpoint({
        origin: "https://persist.example",
        endpoint: { path: "/login", label: "login page", contentType: "text" },
        fetchImpl: vi
          .fn()
          .mockResolvedValue(response(302, { location: "https://other.example" })),
      }),
    ).rejects.toThrow("redirected outside Production");
  });

  it("rejects credential-bearing origins without echoing credentials", () => {
    expect(() =>
      normalizeProductionOrigin("https://user:super-secret@persist.example"),
    ).toThrow("must not contain credentials");
  });
});
