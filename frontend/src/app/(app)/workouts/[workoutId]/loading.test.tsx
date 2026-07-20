import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import WorkoutDetailLoading from "./loading";

function appearsBefore(first: Element, second: Element) {
  return Boolean(
    first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING,
  );
}

describe("WorkoutDetailLoading", () => {
  it("uses one private, labelled busy region", () => {
    render(<WorkoutDetailLoading />);
    const status = screen.getByRole("status", {
      name: "Loading workout details",
    });

    expect(status).toHaveAttribute("aria-busy", "true");
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(status.className).toContain("safe-area-inset-bottom");
  });

  it("matches the compact header and current exercise accordion hierarchy", () => {
    const { container } = render(<WorkoutDetailLoading />);
    const header = container.querySelector('[data-skeleton="workout-header"]');
    const exerciseSection = container.querySelector('[data-skeleton="exercise-section"]');
    const accordion = container.querySelector('[data-skeleton="exercise-accordion"]');
    const currentExercise = container.querySelector('[data-skeleton="current-exercise-summary"]');
    const collapsedExercise = container.querySelector('[data-skeleton="collapsed-exercise-summary"]');

    expect(header).toBeInTheDocument();
    expect(exerciseSection).toBeInTheDocument();
    expect(accordion).toBeInTheDocument();
    expect(currentExercise).toBeInTheDocument();
    expect(collapsedExercise).toBeInTheDocument();
    expect(appearsBefore(header!, exerciseSection!)).toBe(true);
  });

  it("places Add Set before compact saved-set history", () => {
    const { container } = render(<WorkoutDetailLoading />);
    const previous = container.querySelector('[data-skeleton="previous-performance"]');
    const composer = container.querySelector('[data-skeleton="add-set-composer"]');
    const savedHistory = container.querySelector('[data-skeleton="saved-set-history"]');

    expect(previous).toBeInTheDocument();
    expect(composer).toBeInTheDocument();
    expect(savedHistory).toBeInTheDocument();
    expect(appearsBefore(previous!, composer!)).toBe(true);
    expect(appearsBefore(composer!, savedHistory!)).toBe(true);
    expect(
      savedHistory?.querySelectorAll('[data-skeleton="saved-set-row"]'),
    ).toHaveLength(3);
  });

  it("uses the factual three-metric momentum treatment without fabricated progress", () => {
    const { container } = render(<WorkoutDetailLoading />);
    const momentum = container.querySelector('[data-skeleton="workout-momentum"]');

    expect(momentum).toBeInTheDocument();
    expect(
      momentum?.querySelectorAll('[data-skeleton="momentum-metric"]'),
    ).toHaveLength(3);
    expect(container.querySelector('[data-skeleton="four-stat-grid"]')).not.toBeInTheDocument();
    expect(container).not.toHaveTextContent(/12\s*sets?/i);
    expect(container.querySelector("[data-progress]")).not.toBeInTheDocument();
  });

  it("reserves dock clearance and remains narrow-screen safe", () => {
    const { container } = render(<WorkoutDetailLoading />);
    const header = container.querySelector('[data-skeleton="workout-header"]');
    const exerciseSection = container.querySelector('[data-skeleton="exercise-section"]');
    const clearance = container.querySelector('[data-skeleton="workout-dock-clearance"]');

    expect(header).toHaveClass("min-w-0", "overflow-hidden");
    expect(exerciseSection).toHaveClass("min-w-0");
    expect(clearance).toHaveClass("md:hidden");
    expect(clearance?.className).toContain("mobile-nav-height");
    expect(clearance?.className).toContain("safe-area-inset-bottom");
  });

  it("hides decorative placeholders and respects reduced motion", () => {
    const { container } = render(<WorkoutDetailLoading />);
    const blocks = container.querySelectorAll("[data-skeleton-block]");

    expect(blocks.length).toBeGreaterThan(0);
    blocks.forEach((block) => {
      expect(block).toHaveAttribute("aria-hidden", "true");
      expect(block).toHaveClass("motion-reduce:animate-none");
    });
  });
});
