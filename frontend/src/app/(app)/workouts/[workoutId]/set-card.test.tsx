import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SetCard } from "./set-card";
import type { WorkoutSetForPage } from "./workout-page-types";

vi.mock("@/app/actions/workout-exercises", () => ({
  deleteSetFromExercise: vi.fn(),
  updateSetInExerciseWithState: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

const completeSet: WorkoutSetForPage = {
  id: "set-3",
  setNumber: 3,
  weight: 315,
  reps: 5,
  rir: 2,
  tempo: "3-1-1",
  notes: "Controlled eccentric with a long pause before the final rep.",
};

describe("SetCard", () => {
  it("renders a semantic, scan-friendly set row with all metadata", () => {
    render(<SetCard workoutId="workout-1" set={completeSet} />);

    const setRow = screen.getByRole("article", { name: "Set 3" });

    expect(within(setRow).getByRole("heading", { name: "Set 3" })).toBeVisible();
    expect(
      within(setRow).getByLabelText("315 pounds by 5 reps")
    ).toHaveTextContent("315 lb × 5");
    expect(within(setRow).getByText("RIR")).toBeVisible();
    expect(within(setRow).getByText("2")).toBeVisible();
    expect(within(setRow).getByText("Tempo")).toBeVisible();
    expect(within(setRow).getByText("3-1-1")).toBeVisible();
    expect(within(setRow).getByText("Notes")).toBeVisible();
    expect(within(setRow).getByText(completeSet.notes!)).toBeVisible();
  });

  it("omits optional metadata cleanly when it is absent", () => {
    render(
      <SetCard
        workoutId="workout-1"
        set={{
          ...completeSet,
          rir: null,
          tempo: null,
          notes: null,
        }}
      />
    );

    const setRow = screen.getByRole("article", { name: "Set 3" });

    expect(within(setRow).queryByText("RIR")).not.toBeInTheDocument();
    expect(within(setRow).queryByText("Tempo")).not.toBeInTheDocument();
    expect(within(setRow).queryByText("Notes")).not.toBeInTheDocument();
    expect(
      within(setRow).getByLabelText("315 pounds by 5 reps")
    ).toBeVisible();
  });

  it("announces personal-record context without relying on color", () => {
    render(
      <SetCard
        workoutId="workout-1"
        set={completeSet}
        prStatus={{
          isPersonalRecord: true,
          estimatedOneRepMax: 354.4,
        }}
      />
    );

    const status = screen.getByRole("status", {
      name: "New personal record. Estimated one rep max 354 pounds.",
    });

    expect(status).toHaveTextContent("New PR");
    expect(status).toHaveTextContent("Est. 1RM 354 lb");
  });

  it("keeps edit and delete actions accessible and wired to the set", async () => {
    const user = userEvent.setup();
    render(<SetCard workoutId="workout-1" set={completeSet} />);

    const editButton = screen.getByRole("button", { name: "Edit set 3" });
    const deleteButton = screen.getByRole("button", { name: "Delete set 3" });
    const deleteForm = deleteButton.closest("form");

    expect(editButton).toBeVisible();
    expect(deleteButton).toBeVisible();
    expect(deleteForm).not.toBeNull();
    expect(within(deleteForm!).getByDisplayValue("workout-1")).toHaveAttribute(
      "name",
      "workoutId"
    );
    expect(within(deleteForm!).getByDisplayValue("set-3")).toHaveAttribute(
      "name",
      "workoutSetId"
    );

    await user.click(editButton);
    expect(screen.getByRole("dialog", { name: "Edit set 3" })).toBeVisible();
  });

  it("preserves the inline delete confirmation flow", async () => {
    const user = userEvent.setup();
    render(<SetCard workoutId="workout-1" set={completeSet} />);

    await user.click(screen.getByRole("button", { name: "Delete set 3" }));

    expect(screen.getByText("Delete set 3?")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Confirm delete set 3" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Cancel delete set 3" })
    ).toBeVisible();
  });
});
