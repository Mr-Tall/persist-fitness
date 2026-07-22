import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ useOfflineWorkout: vi.fn() }));
vi.mock("./workout-experience-provider", () => ({
  useOfflineWorkout: mocks.useOfflineWorkout,
}));
import { WorkoutSyncIndicator } from "./workout-sync-indicator";

describe("WorkoutSyncIndicator", () => {
  beforeEach(() => {
    mocks.useOfflineWorkout.mockReturnValue({
      status: "saved", pendingCount: 0, conflicts: [], isOnline: true,
      syncNow: vi.fn(), dismissConflict: vi.fn(),
    });
  });

  it.each([
    ["saved", "Saved"], ["saving", "Saving"], ["offline", "Offline"], ["pending", "Changes pending"],
    ["syncing", "Syncing"], ["issue", "Sync issue"],
  ])("labels the %s state with text", (status, label) => {
    mocks.useOfflineWorkout.mockReturnValue({
      status, pendingCount: status === "saved" ? 0 : 2, conflicts: [],
      isOnline: status !== "offline", syncNow: vi.fn(), dismissConflict: vi.fn(),
    });
    render(<WorkoutSyncIndicator />);
    expect(screen.getByLabelText("Workout sync")).toHaveTextContent(label);
  });

  it("announces conflicts, retries them, and can keep them for later", () => {
    const dismissConflict = vi.fn();
    mocks.useOfflineWorkout.mockReturnValue({
      status: "issue", pendingCount: 1, isOnline: true, syncNow: vi.fn(),
      dismissConflict,
      conflicts: [{ clientMutationId: "m1", conflict: { code: "SET_DELETED", message: "Set changed elsewhere" } }],
    });
    render(<WorkoutSyncIndicator />);
    expect(screen.getByRole("alert")).toHaveTextContent("Set changed elsewhere");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(dismissConflict).toHaveBeenCalledWith("m1");
    fireEvent.click(screen.getByRole("button", { name: "Keep for later" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
