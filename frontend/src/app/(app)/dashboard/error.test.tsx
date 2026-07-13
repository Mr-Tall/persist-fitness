import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import DashboardError from "./error";

const internalMessage =
  "Database connection failed with password=do-not-expose-this";

function renderBoundary(reset = vi.fn()) {
  const error = Object.assign(new Error(internalMessage), {
    digest: "safe-digest",
  });

  render(<DashboardError error={error} reset={reset} />);

  return { reset };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DashboardError", () => {
  it("renders a contextual accessible recovery state without internal details", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    renderBoundary();

    expect(screen.getByRole("alert")).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 1, name: "Today couldn't load" })
    ).toBeVisible();
    expect(
      screen.getByText(
        "Your workout data is still safe. Try loading this screen again."
      )
    ).toBeVisible();
    expect(screen.queryByText(internalMessage)).not.toBeInTheDocument();
  });

  it("retries through reset and keeps recovery controls accessible", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const user = userEvent.setup();
    const { reset } = renderBoundary();

    const retry = screen.getByRole("button", { name: "Try again" });
    const workouts = screen.getByRole("link", { name: "View workouts" });

    expect(retry).toHaveClass("min-h-12");
    expect(workouts).toHaveClass("min-h-12");
    expect(workouts).toHaveAttribute("href", "/workouts");

    await user.click(retry);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("logs only sanitized diagnostic context", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    renderBoundary();

    await waitFor(() => expect(log).toHaveBeenCalled());

    const loggedValues = JSON.stringify(log.mock.calls);
    expect(loggedValues).toContain("Dashboard failed to render.");
    expect(loggedValues).toContain("safe-digest");
    expect(loggedValues).not.toContain(internalMessage);
    expect(loggedValues).not.toContain("do-not-expose-this");
  });
});
