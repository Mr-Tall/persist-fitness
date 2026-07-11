"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

type DeleteInlineButtonProps = {
  label?: string;
  confirmMessage: string;
};

function ConfirmedDeleteButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={() => {
        if (!pending) {
          toast("Deleting...", {
            duration: 1600,
          });
        }
      }}
      className="rounded-lg bg-red-600 px-2 py-1 text-xs font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Deleting..." : label}
    </button>
  );
}

export function DeleteInlineButton({
  label = "Delete",
  confirmMessage,
}: DeleteInlineButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isConfirming) {
    return (
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
      >
        {label}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-2 py-2">
      <span className="text-xs font-semibold text-red-700">
        {confirmMessage}
      </span>

      <ConfirmedDeleteButton label="Confirm" />

      <button
        type="button"
        onClick={() => setIsConfirming(false)}
        className="rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-bold text-red-700 transition hover:bg-red-100"
      >
        Cancel
      </button>
    </div>
  );
}