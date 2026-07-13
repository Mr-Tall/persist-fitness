import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddSetForm } from "./add-set-form";

const mocks = vi.hoisted(() => ({
  actionState: {
    status: "idle" as "idle" | "success" | "error",
    message: "",
    submittedAt: null as number | null,
  },
  pending: false,
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();

  return {
    ...actual,
    useActionState: vi.fn(() => [mocks.actionState, vi.fn(), mocks.pending]),
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
  addSetToExerciseWithState: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const defaultProps: ComponentProps<typeof AddSetForm> = {
  workoutId: "workout-1",
  workoutExerciseId: "workout-exercise-1",
};

function renderComposer() {
  return render(<AddSetForm {...defaultProps} />);
}

describe("AddSetForm", () => {
  beforeEach(() => {
    mocks.actionState.status = "idle";
    mocks.actionState.message = "";
    mocks.actionState.submittedAt = null;
    mocks.pending = false;
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

    expect(screen.getByLabelText("Reps")).toHaveAttribute("name", "reps");
    expect(screen.getByLabelText("Reps")).toHaveAttribute("min", "0");
    expect(screen.getByLabelText("Reps")).toHaveAttribute("max", "10000");
    expect(screen.getByLabelText("Reps")).toHaveAttribute("step", "1");
    expect(screen.getByLabelText("Reps")).toHaveAttribute(
      "inputmode",
      "numeric"
    );

    expect(screen.getByLabelText("RIR")).toHaveAttribute("name", "rir");
    expect(screen.getByLabelText("RIR")).toHaveAttribute("min", "0");
    expect(screen.getByLabelText("RIR")).toHaveAttribute("max", "10");
    expect(screen.getByLabelText("RIR")).toHaveAttribute("step", "1");
    expect(screen.getByLabelText("Tempo")).toHaveAttribute("name", "tempo");
    expect(screen.getByLabelText("Notes")).toHaveAttribute("name", "notes");

    expect(screen.getByDisplayValue("workout-1")).toHaveAttribute(
      "name",
      "workoutId"
    );
    expect(screen.getByDisplayValue("workout-exercise-1")).toHaveAttribute(
      "name",
      "workoutExerciseId"
    );
  });

  it("preserves the save button and pending presentation", () => {
    const { rerender } = renderComposer();

    expect(screen.getByRole("button", { name: "Save set" })).toBeEnabled();

    mocks.pending = true;
    rerender(<AddSetForm {...defaultProps} />);

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
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
