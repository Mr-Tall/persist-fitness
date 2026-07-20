"use client";

import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import {
  saveProfileWithState,
  type SaveProfileFormState,
} from "@/app/actions/profile";

const initialState: SaveProfileFormState = {
  status: "idle",
  message: "",
  submittedAt: null,
};

function restoreSubmittedValues(form: HTMLFormElement, values: FormData) {
  for (const element of Array.from(form.elements)) {
    if (
      !(element instanceof HTMLInputElement) &&
      !(element instanceof HTMLSelectElement) &&
      !(element instanceof HTMLTextAreaElement)
    ) {
      continue;
    }

    if (!element.name) {
      continue;
    }

    if (element instanceof HTMLInputElement && element.type === "checkbox") {
      element.checked = values.getAll(element.name).map(String).includes(element.value);
      continue;
    }

    const submittedValue = values.get(element.name);
    if (submittedValue !== null) {
      element.value = String(submittedValue);
    }
  }
}

export function ProfileForm({ children }: { children: ReactNode }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const messageRef = useRef<HTMLParagraphElement>(null);
  const submittedValuesRef = useRef<FormData>(null);
  const id = useId();
  const messageId = `${id}-message`;

  const [state, formAction, isPending] = useActionState(
    saveProfileWithState,
    initialState,
  );

  const hasMessage =
    !isPending && state.status !== "idle" && Boolean(state.message);

  useLayoutEffect(() => {
    if (state.status !== "error" || !hasMessage || !formRef.current) {
      return;
    }

    if (submittedValuesRef.current) {
      restoreSubmittedValues(formRef.current, submittedValuesRef.current);
    }
    messageRef.current?.focus({ preventScroll: true });
  }, [hasMessage, state.status, state.submittedAt]);

  useEffect(() => {
    if (state.status !== "success" || !hasMessage) {
      return;
    }

    toast.success(state.message);
    submittedValuesRef.current = null;
    router.push("/dashboard");
  }, [hasMessage, router, state.message, state.status, state.submittedAt]);

  function captureSubmission(event: FormEvent<HTMLFormElement>) {
    submittedValuesRef.current = new FormData(event.currentTarget);
  }

  return (
    <form
      action={formAction}
      aria-busy={isPending}
      aria-describedby={hasMessage ? messageId : undefined}
      className="space-y-7 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur sm:p-7"
      onSubmit={captureSubmission}
      ref={formRef}
    >
      {hasMessage && (
        <p
          className={`rounded-2xl border px-4 py-3 text-sm font-bold leading-6 outline-none ${
            state.status === "success"
              ? "border-emerald-300/25 bg-emerald-400/[0.08] text-emerald-200"
              : "border-red-300/25 bg-red-400/[0.08] text-red-200"
          }`}
          id={messageId}
          ref={messageRef}
          role={state.status === "error" ? "alert" : "status"}
          tabIndex={state.status === "error" ? -1 : undefined}
        >
          {state.message}
        </p>
      )}
      {children}
    </form>
  );
}
