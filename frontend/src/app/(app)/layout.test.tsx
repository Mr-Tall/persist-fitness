import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/require-user", () => ({
  requireUserSession: vi.fn().mockResolvedValue({
    user: { id: "user-1" },
  }),
}));

vi.mock("@/components/navigation/mobile-nav", () => ({
  MobileNav: () => <nav aria-label="Mobile navigation" />,
}));

import AppLayout from "./layout";

describe("AppLayout", () => {
  it("keeps the authenticated header desktop-only and preserves mobile navigation", async () => {
    render(
      await AppLayout({
        children: <main>App content</main>,
      })
    );

    const header = screen.getByRole("banner");
    expect(header).toHaveClass("hidden", "md:block");
    expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeInTheDocument();
    expect(screen.getByText("App content")).toBeVisible();
  });

  it("routes the authenticated desktop brand to Dashboard", async () => {
    render(
      await AppLayout({
        children: <main>App content</main>,
      })
    );

    const brand = screen.getByRole("link", { name: "Persist Fitness" });
    expect(brand).toHaveAttribute("href", "/dashboard");
    expect(brand).toHaveClass("focus-visible:ring-2");
    expect(
      screen.getByRole("link", { name: "Dashboard" })
    ).toHaveAttribute("href", "/dashboard");
  });
});
