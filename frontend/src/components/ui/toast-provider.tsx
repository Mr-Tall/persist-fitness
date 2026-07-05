"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        className:
          "border border-white/10 bg-zinc-950 text-white shadow-2xl",
      }}
    />
  );
}