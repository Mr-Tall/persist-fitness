import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  PlannedExerciseEditorProvider,
  PlannedExerciseEditTrigger,
} from "./planned-exercise-editor";

const updateExerciseMock = vi.hoisted(() => vi.fn());
const toastMock = vi.hoisted(() =>
  Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
);

vi.mock("@/app/actions/routines", () => ({
  updateExerciseInRoutineWithState: updateExerciseMock,
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

const longExerciseName =
  "Single-arm cable row with rotation and an intentionally long exercise name";

const exercises = [
  {
    id: "template-exercise-1",
    name: "Bench Press",
    sets: 3,
    reps: "8-10",
    notes: "Controlled tempo",
  },
  {
    id: "template-exercise-2",
    name: longExerciseName,
    sets: 4,
    reps: null,
    notes: null,
  },
];

function renderEditor() {
  return render(
    <PlannedExerciseEditorProvider
      routineId="routine-1"
      exercises={exercises}
    >
      <PlannedExerciseEditTrigger
        exerciseId="template-exercise-1"
        exerciseName="Bench Press"
      />
      <PlannedExerciseEditTrigger
        exerciseId="template-exercise-2"
        exerciseName={longExerciseName}
      />
    </PlannedExerciseEditorProvider>,
  );
}

async function openBenchEditor(user: ReturnType<typeof userEvent.setup>) {
  const trigger = screen.getByRole("button", { name: "Edit Bench Press plan" });
  await user.click(trigger);
  const dialog = screen.getByRole("dialog", {
    name: "Edit Bench Press plan",
  });
  await waitFor(() => expect(screen.getByLabelText("Planned sets")).toHaveFocus());
  return { dialog, trigger };
}

describe("PlannedExerciseEditorProvider", () => {
  beforeEach(() => {
    updateExerciseMock.mockReset();
    updateExerciseMock.mockResolvedValue({
      status: "success",
      message: "Exercise plan updated.",
      submittedAt: Date.now(),
    });
    toastMock.mockClear();
    toastMock.success.mockClear();
    toastMock.error.mockClear();
    document.body.style.overflow = "";
  });

  it("opens the selected exercise with original values, fields, and hidden IDs", async () => {
    const user = userEvent.setup();
    const { container } = renderEditor();
    const { dialog, trigger } = await openBenchEditor(user);

    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription(
      "Update planned sets, target reps, or coaching notes.",
    );
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getByLabelText("Planned sets")).toHaveValue(3);
    expect(screen.getByLabelText("Target reps")).toHaveValue("8-10");
    expect(screen.getByLabelText("Notes")).toHaveValue("Controlled tempo");
    expect(screen.getByLabelText("Planned sets")).toHaveAttribute("name", "sets");
    expect(screen.getByLabelText("Target reps")).toHaveAttribute("name", "reps");
    expect(screen.getByLabelText("Notes")).toHaveAttribute("name", "notes");
    expect(container.querySelector('input[name="routineId"]')).toHaveValue(
      "routine-1",
    );
    expect(
      container.querySelector('input[name="templateExerciseId"]'),
    ).toHaveValue("template-exercise-1");
    expect(dialog.parentElement).toHaveClass("sm:items-center");
  });

  it("closes with Escape, Cancel, or Close and restores the exact trigger", async () => {
    const user = userEvent.setup();
    renderEditor();
    const { trigger } = await openBenchEditor(user);

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(document.body.style.overflow).toBe("");

    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(trigger).toHaveFocus());

    await user.click(trigger);
    await user.click(
      screen.getByRole("button", { name: "Close Bench Press plan editor" }),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("contains forward and backward Tab navigation", async () => {
    const user = userEvent.setup();
    renderEditor();
    await openBenchEditor(user);
    const close = screen.getByRole("button", {
      name: "Close Bench Press plan editor",
    });
    const save = screen.getByRole("button", { name: "Save exercise" });

    close.focus();
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(save).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
  });

  it("submits the existing contract, then closes and restores focus", async () => {
    const user = userEvent.setup();
    renderEditor();
    const { trigger } = await openBenchEditor(user);

    fireEvent.change(screen.getByLabelText("Planned sets"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText("Target reps"), {
      target: { value: "6-8" },
    });
    fireEvent.change(screen.getByLabelText("Notes"), {
      target: { value: "Pause every rep" },
    });
    await user.click(screen.getByRole("button", { name: "Save exercise" }));

    await waitFor(() => expect(updateExerciseMock).toHaveBeenCalledOnce());
    const formData = updateExerciseMock.mock.calls[0][1] as FormData;
    expect(formData.get("routineId")).toBe("routine-1");
    expect(formData.get("templateExerciseId")).toBe("template-exercise-1");
    expect(formData.get("sets")).toBe("5");
    expect(formData.get("reps")).toBe("6-8");
    expect(formData.get("notes")).toBe("Pause every rep");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Exercise plan updated."),
    );

    await user.click(trigger);
    expect(screen.getByLabelText("Planned sets")).toHaveValue(3);
    expect(screen.getByLabelText("Target reps")).toHaveValue("8-10");
  });

  it("keeps failed values and focus in the open sheet with a safe error", async () => {
    updateExerciseMock.mockResolvedValueOnce({
      status: "error",
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
      submittedAt: Date.now(),
    });
    const user = userEvent.setup();
    renderEditor();
    await openBenchEditor(user);
    const sets = screen.getByLabelText("Planned sets");
    const reps = screen.getByLabelText("Target reps");
    const notes = screen.getByLabelText("Notes");
    const save = screen.getByRole("button", { name: "Save exercise" });

    fireEvent.change(sets, { target: { value: "6" } });
    fireEvent.change(reps, { target: { value: "12" } });
    fireEvent.change(notes, { target: { value: "Keep this edit" } });
    await user.click(save);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again.",
    );
    expect(screen.getByRole("dialog", { name: "Edit Bench Press plan" })).toBeVisible();
    expect(sets).toHaveValue(6);
    expect(reps).toHaveValue("12");
    expect(notes).toHaveValue("Keep this edit");
    expect(save).toHaveFocus();
    expect(toastMock.error).toHaveBeenCalledWith(
      "Something went wrong. Please try again.",
    );
  });

  it("reuses one dialog when a different long-name exercise is selected", async () => {
    const user = userEvent.setup();
    renderEditor();
    const longNameTrigger = screen.getByRole("button", {
      name: `Edit ${longExerciseName} plan`,
    });
    await openBenchEditor(user);

    fireEvent.click(longNameTrigger);

    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(
      screen.getByRole("dialog", { name: `Edit ${longExerciseName} plan` }),
    ).toBeVisible();
    expect(screen.getByLabelText("Planned sets")).toHaveValue(4);
    expect(screen.getByLabelText("Target reps")).toHaveValue("");
    expect(screen.getByLabelText("Notes")).toHaveValue("");
  });
});
