import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("offline workout service-worker boundary", () => {
  const source = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");

  it("limits navigation fallback to workout detail routes", () => {
    expect(source).toContain('/^\\/workouts\\/[^/]+$/');
    expect(source).not.toContain("/dashboard");
    expect(source).not.toContain("/progress");
    expect(source).not.toContain("/api/");
  });

  it("caches only GET assets and explicit active-workout documents", () => {
    expect(source).toContain('event.request.method !== "GET"');
    expect(source).toContain('event.data?.type === "CACHE_ACTIVE_WORKOUT"');
    expect(source).toContain('event.data?.type === "CLEAR_OFFLINE_WORKOUTS"');
  });
});
