"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import {
  deleteAccountWithState,
  revokeSessionWithState,
  signOutOtherSessionsWithState,
  type AccountActionState,
} from "@/app/actions/account";
import { AccessibleDialog } from "@/components/ui/accessible-dialog";
import { clearDeletedAccountClientData } from "@/lib/account/client-cleanup";

const initialState: AccountActionState = { status: "idle", message: "", submittedAt: null };

export type SessionView = {
  id: string;
  createdAt: string;
  expires: string;
  lastActiveAt: string;
  userAgentSummary: string;
  isCurrent: boolean;
};

function ActionStatus({ state }: { state: AccountActionState }) {
  if (state.status === "idle") return null;
  return <p role={state.status === "error" ? "alert" : "status"} className={`mt-2 text-sm font-bold ${state.status === "error" ? "text-danger" : "text-success"}`}>{state.message}</p>;
}

function RevokeSessionForm({ session }: { session: SessionView }) {
  const [state, action, pending] = useActionState(revokeSessionWithState, initialState);
  return (
    <form action={action} className="mt-3 sm:mt-0 sm:text-right">
      <input type="hidden" name="sessionId" value={session.id} />
      <button type="submit" disabled={pending} aria-label={`Sign out ${session.userAgentSummary}`} className="min-h-11 rounded-xl border border-border px-3 text-sm font-bold text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60">
        {pending ? "Signing out..." : "Sign out"}
      </button>
      <ActionStatus state={state} />
    </form>
  );
}

export function SessionManagement({ sessions }: { sessions: SessionView[] }) {
  const [state, action, pending] = useActionState(signOutOtherSessionsWithState, initialState);
  const otherCount = sessions.filter((item) => !item.isCurrent).length;
  return (
    <section aria-labelledby="active-sessions-heading" className="mt-5 rounded-[2rem] border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="active-sessions-heading" className="text-lg font-black text-white">Active sessions</h2>
          <p className="mt-1 text-sm leading-6 text-text-muted">Review devices signed in to your account. Session tokens are never shown.</p>
        </div>
        <form action={action}>
          <button type="submit" disabled={pending || otherCount === 0} className="min-h-12 rounded-xl border border-border px-4 text-sm font-bold text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50">
            {pending ? "Signing out..." : "Sign out other devices"}
          </button>
          <ActionStatus state={state} />
        </form>
      </div>
      <ul className="mt-5 divide-y divide-border" aria-label="Signed-in devices">
        {sessions.map((session) => (
          <li key={session.id} className="py-4 first:pt-0 last:pb-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="font-bold text-text-primary">{session.userAgentSummary}{session.isCurrent ? " (current device)" : ""}</p>
              <p className="mt-1 text-xs text-text-muted">Last active <time dateTime={session.lastActiveAt} suppressHydrationWarning>{new Date(session.lastActiveAt).toLocaleString()}</time> · Expires <time dateTime={session.expires} suppressHydrationWarning>{new Date(session.expires).toLocaleDateString()}</time></p>
            </div>
            {!session.isCurrent && <RevokeSessionForm session={session} />}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AccountDataControls() {
  return (
    <section aria-labelledby="your-data-heading" className="mt-5 rounded-[2rem] border border-border bg-surface p-5 sm:p-6">
      <h2 id="your-data-heading" className="text-lg font-black text-white">Your data</h2>
      <p className="mt-1 text-sm leading-6 text-text-muted">Download a server-generated JSON copy of your profile, training history, routines, programs, and feedback. Exports are delivered directly and are not retained.</p>
      <a href="/api/account/export" download className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-action px-4 font-black text-action-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">Download personal data</a>
    </section>
  );
}

export function DeleteAccountControl() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deleteAccountWithState, initialState);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const confirmationRef = useRef<HTMLInputElement>(null);
  const handledSuccess = useRef<number | null>(null);
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  useEffect(() => {
    if (state.status !== "success" || !state.submittedAt || handledSuccess.current === state.submittedAt) return;
    handledSuccess.current = state.submittedAt;
    void (async () => {
      await clearDeletedAccountClientData();
      await signOut({ callbackUrl: "/" });
    })();
  }, [state.status, state.submittedAt]);

  return (
    <section aria-labelledby="delete-account-heading" className="mt-5 rounded-[2rem] border border-danger/25 bg-danger-soft p-5 sm:p-6">
      <h2 id="delete-account-heading" className="text-lg font-black text-white">Delete account</h2>
      <p className="mt-1 text-sm leading-6 text-text-muted">Permanently removes your account and owned training data. This cannot be undone.</p>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)} className="mt-4 min-h-12 rounded-xl border border-danger/40 px-4 font-black text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">Delete my account</button>
      <AccessibleDialog open={open} onClose={() => !pending && setOpen(false)} escapeDisabled={pending} initialFocusRef={confirmationRef} restoreFocusRef={triggerRef} titleId={titleId} descriptionId={descriptionId}>
        <form action={action} aria-busy={pending} className="flex min-h-0 flex-1 flex-col" data-sensitive data-ph-no-capture data-sentry-mask>
          <header className="border-b border-border px-5 py-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-danger">Permanent action</p>
            <h2 id={titleId} className="mt-1 text-xl font-black text-white">Delete your account?</h2>
            <p id={descriptionId} className="mt-2 text-sm leading-6 text-text-muted">All workouts, routines, enrollments, offline receipts, feedback, screenshots, and sessions owned by this account will be removed. Type DELETE to confirm.</p>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <label htmlFor={`${id}-confirmation`} className="text-sm font-bold text-text-primary">Confirmation</label>
            <input ref={confirmationRef} id={`${id}-confirmation`} name="confirmation" autoComplete="off" required pattern="DELETE" aria-describedby={state.status !== "idle" ? `${id}-status` : descriptionId} className="mt-2 min-h-12 w-full rounded-xl border border-border bg-canvas px-4 text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" />
            {state.status !== "idle" && (
              <p
                id={`${id}-status`}
                role={state.status === "error" ? "alert" : "status"}
                className={`mt-3 text-sm font-bold ${state.status === "error" ? "text-danger" : "text-success"}`}
              >
                {state.message}
              </p>
            )}
          </div>
          <footer className="grid grid-cols-2 gap-2 border-t border-border px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            <button type="button" disabled={pending} onClick={() => setOpen(false)} className="min-h-12 rounded-xl border border-border font-bold text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">Cancel</button>
            <button type="submit" disabled={pending} className="min-h-12 rounded-xl bg-danger font-black text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60">{pending ? "Deleting..." : "Delete permanently"}</button>
          </footer>
        </form>
      </AccessibleDialog>
    </section>
  );
}
