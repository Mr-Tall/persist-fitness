import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/programs", () => ({
  startProgramWorkout: vi.fn(),
}));

import { CurrentProgramCard } from "./current-program-card";

const program = {
  id: "program-1",
  name: "Foundational Strength",
  currentWeek: 2,
  currentDay: 3,
  completionPercent: 42,
  nextWorkout: { id: "routine-1", title: "Lower Strength" },
};

describe("CurrentProgramCard", () => {
  it("shows dashboard status and starts the referenced next routine", () => {
    render(
      <CurrentProgramCard
        hasActiveWorkout={false}
        headingId="current-program"
        program={program}
      />,
    );

    expect(screen.getByRole("heading", { name: program.name })).toBeVisible();
    expect(screen.getByText(/Week 2/)).toHaveTextContent("Day 3");
    expect(screen.getByText("Lower Strength")).toBeVisible();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "42");
    const start = screen.getByRole("button", { name: "Start next workout" });
    expect(start.closest("form")?.querySelector('input[name="programId"]')).toHaveValue(
      "program-1",
    );
  });

  it("does not offer a second workout while another workout is active", () => {
    render(
      <CurrentProgramCard
        hasActiveWorkout
        headingId="current-program"
        program={program}
      />,
    );

    expect(screen.queryByRole("button", { name: "Start next workout" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View schedule" })).toHaveAttribute(
      "href",
      "/programs/program-1",
    );
  });
});
