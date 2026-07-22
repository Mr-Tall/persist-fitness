"use server";

import { ActionError, runActionWithSafeErrors } from "@/lib/actions/action-error";
import { requireUserId } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { flattenProgramSchedule } from "@/lib/program-progress";
import { coordinateActiveWorkout } from "@/lib/workouts/active-workout-coordinator";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const programIdSchema = z.object({
  programId: z.string().min(1),
});

const ACTIVE_PROGRAM_CONSTRAINT =
  "ProgramEnrollment_one_active_per_user_key";
const MAX_ENROLLMENT_ATTEMPTS = 3;

function isWriteConflict(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2034"
  );
}

function isActiveProgramConflict(error: unknown) {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error) ||
    error.code !== "P2002" ||
    !("meta" in error) ||
    typeof error.meta !== "object" ||
    error.meta === null
  ) {
    return false;
  }

  const meta = error.meta as { modelName?: unknown; target?: unknown };
  return (
    meta.target === ACTIVE_PROGRAM_CONSTRAINT ||
    (meta.modelName === "ProgramEnrollment" &&
      Array.isArray(meta.target) &&
      meta.target.length === 1 &&
      meta.target[0] === "userId")
  );
}

function todayAtUtcNoon() {
  const today = new Date().toISOString().split("T")[0];
  return new Date(`${today}T12:00:00.000Z`);
}

async function enrollInProgramUnsafe(formData: FormData) {
  const userId = await requireUserId();
  const { programId } = programIdSchema.parse({
    programId: formData.get("programId"),
  });

  for (let attempt = 1; attempt <= MAX_ENROLLMENT_ATTEMPTS; attempt += 1) {
    try {
      await db.$transaction(
        async (transaction) => {
          const program = await transaction.program.findFirst({
            where: {
              id: programId,
              OR: [{ isPublished: true }, { ownerId: userId }],
            },
            select: {
              id: true,
              weeks: {
                orderBy: { weekNumber: "asc" },
                select: {
                  weekNumber: true,
                  days: {
                    orderBy: { dayNumber: "asc" },
                    select: { id: true, dayNumber: true },
                  },
                },
              },
            },
          });

          if (!program) {
            throw new ActionError({
              code: "NOT_FOUND",
              message: "The requested training program could not be found.",
            });
          }

          const firstDay = flattenProgramSchedule(program.weeks)[0];
          if (!firstDay) {
            throw new ActionError({
              code: "CONFLICT",
              message:
                "This training program does not have a workout schedule yet.",
            });
          }

          const activeEnrollment =
            await transaction.programEnrollment.findFirst({
              where: { userId, status: "active" },
              select: { id: true, programId: true },
            });

          if (activeEnrollment) {
            if (activeEnrollment.programId === program.id) return;
            throw new ActionError({
              code: "CONFLICT",
              message:
                "Finish your current training program before enrolling in another.",
            });
          }

          await transaction.programEnrollment.create({
            data: {
              userId,
              programId: program.id,
              startDate: new Date(),
              currentWeek: firstDay.weekNumber,
              currentDay: firstDay.dayNumber,
              status: "active",
            },
          });
        },
        { isolationLevel: "Serializable" },
      );
      break;
    } catch (error) {
      if (isWriteConflict(error) && attempt < MAX_ENROLLMENT_ATTEMPTS) {
        continue;
      }
      if (isActiveProgramConflict(error)) {
        throw new ActionError({
          code: "CONFLICT",
          message: "You already have an active training program.",
        });
      }
      throw error;
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/programs");
  revalidatePath(`/programs/${programId}`);
  redirect(`/programs/${programId}`);
}

async function startProgramWorkoutUnsafe(formData: FormData) {
  const userId = await requireUserId();
  const { programId } = programIdSchema.parse({
    programId: formData.get("programId"),
  });

  const enrollment = await db.programEnrollment.findFirst({
    where: { userId, programId, status: "active" },
    select: {
      id: true,
      currentWeek: true,
      currentDay: true,
      program: {
        select: {
          weeks: {
            select: {
              weekNumber: true,
              days: {
                select: {
                  id: true,
                  dayNumber: true,
                  routine: {
                    select: {
                      title: true,
                      goal: true,
                      exercises: {
                        orderBy: { order: "asc" },
                        select: {
                          exerciseId: true,
                          name: true,
                          order: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!enrollment) {
    throw new ActionError({
      code: "NOT_FOUND",
      message: "The active training program could not be found.",
    });
  }

  const scheduledDay = enrollment.program.weeks
    .find((week) => week.weekNumber === enrollment.currentWeek)
    ?.days.find((day) => day.dayNumber === enrollment.currentDay);

  if (!scheduledDay) {
    throw new ActionError({
      code: "CONFLICT",
      message: "The next scheduled workout is unavailable.",
    });
  }

  const { workoutId } = await coordinateActiveWorkout({
    userId,
    createWorkout: (transaction) =>
      transaction.workout.create({
        data: {
          userId,
          title: scheduledDay.routine.title,
          goal: scheduledDay.routine.goal,
          notes: null,
          date: todayAtUtcNoon(),
          status: "active",
          startedAt: new Date(),
          finishedAt: null,
          exercises: {
            create: scheduledDay.routine.exercises.map((exercise) => ({
              exerciseId: exercise.exerciseId,
              name: exercise.name,
              order: exercise.order,
            })),
          },
          programWorkout: {
            create: {
              enrollmentId: enrollment.id,
              programDayId: scheduledDay.id,
            },
          },
        },
      }),
  });

  redirect(`/workouts/${workoutId}`);
}

export async function enrollInProgram(formData: FormData) {
  return runActionWithSafeErrors({ actionName: "enrollInProgram" }, () =>
    enrollInProgramUnsafe(formData),
  );
}

export async function startProgramWorkout(formData: FormData) {
  return runActionWithSafeErrors({ actionName: "startProgramWorkout" }, () =>
    startProgramWorkoutUnsafe(formData),
  );
}
