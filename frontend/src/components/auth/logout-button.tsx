"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100"
    >
      Sign out
    </button>
  );
}