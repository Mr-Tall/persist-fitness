"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

type DeleteInlineButtonProps = {
  label?: string;
  accessibleLabel?: string;
  confirmMessage: string;
};

function ConfirmedDeleteButton({
  label,
  accessibleLabel,
}: {
  label: string;
  accessibleLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={accessibleLabel}
      onClick={() => {
        if (!pending) {
          toast("Deleting...", {
            duration: 1600,
          });
        }
      }}
      className="min-h-11 rounded-xl bg-danger px-3 py-2 text-xs font-black text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Deleting..." : label}
    </button>
  );
}

export function DeleteInlineButton({
  label = "Delete",
  accessibleLabel = label,
  confirmMessage,
}: DeleteInlineButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isConfirming) {
    return (
      <button
        type="button"
        aria-label={accessibleLabel}
        onClick={() => setIsConfirming(true)}
        className="min-h-11 rounded-xl px-3 py-2 text-xs font-bold text-danger transition hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        {label}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 rounded-xl border border-danger/20 bg-danger-soft p-2">
      <span className="basis-full text-right text-xs font-semibold text-danger sm:basis-auto">
        {confirmMessage}
      </span>

      <ConfirmedDeleteButton
        label="Confirm"
        accessibleLabel={`Confirm ${accessibleLabel.toLowerCase()}`}
      />

      <button
        type="button"
        aria-label={`Cancel ${accessibleLabel.toLowerCase()}`}
        onClick={() => setIsConfirming(false)}
        className="min-h-11 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-neutral-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        Cancel
      </button>
    </div>
  );
}
