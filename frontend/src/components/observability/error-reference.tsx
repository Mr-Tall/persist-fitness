"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createCorrelationReference, normalizeErrorReference } from "@/lib/observability/reference";
import { captureHandledException } from "@/lib/observability/sentry";

export function ErrorReference({ error }: { error: Error & { digest?: string } }) {
  const [reference] = useState(() => normalizeErrorReference(error.digest) ?? createCorrelationReference());
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    captureHandledException(error, reference);
  }, [error, reference]);
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-text-muted">
      <span>Reference: <strong className="text-text-secondary">{reference}</strong></span>
      <button type="button" aria-label={`Copy error reference ${reference}`} onClick={async () => { if (navigator.clipboard) await navigator.clipboard.writeText(reference); setCopied(true); }} className="min-h-11 rounded-xl px-3 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">{copied ? "Copied" : "Copy reference"}</button>
      <Link href={`/settings?feedback=bug&reference=${encodeURIComponent(reference)}`} className="inline-flex min-h-11 items-center rounded-xl px-3 font-bold text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">Report this issue</Link>
    </div>
  );
}
