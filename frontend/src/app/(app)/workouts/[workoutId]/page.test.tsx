import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WorkoutDetailPage from "./page";

const mocks = vi.hoisted(() => ({
  requireUserId: vi.fn(),
  findWorkout: vi.fn(),
  findExercises: vi.fn(),
  getPreviousPerformance: vi.fn(),
  getSetPrStatuses: vi.fn(),
}));

vi.mock("@/lib/auth/require-user", () => ({
  requireUserId: mocks.requireUserId,
}));

vi.mock("@/lib/db", () => ({
  db: {
    workout: { findFirst: mocks.findWorkout },
    exercise: { findMany: mocks.findExercises },
  },
}));

vi.mock("@/lib/previous-performance", () => ({
  getPreviousPerformanceForExercise: mocks.getPreviousPerformance,
}));

vi.mock("@/lib/set-pr-status", () => ({
  getSetPrStatuses: mocks.getSetPrStatuses,
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

vi.mock("@/app/actions/workout-exercises", () => ({
  addExerciseToWorkoutWithState: vi.fn(),
  addSetToExerciseWithState: vi.fn(),
  deleteExerciseFromWorkout: vi.fn(),
  deleteSetFromExercise: vi.fn(),
  updateSetInExerciseWithState: vi.fn(),
}));

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

const workoutSet = {
  id: "set-1",
  workoutExerciseId: "workout-exercise-1",
  setNumber: 1,
  weight: 225,
  reps: 8,
  rir: 2,
  tempo: "3-1-1",
  notes: "Strong final rep.",
  createdAt: new Date("2026-07-13T12:10:00.000Z"),
  updatedAt: new Date("2026-07-13T12:10:00.000Z"),
};

function workoutForStatus(status: "active" | "completed") {
  return {
    id: "workout-1",
    userId: "user-1",
    title: "Upper body strength",
    goal: "Strength",
    notes: "Controlled working sets.",
    date: new Date("2026-07-13T12:00:00.000Z"),
    status,
    startedAt: new Date("2026-07-13T12:00:00.000Z"),
    finishedAt:
      status === "completed"
        ? new Date("2026-07-13T12:52:00.000Z")
        : null,
    createdAt: new Date("2026-07-13T12:00:00.000Z"),
    updatedAt: new Date("2026-07-13T12:52:00.000Z"),
    exercises: [
      {
        id: "workout-exercise-1",
        workoutId: "workout-1",
        exerciseId: "exercise-1",
        name: "Bench Press",
        order: 0,
        createdAt: new Date("2026-07-13T12:00:00.000Z"),
        updatedAt: new Date("2026-07-13T12:00:00.000Z"),
        sets: [workoutSet],
      },
    ],
  };
}

async function renderWorkoutPage(status: "active" | "completed") {
  mocks.findWorkout.mockResolvedValue(workoutForStatus(status));
  const page = await WorkoutDetailPage({
    params: Promise.resolve({ workoutId: "workout-1" }),
  });

  return render(page);
}

describe("WorkoutDetailPage lifecycle modes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserId.mockResolvedValue("user-1");
    mocks.findExercises.mockResolvedValue([
      {
        id: "exercise-1",
        name: "Bench Press",
        equipment: "Barbell",
        primaryMuscles: ["Chest"],
        favoritedBy: [],
      },
    ]);
    mocks.getPreviousPerformance.mockResolvedValue(null);
    mocks.getSetPrStatuses.mockResolvedValue(
      new Map([
        [
          "set-1",
          { isPersonalRecord: true, estimatedOneRepMax: 285.2 },
        ],
      ])
    );
  });

  it("renders completed workouts as accessible read-only history", async () => {
    const user = userEvent.setup();
    const { container } = await renderWorkoutPage("completed");

    expect(
      screen.getByText(
        "Completed workout. Logging controls are unavailable until reopened."
      )
    ).toHaveAttribute("role", "status");
    expect(
      screen.getByRole("button", { name: "Reopen workout" })
    ).toBeVisible();
    const exerciseSummary = screen.getByText("Bench Press").closest("summary");
    expect(exerciseSummary).not.toBeNull();
    await user.click(exerciseSummary!);

    expect(screen.getByLabelText("225 pounds by 8 reps")).toBeVisible();
    expect(
      screen.getByRole("status", {
        name: "New personal record. Estimated one rep max 285 pounds.",
      })
    ).toBeVisible();
    expect(screen.getByText("Great session.")).toBeVisible();

    expect(
      screen.queryByRole("button", { name: "Open add exercise" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save set" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit set 1" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete set 1" })
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Delete exercise")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Finish workout" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("complementary", { name: "Workout controls" })
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('input[name="workoutSetId"]')
    ).not.toBeInTheDocument();
  });

  it("restores every logging control for active workouts", async () => {
    await renderWorkoutPage("active");

    expect(
      screen.queryByText(
        "Completed workout. Logging controls are unavailable until reopened."
      )
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open add exercise" })
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Save set" })).toBeVisible();
    expect(
      screen.getByText("No previous sets yet. This session will become your reference.")
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Edit set 1" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Delete set 1" })).toBeVisible();
    expect(screen.getByText("Delete exercise")).toBeVisible();
    expect(
      screen.getAllByRole("button", { name: "Finish workout" })
    ).toHaveLength(2);
    expect(
      screen.getByRole("complementary", { name: "Workout controls" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reopen workout" })
    ).not.toBeInTheDocument();
  });
});
