import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ExerciseDetailError from "./exercises/[exerciseId]/error";
import ExerciseDetailLoading from "./exercises/[exerciseId]/loading";
import ExercisesError from "./exercises/error";
import ExercisesLoading from "./exercises/loading";
import NewRoutineError from "./routines/new/error";
import NewRoutineLoading from "./routines/new/loading";
import RoutinesError from "./routines/error";
import RoutinesLoading from "./routines/loading";
import SettingsError from "./settings/error";
import SettingsLoading from "./settings/loading";
import NewWorkoutError from "./workouts/new/error";
import NewWorkoutLoading from "./workouts/new/loading";

type ErrorBoundaryComponent = ComponentType<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

const loadingCases: Array<{
  Component: ComponentType;
  label: string;
  sections: string[];
}> = [
  {
    Component: NewWorkoutLoading,
    label: "Loading new workout",
    sections: ["header", "workout-form"],
  },
  {
    Component: RoutinesLoading,
    label: "Loading routines",
    sections: ["header", "routine-list"],
  },
  {
    Component: NewRoutineLoading,
    label: "Loading new routine",
    sections: ["header", "routine-form"],
  },
  {
    Component: SettingsLoading,
    label: "Loading profile",
    sections: ["header", "profile-form", "account"],
  },
  {
    Component: ExercisesLoading,
    label: "Loading exercise library",
    sections: ["header", "exercise-list"],
  },
  {
    Component: ExerciseDetailLoading,
    label: "Loading exercise",
    sections: ["header", "metrics", "progress-chart", "details"],
  },
];

const errorCases: Array<{
  Component: ErrorBoundaryComponent;
  destination: string;
  destinationLabel: string;
  title: string;
}> = [
  {
    Component: NewWorkoutError,
    destination: "/workouts",
    destinationLabel: "Back to workouts",
    title: "Workout setup couldn't load",
  },
  {
    Component: RoutinesError,
    destination: "/dashboard",
    destinationLabel: "Go to Today",
    title: "Routines couldn't load",
  },
  {
    Component: NewRoutineError,
    destination: "/routines",
    destinationLabel: "Back to routines",
    title: "Routine setup couldn't load",
  },
  {
    Component: SettingsError,
    destination: "/dashboard",
    destinationLabel: "Go to Today",
    title: "Profile couldn't load",
  },
  {
    Component: ExercisesError,
    destination: "/dashboard",
    destinationLabel: "Go to Today",
    title: "Exercise library couldn't load",
  },
  {
    Component: ExerciseDetailError,
    destination: "/exercises",
    destinationLabel: "Back to exercises",
    title: "Exercise couldn't load",
  },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe.each(loadingCases)("$label", ({ Component, label, sections }) => {
  it("renders one mobile-first, accessible loading region", () => {
    const { container } = render(<Component />);
    const status = screen.getByRole("status", { name: label });

    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveClass("px-4", "pt-4");
    expect(status.className).toContain("safe-area-inset-bottom");
    expect(screen.getAllByRole("status")).toHaveLength(1);

    for (const section of sections) {
      expect(
        container.querySelector(`[data-skeleton="${section}"]`),
      ).toBeInTheDocument();
    }
  });

  it("hides decorative placeholders and respects reduced motion", () => {
    const { container } = render(<Component />);
    const blocks = container.querySelectorAll("[data-skeleton-block]");

    expect(blocks.length).toBeGreaterThan(0);
    blocks.forEach((block) => {
      expect(block).toHaveAttribute("aria-hidden", "true");
      expect(block).toHaveClass("motion-reduce:animate-none");
    });
  });
});

describe.each(errorCases)(
  "$title",
  ({ Component, destination, destinationLabel, title }) => {
    it("keeps internal details private and focuses the contextual heading", async () => {
      const internalMessage = "DATABASE_URL=password-do-not-expose";
      const error = Object.assign(new Error(internalMessage), {
        digest: "safe-digest",
      });
      const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

      render(<Component error={error} reset={vi.fn()} />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
      const heading = screen.getByRole("heading", { level: 1, name: title });
      await waitFor(() => expect(heading).toHaveFocus());
      expect(screen.queryByText(internalMessage)).not.toBeInTheDocument();
      expect(JSON.stringify(log.mock.calls)).not.toContain(internalMessage);
    });

    it("offers 48px retry and route-safe navigation controls", () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      const reset = vi.fn();

      render(<Component error={new Error("failure")} reset={reset} />);

      const retry = screen.getByRole("button", { name: "Try again" });
      const destinationLink = screen.getByRole("link", {
        name: destinationLabel,
      });

      expect(retry).toHaveClass("min-h-12");
      expect(destinationLink).toHaveClass("min-h-12");
      expect(destinationLink).toHaveAttribute("href", destination);
      expect(screen.getByRole("alert").parentElement?.className).toContain(
        "safe-area-inset-bottom",
      );

      fireEvent.click(retry);
      expect(reset).toHaveBeenCalledTimes(1);
    });
  },
);
