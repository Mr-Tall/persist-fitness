import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ useOfflineWorkout: vi.fn() }));
vi.mock("./workout-experience-provider", () => ({
  useOfflineWorkout: mocks.useOfflineWorkout,
}));
vi.mock("@/app/actions/workouts", () => ({ finishWorkout: vi.fn(), reopenWorkout: vi.fn() }));
import { FinishWorkoutButton } from "./finish-workout-button";

describe("FinishWorkoutButton offline guard", () => {
  beforeEach(() => mocks.useOfflineWorkout.mockReturnValue(null));

  it("preserves normal online finish behavior without pending changes", () => {
    render(<FinishWorkoutButton workoutId="workout-1" status="active" />);
    expect(screen.getByRole("button", { name: "Finish workout" })).toBeEnabled();
  });

  it("blocks finishing and offers synchronization while changes remain", () => {
    const syncNow = vi.fn();
    mocks.useOfflineWorkout.mockReturnValue({
      pendingCount: 2, isOnline: true, status: "pending", syncNow,
    });
    render(<FinishWorkoutButton workoutId="workout-1" status="active" />);
    expect(screen.queryByRole("button", { name: "Finish workout" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sync now" }));
    expect(syncNow).toHaveBeenCalledOnce();
    expect(screen.getByRole("status")).toHaveTextContent("2 pending changes");
  });

  it("explains that reconnection is required before finishing", () => {
    mocks.useOfflineWorkout.mockReturnValue({
      pendingCount: 1, isOnline: false, status: "offline", syncNow: vi.fn(),
    });
    render(<FinishWorkoutButton workoutId="workout-1" status="active" />);
    expect(screen.getByRole("button", { name: "Reconnect to finish" })).toBeDisabled();
  });
});
