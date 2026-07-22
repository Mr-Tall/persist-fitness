import "server-only";

import { db } from "@/lib/db";

export const DATA_EXPORT_FORMAT_VERSION = 1;

export async function createPersonalDataExport(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      onboardingCompletedAt: true,
      createdAt: true,
      updatedAt: true,
      accounts: {
        select: {
          type: true,
          provider: true,
          providerAccountId: true,
        },
      },
      sessions: {
        orderBy: { lastActiveAt: "asc" },
        select: {
          createdAt: true,
          lastActiveAt: true,
          userAgentSummary: true,
          expires: true,
        },
      },
      profile: {
        select: {
          height: true,
          weight: true,
          trainingAge: true,
          primaryGoal: true,
          experience: true,
          availableDays: true,
          equipment: true,
          preferredSplit: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      workouts: {
        orderBy: { date: "asc" },
        select: {
          id: true,
          title: true,
          goal: true,
          notes: true,
          date: true,
          rpe: true,
          mood: true,
          status: true,
          startedAt: true,
          finishedAt: true,
          createdAt: true,
          updatedAt: true,
          exercises: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              exerciseId: true,
              name: true,
              order: true,
              exercise: { select: { trackingType: true } },
              sets: {
                orderBy: { setNumber: "asc" },
                select: {
                  id: true,
                  setNumber: true,
                  reps: true,
                  weight: true,
                  durationSeconds: true,
                  distance: true,
                  distanceUnit: true,
                  rir: true,
                  tempo: true,
                  notes: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
        },
      },
      templates: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          title: true,
          goal: true,
          description: true,
          source: true,
          createdAt: true,
          updatedAt: true,
          exercises: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              exerciseId: true,
              name: true,
              sets: true,
              reps: true,
              notes: true,
              order: true,
            },
          },
        },
      },
      programEnrollments: {
        orderBy: { startDate: "asc" },
        select: {
          id: true,
          startDate: true,
          currentWeek: true,
          currentDay: true,
          status: true,
          completedAt: true,
          createdAt: true,
          updatedAt: true,
          program: {
            select: {
              id: true,
              name: true,
              description: true,
              difficulty: true,
              estimatedWeeks: true,
              category: true,
            },
          },
          scheduledWorkouts: {
            select: {
              workoutId: true,
              programDayId: true,
              completedAt: true,
            },
          },
        },
      },
      programsOwned: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          difficulty: true,
          estimatedWeeks: true,
          category: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      favoriteExercises: {
        orderBy: { createdAt: "asc" },
        select: {
          createdAt: true,
          exercise: {
            select: { id: true, name: true, trackingType: true },
          },
        },
      },
      feedback: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          category: true,
          message: true,
          status: true,
          route: true,
          appVersion: true,
          environment: true,
          platform: true,
          userAgentSummary: true,
          errorReference: true,
          conflictCategory: true,
          screenshotPath: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!user) return null;

  const exerciseHistory = new Map<string, {
    exerciseId: string | null;
    name: string;
    trackingType: string | null;
    performances: Array<{
      workoutId: string;
      workoutDate: Date;
      sets: (typeof user.workouts)[number]["exercises"][number]["sets"];
    }>;
  }>();
  for (const workout of user.workouts) {
    for (const exercise of workout.exercises) {
      const key = exercise.exerciseId ?? `custom:${exercise.name.toLowerCase()}`;
      const history = exerciseHistory.get(key) ?? {
        exerciseId: exercise.exerciseId,
        name: exercise.name,
        trackingType: exercise.exercise?.trackingType ?? null,
        performances: [],
      };
      history.performances.push({
        workoutId: workout.id,
        workoutDate: workout.date,
        sets: exercise.sets,
      });
      exerciseHistory.set(key, history);
    }
  }

  const { feedback, ...accountData } = user;
  return {
    formatVersion: DATA_EXPORT_FORMAT_VERSION,
    generatedAt: new Date(),
    account: accountData,
    exerciseHistory: [...exerciseHistory.values()],
    feedback: feedback.map(({ screenshotPath, ...item }) => ({
      ...item,
      screenshotAttached: Boolean(screenshotPath),
    })),
  };
}
