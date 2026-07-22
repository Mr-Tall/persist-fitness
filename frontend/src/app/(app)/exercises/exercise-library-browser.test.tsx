import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ExerciseLibraryCardData } from "@/lib/exercise-library-data";
import { ExerciseLibraryBrowser } from "./exercise-library-browser";

vi.mock("@/app/actions/favorite-exercises", () => ({
  toggleFavoriteExercise: vi.fn(),
}));

function exercise(
  overrides: Partial<ExerciseLibraryCardData> &
    Pick<ExerciseLibraryCardData, "id" | "name">,
): ExerciseLibraryCardData {
  const { id, name, ...rest } = overrides;
  return {
    aliases: [],
    category: "strength",
    equipment: "barbell",
    exerciseType: "strength",
    force: "push",
    id,
    images: [],
    instructions: [],
    isFavorite: false,
    isRecentlyUsed: false,
    isRecommended: false,
    laterality: "bilateral",
    level: "intermediate",
    mechanic: "compound",
    movementPattern: "push",
    name,
    primaryMuscles: ["chest"],
    relatedExercises: [],
    secondaryMuscles: ["triceps"],
    thumbnailUrl: null,
    tips: [],
    trackingType: "weight_reps",
    lastPerformed: null,
    lastPerformance: null,
    personalRecord: null,
    ...rest,
  };
}

const exercises = [
  exercise({
    id: "bench",
    name: "Bench Press",
    aliases: ["flat bench"],
    isFavorite: true,
    lastPerformed: {
      dateLabel: "7/20/2026",
      workoutHref: "/workouts/workout-1",
      workoutTitle: "Push day",
    },
    lastPerformance: "225 lb · 8 reps · RIR 2",
    personalRecord: {
      estimatedOneRepMax: 285,
      label: "225 lb × 8",
      workoutHref: "/workouts/workout-1",
    },
    relatedExercises: [{ id: "incline", name: "Incline Bench Press" }],
  }),
  exercise({ id: "row", name: "Cable Row", equipment: "cable", force: "pull", isRecentlyUsed: true, movementPattern: "pull", primaryMuscles: ["back"] }),
  exercise({ id: "incline", name: "Incline Bench Press", isRecommended: true }),
  exercise({ id: "squat", name: "Back Squat", movementPattern: "squat", primaryMuscles: ["quadriceps"] }),
];

describe("ExerciseLibraryBrowser", () => {
  it("orders favorites, recent exercises, recommendations, then remaining matches", () => {
    render(<ExerciseLibraryBrowser exercises={exercises} />);

    const headings = ["Favorites", "Recently used", "Recommendations", "All exercises"].map(
      (name) => screen.getByRole("heading", { name }),
    );
    expect(headings[0].compareDocumentPosition(headings[1]) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(headings[1].compareDocumentPosition(headings[2]) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(headings[2].compareDocumentPosition(headings[3]) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    const unpin = screen.getByRole("button", { name: "Unpin Bench Press" });
    expect(unpin).toBeVisible();
    expect(
      within(unpin.closest("form")!).getByDisplayValue("bench"),
    ).toHaveAttribute("name", "exerciseId");
    expect(screen.getByRole("button", { name: "Pin Cable Row" })).toBeVisible();
  });

  it("searches aliases case-insensitively while trimming whitespace", async () => {
    const user = userEvent.setup();
    render(<ExerciseLibraryBrowser exercises={exercises} />);

    await user.type(screen.getByRole("searchbox", { name: "Search exercises" }), "  FLAT BENCH  ");
    expect(screen.getByRole("heading", { name: "Bench Press" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Cable Row" })).not.toBeInTheDocument();
  });

  it("combines multiple filter groups and exposes keyboard-operable chips", async () => {
    const user = userEvent.setup();
    render(<ExerciseLibraryBrowser exercises={exercises} />);

    await user.click(screen.getByText("Filter exercises"));
    const muscleGroup = screen.getByRole("group", { name: "Muscle" });
    const chest = within(muscleGroup).getByRole("button", { name: "chest" });
    await user.click(chest);
    expect(chest).toHaveAttribute("aria-pressed", "true");

    const equipmentGroup = screen.getByRole("group", { name: "Equipment" });
    await user.click(within(equipmentGroup).getByRole("button", { name: "barbell" }));
    expect(screen.getByRole("heading", { name: "Bench Press" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Cable Row" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Back Squat" })).not.toBeInTheDocument();
  });

  it("renders rich history, PR, related links, and helpful empty results", async () => {
    const user = userEvent.setup();
    render(<ExerciseLibraryBrowser exercises={exercises} />);

    const bench = screen.getByRole("heading", { name: "Bench Press" }).closest("article")!;
    expect(within(bench).getByText("Weight + reps")).toBeVisible();
    expect(within(bench).getByText("7/20/2026")).toBeVisible();
    expect(within(bench).getByText("225 lb × 8")).toBeVisible();
    expect(within(bench).getByText(/225 lb · 8 reps · RIR 2/)).toBeVisible();
    expect(within(bench).getByRole("link", { name: "Incline Bench Press" })).toHaveAttribute("href", "/exercises/incline");

    await user.type(screen.getByRole("searchbox", { name: "Search exercises" }), "unknown movement");
    expect(screen.getByRole("status")).toHaveTextContent("No exercises match");
  });

  it("opens existing exercise details and restores focus to the exact card trigger", async () => {
    const user = userEvent.setup();
    render(<ExerciseLibraryBrowser exercises={exercises} />);

    const trigger = screen.getByRole("button", {
      name: "View details for Bench Press",
    });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Bench Press" });
    expect(within(dialog).getByText("Movement details and coaching guidance.")).toBeVisible();

    await user.click(
      within(dialog).getByRole("button", { name: "Close Bench Press details" }),
    );
    expect(screen.queryByRole("dialog", { name: "Bench Press" })).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
