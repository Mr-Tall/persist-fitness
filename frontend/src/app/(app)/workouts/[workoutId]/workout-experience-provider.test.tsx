import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/offline-workout", () => ({
  syncOfflineWorkoutMutation: vi.fn(),
}));
import { WorkoutExperienceProvider } from "./workout-experience-provider";

describe("WorkoutExperienceProvider connectivity lifecycle", () => {
  it("cleans up connectivity listeners on unmount", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const view = render(
      <WorkoutExperienceProvider>
        <div>Workout</div>
      </WorkoutExperienceProvider>,
    );
    expect(add).toHaveBeenCalledWith("online", expect.any(Function));
    expect(add).toHaveBeenCalledWith("offline", expect.any(Function));
    view.unmount();
    expect(remove).toHaveBeenCalledWith("online", expect.any(Function));
    expect(remove).toHaveBeenCalledWith("offline", expect.any(Function));
  });
});
