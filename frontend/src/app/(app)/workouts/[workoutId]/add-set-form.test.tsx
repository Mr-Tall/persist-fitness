import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useActionState, type ComponentProps } from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getLatestSetPrefill } from "./add-set-prefill";
import { AddSetForm } from "./add-set-form";

const addSetActionMock = vi.hoisted(() => vi.fn());
const confirmSavedSetMock = vi.hoisted(() => vi.fn());

const mocks = vi.hoisted(() => ({
  actionState: {
    status: "idle" as "idle" | "success" | "error",
    message: "",
    submittedAt: null as number | null,
    savedSetNumber: undefined as number | undefined,
  },
  pending: false,
  formAction: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();

  return {
    ...actual,
    useActionState: vi.fn(() => [
      mocks.actionState,
      mocks.formAction,
      mocks.pending,
    ]),
  };
});

vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();

  return {
    ...actual,
    useFormStatus: vi.fn(() => ({
      pending: mocks.pending,
      data: null,
      method: null,
      action: null,
    })),
  };
});

vi.mock("@/app/actions/workout-exercises", () => ({
  addSetToExerciseWithState: addSetActionMock,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("./saved-set-feedback", () => ({
  useSavedSetFeedback: () => ({
    savedSetNumber: null,
    confirmSavedSet: confirmSavedSetMock,
  }),
}));

const defaultProps: ComponentProps<typeof AddSetForm> = {
  workoutId: "workout-1",
  workoutExerciseId: "workout-exercise-1",
};

function renderComposer(props: Partial<ComponentProps<typeof AddSetForm>> = {}) {
  return render(<AddSetForm {...defaultProps} {...props} />);
}

describe("AddSetForm", () => {
  beforeEach(() => {
    mocks.actionState.status = "idle";
    mocks.actionState.message = "";
    mocks.actionState.submittedAt = null;
    mocks.actionState.savedSetNumber = undefined;
    mocks.pending = false;
    mocks.formAction.mockClear();
    confirmSavedSetMock.mockClear();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("leaves the first set composer empty", () => {
    const prefill = getLatestSetPrefill([]);
    renderComposer({ prefill });

    expect(prefill).toBeUndefined();
    expect(screen.getByLabelText("Weight")).toHaveValue(null);
    expect(screen.getByLabelText("Reps")).toHaveValue(null);
    expect(screen.getByLabelText("RIR")).toHaveValue(null);
    expect(screen.getByLabelText("Tempo")).toHaveValue("");
    expect(screen.getByLabelText("Notes")).toHaveValue("");
  });

  it("selects prefill values from the highest set number", () => {
    const prefill = getLatestSetPrefill([
      {
        setNumber: 4,
        weight: 245,
        reps: 5,
        rir: 1,
        tempo: "2-0-1",
      },
      {
        setNumber: 2,
        weight: 225,
        reps: 8,
        rir: 2,
        tempo: null,
      },
      {
        setNumber: 3,
        weight: 235,
        reps: 6,
        rir: null,
        tempo: "3-1-1",
      },
    ]);

    renderComposer({ prefill });

    expect(screen.getByLabelText("Weight")).toHaveValue(245);
    expect(screen.getByLabelText("Reps")).toHaveValue(5);
    expect(screen.getByLabelText("RIR")).toHaveValue(1);
    expect(screen.getByLabelText("Tempo")).toHaveValue("2-0-1");
    expect(screen.getByLabelText("Notes")).toHaveValue("");
  });

  it("renders weight and reps first with associated labels", () => {
    renderComposer();

    const form = screen.getByText("Log next set").closest("form");
    expect(form).not.toBeNull();

    const numericInputs = within(form!).getAllByRole("spinbutton");
    const weight = screen.getByLabelText("Weight");
    const reps = screen.getByLabelText("Reps");

    expect(numericInputs[0]).toBe(weight);
    expect(numericInputs[1]).toBe(reps);
    expect(screen.getByLabelText("RIR")).toBeInTheDocument();
    expect(screen.getByLabelText("Tempo")).toBeInTheDocument();
    expect(screen.getByLabelText("Notes")).toBeInTheDocument();
  });

  it("keeps DOM order aligned with the mobile composer hierarchy", () => {
    renderComposer();

    const form = screen.getByText("Log next set").closest("form");
    const orderedControls = Array.from(
      form!.querySelectorAll(
        "input:not([type='hidden']), summary, textarea, button[type='submit']"
      )
    );

    expect(orderedControls).toEqual([
      screen.getByLabelText("Weight"),
      screen.getByLabelText("Reps"),
      screen.getByLabelText("RIR"),
      screen.getByText("Add details").closest("summary"),
      screen.getByLabelText("Tempo"),
      screen.getByLabelText("Notes"),
      screen.getByRole("button", { name: "Save set" }),
    ]);
  });

  it("moves focus from Weight to Reps without submitting", async () => {
    const user = userEvent.setup();
    renderComposer();

    const weight = screen.getByLabelText("Weight");
    await user.click(weight);
    await user.keyboard("{Enter}");

    expect(screen.getByLabelText("Reps")).toHaveFocus();
    expect(mocks.formAction).not.toHaveBeenCalled();
  });

  it("moves focus from Reps to RIR and from RIR to Save without submitting", async () => {
    const user = userEvent.setup();
    renderComposer();

    await user.click(screen.getByLabelText("Reps"));
    await user.keyboard("{Enter}");
    expect(screen.getByLabelText("RIR")).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Save set" })).toHaveFocus();
    expect(mocks.formAction).not.toHaveBeenCalled();
  });

  it("keeps optional detail fields inside an accessible native disclosure", async () => {
    const user = userEvent.setup();
    renderComposer();

    const summary = screen.getByText("Add details").closest("summary");
    const disclosure = summary?.closest("details");

    expect(summary).not.toBeNull();
    expect(disclosure).not.toBeNull();
    expect(summary?.tagName).toBe("SUMMARY");
    expect(disclosure).not.toHaveAttribute("open");
    expect(disclosure).toContainElement(screen.getByLabelText("Tempo"));
    expect(disclosure).toContainElement(screen.getByLabelText("Notes"));

    summary!.focus();
    expect(summary).toHaveFocus();
    await user.click(summary!);
    expect(disclosure).toHaveAttribute("open");
  });

  it("preserves field names and numeric input constraints", () => {
    renderComposer();

    expect(screen.getByLabelText("Weight")).toHaveAttribute("name", "weight");
    expect(screen.getByLabelText("Weight")).toHaveAttribute("min", "0");
    expect(screen.getByLabelText("Weight")).toHaveAttribute("max", "10000");
    expect(screen.getByLabelText("Weight")).toHaveAttribute("step", "0.5");
    expect(screen.getByLabelText("Weight")).toHaveAttribute(
      "inputmode",
      "decimal"
    );
    expect(screen.getByLabelText("Weight")).toHaveAttribute(
      "enterkeyhint",
      "next"
    );

    expect(screen.getByLabelText("Reps")).toHaveAttribute("name", "reps");
    expect(screen.getByLabelText("Reps")).toHaveAttribute("min", "0");
    expect(screen.getByLabelText("Reps")).toHaveAttribute("max", "10000");
    expect(screen.getByLabelText("Reps")).toHaveAttribute("step", "1");
    expect(screen.getByLabelText("Reps")).toHaveAttribute(
      "inputmode",
      "numeric"
    );
    expect(screen.getByLabelText("Reps")).toHaveAttribute(
      "enterkeyhint",
      "next"
    );

    expect(screen.getByLabelText("RIR")).toHaveAttribute("name", "rir");
    expect(screen.getByLabelText("RIR")).toHaveAttribute("min", "0");
    expect(screen.getByLabelText("RIR")).toHaveAttribute("max", "10");
    expect(screen.getByLabelText("RIR")).toHaveAttribute("step", "1");
    expect(screen.getByLabelText("RIR")).toHaveAttribute(
      "enterkeyhint",
      "done"
    );
    expect(screen.getByLabelText("Tempo")).toHaveAttribute("name", "tempo");
    expect(screen.getByLabelText("Notes")).toHaveAttribute("name", "notes");
    expect(screen.getByLabelText("Tempo")).toHaveAttribute(
      "enterkeyhint",
      "next"
    );
    expect(screen.getByLabelText("Notes")).toHaveAttribute(
      "enterkeyhint",
      "enter"
    );

    expect(screen.getByDisplayValue("workout-1")).toHaveAttribute(
      "name",
      "workoutId"
    );
    expect(screen.getByDisplayValue("workout-exercise-1")).toHaveAttribute(
      "name",
      "workoutExerciseId"
    );
    expect(vi.mocked(useActionState)).toHaveBeenCalledWith(
      addSetActionMock,
      expect.objectContaining({ status: "idle" })
    );
  });

  it("keeps prefill state scoped to each exercise", () => {
    const { container } = render(
      <>
        <AddSetForm
          workoutId="workout-1"
          workoutExerciseId="exercise-a"
          prefill={{ weight: 315, reps: 3, rir: 1, tempo: null }}
        />
        <AddSetForm
          workoutId="workout-1"
          workoutExerciseId="exercise-b"
          prefill={{ weight: 95, reps: 12, rir: 3, tempo: "2-1-2" }}
        />
      </>
    );
    const forms = container.querySelectorAll("form");

    expect(within(forms[0]).getByLabelText("Weight")).toHaveValue(315);
    expect(within(forms[0]).getByLabelText("RIR")).toHaveValue(1);
    expect(within(forms[1]).getByLabelText("Weight")).toHaveValue(95);
    expect(within(forms[1]).getByLabelText("RIR")).toHaveValue(3);
    expect(document.activeElement).toBe(document.body);
  });

  it("preserves repeat values and clears reps and notes after success", async () => {
    const user = userEvent.setup();
    const { rerender } = renderComposer({
      prefill: { weight: 225, reps: 8, rir: 2, tempo: "3-1-1" },
    });

    await user.clear(screen.getByLabelText("Weight"));
    await user.type(screen.getByLabelText("Weight"), "230");
    await user.clear(screen.getByLabelText("Reps"));
    await user.type(screen.getByLabelText("Reps"), "7");
    await user.clear(screen.getByLabelText("RIR"));
    await user.type(screen.getByLabelText("RIR"), "1");
    await user.click(screen.getByText("Add details"));
    await user.clear(screen.getByLabelText("Tempo"));
    await user.type(screen.getByLabelText("Tempo"), "2-0-1");
    await user.type(screen.getByLabelText("Notes"), "Smooth rep speed");

    mocks.actionState.status = "success";
    mocks.actionState.message = "Set added.";
    mocks.actionState.submittedAt = Date.now();
    mocks.actionState.savedSetNumber = 4;
    rerender(
      <AddSetForm
        {...defaultProps}
        prefill={{ weight: 225, reps: 8, rir: 2, tempo: "3-1-1" }}
      />
    );

    expect(screen.getByLabelText("Weight")).toHaveValue(230);
    expect(screen.getByLabelText("RIR")).toHaveValue(1);
    expect(screen.getByLabelText("Tempo")).toHaveValue("2-0-1");
    expect(screen.getByLabelText("Reps")).toHaveValue(null);
    expect(screen.getByLabelText("Notes")).toHaveValue("");
    expect(screen.getByLabelText("Reps")).toHaveFocus();
    expect(confirmSavedSetMock).toHaveBeenCalledWith(4);
    expect(toast.success).toHaveBeenCalledWith("Set added.");
  });

  it("preserves entered values after a failed save", async () => {
    const user = userEvent.setup();
    const { rerender } = renderComposer();

    await user.type(screen.getByLabelText("Weight"), "185");
    await user.type(screen.getByLabelText("Reps"), "10");
    await user.type(screen.getByLabelText("RIR"), "2");
    await user.click(screen.getByText("Add details"));
    await user.type(screen.getByLabelText("Tempo"), "3-0-1");
    await user.type(screen.getByLabelText("Notes"), "Keep this attempt");
    screen.getByLabelText("RIR").focus();

    mocks.actionState.status = "error";
    mocks.actionState.message = "Please check the form and try again.";
    mocks.actionState.submittedAt = Date.now();
    rerender(<AddSetForm {...defaultProps} />);

    expect(screen.getByLabelText("Weight")).toHaveValue(185);
    expect(screen.getByLabelText("Reps")).toHaveValue(10);
    expect(screen.getByLabelText("RIR")).toHaveValue(2);
    expect(screen.getByLabelText("Tempo")).toHaveValue("3-0-1");
    expect(screen.getByLabelText("Notes")).toHaveValue("Keep this attempt");
    expect(screen.getByLabelText("RIR")).toHaveFocus();
    expect(toast.error).toHaveBeenCalledWith(
      "Please check the form and try again."
    );
    expect(confirmSavedSetMock).not.toHaveBeenCalled();
  });

  it("moves from Tempo to Notes and keeps Notes Enter as text input", async () => {
    const user = userEvent.setup();
    renderComposer();

    await user.click(screen.getByText("Add details"));
    await user.click(screen.getByLabelText("Tempo"));
    await user.keyboard("{Enter}");

    const notes = screen.getByLabelText("Notes");
    expect(notes).toHaveFocus();
    await user.keyboard("First line{Enter}Second line");

    expect(notes).toHaveValue("First line\nSecond line");
    expect(notes).toHaveFocus();
    expect(mocks.formAction).not.toHaveBeenCalled();
  });

  it("preserves the save button and pending presentation", () => {
    const { rerender } = renderComposer();

    expect(screen.getByRole("button", { name: "Save set" })).toBeEnabled();

    mocks.pending = true;
    rerender(<AddSetForm {...defaultProps} />);

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    expect(confirmSavedSetMock).not.toHaveBeenCalled();
  });

  it("renders action feedback as an accessible message", () => {
    mocks.actionState.status = "error";
    mocks.actionState.message =
      "That set could not be saved. Check every value and try again when ready.";
    mocks.actionState.submittedAt = Date.now();

    renderComposer();

    const message = screen.getByRole("alert");
    const form = screen.getByText("Log next set").closest("form");

    expect(message).toHaveTextContent(mocks.actionState.message);
    expect(form).toHaveAttribute("aria-describedby", message.id);
  });
});
