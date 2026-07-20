import { auth } from "@/auth";
import { PageHeader } from "@/components/ui/page-header";
import { redirect } from "next/navigation";
import { NewRoutineForm } from "./new-routine-form";

export default async function NewRoutinePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="New routine"
        title="Create a reusable workout"
        description="Build a routine once, then start workouts from it whenever you train."
      />

      <NewRoutineForm />
    </main>
  );
}
