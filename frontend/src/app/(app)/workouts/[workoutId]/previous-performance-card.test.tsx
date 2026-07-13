import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PreviousPerformanceCard } from "./previous-performance-card";
import type { PreviousPerformance } from "@/lib/previous-performance";

const previous: PreviousPerformance = {
  exerciseName: "Paused Back Squat",
  workoutTitle: "Lower body strength",
  workoutDate: new Date("2026-07-06T12:00:00.000Z"),
  sets: [
    { setNumber: 1, weight: 225, reps: 8, rir: 3 },
    { setNumber: 2, weight: 245, reps: 5, rir: 1 },
    { setNumber: 3, weight: 225, reps: 6, rir: null },
  ],
};

describe("PreviousPerformanceCard", () => {
  it("shows the most useful previous result in the compact summary", () => {
    render(<PreviousPerformanceCard previous={previous} />);

    const region = screen.getByRole("region", {
      name: "Previous performance",
    });

    const compactSummary = within(region)
      .getByText("Last session")
      .closest("div");

    expect(compactSummary).not.toBeNull();
    expect(within(compactSummary!).getByText("Last session")).toBeVisible();
    expect(
      within(compactSummary!).getByLabelText("225 pounds by 8 reps")
    ).toHaveTextContent("225 lb × 8");
  });

  it("keeps every previous set and supporting context inside the disclosure", () => {
    render(<PreviousPerformanceCard previous={previous} />);

    const summary = screen.getByText("View previous sets").closest("summary");
    const disclosure = summary?.closest("details");
    const previousSets = screen.getByRole("list", { name: "Previous sets" });

    expect(summary).not.toBeNull();
    expect(disclosure).not.toBeNull();
    expect(disclosure).toContainElement(previousSets);
    expect(within(disclosure!).getByText(previous.workoutTitle)).toBeInTheDocument();
    expect(within(disclosure!).getByText(/Paused Back Squat/)).toBeInTheDocument();
    expect(within(previousSets).getAllByRole("listitem")).toHaveLength(3);
    expect(within(previousSets).getByText("RIR 3")).toBeInTheDocument();
    expect(within(previousSets).getByText("RIR 1")).toBeInTheDocument();
  });

  it("uses a focusable native disclosure that can be activated", async () => {
    const user = userEvent.setup();
    render(<PreviousPerformanceCard previous={previous} />);

    const summary = screen.getByText("View previous sets").closest("summary");
    const disclosure = summary?.closest("details");

    expect(summary?.tagName).toBe("SUMMARY");
    expect(disclosure).not.toHaveAttribute("open");

    summary!.focus();
    expect(summary).toHaveFocus();
    await user.click(summary!);
    expect(disclosure).toHaveAttribute("open");
  });

  it("preserves the existing progression suggestion", () => {
    render(<PreviousPerformanceCard previous={previous} />);

    expect(screen.getByText("Suggested next:")).toBeVisible();
    expect(
      screen.getByText(
        "Last time looked controlled. Try 230 lb for 8 reps."
      )
    ).toBeVisible();
  });

  it("renders a concise accessible empty state", () => {
    render(<PreviousPerformanceCard previous={null} />);

    expect(
      screen.getByText(
        "No previous sets yet. This session will become your reference."
      )
    ).toBeVisible();
    expect(screen.queryByText("View previous sets")).not.toBeInTheDocument();
  });

  it("preserves long workout and exercise text in the expanded context", () => {
    const longWorkoutTitle =
      "Competition preparation lower body strength session with tempo and paused variations";
    const longExerciseName =
      "Safety bar elevated-heel paused squat with controlled eccentric";

    render(
      <PreviousPerformanceCard
        previous={{
          ...previous,
          workoutTitle: longWorkoutTitle,
          exerciseName: longExerciseName,
        }}
      />
    );

    const disclosure = screen
      .getByText("View previous sets")
      .closest("details");

    expect(within(disclosure!).getByText(longWorkoutTitle)).toBeInTheDocument();
    expect(within(disclosure!).getByText(new RegExp(longExerciseName))).toBeInTheDocument();
  });
});
