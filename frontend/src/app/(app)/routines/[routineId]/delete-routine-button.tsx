"use client";

type DeleteRoutineButtonProps = {
  routineTitle: string;
  variant?: "default" | "list";
};

export function DeleteRoutineButton({
  routineTitle,
  variant = "default",
}: DeleteRoutineButtonProps) {
  return (
    <button
      aria-label={`Delete ${routineTitle} routine`}
      type="submit"
      onClick={(event) => {
        const confirmed = window.confirm(
          `Delete ${routineTitle}? This cannot be undone.`
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
      className={
        variant === "list"
          ? "inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-red-300/15 bg-red-400/[0.04] px-3 py-2 text-sm font-bold text-red-200 transition hover:border-red-300/25 hover:bg-red-400/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          : "inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-red-300/20 bg-red-400/[0.06] px-4 py-2 text-sm font-bold text-red-200 transition hover:border-red-300/30 hover:bg-red-400/[0.10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:w-auto"
      }
    >
      {variant === "list" ? "Delete" : "Delete routine"}
    </button>
  );
}
