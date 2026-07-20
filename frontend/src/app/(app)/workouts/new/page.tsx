import { auth } from "@/auth";
import { PageHeader } from "@/components/ui/page-header";
import { redirect } from "next/navigation";
import { NewWorkoutForm } from "./new-workout-form";

export default async function NewWorkoutPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="New workout"
        title="Log a training session"
        description="Start with the session details. After creating the workout, you’ll add exercises and sets."
      />

      <NewWorkoutForm today={today} />
    </main>
  );
}
