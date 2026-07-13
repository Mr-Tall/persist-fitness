import Link from "next/link";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { requireUserSession } from "@/lib/auth/require-user";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireUserSession();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/55 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
          <Link href="/" className="text-lg font-black tracking-tight">
            <span className="text-white">Persist</span>{" "}
            <span className="text-emerald-400">Fitness</span>
          </Link>

          <div className="hidden items-center gap-5 text-sm font-medium text-neutral-300 md:flex">
            <Link href="/dashboard" className="transition hover:text-white">
              Dashboard
            </Link>
            <Link href="/progress" className="transition hover:text-white">
              Progress
            </Link>
            <Link href="/workouts" className="transition hover:text-white">
              Workouts
            </Link>
            <Link href="/routines" className="transition hover:text-white">
              Routines
            </Link>
            <Link href="/exercises" className="transition hover:text-white">
              Exercises
            </Link>
            <Link href="/settings" className="transition hover:text-white">
              Settings
            </Link>
          </div>
        </nav>
      </header>

      <div className="[--mobile-nav-height:calc(3.75rem_+_max(0.75rem,env(safe-area-inset-bottom)))] pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </div>
      <MobileNav />
    </>
  );
}
