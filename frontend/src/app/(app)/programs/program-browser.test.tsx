import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgramBrowser, type ProgramBrowserItem } from "./program-browser";

const programs: ProgramBrowserItem[] = [
  {
    id: "strength-1",
    name: "Foundational Strength",
    description: "A deliberate strength foundation.",
    difficulty: "Beginner",
    estimatedWeeks: 8,
    category: "Strength",
    workoutCount: 24,
    isCurrent: true,
  },
  {
    id: "power-1",
    name: "Powerlifting Peak",
    description: null,
    difficulty: "Advanced",
    estimatedWeeks: 12,
    category: "Powerlifting",
    workoutCount: 36,
    isCurrent: false,
  },
];

describe("ProgramBrowser", () => {
  it("renders program metadata and exact detail destinations", () => {
    render(<ProgramBrowser programs={programs} />);

    const list = screen.getByRole("list", { name: "Training programs" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Foundational Strength")).toBeVisible();
    expect(screen.getByText("8 weeks")).toBeVisible();
    expect(screen.getByText("24 workouts")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "View Foundational Strength program" }),
    ).toHaveAttribute("href", "/programs/strength-1");
  });

  it("filters independently by supported difficulty and category", () => {
    render(<ProgramBrowser programs={programs} />);

    fireEvent.click(screen.getByRole("button", { name: "Advanced" }));
    expect(screen.queryByText("Foundational Strength")).not.toBeInTheDocument();
    expect(screen.getByText("Powerlifting Peak")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Strength" }));
    expect(screen.getByRole("status")).toHaveTextContent("No programs match");
  });

  it("marks the enrolled program without treating other programs as current", () => {
    render(<ProgramBrowser programs={programs} />);
    expect(screen.getAllByText("Current")).toHaveLength(1);
  });
});
