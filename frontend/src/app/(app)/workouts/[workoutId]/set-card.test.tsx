import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SetCard } from "./set-card";
import type { WorkoutSetForPage } from "./workout-page-types";
import {
  SAVED_SET_FEEDBACK_DURATION_MS,
  SavedSetFeedbackProvider,
  useSavedSetFeedback,
} from "./saved-set-feedback";

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

function SavedSetTestTrigger({ setNumber }: { setNumber: number }) {
  const { confirmSavedSet } = useSavedSetFeedback();

  return (
    <button type="button" onClick={() => confirmSavedSet(setNumber)}>
      Confirm set {setNumber}
    </button>
  );
}

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

  it("keeps historical values and PR context without mutation controls", () => {
    const { container } = render(
      <SetCard
        workoutId="workout-1"
        set={completeSet}
        editable={false}
        prStatus={{
          isPersonalRecord: true,
          estimatedOneRepMax: 354.4,
        }}
      />
    );

    expect(screen.getByLabelText("315 pounds by 5 reps")).toBeVisible();
    expect(screen.getByText(completeSet.notes!)).toBeVisible();
    expect(
      screen.getByRole("status", {
        name: "New personal record. Estimated one rep max 354 pounds.",
      })
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Edit set 3" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete set 3" })
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('input[name="workoutSetId"]')
    ).not.toBeInTheDocument();
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

  it("briefly confirms only the matching server-rendered set", () => {
    vi.useFakeTimers();

    try {
      render(
        <SavedSetFeedbackProvider>
          <SetCard
            workoutId="workout-1"
            set={{ ...completeSet, id: "set-2", setNumber: 2 }}
          />
          <SetCard workoutId="workout-1" set={completeSet} />
          <SavedSetTestTrigger setNumber={3} />
        </SavedSetFeedbackProvider>
      );

      const setTwo = screen.getByRole("article", { name: "Set 2" });
      const setThree = screen.getByRole("article", { name: "Set 3" });

      expect(within(setThree).queryByText("Saved")).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Confirm set 3" }));

      expect(within(setThree).getByText("Saved")).toBeVisible();
      expect(
        within(setThree).getByRole("status", { name: "Set 3 saved" })
      ).toBeInTheDocument();
      expect(within(setTwo).queryByText("Saved")).not.toBeInTheDocument();
      expect(setTwo).toHaveClass("border-white/10");
      expect(setThree).toHaveClass("border-emerald-300/70");
      expect(setThree).toHaveClass("motion-reduce:transition-none");

      act(() => {
        vi.advanceTimersByTime(SAVED_SET_FEEDBACK_DURATION_MS);
      });

      expect(within(setThree).queryByText("Saved")).not.toBeInTheDocument();
      expect(setThree).toHaveClass("border-white/10");
    } finally {
      vi.useRealTimers();
    }
  });
});
