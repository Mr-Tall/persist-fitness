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
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-950">
        <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
            <Link href="/" className="text-lg font-bold tracking-tight">
              Persist Fitness
            </Link>

            <div className="hidden items-center gap-5 text-sm font-medium text-neutral-700 md:flex">
              <Link href="/dashboard" className="hover:text-neutral-950">
                Dashboard
              </Link>
              <Link href="/workouts" className="hover:text-neutral-950">
                Workouts
              </Link>
              <Link href="/exercises" className="hover:text-neutral-950">
                Exercises
              </Link>
              <Link href="/settings" className="hover:text-neutral-950">
                Settings
              </Link>
              <Link
                href="/login"
                className="rounded-xl bg-neutral-950 px-4 py-2 text-white hover:bg-neutral-800"
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