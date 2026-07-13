import fs from "node:fs";
import path from "node:path";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkoutMobileBar } from "./workout-mobile-bar";

vi.mock("@/app/actions/workouts", () => ({
  finishWorkout: vi.fn(),
  reopenWorkout: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: vi.fn(),
}));

describe("WorkoutMobileBar", () => {
  it("renders active workout status, concise metrics, and Finish", () => {
    render(
      <WorkoutMobileBar
        workoutId="workout-1"
        workoutStatus="active"
        totalSets={7}
        duration="In progress"
      />
    );

    const dock = screen.getByRole("complementary", {
      name: "Workout controls",
    });

    expect(within(dock).getByText("Active workout")).toBeVisible();
    expect(within(dock).getByText(/7 sets/)).toHaveTextContent(
      "7 sets · Duration In progress"
    );
    expect(
      within(dock).getByRole("button", { name: "Finish workout" })
    ).toBeVisible();
  });

  it("preserves lifecycle form wiring and the workout identifier", () => {
    render(
      <WorkoutMobileBar
        workoutId="workout-42"
        workoutStatus="active"
        totalSets={1}
        duration="In progress"
      />
    );

    const finishButton = screen.getByRole("button", {
      name: "Finish workout",
    });
    const lifecycleForm = finishButton.closest("form");

    expect(lifecycleForm).not.toBeNull();
    expect(
      within(lifecycleForm!).getByDisplayValue("workout-42")
    ).toHaveAttribute("name", "workoutId");
  });

  it("does not duplicate Reopen controls for completed workouts", () => {
    render(
      <WorkoutMobileBar
        workoutId="workout-1"
        workoutStatus="completed"
        totalSets={7}
        duration="52m"
      />
    );

    expect(
      screen.queryByRole("complementary", { name: "Workout controls" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reopen workout" })
    ).not.toBeInTheDocument();
  });

  it("is mobile-only and positions itself from the safe-area-aware nav height", () => {
    render(
      <WorkoutMobileBar
        workoutId="workout-1"
        workoutStatus="active"
        totalSets={99999}
        duration="In progress"
      />
    );

    const dock = screen.getByRole("complementary", {
      name: "Workout controls",
    });

    expect(dock).toHaveClass("md:hidden");
    expect(dock.className).toContain("var(--mobile-nav-height)");
  });

  it("keeps shell and page clearance for both fixed mobile regions", () => {
    const appLayout = fs.readFileSync(
      path.join(process.cwd(), "src/app/(app)/layout.tsx"),
      "utf8"
    );
    const workoutPage = fs.readFileSync(
      path.join(process.cwd(), "src/app/(app)/workouts/[workoutId]/page.tsx"),
      "utf8"
    );

    expect(appLayout).toContain(
      "--mobile-nav-height:calc(3.75rem_+_max(0.75rem,env(safe-area-inset-bottom)))"
    );
    expect(appLayout).toContain(
      "pb-[calc(5rem+env(safe-area-inset-bottom))]"
    );
    expect(workoutPage).toContain("px-4 pb-28 pt-6");
  });
});
