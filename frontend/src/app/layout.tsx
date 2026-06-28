import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { MobileNav } from "@/components/navigation/mobile-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Persist Fitness",
    template: "%s | Persist Fitness",
  },
  description:
    "An AI-assisted workout companion for tracking workouts, logging sets, and building consistent training habits.",
  applicationName: "Persist Fitness",
  appleWebApp: {
    capable: true,
    title: "Persist Fitness",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#050505] text-neutral-100 antialiased">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(132,204,22,0.10),transparent_30%),linear-gradient(180deg,#050505_0%,#0a0a0a_45%,#050505_100%)]" />

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
              <Link
                href="/login"
                className="rounded-xl bg-emerald-400 px-4 py-2 font-bold text-black transition hover:bg-emerald-300"
              >
                Sign in
              </Link>
            </div>
          </nav>
        </header>

        <div className="pb-20 md:pb-0">{children}</div>
        <MobileNav />
      </body>
    </html>
  );
}