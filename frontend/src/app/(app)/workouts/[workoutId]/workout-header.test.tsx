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
      completedExercises={1}
      totalExercises={2}
      totalSets={7}
      totalVolume="12,450 lb"
      personalRecordCount={2}
      estimatedDuration="~38m"
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

    expect(screen.getByText("1 / 2 exercises completed")).toBeVisible();
    expect(screen.getByRole("progressbar", { name: "Workout progress" }))
      .toHaveAttribute("aria-valuenow", "58");
    const summary = screen.getByRole("group", { name: "Workout summary" });
    expect(within(summary).getByText("Exercises completed")).toBeVisible();
    expect(within(summary).getByText("1 / 2")).toBeVisible();
    expect(within(summary).getByText("Sets logged")).toBeVisible();
    expect(within(summary).getByText("7")).toBeVisible();
    expect(within(summary).getByText("Total volume")).toBeVisible();
    expect(within(summary).getByText("12,450 lb")).toBeVisible();
    expect(within(summary).getByText("PRs earned")).toBeVisible();
    expect(within(summary).getByText("2")).toBeVisible();
    expect(within(summary).getByText("Estimated duration")).toBeVisible();
    expect(within(summary).getByText("~38m")).toBeVisible();
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
    expect(
      screen.queryByRole("button", { name: "Finish workout" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit workout" })
    ).not.toBeInTheDocument();
  });

  it("preserves all actions for a long workout title and large volume", () => {
    const longTitle =
      "Competition preparation lower body strength and conditioning session with paused variations";

    render(
      <WorkoutHeader
        workout={{ ...activeWorkout, title: longTitle }}
        completedExercises={2}
        totalExercises={2}
        totalSets={24}
        totalVolume="1,234,567,890 lb"
        personalRecordCount={4}
        estimatedDuration="~1h 22m"
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
