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
            <span className="text-emerald-400">Fitness</span>
          </Link>
        </nav>
      </header>
      {children}
    </>
  );
}
