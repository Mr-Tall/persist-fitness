"use client";

import { signIn } from "next-auth/react";

export function LoginButton() {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
    >
      Continue with Google
    </button>
  );
}