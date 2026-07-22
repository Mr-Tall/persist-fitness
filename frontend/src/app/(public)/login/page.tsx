import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LoginButton } from "@/components/auth/login-button";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-neutral-950 px-6 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.25em] text-text-secondary">
          Persist Fitness
        </p>

        <h1 className="mb-4 text-3xl font-bold">
          Sign in to start tracking your training.
        </h1>

        <p className="mb-8 text-sm leading-6 text-neutral-300">
          Use your Google account to save workouts, build your profile, and eventually get smarter AI-assisted training suggestions.
        </p>

        <LoginButton />
      </section>
    </main>
  );
}
