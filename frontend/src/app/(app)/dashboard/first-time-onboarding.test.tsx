import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FirstTimeOnboarding } from "./first-time-onboarding";

const mocks = vi.hoisted(() => ({
  completeOnboarding: vi.fn(),
  push: vi.fn(),
}));

vi.mock("@/app/actions/onboarding", () => ({
  completeOnboarding: mocks.completeOnboarding,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

describe("FirstTimeOnboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = "";
    mocks.completeOnboarding.mockResolvedValue({
      status: "success",
      message: "Welcome to Persist Fitness.",
      submittedAt: 1,
    });
  });

  it("opens as an accessible mobile-first dialog and focuses its heading", async () => {
    render(
      <main id="dashboard-content" tabIndex={-1}>
        <FirstTimeOnboarding />
      </main>,
    );

    const dialog = screen.getByRole("dialog", {
      name: "Make every workout count.",
    });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog.querySelector("form")).toHaveAttribute("aria-busy", "false");
    expect(dialog).toHaveClass("h-[calc(100dvh-0.75rem)]");
    expect(screen.getByText("Track workouts")).toBeInTheDocument();
    expect(screen.getByText("Monitor progress")).toBeInTheDocument();
    expect(screen.getByText("Build routines")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Make every workout count." }),
      ).toHaveFocus(),
    );
  });

  it("allows goal selection and continues to first-workout creation", async () => {
    const user = userEvent.setup();
    render(
      <main id="dashboard-content" tabIndex={-1}>
        <FirstTimeOnboarding />
      </main>,
    );

    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Strength" }));
    expect(screen.getByRole("button", { name: "Strength" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Create Workout" }));

    await waitFor(() => expect(mocks.completeOnboarding).toHaveBeenCalledTimes(1));
    const submittedData = mocks.completeOnboarding.mock.calls[0][1] as FormData;
    expect(submittedData.get("goal")).toBe("Get stronger");
    expect(submittedData.get("intent")).toBe("create-workout");
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/workouts/new"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("persists a skip, closes, unlocks scrolling, and restores dashboard focus", async () => {
    const user = userEvent.setup();
    render(
      <main id="dashboard-content" tabIndex={-1}>
        <FirstTimeOnboarding />
      </main>,
    );

    await user.click(screen.getByRole("button", { name: "Skip onboarding" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const submittedData = mocks.completeOnboarding.mock.calls[0][1] as FormData;
    expect(submittedData.get("intent")).toBe("skip");
    expect(submittedData.get("goal")).toBe("");
    expect(document.body.style.overflow).toBe("");
    await waitFor(() => expect(screen.getByRole("main")).toHaveFocus());
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("allows skipping only the goal before presenting the workout CTA", async () => {
    const user = userEvent.setup();
    render(<FirstTimeOnboarding restoreFocusId="missing-focus-target" />);

    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Skip goal" }));

    expect(
      screen.getByRole("heading", { name: "Create your first workout." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Workout" })).toBeInTheDocument();
    expect(mocks.completeOnboarding).not.toHaveBeenCalled();
  });

  it("keeps the dialog open and exposes a safe alert after persistence failure", async () => {
    mocks.completeOnboarding.mockResolvedValueOnce({
      status: "error",
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
      submittedAt: 2,
    });
    const user = userEvent.setup();
    render(<FirstTimeOnboarding />);

    await user.click(screen.getByRole("button", { name: "Skip onboarding" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again.",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("contains keyboard focus inside the active dialog", async () => {
    render(<FirstTimeOnboarding />);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Make every workout count." }),
      ).toHaveFocus(),
    );

    const skip = screen.getByRole("button", { name: "Skip onboarding" });
    skip.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });

    expect(screen.getByRole("button", { name: "Continue" })).toHaveFocus();
  });

  it("treats Escape as the available persisted skip action", async () => {
    render(<FirstTimeOnboarding />);

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => expect(mocks.completeOnboarding).toHaveBeenCalledTimes(1));
    const submittedData = mocks.completeOnboarding.mock.calls[0][1] as FormData;
    expect(submittedData.get("intent")).toBe("skip");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
