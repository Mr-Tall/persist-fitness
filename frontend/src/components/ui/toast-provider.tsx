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
          "border border-border bg-surface-elevated text-text-primary shadow-2xl",
      }}
    />
  );
}
