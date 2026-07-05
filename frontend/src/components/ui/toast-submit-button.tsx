"use client";

import { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

type ToastSubmitButtonProps = {
  children: ReactNode;
  pendingText?: string;
  toastMessage: string;
  className?: string;
  disabled?: boolean;
};

export function ToastSubmitButton({
  children,
  pendingText = "Working...",
  toastMessage,
  className = "",
  disabled = false,
}: ToastSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      onClick={() => {
        if (!isDisabled) {
          toast(toastMessage, {
            duration: 1800,
          });
        }
      }}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-70`}
    >
      {pending ? pendingText : children}
    </button>
  );
}