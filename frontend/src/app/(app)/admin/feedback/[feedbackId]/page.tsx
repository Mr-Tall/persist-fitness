import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteFeedback, getSignedFeedbackScreenshot, updateFeedbackStatus } from "@/app/actions/feedback";
import { requireAdminUser } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { feedbackStatuses } from "@/lib/feedback/metadata";
import { CopyReferenceButton } from "@/components/observability/copy-reference-button";
import Image from "next/image";

type FeedbackDetail = { id: string; category: string; status: string; message: string; route: string; appVersion: string | null; environment: string; platform: string; userAgentSummary: string; errorReference: string | null; conflictCategory: string | null; screenshotPath: string | null; createdAt: Date };

export default async function FeedbackDetailPage({ params }: { params: Promise<{ feedbackId: string }> }) {
  await requireAdminUser();
  const { feedbackId } = await params;
  const rows = await db.$queryRaw<FeedbackDetail[]>`SELECT "id", "category", "status", "message", "route", "appVersion", "environment", "platform", "userAgentSummary", "errorReference", "conflictCategory", "screenshotPath", "createdAt" FROM "Feedback" WHERE "id" = ${feedbackId} LIMIT 1`;
  const feedback = rows[0];
  if (!feedback) notFound();
  const screenshotUrl = feedback.screenshotPath ? await getSignedFeedbackScreenshot(feedback.id) : null;
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <Link href="/admin/feedback" className="inline-flex min-h-11 items-center rounded-xl text-sm font-bold text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">Back to inbox</Link>
      <article className="mt-3 rounded-3xl border border-border bg-surface p-5 sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-text-secondary">{feedback.category.replace("_", " ")}</p>
        <h1 className="mt-2 text-2xl font-black text-white">Feedback detail</h1>
        <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-neutral-200" data-sensitive data-sentry-mask>{feedback.message}</p>
        <dl className="mt-5 grid gap-2 text-sm text-text-muted"><div><dt className="font-bold">Created</dt><dd><time dateTime={feedback.createdAt.toISOString()}>{feedback.createdAt.toLocaleString()}</time></dd></div><div><dt className="font-bold">Route</dt><dd>{feedback.route}</dd></div><div><dt className="font-bold">Platform</dt><dd>{feedback.platform} · {feedback.userAgentSummary}</dd></div><div><dt className="font-bold">Environment</dt><dd>{feedback.environment} · {feedback.appVersion ?? "unknown version"}</dd></div>{feedback.conflictCategory && <div><dt className="font-bold">Sync conflict</dt><dd>{feedback.conflictCategory.replaceAll("_", " ")}</dd></div>}{feedback.errorReference && <div><dt className="font-bold">Reference</dt><dd className="flex items-center gap-2">{feedback.errorReference}<CopyReferenceButton reference={feedback.errorReference} /></dd></div>}</dl>
        {screenshotUrl && (
          <Image
            src={screenshotUrl}
            alt="Screenshot attached to this beta feedback report"
            width={1024}
            height={768}
            unoptimized
            className="mt-5 h-auto max-h-[32rem] w-auto max-w-full rounded-2xl border border-border object-contain"
            data-screenshot-preview
            data-ph-no-capture
            data-sentry-block
          />
        )}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <form action={updateFeedbackStatus}><input type="hidden" name="feedbackId" value={feedback.id} /><label htmlFor="feedback-status" className="text-sm font-bold">Status</label><select id="feedback-status" name="status" defaultValue={feedback.status} aria-label="Update feedback status" className="mt-2 min-h-12 w-full rounded-xl border border-border bg-canvas px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">{feedbackStatuses.map((status) => <option key={status}>{status}</option>)}</select><button className="mt-2 min-h-12 w-full rounded-xl bg-action font-black text-action-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">Update status</button></form>
          <form action={deleteFeedback} className="self-end"><input type="hidden" name="feedbackId" value={feedback.id} /><button aria-label="Delete this feedback and its screenshot" className="min-h-12 w-full rounded-xl border border-danger/30 bg-danger-soft font-black text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">Delete feedback</button></form>
        </div>
      </article>
    </main>
  );
}
