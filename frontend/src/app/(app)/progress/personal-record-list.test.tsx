import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ExercisePersonalRecord } from "@/lib/personal-records";
import { PersonalRecordList } from "./personal-record-list";

const longExerciseName =
  "Single-arm cable-supported rear-delt row with an intentionally long movement name";
const longWorkoutTitle =
  "Upper-body strength and controlled hypertrophy with a deliberately long workout title";

const records: ExercisePersonalRecord[] = [
  {
    exerciseName: longExerciseName,
    workoutId: "workout-1",
    workoutTitle: longWorkoutTitle,
    workoutDate: new Date("2026-07-12T12:00:00.000Z"),
    weight: 1234567,
    reps: 10000,
    estimatedOneRepMax: 987654321,
  },
  {
    exerciseName: "Bench Press",
    workoutId: "workout-2",
    workoutTitle: "Push day",
    workoutDate: new Date("2026-07-10T12:00:00.000Z"),
    weight: 225,
    reps: 8,
    estimatedOneRepMax: 285,
  },
];

describe("PersonalRecordList", () => {
  it("renders compact records as a semantic achievement list", () => {
    render(<PersonalRecordList records={records} />);

    const list = screen.getByRole("list");
    const items = within(list).getAllByRole("listitem");

    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText(longExerciseName)).toBeVisible();
    expect(within(items[0]).getByText("1,234,567 lb × 10,000 reps")).toBeVisible();
    expect(
      within(items[0]).getByText("Estimated 1RM 987,654,321 lb")
    ).toBeVisible();
    expect(
      within(items[0]).getByText(`${longWorkoutTitle} · 7/12/2026`)
    ).toBeVisible();
  });

  it("keeps each source destination and accessible link name specific", () => {
    render(<PersonalRecordList records={records} />);

    const longRecordLink = screen.getByRole("link", {
      name: new RegExp(`^View ${longExerciseName} record workout\\.`),
    });
    const benchRecordLink = screen.getByRole("link", {
      name: /^View Bench Press record workout\./,
    });

    expect(longRecordLink).toHaveAttribute("href", "/workouts/workout-1");
    expect(benchRecordLink).toHaveAttribute("href", "/workouts/workout-2");
    expect(longRecordLink).toHaveClass("min-h-16", "focus-visible:ring-2");
  });

  it("uses safe wrapping for long names, results, estimates, and source context", () => {
    render(<PersonalRecordList records={[records[0]]} />);

    expect(screen.getByText(longExerciseName)).toHaveClass(
      "[overflow-wrap:anywhere]"
    );
    expect(screen.getByText("1,234,567 lb × 10,000 reps")).toHaveClass(
      "[overflow-wrap:anywhere]"
    );
    expect(
      screen.getByText("Estimated 1RM 987,654,321 lb")
    ).toHaveClass("[overflow-wrap:anywhere]");
    expect(screen.getByText(`${longWorkoutTitle} · 7/12/2026`)).toHaveClass(
      "line-clamp-2"
    );
  });
});
