import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  clearCache: vi.fn(),
  clearDatabase: vi.fn(),
  resetAnalytics: vi.fn(),
  setUser: vi.fn(),
  clearHealth: vi.fn(),
}));
vi.mock("@/components/pwa/service-worker-registration", () => ({ clearOfflineWorkoutCache: mocks.clearCache }));
vi.mock("@/lib/offline-workout/storage", () => ({ clearOfflineWorkoutDatabase: mocks.clearDatabase }));
vi.mock("@/lib/analytics/client", () => ({ resetAnalyticsIdentity: mocks.resetAnalytics }));
vi.mock("@/lib/observability/sentry", () => ({ setObservabilityUser: mocks.setUser }));
vi.mock("@/lib/health/storage", () => ({ clearLocalHealthData: mocks.clearHealth }));

import { clearDeletedAccountClientData, hasPendingAccountCleanup } from "./client-cleanup";

describe("deleted account client cleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.clearCache.mockResolvedValue(undefined);
    mocks.clearDatabase.mockResolvedValue(undefined);
    document.cookie = "persist_account_cleanup=1; Path=/";
  });

  it("clears offline data and observability identities", async () => {
    expect(hasPendingAccountCleanup()).toBe(true);
    await clearDeletedAccountClientData();
    expect(mocks.clearDatabase).toHaveBeenCalledOnce();
    expect(mocks.clearCache).toHaveBeenCalledOnce();
    expect(mocks.resetAnalytics).toHaveBeenCalledOnce();
    expect(mocks.setUser).toHaveBeenCalledWith(null);
    expect(mocks.clearHealth).toHaveBeenCalledOnce();
    expect(hasPendingAccountCleanup()).toBe(false);
  });
});
