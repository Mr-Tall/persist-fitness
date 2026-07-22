import { describe, expect, it } from "vitest";
import {
  ConsistencyAnalyzer,
  createCoachReport,
  InsightEngine,
  RecommendationEngine,
  TrendAnalyzer,
} from "./index";
import { analyzeCoachInputs } from "./analyzers";
import type { CoachWorkout } from "./types";

const NOW = new Date("2026-07-22T12:00:00.000Z");

function workout(
  id: string,
  date: string,
  options: {
    exerciseName?: string;
    muscles?: string[];
    weight?: number;
    reps?: number;
    rpe?: number;
  } = {},
): CoachWorkout {
  return {
    id,
    date: new Date(date),
    status: "completed",
    rpe: options.rpe,
    exercises: [
      {
        exerciseId: options.exerciseName ?? "bench",
        name: options.exerciseName ?? "Bench Press",
        exercise: {
          primaryMuscles: options.muscles ?? ["chest"],
          trackingType: "weight_reps",
        },
        sets: [{ weight: options.weight ?? 100, reps: options.reps ?? 5 }],
      },
    ],
  };
}

describe("AI Coach analyzers", () => {
  it("detects a plateau from repeated strength observations", () => {
    const report = createCoachReport({
      now: NOW,
      workouts: [
        workout("w1", "2026-06-01T12:00:00.000Z"),
        workout("w2", "2026-07-02T12:00:00.000Z"),
        workout("w3", "2026-07-09T12:00:00.000Z"),
        workout("w4", "2026-07-16T12:00:00.000Z"),
      ],
    });

    expect(report.insights).toContainEqual(
      expect.objectContaining({
        type: "plateau",
        subject: expect.objectContaining({ name: "Bench Press" }),
      }),
    );
  });

  it("calculates deterministic workout consistency and frequency", () => {
    const workouts = [
      workout("w1", "2026-07-01T12:00:00.000Z"),
      workout("w2", "2026-07-08T12:00:00.000Z"),
      workout("w3", "2026-07-15T12:00:00.000Z"),
      workout("w4", "2026-07-21T12:00:00.000Z"),
    ];

    expect(new ConsistencyAnalyzer().analyze(workouts, NOW)).toEqual({
      completedWorkoutCount: 4,
      workoutsLast28Days: 4,
      workoutsPerWeek: 1,
      activeWeeks: 4,
      consistencyPercent: 100,
    });
  });

  it("isolates trend calculation and recognizes strength progress", () => {
    const workouts = [
      workout("old", "2026-06-10T12:00:00.000Z", { weight: 100 }),
      workout("recent", "2026-07-20T12:00:00.000Z", { weight: 110 }),
    ];

    const trend = new TrendAnalyzer().analyze(workouts, NOW);
    expect(trend.exercises[0]).toMatchObject({
      exerciseName: "Bench Press",
      changePercent: 10,
      recentPrCount: 1,
    });
    expect(createCoachReport({ workouts, now: NOW }).insights).toContainEqual(
      expect.objectContaining({ type: "strength_progress" }),
    );
  });

  it("reports muscle balance and skipped major muscle groups", () => {
    const analysis = analyzeCoachInputs(
      [workout("w1", "2026-07-20T12:00:00.000Z", { muscles: ["chest"] })],
      null,
      NOW,
    );
    const insights = new InsightEngine().generate(analysis);

    expect(analysis.trainingBalance).toMatchObject({
      balancePercent: 17,
      skippedMuscles: expect.arrayContaining(["back", "quadriceps"]),
    });
    expect(insights).toContainEqual(
      expect.objectContaining({ type: "skipped_muscle_groups", priority: "high" }),
    );
  });

  it("detects inferred missed program workouts and program adherence", () => {
    const report = createCoachReport({
      now: NOW,
      workouts: [],
      program: {
        startDate: new Date("2026-07-01T12:00:00.000Z"),
        completedDays: 2,
        totalDays: 12,
        plannedDaysByWeek: [3, 3, 3, 3],
      },
    });

    expect(report.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "program_adherence" }),
        expect.objectContaining({
          type: "missed_planned_workouts",
          metrics: expect.arrayContaining([
            expect.objectContaining({ key: "missed_planned_workouts", value: 7 }),
          ]),
        }),
      ]),
    );
  });
});

describe("AI Coach recommendations", () => {
  it("returns structured recommendations with bounded confidence", () => {
    const insights = createCoachReport({
      now: NOW,
      workouts: [workout("w1", "2026-07-20T12:00:00.000Z")],
    }).insights;
    const recommendations = new RecommendationEngine().generate(insights);

    expect(recommendations[0]).toEqual(
      expect.objectContaining({
        title: expect.any(String),
        priority: expect.stringMatching(/high|medium|low/),
        category: expect.any(String),
        supportingMetrics: expect.any(Array),
        confidence: expect.any(Number),
        suggestedAction: expect.objectContaining({ type: expect.any(String) }),
      }),
    );
    expect(recommendations.every((item) => item.confidence >= 0 && item.confidence <= 1)).toBe(true);
  });
});

