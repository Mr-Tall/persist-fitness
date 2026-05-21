import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Persist Fitness",
  description: "AI-assisted workout tracking built around consistency and progression.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-950">
        <header className="border-b border-neutral-200">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-bold">
              Persist Fitness
            </Link>

            <div className="flex items-center gap-5 text-sm font-medium text-neutral-700">
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

        {children}
      </body>
    </html>
  );
}