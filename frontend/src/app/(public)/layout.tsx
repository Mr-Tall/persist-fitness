import Link from "next/link";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/55 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl items-center px-5 py-4 sm:px-6">
          <Link href="/" className="text-lg font-black tracking-tight">
            <span className="text-white">Persist</span>{" "}
            <span className="text-text-secondary">Fitness</span>
          </Link>
        </nav>
      </header>
      {children}
      <footer className="border-t border-border px-5 py-5 text-sm text-text-muted">
        <nav aria-label="Legal" className="mx-auto flex max-w-6xl flex-wrap gap-2">
          <Link href="/privacy" className="inline-flex min-h-11 items-center rounded-xl px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">Privacy</Link>
          <Link href="/terms" className="inline-flex min-h-11 items-center rounded-xl px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">Terms</Link>
          <Link href="/data-usage" className="inline-flex min-h-11 items-center rounded-xl px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">Data usage</Link>
        </nav>
      </footer>
    </>
  );
}
