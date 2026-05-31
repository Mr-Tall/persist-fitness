import { auth } from "@/auth";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function ExercisesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const exercises = await db.exercise.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Exercises"
        title="Exercise library"
        description="Browse the starter exercise library. This will power search, routines, previous performance, substitutions, and future AI suggestions."
      />

      {exercises.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
          <h2 className="text-xl font-semibold">No exercises seeded yet</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Run <code>npx prisma db seed</code> to add the starter library.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {exercises.map((exercise) => (
            <article
              key={exercise.id}
              className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <h2 className="text-lg font-semibold">{exercise.name}</h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    {exercise.equipment || "No equipment"} ·{" "}
                    {exercise.mechanic || "Movement"}
                  </p>
                </div>

                {exercise.category && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {exercise.category}
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {exercise.primaryMuscles.map((muscle) => (
                  <span
                    key={muscle}
                    className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700"
                  >
                    {muscle}
                  </span>
                ))}

                {exercise.secondaryMuscles.map((muscle) => (
                  <span
                    key={muscle}
                    className="rounded-full bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-500"
                  >
                    {muscle}
                  </span>
                ))}
              </div>

              {exercise.instructions.length > 0 && (
                <details className="mt-4 rounded-2xl bg-neutral-50 p-4">
                  <summary className="cursor-pointer text-sm font-semibold">
                    Instructions
                  </summary>

                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-neutral-600">
                    {exercise.instructions.map((instruction) => (
                      <li key={instruction}>{instruction}</li>
                    ))}
                  </ol>
                </details>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}