import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  capture: vi.fn(),
  identify: vi.fn(),
  setUser: vi.fn(),
}));

vi.mock("@/lib/analytics/client", () => ({
  captureProductEvent: mocks.capture,
  identifyAnalyticsUser: mocks.identify,
}));
vi.mock("@/lib/observability/sentry", () => ({
  setObservabilityUser: mocks.setUser,
}));

import { ObservabilityIdentity } from "./observability-identity";

describe("ObservabilityIdentity", () => {
  it("identifies providers with only the opaque internal user ID", () => {
    const { unmount } = render(<ObservabilityIdentity userId="opaque-user-id" />);

    expect(mocks.identify).toHaveBeenCalledWith("opaque-user-id");
    expect(mocks.setUser).toHaveBeenCalledWith("opaque-user-id");
    expect(mocks.capture).toHaveBeenCalledWith(
      "account_signed_in",
      {},
      { onceKey: "opaque-user-id" },
    );

    unmount();
    expect(mocks.setUser).toHaveBeenLastCalledWith(null);
  });
});
