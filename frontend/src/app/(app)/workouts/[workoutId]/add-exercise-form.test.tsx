import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AddExerciseForm } from "./add-exercise-form";

const addExerciseMock = vi.hoisted(() => vi.fn());
const toastMock = vi.hoisted(() =>
  Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  })
);

vi.mock("@/app/actions/workout-exercises", () => ({
  addExerciseToWorkoutWithState: addExerciseMock,
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

const exercises = [
  {
    id: "exercise-1",
    name: "Barbell Back Squat",
    equipment: "Barbell",
    primaryMuscles: ["Quadriceps", "Glutes"],
  },
  {
    id: "exercise-2",
    name: "Bench Press",
    equipment: "Barbell",
    primaryMuscles: ["Chest", "Triceps"],
  },
];

describe("AddExerciseForm", () => {
  beforeEach(() => {
    addExerciseMock.mockReset();
    addExerciseMock.mockResolvedValue({
      status: "success",
      message: "Exercise added.",
      submittedAt: 1,
    });
    toastMock.mockClear();
    toastMock.success.mockClear();
    toastMock.error.mockClear();
    document.body.style.overflow = "";
  });

  it("uses a mobile launcher while keeping the form available on desktop", () => {
    const { container } = render(
      <AddExerciseForm workoutId="workout-1" exercises={exercises} />
    );

    const launcher = screen.getByRole("button", { name: "Open add exercise" });
    const form = container.querySelector("form");

    expect(launcher).toHaveAttribute("aria-haspopup", "dialog");
    expect(launcher).toHaveAttribute("aria-expanded", "false");
    expect(launcher).toHaveClass("md:hidden");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(form?.parentElement?.parentElement).toHaveClass("md:block");
  });

  it("opens an accessible sheet and moves focus to search", async () => {
    const user = userEvent.setup();
    render(<AddExerciseForm workoutId="workout-1" exercises={exercises} />);

    await user.click(screen.getByRole("button", { name: "Open add exercise" }));

    const dialog = screen.getByRole("dialog", { name: "Add exercise" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("heading", { name: "Add exercise" })).toBeInTheDocument();
    expect(screen.getByLabelText("Custom name")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Barbell Back Squat/ })
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("searchbox")).toHaveFocus());
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("closes from its close action and restores launcher focus", async () => {
    const user = userEvent.setup();
    render(<AddExerciseForm workoutId="workout-1" exercises={exercises} />);
    const launcher = screen.getByRole("button", { name: "Open add exercise" });

    await user.click(launcher);
    await user.click(screen.getByRole("button", { name: "Close add exercise" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(launcher).toHaveFocus();
    expect(launcher).toHaveAttribute("aria-expanded", "false");
    expect(document.body.style.overflow).toBe("");
  });

  it("closes on Escape and restores launcher focus", async () => {
    const user = userEvent.setup();
    render(<AddExerciseForm workoutId="workout-1" exercises={exercises} />);
    const launcher = screen.getByRole("button", { name: "Open add exercise" });

    await user.click(launcher);
    await waitFor(() => expect(screen.getByRole("searchbox")).toHaveFocus());
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(launcher).toHaveFocus();
  });

  it("preserves selected exercise state and existing form fields", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AddExerciseForm workoutId="workout-1" exercises={exercises} />
    );

    await user.click(screen.getByRole("button", { name: "Open add exercise" }));
    const exerciseButton = screen.getByRole("button", { name: /Bench Press/ });
    await user.click(exerciseButton);

    expect(exerciseButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Selected: Bench Press")).toBeInTheDocument();
    expect(container.querySelector('input[name="workoutId"]')).toHaveValue(
      "workout-1"
    );
    expect(container.querySelector('input[name="exerciseId"]')).toHaveValue(
      "exercise-2"
    );
    expect(screen.getByLabelText("Custom name")).toHaveAttribute("name", "name");
    expect(screen.getByRole("button", { name: "Add exercise" })).toBeEnabled();
  });

  it("submits through the existing action with the same field names", async () => {
    const user = userEvent.setup();
    render(<AddExerciseForm workoutId="workout-1" exercises={exercises} />);

    await user.click(screen.getByRole("button", { name: "Open add exercise" }));
    await user.click(
      screen.getByRole("button", { name: /Barbell Back Squat/ })
    );
    await user.click(screen.getByRole("button", { name: "Add exercise" }));

    await waitFor(() => expect(addExerciseMock).toHaveBeenCalledTimes(1));
    const submittedData = addExerciseMock.mock.calls[0][1] as FormData;
    expect(submittedData.get("workoutId")).toBe("workout-1");
    expect(submittedData.get("exerciseId")).toBe("exercise-1");
    expect(submittedData.get("name")).toBe("");
  });
});
