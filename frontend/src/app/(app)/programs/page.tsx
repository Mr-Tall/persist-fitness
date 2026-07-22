import { requireUserId } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { ProgramBrowser } from "./program-browser";

export default async function ProgramsPage() {
  const userId = await requireUserId();
  const programs = await db.program.findMany({
    where: { OR: [{ isPublished: true }, { ownerId: userId }] },
    orderBy: [{ difficulty: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      difficulty: true,
      estimatedWeeks: true,
      category: true,
      weeks: {
        select: { days: { select: { id: true } } },
      },
      enrollments: {
        where: { userId, status: "active" },
        select: { id: true },
      },
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-10">
      <header>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-text-muted">
          Programs
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-text-primary sm:text-5xl">
          Training programs
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
          Follow a reusable multi-week schedule built from proven workout routines.
        </p>
      </header>

      <div className="mt-6">
        {programs.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-border p-7 text-center">
            <h2 className="text-lg font-black text-text-primary">No programs available yet</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Published training programs will appear here when they are ready.
            </p>
          </section>
        ) : (
          <ProgramBrowser
            programs={programs.map((program) => ({
              id: program.id,
              name: program.name,
              description: program.description,
              difficulty: program.difficulty,
              estimatedWeeks: program.estimatedWeeks,
              category: program.category,
              isCurrent: program.enrollments.length > 0,
              workoutCount: program.weeks.reduce(
                (total, week) => total + week.days.length,
                0,
              ),
            }))}
          />
        )}
      </div>
    </main>
  );
}
