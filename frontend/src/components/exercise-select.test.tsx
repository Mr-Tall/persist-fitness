import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ExerciseSelect } from "./exercise-select";

const exercises = [
  {
    id: "favorite-bench",
    name: "Bench Press",
    equipment: "Barbell",
    primaryMuscles: ["Chest", "Triceps"],
    isFavorite: true,
  },
  {
    id: "recent-row",
    name: "Seated Cable Row",
    equipment: "Cable",
    primaryMuscles: ["Back"],
    isRecentlyUsed: true,
  },
  {
    id: "squat",
    name: "Back Squat",
    equipment: "Barbell",
    primaryMuscles: ["Quadriceps", "Glutes"],
  },
  {
    id: "raise",
    name: "Dumbbell Lateral Raise",
    equipment: "Dumbbell",
    primaryMuscles: ["Shoulders"],
  },
];

describe("ExerciseSelect", () => {
  it("organizes available exercises into ordered, non-empty sections", () => {
    render(<ExerciseSelect exercises={exercises} />);

    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings.map((heading) => heading.textContent)).toEqual([
      "Favorites",
      "Recently used",
      "All exercises",
    ]);

    expect(
      within(screen.getByRole("region", { name: "Favorites" })).getByRole(
        "button",
        { name: /Bench Press/ },
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Recently used" })).getByRole(
        "button",
        { name: /Seated Cable Row/ },
      ),
    ).toBeInTheDocument();
  });

  it("filters instantly without case or surrounding-whitespace sensitivity", async () => {
    const user = userEvent.setup();
    render(<ExerciseSelect exercises={exercises} />);

    const search = screen.getByRole("searchbox", { name: "Search exercises" });
    await user.type(search, "  bAcK sQuAt  ");

    expect(screen.getByRole("button", { name: /Back Squat/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Bench Press/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Favorites")).not.toBeInTheDocument();
    expect(screen.queryByText("Recently used")).not.toBeInTheDocument();
    expect(screen.getByText("All exercises")).toBeInTheDocument();
  });

  it("searches exercise equipment and primary muscles", async () => {
    const user = userEvent.setup();
    render(<ExerciseSelect exercises={exercises} />);

    await user.type(screen.getByRole("searchbox"), "shoulders");

    expect(
      screen.getByRole("button", { name: /Dumbbell Lateral Raise/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Back Squat/ })).not.toBeInTheDocument();
  });

  it("announces an accessible empty result without rendering empty sections", async () => {
    const user = userEvent.setup();
    render(<ExerciseSelect exercises={exercises} />);

    await user.type(screen.getByRole("searchbox"), "movement that does not exist");

    expect(screen.getByRole("status")).toHaveTextContent("No exercises found");
    expect(screen.queryByRole("heading", { level: 3 })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Custom name")).toBeInTheDocument();
  });

  it("preserves keyboard selection, hidden field behavior, and accessible labels", async () => {
    const user = userEvent.setup();
    const onValidityChange = vi.fn();
    const { container } = render(
      <ExerciseSelect
        exercises={exercises}
        onValidityChange={onValidityChange}
      />,
    );

    const search = screen.getByRole("searchbox", { name: "Search exercises" });
    search.focus();
    await user.keyboard("{Tab}{Enter}");

    const selectedButton = screen.getByRole("button", { pressed: true });
    expect(selectedButton).toHaveAccessibleName(/Bench Press/);
    expect(container.querySelector('input[name="exerciseId"]')).toHaveValue(
      "favorite-bench",
    );
    expect(onValidityChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByText("Selected: Bench Press")).toBeInTheDocument();
  });

  it("does not reset the result-list scroll position while filtering", async () => {
    const user = userEvent.setup();
    render(<ExerciseSelect exercises={exercises} />);
    const resultsViewport = screen.getByRole("region", {
      name: "Exercise results",
    });

    resultsViewport.scrollTop = 24;
    await user.type(screen.getByRole("searchbox"), "barbell");

    expect(resultsViewport.scrollTop).toBe(24);
  });
});
