"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { submitFeedback, type FeedbackFormState } from "@/app/actions/feedback";
import { AccessibleDialog } from "@/components/ui/accessible-dialog";
import { captureProductEvent } from "@/lib/analytics/client";
import { sensitiveReplayAttributes } from "@/lib/observability/sanitize";
import Image from "next/image";

const initialState: FeedbackFormState = { status: "idle", message: "", submittedAt: null };

export function FeedbackDialog({
  autoOpen = false,
  initialCategory = "general",
  errorReference = "",
  conflictCategory = "",
  triggerLabel = "Send beta feedback",
}: {
  autoOpen?: boolean;
  initialCategory?: "bug" | "feature_request" | "general";
  errorReference?: string;
  conflictCategory?: string;
  triggerLabel?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(autoOpen);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const statusId = `${id}-status`;
  const [state, action, pending] = useActionState(submitFeedback, initialState);

  useEffect(() => {
    if (state.status !== "success" || !state.feedbackId) return;
    captureProductEvent("feedback_submitted", {
      category: state.submittedCategory ?? initialCategory,
      screenshot_attached: Boolean(state.screenshotAttached),
    }, { onceKey: state.feedbackId });
  }, [initialCategory, state.feedbackId, state.screenshotAttached, state.status, state.submittedCategory]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  return (
    <>
      <button ref={triggerRef} type="button" aria-haspopup="dialog" onClick={() => setOpen(true)} className="min-h-12 rounded-2xl border border-border bg-action-secondary px-4 py-3 text-sm font-black text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
        {triggerLabel}
      </button>
      <AccessibleDialog open={open} onClose={() => !pending && setOpen(false)} escapeDisabled={pending} initialFocusRef={messageRef} restoreFocusRef={triggerRef} titleId={titleId} descriptionId={`${descriptionId}${state.status !== "idle" ? ` ${statusId}` : ""}`}>
        <form
          action={action}
          aria-busy={pending}
          aria-describedby={state.status !== "idle" ? statusId : undefined}
          className="flex min-h-0 flex-1 flex-col"
          {...sensitiveReplayAttributes}
        >
          <input type="hidden" name="route" value={pathname} />
          <input type="hidden" name="errorReference" value={errorReference} />
          <input type="hidden" name="conflictCategory" value={conflictCategory} />
          <header className="border-b border-border px-5 py-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-text-secondary">Private beta</p>
            <h2 id={titleId} className="mt-1 text-xl font-black text-white">Send feedback</h2>
            <p id={descriptionId} className="mt-1 text-sm text-neutral-400">Describe what happened. Workout details are never attached automatically.</p>
          </header>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <div>
              <label htmlFor={`${id}-category`} className="text-sm font-bold text-neutral-200">Category</label>
              <select id={`${id}-category`} name="category" defaultValue={initialCategory} aria-describedby={state.fieldErrors?.category ? statusId : undefined} className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-surface px-4 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                <option value="bug">Bug</option><option value="feature_request">Feature request</option><option value="general">General</option>
              </select>
            </div>
            <div>
              <label htmlFor={`${id}-message`} className="text-sm font-bold text-neutral-200">What should we know?</label>
              <textarea ref={messageRef} id={`${id}-message`} name="message" required minLength={10} maxLength={2000} rows={7} aria-describedby={state.fieldErrors?.message ? statusId : undefined} className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" {...sensitiveReplayAttributes} />
            </div>
            <div>
              <label htmlFor={`${id}-screenshot`} className="text-sm font-bold text-neutral-200">Screenshot <span className="font-normal text-text-muted">(optional, 3 MB max)</span></label>
              <input id={`${id}-screenshot`} name="screenshot" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby={state.fieldErrors?.screenshot ? statusId : undefined} onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                setPreviewUrl(file ? URL.createObjectURL(file) : null);
              }} className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-surface px-3 py-2 text-sm text-neutral-300 file:mr-3 file:rounded-xl file:border-0 file:px-3 file:py-2" data-screenshot-preview />
              {previewUrl && (
                <Image
                  src={previewUrl}
                  alt="Preview of the screenshot that will be attached"
                  width={640}
                  height={360}
                  unoptimized
                  className="mt-3 h-auto max-h-48 w-auto max-w-full rounded-xl border border-border object-contain"
                  data-screenshot-preview
                  data-sentry-block
                />
              )}
            </div>
            {errorReference && <p className="text-xs text-text-muted">Reference: {errorReference}</p>}
            {state.status !== "idle" && <p id={statusId} role={state.status === "error" ? "alert" : "status"} className={state.status === "error" ? "text-sm font-bold text-danger" : "text-sm font-bold text-success"}>{state.message}</p>}
          </div>
          <footer className="grid grid-cols-2 gap-2 border-t border-border px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            <button type="button" disabled={pending} onClick={() => setOpen(false)} className="min-h-12 rounded-2xl border border-border font-bold text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">Cancel</button>
            <button type="submit" disabled={pending || state.status === "success"} className="min-h-12 rounded-2xl bg-action font-black text-action-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60">{pending ? "Sending…" : state.status === "success" ? "Sent" : "Send feedback"}</button>
          </footer>
        </form>
      </AccessibleDialog>
    </>
  );
}
