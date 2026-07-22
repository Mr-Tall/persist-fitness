import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AddTemplateExerciseForm } from "./add-template-exercise-form";

const addExerciseMock = vi.hoisted(() => vi.fn());
const toastMock = vi.hoisted(() =>
  Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
);

vi.mock("@/app/actions/routines", () => ({
  addExerciseToRoutineWithState: addExerciseMock,
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
    name: "Single-arm cable row with an intentionally long movement name",
    equipment: "Cable",
    primaryMuscles: ["Back"],
  },
];

describe("AddTemplateExerciseForm", () => {
  beforeEach(() => {
    addExerciseMock.mockReset();
    addExerciseMock.mockResolvedValue({
      status: "success",
      message: "Exercise added to routine.",
      submittedAt: 1,
    });
    toastMock.mockClear();
    toastMock.success.mockClear();
    toastMock.error.mockClear();
    document.body.style.overflow = "";
  });

  it("uses a mobile launcher and keeps the inline form available on desktop", () => {
    const { container } = render(
      <AddTemplateExerciseForm
        routineId="routine-1"
        exercises={exercises}
        isEmptyRoutine
      />,
    );

    const launcher = screen.getByRole("button", { name: "Open add exercise" });
    const form = container.querySelector("form");

    expect(launcher).toHaveAttribute("aria-haspopup", "dialog");
    expect(launcher).toHaveAttribute("aria-expanded", "false");
    expect(launcher).toHaveClass("min-h-12", "md:hidden");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(form?.parentElement).toHaveClass("hidden", "md:flex");
  });

  it("opens an accessible sheet, locks the background, and focuses search", async () => {
    const user = userEvent.setup();
    render(
      <AddTemplateExerciseForm routineId="routine-1" exercises={exercises} />,
    );

    await user.click(screen.getByRole("button", { name: "Open add exercise" }));

    const dialog = screen.getByRole("dialog", { name: "Add exercise" });
    expect(dialog).toHaveAttribute(
      "aria-modal",
      "true",
    );
    expect(dialog.closest("[data-dialog-portal]")).not.toBeNull();
    expect(screen.getByRole("group", { name: "Planned targets" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("searchbox")).toHaveFocus());
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("closes with Escape and restores focus to the launcher", async () => {
    const user = userEvent.setup();
    render(
      <AddTemplateExerciseForm routineId="routine-1" exercises={exercises} />,
    );
    const launcher = screen.getByRole("button", { name: "Open add exercise" });

    await user.click(launcher);
    await waitFor(() => expect(screen.getByRole("searchbox")).toHaveFocus());
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(launcher).toHaveFocus());
    expect(document.body.style.overflow).toBe("");
  });

  it("closes from its close action and keeps keyboard focus inside while open", async () => {
    const user = userEvent.setup();
    render(
      <AddTemplateExerciseForm routineId="routine-1" exercises={exercises} />,
    );
    const launcher = screen.getByRole("button", { name: "Open add exercise" });

    await user.click(launcher);
    const closeButton = screen.getByRole("button", { name: "Close add exercise" });
    closeButton.focus();
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(screen.getByLabelText("Notes")).toHaveFocus();

    await user.click(closeButton);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(launcher).toHaveFocus());
  });

  it("preserves the routine form contract and accessible planning labels", async () => {
    const user = userEvent.setup();
    render(
      <AddTemplateExerciseForm routineId="routine-1" exercises={exercises} />,
    );

    await user.click(screen.getByRole("button", { name: "Open add exercise" }));
    await user.click(
      screen.getByRole("button", {
        name: /Barbell Back Squat/,
        pressed: false,
      }),
    );
    fireEvent.change(screen.getByLabelText("Sets"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("Reps"), {
      target: { value: "8-10" },
    });
    fireEvent.change(screen.getByLabelText("Notes"), {
      target: { value: "Controlled tempo" },
    });
    await user.click(screen.getByRole("button", { name: "Add exercise" }));

    await waitFor(() => expect(addExerciseMock).toHaveBeenCalledTimes(1));
    const submittedData = addExerciseMock.mock.calls[0][1] as FormData;
    expect(submittedData.get("routineId")).toBe("routine-1");
    expect(submittedData.get("exerciseId")).toBe("exercise-1");
    expect(submittedData.get("name")).toBe("");
    expect(submittedData.get("sets")).toBe("4");
    expect(submittedData.get("reps")).toBe("8-10");
    expect(submittedData.get("notes")).toBe("Controlled tempo");
    expect(document.querySelector('input[name="routineId"]')).toBeInTheDocument();
  });

  it("closes and clears every submission-ready value after confirmed success", async () => {
    const user = userEvent.setup();
    render(
      <AddTemplateExerciseForm routineId="routine-1" exercises={exercises} />,
    );
    const launcher = screen.getByRole("button", { name: "Open add exercise" });

    await user.click(launcher);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Single-arm" },
    });
    await user.click(
      screen.getByRole("button", {
        name: /Single-arm cable row/,
        pressed: false,
      }),
    );
    fireEvent.change(screen.getByLabelText("Sets"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Reps"), { target: { value: "12" } });
    fireEvent.change(screen.getByLabelText("Notes"), {
      target: { value: "Pause at the top" },
    });
    await user.click(screen.getByRole("button", { name: "Add exercise" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(launcher).toHaveFocus());
    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Exercise added to routine."),
    );

    await user.click(launcher);
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(screen.getByLabelText("Custom name")).toHaveValue("");
    expect(screen.getByLabelText("Sets")).toHaveValue(null);
    expect(screen.getByLabelText("Reps")).toHaveValue("");
    expect(screen.getByLabelText("Notes")).toHaveValue("");
    expect(document.querySelector('input[name="exerciseId"]')).toHaveValue("");
    expect(screen.queryByText(/Selected:/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add exercise" })).toBeDisabled();
  });

  it("keeps the sheet open and preserves every entered value after failure", async () => {
    addExerciseMock.mockResolvedValueOnce({
      status: "error",
      code: "VALIDATION_ERROR",
      message: "Please check the exercise details and try again.",
      submittedAt: 2,
    });
    const user = userEvent.setup();
    render(
      <AddTemplateExerciseForm routineId="routine-1" exercises={exercises} />,
    );

    await user.click(screen.getByRole("button", { name: "Open add exercise" }));
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Back Squat" },
    });
    await user.click(
      screen.getByRole("button", {
        name: /Barbell Back Squat/,
        pressed: false,
      }),
    );
    fireEvent.change(screen.getByLabelText("Sets"), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText("Reps"), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText("Notes"), {
      target: { value: "Heavy day" },
    });
    await user.click(screen.getByRole("button", { name: "Add exercise" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please check the exercise details and try again.",
    );
    expect(screen.getByRole("dialog", { name: "Add exercise" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toHaveValue("Back Squat");
    expect(screen.getByText("Selected: Barbell Back Squat")).toBeInTheDocument();
    expect(screen.getByLabelText("Sets")).toHaveValue(5);
    expect(screen.getByLabelText("Reps")).toHaveValue("5");
    expect(screen.getByLabelText("Notes")).toHaveValue("Heavy day");
    expect(toastMock.error).toHaveBeenCalledWith(
      "Please check the exercise details and try again.",
    );
  });

  it("preserves a custom movement after failure and clears it after success", async () => {
    const user = userEvent.setup();
    render(
      <AddTemplateExerciseForm routineId="routine-1" exercises={exercises} />,
    );
    const launcher = screen.getByRole("button", { name: "Open add exercise" });

    addExerciseMock.mockResolvedValueOnce({
      status: "error",
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
      submittedAt: 3,
    });
    await user.click(launcher);
    fireEvent.change(screen.getByLabelText("Custom name"), {
      target: { value: "Cable Y Raise" },
    });
    await user.click(screen.getByRole("button", { name: "Add exercise" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByLabelText("Custom name")).toHaveValue("Cable Y Raise");

    addExerciseMock.mockResolvedValueOnce({
      status: "success",
      message: "Exercise added to routine.",
      submittedAt: 4,
    });
    await user.click(screen.getByRole("button", { name: "Add exercise" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await user.click(launcher);
    expect(screen.getByLabelText("Custom name")).toHaveValue("");
  });
});
