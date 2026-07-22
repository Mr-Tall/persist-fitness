import Link from "next/link";
import { Prisma } from "@prisma/client";
import { requireAdminUser } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { feedbackCategories, feedbackStatuses } from "@/lib/feedback/metadata";

const PAGE_SIZE = 25;
type Row = { id: string; category: string; status: string; createdAt: Date; platform: string; userAgentSummary: string; route: string; errorReference: string | null; message: string; screenshotPath: string | null };

export default async function FeedbackInbox({ searchParams }: { searchParams: Promise<{ status?: string; category?: string; page?: string }> }) {
  await requireAdminUser();
  const query = await searchParams;
  const status = feedbackStatuses.some((item) => item === query.status) ? query.status! : null;
  const category = feedbackCategories.some((item) => item === query.category) ? query.category! : null;
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);
  const filters = Prisma.sql`${status ? Prisma.sql`AND "status" = ${status}` : Prisma.empty} ${category ? Prisma.sql`AND "category" = ${category}` : Prisma.empty}`;
  const rows = await db.$queryRaw<Row[]>`
    SELECT "id", "category", "status", "createdAt", "platform", "userAgentSummary", "route", "errorReference", "message", "screenshotPath"
    FROM "Feedback" WHERE 1=1 ${filters}
    ORDER BY "createdAt" DESC LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}
  `;
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary">Internal</p>
      <h1 className="mt-2 text-3xl font-black text-white">Beta feedback</h1>
      <form className="mt-5 grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-3">
        <select aria-label="Filter feedback by status" name="status" defaultValue={status ?? ""} className="min-h-12 rounded-xl border border-border bg-canvas px-3"><option value="">All statuses</option>{feedbackStatuses.map((item) => <option key={item}>{item}</option>)}</select>
        <select aria-label="Filter feedback by category" name="category" defaultValue={category ?? ""} className="min-h-12 rounded-xl border border-border bg-canvas px-3"><option value="">All categories</option>{feedbackCategories.map((item) => <option key={item}>{item}</option>)}</select>
        <button className="min-h-12 rounded-xl bg-action font-black text-action-foreground">Apply filters</button>
      </form>
      <ul className="mt-5 space-y-3">
        {rows.map((item) => <li key={item.id}><Link href={`/admin/feedback/${item.id}`} className="block rounded-2xl border border-border bg-surface p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"><div className="flex flex-wrap justify-between gap-2"><span className="font-black text-white">{item.category.replace("_", " ")} · {item.status}</span><time className="text-xs text-text-muted">{item.createdAt.toLocaleDateString()}</time></div><p className="mt-2 line-clamp-2 text-sm text-neutral-300">{item.message}</p><p className="mt-2 text-xs text-text-muted">{item.platform} · {item.userAgentSummary} · {item.route}{item.screenshotPath ? " · Screenshot" : ""}{item.errorReference ? ` · Ref ${item.errorReference}` : ""}</p></Link></li>)}
      </ul>
      {rows.length === 0 && <p className="mt-6 rounded-2xl border border-dashed border-border p-6 text-center text-text-muted">No feedback matches these filters.</p>}
      <nav aria-label="Feedback pages" className="mt-5 flex justify-between"><Link className={`min-h-11 rounded-xl px-4 py-3 ${page === 1 ? "pointer-events-none opacity-40" : ""}`} href={`?page=${page - 1}${status ? `&status=${status}` : ""}${category ? `&category=${category}` : ""}`}>Previous</Link><Link className={`min-h-11 rounded-xl px-4 py-3 ${rows.length < PAGE_SIZE ? "pointer-events-none opacity-40" : ""}`} href={`?page=${page + 1}${status ? `&status=${status}` : ""}${category ? `&category=${category}` : ""}`}>Next</Link></nav>
    </main>
  );
}
