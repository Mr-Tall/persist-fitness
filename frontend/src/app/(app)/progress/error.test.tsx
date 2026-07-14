import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProgressError from "./error";

describe("ProgressError", () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

  beforeEach(() => {
    consoleError.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders a private, contextual recovery state", () => {
    const internalMessage = "DATABASE_URL leaked from an internal failure";
    const error = Object.assign(new Error(internalMessage), { digest: "safe-digest" });

    render(<ProgressError error={error} reset={vi.fn()} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Progress couldn't load" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Your workout history is still safe. Try loading your progress again."),
    ).toBeInTheDocument();
    expect(screen.queryByText(internalMessage)).not.toBeInTheDocument();

    expect(consoleError).toHaveBeenCalledWith("Progress failed to render.", {
      errorType: "Error",
      digest: "safe-digest",
    });
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(internalMessage);
  });

  it("retries with the route error-boundary reset callback", () => {
    const reset = vi.fn();
    render(<ProgressError error={new Error("failure")} reset={reset} />);

    const retry = screen.getByRole("button", { name: "Try again" });
    expect(retry).toHaveClass("min-h-12");
    fireEvent.click(retry);

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("offers accessible navigation to workout history", () => {
    render(<ProgressError error={new Error("failure")} reset={vi.fn()} />);

    const historyLink = screen.getByRole("link", { name: "View workouts" });
    expect(historyLink).toHaveAttribute("href", "/workouts");
    expect(historyLink).toHaveClass("min-h-12");
  });
});
