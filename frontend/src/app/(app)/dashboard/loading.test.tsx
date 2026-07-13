import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DashboardLoading from "./loading";

describe("DashboardLoading", () => {
  it("mirrors the compact mobile Today hierarchy", () => {
    render(<DashboardLoading />);

    const mobile = screen.getByTestId("mobile-today-skeleton");

    expect(
      mobile.querySelector('[data-skeleton="today-header"]')
    ).not.toBeNull();
    expect(
      mobile.querySelector('[data-skeleton="primary-card"]')
    ).not.toBeNull();
    expect(
      mobile.querySelector('[data-skeleton="weekly-momentum"]')
    ).not.toBeNull();
    expect(
      mobile.querySelector('[data-skeleton="latest-workout"]')
    ).not.toBeNull();
    expect(
      mobile.querySelector('[data-skeleton="desktop-stat"]')
    ).toBeNull();
  });

  it("announces loading once and hides placeholders from assistive technology", () => {
    const { container } = render(<DashboardLoading />);

    expect(
      screen.getByRole("status", { name: "Loading Today" })
    ).toHaveAttribute("aria-busy", "true");

    const blocks = container.querySelectorAll("[data-skeleton-block]");
    expect(blocks.length).toBeGreaterThan(0);
    blocks.forEach((block) => {
      expect(block).toHaveAttribute("aria-hidden", "true");
      expect(block).toHaveClass("motion-reduce:animate-none");
    });
  });

  it("keeps separate responsive mobile and desktop structures", () => {
    render(<DashboardLoading />);

    expect(screen.getByTestId("mobile-today-skeleton")).toHaveClass(
      "md:hidden"
    );
    expect(screen.getByTestId("desktop-dashboard-skeleton")).toHaveClass(
      "hidden",
      "md:block"
    );
    expect(
      screen
        .getByTestId("desktop-dashboard-skeleton")
        .querySelectorAll('[data-skeleton="desktop-stat"]')
    ).toHaveLength(4);
  });
});
