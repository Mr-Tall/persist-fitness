"use client";

import { useState } from "react";

export function CopyReferenceButton({ reference }: { reference: string }) {
  const [copied, setCopied] = useState(false);
  return <button type="button" aria-label={`Copy error reference ${reference}`} onClick={async () => { if (navigator.clipboard) await navigator.clipboard.writeText(reference); setCopied(true); }} className="min-h-11 rounded-xl px-3 text-xs font-bold text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">{copied ? "Copied" : "Copy reference"}</button>;
}
