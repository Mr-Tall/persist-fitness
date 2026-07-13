import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MobileTodayPrimaryCard } from "./mobile-today-primary-card";

vi.mock("@/app/actions/workouts", () => ({
  startTodaysWorkout: vi.fn(),
}));

const activeWorkout = {
  id: "workout-1",
  title: "Upper body strength",
  startedTime: "6:30 PM",
  setCount: 8,
  exerciseCount: 3,
};

const trainingMessage = "Start a session today and build momentum.";

describe("MobileTodayPrimaryCard", () => {
  it("shows Resume as the only workout-start action when a workout is active", () => {
    render(
      <MobileTodayPrimaryCard
        activeWorkout={activeWorkout}
        hasRoutines
        trainingMessage={trainingMessage}
      />
    );

    expect(screen.getByRole("link", { name: "Resume workout" })).toHaveAttribute(
      "href",
      "/workouts/workout-1"
    );
    expect(screen.getByText("Upper body strength")).toBeVisible();
    expect(screen.getByText(/Started 6:30 PM/)).toHaveTextContent(
      "8 sets · 3 exercises"
    );
    expect(
      screen.queryByRole("button", { name: "Start today's workout" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Start from routine" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Create a routine" })
    ).not.toBeInTheDocument();
  });

  it("shows Start Today and Start from Routine when routines exist", () => {
    render(
      <MobileTodayPrimaryCard
        activeWorkout={null}
        hasRoutines
        trainingMessage={trainingMessage}
      />
    );

    const startToday = screen.getByRole("button", {
      name: "Start today's workout",
    });
    expect(startToday).toHaveAttribute("type", "submit");
    expect(startToday.closest("form")).not.toBeNull();
    expect(
      screen.getByRole("link", { name: "Start from routine" })
    ).toHaveAttribute("href", "/routines");
    expect(
      screen.queryByRole("link", { name: "Create a routine" })
    ).not.toBeInTheDocument();
  });

  it("offers routine creation instead of an empty routine destination", () => {
    render(
      <MobileTodayPrimaryCard
        activeWorkout={null}
        hasRoutines={false}
        trainingMessage={trainingMessage}
      />
    );

    expect(
      screen.getByRole("button", { name: "Start today's workout" })
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Create a routine" })
    ).toHaveAttribute("href", "/routines/new");
    expect(
      screen.queryByRole("link", { name: "Start from routine" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Resume workout" })
    ).not.toBeInTheDocument();
  });

  it("keeps Resume available with a long workout title", () => {
    const longTitle =
      "Upper body strength and controlled hypertrophy session with an intentionally long workout title";

    render(
      <MobileTodayPrimaryCard
        activeWorkout={{ ...activeWorkout, title: longTitle }}
        hasRoutines
        trainingMessage={trainingMessage}
      />
    );

    const title = screen.getByRole("heading", { level: 2, name: longTitle });
    expect(title).toBeVisible();
    expect(title).toHaveClass("line-clamp-2");
    expect(screen.getByRole("link", { name: "Resume workout" })).toBeVisible();
  });

  it("keeps long supporting copy and inactive actions available", () => {
    const longMessage =
      "Your consistency is building steadily across a demanding training week, so choose today's session when you are ready and keep the next action focused.";

    render(
      <MobileTodayPrimaryCard
        activeWorkout={null}
        hasRoutines
        trainingMessage={longMessage}
      />
    );

    expect(screen.getByText(longMessage)).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Start today's workout" })
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Start from routine" })
    ).toHaveAttribute("href", "/routines");
  });
});
