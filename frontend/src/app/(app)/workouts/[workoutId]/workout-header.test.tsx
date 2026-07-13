import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkoutHeader } from "./workout-header";
import type { WorkoutForPage } from "./workout-page-types";

vi.mock("@/app/actions/workouts", () => ({
  deleteWorkout: vi.fn(),
  finishWorkout: vi.fn(),
  reopenWorkout: vi.fn(),
  repeatWorkout: vi.fn(),
  updateWorkoutWithState: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

const activeWorkout: WorkoutForPage = {
  id: "workout-1",
  title: "Heavy lower body session",
  goal: "Strength",
  notes: "Keep the final squat repetitions controlled.",
  date: new Date("2026-07-13T12:00:00.000Z"),
  status: "active",
  startedAt: new Date("2026-07-13T12:00:00.000Z"),
  finishedAt: null,
  exercises: [
    {
      id: "workout-exercise-1",
      exerciseId: "exercise-1",
      name: "Back Squat",
      order: 0,
      sets: [],
    },
    {
      id: "workout-exercise-2",
      exerciseId: "exercise-2",
      name: "Romanian Deadlift",
      order: 1,
      sets: [],
    },
  ],
};

function renderHeader(
  workout: WorkoutForPage = activeWorkout,
  isCompleted = false
) {
  return render(
    <WorkoutHeader
      workout={workout}
      totalSets={7}
      totalVolume="12,450 lb"
      duration={isCompleted ? "52m" : "In progress"}
      workoutProgress={58}
      isCompleted={isCompleted}
    />
  );
}

describe("WorkoutHeader", () => {
  it("presents active workout context with semantic title and momentum", () => {
    renderHeader();

    expect(
      screen.getByRole("heading", { level: 1, name: activeWorkout.title })
    ).toBeVisible();
    expect(screen.getByText("Active workout")).toBeVisible();
    expect(screen.getByLabelText("Duration: In progress")).toBeVisible();

    const momentum = screen.getByRole("group", { name: "Workout momentum" });
    expect(within(momentum).getByText("Exercises")).toBeVisible();
    expect(within(momentum).getByText("2")).toBeVisible();
    expect(within(momentum).getByText("Sets")).toBeVisible();
    expect(within(momentum).getByText("7")).toBeVisible();
    expect(within(momentum).getByText("Volume")).toBeVisible();
    expect(within(momentum).getByText("12,450 lb")).toBeVisible();
  });

  it("keeps every active-workout action available by accessible name", () => {
    renderHeader();

    expect(
      screen.getByRole("link", { name: /Back to workouts/ })
    ).toHaveAttribute("href", "/workouts");
    expect(
      screen.getByRole("button", { name: "Finish workout" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Repeat workout" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Edit workout" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Delete workout" })
    ).toBeVisible();
  });

  it("shows completed state and the reopen lifecycle action", () => {
    renderHeader(
      {
        ...activeWorkout,
        status: "completed",
        finishedAt: new Date("2026-07-13T12:52:00.000Z"),
      },
      true
    );

    expect(screen.getByText("Completed workout")).toBeVisible();
    expect(screen.getByLabelText("Duration: 52m")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Reopen workout" })
    ).toBeVisible();
  });

  it("preserves all actions for a long workout title and large volume", () => {
    const longTitle =
      "Competition preparation lower body strength and conditioning session with paused variations";

    render(
      <WorkoutHeader
        workout={{ ...activeWorkout, title: longTitle }}
        totalSets={24}
        totalVolume="1,234,567,890 lb"
        duration="In progress"
        workoutProgress={100}
        isCompleted={false}
      />
    );

    expect(screen.getByRole("heading", { name: longTitle })).toBeVisible();
    expect(screen.getByText("1,234,567,890 lb")).toHaveAttribute(
      "title",
      "1,234,567,890 lb"
    );
    expect(
      screen.getByRole("button", { name: "Finish workout" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Repeat workout" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Edit workout" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Delete workout" })
    ).toBeVisible();
  });
});
