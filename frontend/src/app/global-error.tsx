"use client";

import { ErrorReference } from "@/components/observability/error-reference";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en"><body className="bg-black text-white"><main className="grid min-h-screen place-items-center p-5"><section role="alert" className="max-w-lg rounded-3xl border border-white/10 bg-neutral-950 p-6"><h1 className="text-2xl font-black">Something went wrong.</h1><p className="mt-3 text-neutral-300">Your data is still protected. Try loading the application again.</p><ErrorReference error={error} /><button type="button" onClick={reset} className="mt-5 min-h-12 rounded-xl bg-white px-5 font-black text-black">Try again</button></section></main></body></html>
  );
}
