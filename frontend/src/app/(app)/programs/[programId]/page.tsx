import { enrollInProgram, startProgramWorkout } from "@/app/actions/programs";
import { requireUserId } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { calculateProgramProgress } from "@/lib/program-progress";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const userId = await requireUserId();
  const { programId } = await params;
  const program = await db.program.findFirst({
    where: {
      id: programId,
      OR: [{ isPublished: true }, { ownerId: userId }],
    },
    select: {
      id: true,
      name: true,
      description: true,
      difficulty: true,
      estimatedWeeks: true,
      category: true,
      weeks: {
        orderBy: { weekNumber: "asc" },
        select: {
          id: true,
          title: true,
          weekNumber: true,
          days: {
            orderBy: { dayNumber: "asc" },
            select: {
              id: true,
              dayNumber: true,
              title: true,
              routine: {
                select: {
                  id: true,
                  title: true,
                  goal: true,
                  exercises: {
                    orderBy: { order: "asc" },
                    select: {
                      id: true,
                      name: true,
                      exercise: { select: { equipment: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      enrollments: {
        where: { userId, status: "active" },
        select: {
          id: true,
          currentWeek: true,
          currentDay: true,
          status: true,
          startDate: true,
        },
      },
    },
  });

  if (!program) notFound();

  const enrollment = program.enrollments[0] ?? null;
  const progress = enrollment
    ? calculateProgramProgress(program.weeks, enrollment)
    : null;
  const equipment = Array.from(
    new Set(
      program.weeks.flatMap((week) =>
        week.days.flatMap((day) =>
          day.routine.exercises.flatMap((exercise) =>
            exercise.exercise?.equipment ? [exercise.exercise.equipment] : [],
          ),
        ),
      ),
    ),
  ).sort();

  return (
    <main className="mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-10">
      <Link
        className="inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-bold text-text-secondary hover:bg-action-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        href="/programs"
      >
        ← Back to programs
      </Link>

      <header className="mt-3">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">
          {program.category} · {program.difficulty}
        </p>
        <h1 className="mt-1 break-words text-3xl font-black text-text-primary sm:text-5xl">
          {program.name}
        </h1>
        {program.description && (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
            {program.description}
          </p>
        )}

        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-3">
            <dt className="text-xs font-bold text-text-muted">Estimated duration</dt>
            <dd className="mt-1 font-black text-text-primary">{program.estimatedWeeks} weeks</dd>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3">
            <dt className="text-xs font-bold text-text-muted">Workouts</dt>
            <dd className="mt-1 font-black text-text-primary">
              {program.weeks.reduce((total, week) => total + week.days.length, 0)} scheduled
            </dd>
          </div>
          <div className="col-span-2 rounded-xl border border-border bg-surface p-3 sm:col-span-1">
            <dt className="text-xs font-bold text-text-muted">Equipment</dt>
            <dd className="mt-1 break-words font-black text-text-primary">
              {equipment.length > 0 ? equipment.join(", ") : "No equipment listed"}
            </dd>
          </div>
        </dl>

        {enrollment && progress ? (
          <section aria-label="Enrollment progress" className="mt-4 rounded-2xl border border-info/20 bg-info-soft p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-black text-text-primary">
                Week {enrollment.currentWeek} · Day {enrollment.currentDay}
              </p>
              <span className="font-black text-info">{progress.completionPercent}%</span>
            </div>
            <div
              aria-label={`${program.name} completion`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={progress.completionPercent}
              className="mt-3 h-2 overflow-hidden rounded-full bg-black/20"
              role="progressbar"
            >
              <div className="h-full rounded-full bg-action" style={{ width: `${progress.completionPercent}%` }} />
            </div>
            <form action={startProgramWorkout} className="mt-4">
              <input name="programId" type="hidden" value={program.id} />
              <button className="min-h-12 w-full rounded-xl bg-action px-4 py-3 text-sm font-black text-action-foreground hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" type="submit">
                Start next workout
              </button>
            </form>
          </section>
        ) : (
          <form action={enrollInProgram} className="mt-4">
            <input name="programId" type="hidden" value={program.id} />
            <button className="min-h-12 w-full rounded-xl bg-action px-4 py-3 text-sm font-black text-action-foreground hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:w-auto" type="submit">
              Enroll in program
            </button>
          </form>
        )}
      </header>

      <section aria-labelledby="program-schedule-title" className="mt-7">
        <h2 className="text-xl font-black text-text-primary" id="program-schedule-title">
          Workout schedule
        </h2>
        <div className="mt-3 space-y-4">
          {program.weeks.map((week) => (
            <section className="rounded-2xl border border-border bg-surface p-4" key={week.id}>
              <h3 className="font-black text-text-primary">
                Week {week.weekNumber}{week.title ? ` · ${week.title}` : ""}
              </h3>
              <ol className="mt-3 divide-y divide-border">
                {week.days.map((day) => {
                  const isCurrent =
                    enrollment?.currentWeek === week.weekNumber &&
                    enrollment.currentDay === day.dayNumber;
                  return (
                    <li className="flex min-w-0 items-start justify-between gap-3 py-3" key={day.id}>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-text-muted">Day {day.dayNumber}</p>
                        <p className="mt-0.5 break-words font-black text-text-primary">
                          {day.title ?? day.routine.title}
                        </p>
                        <p className="mt-1 text-xs text-text-secondary">
                          {day.routine.exercises.length} exercises
                          {day.routine.goal ? ` · ${day.routine.goal}` : ""}
                        </p>
                      </div>
                      {isCurrent && (
                        <span className="shrink-0 rounded-full border border-info/30 bg-info-soft px-2.5 py-1 text-[11px] font-black text-info">
                          Next
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
