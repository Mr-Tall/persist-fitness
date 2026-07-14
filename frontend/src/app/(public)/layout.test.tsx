import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PublicLayout from "./layout";

describe("PublicLayout", () => {
  it("keeps its public header and landing-page brand destination", () => {
    render(
      <PublicLayout>
        <main>Public content</main>
      </PublicLayout>
    );

    expect(screen.getByRole("banner")).not.toHaveClass("hidden");
    expect(
      screen.getByRole("link", { name: "Persist Fitness" })
    ).toHaveAttribute("href", "/");
    expect(screen.getByText("Public content")).toBeVisible();
  });
});
