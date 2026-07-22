import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { describe, expect, it } from "vitest";

import type { ExerciseLibraryOption } from "./exercise-select";
import { ExerciseDetailsDialog } from "./exercise-details-dialog";

const populatedExercise: ExerciseLibraryOption = {
  id: "bench-press",
  name: "Barbell Bench Press",
  equipment: "Barbell",
  primaryMuscles: ["Chest"],
  secondaryMuscles: ["Triceps", "Shoulders"],
  force: "Push",
  level: "Intermediate",
  mechanic: "Compound",
  movementPattern: "horizontal_push",
  exerciseType: "compound",
  laterality: "bilateral",
  trackingType: "weight_reps",
  instructions: ["Lower the bar under control.", "Press to the start position."],
  tips: ["Keep your shoulder blades stable."],
  aliases: ["Bench Press", "Flat Bench"],
  thumbnailUrl: "https://example.com/bench-press.jpg",
};

function DialogHarness({ exercise }: { exercise: ExerciseLibraryOption }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
        View exercise details
      </button>
      <ExerciseDetailsDialog
        exercise={open ? exercise : null}
        onClose={() => setOpen(false)}
        restoreFocusRef={triggerRef}
      />
    </>
  );
}

describe("ExerciseDetailsDialog", () => {
  it("renders populated library metadata in a sectioned dialog", async () => {
    const user = userEvent.setup();
    render(<DialogHarness exercise={populatedExercise} />);

    await user.click(screen.getByRole("button", { name: "View exercise details" }));

    expect(
      screen.getByRole("dialog", { name: "Barbell Bench Press" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByText("horizontal push")).toBeInTheDocument();
    expect(screen.getByText("weight reps")).toBeInTheDocument();
    expect(screen.getByText("Chest")).toBeInTheDocument();
    expect(screen.getByText("Triceps")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Instructions" })).toBeInTheDocument();
    expect(screen.getByText("Keep your shoulder blades stable.")).toBeInTheDocument();
    expect(screen.getByText("Bench Press, Flat Bench")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Barbell Bench Press thumbnail" })).toBeInTheDocument();
  });

  it("omits sections and metadata that do not exist", async () => {
    const user = userEvent.setup();
    render(
      <DialogHarness
        exercise={{
          id: "custom",
          name: "Uncatalogued movement",
          equipment: null,
          primaryMuscles: [],
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "View exercise details" }));

    expect(screen.queryByRole("heading", { name: "Overview" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Muscles" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Instructions" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Tips" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Also known as" })).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("supports keyboard close, traps focus, and restores the trigger", async () => {
    const user = userEvent.setup();
    render(<DialogHarness exercise={populatedExercise} />);

    const trigger = screen.getByRole("button", { name: "View exercise details" });
    await user.click(trigger);
    const close = await screen.findByRole("button", {
      name: "Close Barbell Bench Press details",
    });
    await waitFor(() => expect(close).toHaveFocus());

    await user.tab();
    expect(close).toHaveFocus();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("uses the shared mobile sheet and desktop modal presentation", async () => {
    const user = userEvent.setup();
    render(<DialogHarness exercise={populatedExercise} />);

    await user.click(screen.getByRole("button", { name: "View exercise details" }));
    const panel = screen.getByRole("dialog");

    expect(panel).toHaveClass("rounded-t-[2rem]");
    expect(panel).toHaveClass("sm:rounded-3xl");
    expect(panel).toHaveClass("md:max-w-2xl");
    expect(panel.parentElement).toHaveAttribute("data-dialog-portal");
  });
});
