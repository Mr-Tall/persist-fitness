import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ProgressLoading from "./loading";

const progressSections = [
  "progress-header",
  "weekly-momentum",
  "lifetime-summary",
  "top-lift",
  "personal-records",
  "recent-training",
];

describe("ProgressLoading", () => {
  it("mirrors the mobile Progress section order", () => {
    render(<ProgressLoading />);

    const mobileSkeleton = screen.getByTestId("mobile-progress-skeleton");
    const sections = progressSections.map((name) =>
      mobileSkeleton.querySelector(`[data-skeleton="${name}"]`),
    );

    sections.forEach((section) => expect(section).toBeInTheDocument());
    for (let index = 0; index < sections.length - 1; index += 1) {
      const currentSection = sections[index];
      const nextSection = sections[index + 1];

      expect(currentSection).not.toBeNull();
      expect(nextSection).not.toBeNull();
      expect(
        currentSection!.compareDocumentPosition(nextSection!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }

    expect(
      mobileSkeleton.querySelectorAll('[data-skeleton="personal-record-row"]'),
    ).toHaveLength(3);
    expect(
      mobileSkeleton.querySelectorAll('[data-skeleton="recent-training-row"]'),
    ).toHaveLength(2);
  });

  it("uses one accessible loading region and hides decorative placeholders", () => {
    const { container } = render(<ProgressLoading />);

    const status = screen.getByRole("status", { name: "Loading Progress" });
    expect(status).toHaveAttribute("aria-busy", "true");

    const placeholders = container.querySelectorAll("[data-skeleton-block]");
    expect(placeholders.length).toBeGreaterThan(0);
    placeholders.forEach((placeholder) => {
      expect(placeholder).toHaveAttribute("aria-hidden", "true");
      expect(placeholder).toHaveClass("motion-reduce:animate-none");
    });
  });

  it("keeps dedicated mobile and desktop loading structures", () => {
    render(<ProgressLoading />);

    const mobileSkeleton = screen.getByTestId("mobile-progress-skeleton");
    const desktopSkeleton = screen.getByTestId("desktop-progress-skeleton");

    expect(mobileSkeleton).toHaveClass("md:hidden");
    expect(desktopSkeleton).toHaveClass("hidden", "md:block");

    for (const name of progressSections) {
      expect(desktopSkeleton.querySelector(`[data-skeleton="${name}"]`)).toBeInTheDocument();
    }
  });
});
