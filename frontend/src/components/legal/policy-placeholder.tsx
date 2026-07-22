import Link from "next/link";
import type { ReactNode } from "react";

export function PolicyPlaceholder({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-[max(3rem,env(safe-area-inset-bottom))] pt-6 sm:px-6 sm:py-12">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-warning">Beta placeholder</p>
      <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">{title}</h1>
      <p className="mt-3 text-sm leading-7 text-text-secondary">{summary}</p>
      <aside role="note" className="mt-5 rounded-2xl border border-warning/30 bg-warning-soft p-4 text-sm leading-6 text-warning">
        This page is a product placeholder, not final legal copy. It must be reviewed and replaced by qualified counsel before public or App Store release.
      </aside>
      <div className="mt-7 space-y-6 text-sm leading-7 text-neutral-300">{children}</div>
      <Link href="/" className="mt-8 inline-flex min-h-12 items-center rounded-xl border border-border px-4 font-bold text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">Return home</Link>
    </main>
  );
}

export function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return <section><h2 className="text-xl font-black text-white">{title}</h2><div className="mt-2 space-y-2">{children}</div></section>;
}
