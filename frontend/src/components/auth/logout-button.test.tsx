import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  clearCache: vi.fn(),
  clearDatabase: vi.fn(),
  resetAnalytics: vi.fn(),
  setUser: vi.fn(),
  signOut: vi.fn(),
  clearHealth: vi.fn(),
}));

vi.mock("next-auth/react", () => ({ signOut: mocks.signOut }));
vi.mock("@/lib/offline-workout/storage", () => ({
  clearOfflineWorkoutDatabase: mocks.clearDatabase,
}));
vi.mock("@/components/pwa/service-worker-registration", () => ({
  clearOfflineWorkoutCache: mocks.clearCache,
}));
vi.mock("@/lib/analytics/client", () => ({
  resetAnalyticsIdentity: mocks.resetAnalytics,
}));
vi.mock("@/lib/observability/sentry", () => ({
  setObservabilityUser: mocks.setUser,
}));
vi.mock("@/lib/health/storage", () => ({ clearLocalHealthData: mocks.clearHealth }));

import { LogoutButton } from "./logout-button";

describe("LogoutButton observability cleanup", () => {
  it("resets analytics and error-reporting identity before signing out", async () => {
    mocks.clearCache.mockResolvedValue(undefined);
    mocks.clearDatabase.mockResolvedValue(undefined);
    mocks.signOut.mockResolvedValue(undefined);
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledWith({ callbackUrl: "/" }));
    expect(mocks.resetAnalytics).toHaveBeenCalledOnce();
    expect(mocks.setUser).toHaveBeenCalledWith(null);
    expect(mocks.clearHealth).toHaveBeenCalledOnce();
  });
});
