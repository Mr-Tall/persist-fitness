import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import WorkoutsLoading from "./loading";

describe("WorkoutsLoading", () => {
  it("uses one labelled loading region with safe mobile spacing", () => {
    const { container } = render(<WorkoutsLoading />);
    const status = screen.getByRole("status", { name: "Loading workouts" });

    expect(status).toHaveAttribute("aria-busy", "true");
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(status).toHaveClass("px-4", "pt-4");
    expect(status.className).toContain("safe-area-inset-bottom");
    expect(container.querySelector('[data-skeleton="workout-history-header"]')).toBeInTheDocument();
    expect(container.querySelector('[data-skeleton="workout-history-list"]')).toBeInTheDocument();
  });

  it("represents compact resilient workout-history rows", () => {
    const { container } = render(<WorkoutsLoading />);
    const rows = container.querySelectorAll('[data-skeleton="workout-row"]');

    expect(rows).toHaveLength(4);
    rows.forEach((row) => {
      expect(row).toHaveClass("min-w-0", "overflow-hidden");
      expect(row).not.toHaveClass("p-6");
    });
  });

  it("hides decorative placeholders and disables pulse for reduced motion", () => {
    const { container } = render(<WorkoutsLoading />);
    const blocks = container.querySelectorAll("[data-skeleton-block]");

    expect(blocks.length).toBeGreaterThan(0);
    blocks.forEach((block) => {
      expect(block).toHaveAttribute("aria-hidden", "true");
      expect(block).toHaveClass("motion-reduce:animate-none");
    });
  });
});
