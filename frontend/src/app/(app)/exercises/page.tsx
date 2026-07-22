import { auth } from "@/auth";
import { PageHeader } from "@/components/ui/page-header";
import { getExerciseLibraryData } from "@/lib/exercise-library-data";
import { redirect } from "next/navigation";
import { ExerciseLibraryBrowser } from "./exercise-library-browser";

export default async function ExercisesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const exercises = await getExerciseLibraryData(session.user.id);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Exercises"
        title="Exercise library"
        description="Browse movements by training intent, revisit recent performance, and find useful alternatives."
      />

      {exercises.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border bg-surface p-7 text-center">
          <h2 className="text-xl font-black text-text-primary">No exercises available</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">
            The exercise catalog is not available yet. Try loading this screen again later.
          </p>
        </section>
      ) : (
        <ExerciseLibraryBrowser exercises={exercises} />
      )}
    </main>
  );
}
