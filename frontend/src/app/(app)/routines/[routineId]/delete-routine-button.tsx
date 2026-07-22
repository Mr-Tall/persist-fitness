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
          ? "inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-danger/20 bg-danger-soft px-3 py-2 text-sm font-bold text-danger transition hover:border-danger/40 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          : "inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-danger/25 bg-danger-soft px-4 py-2 text-sm font-bold text-danger transition hover:border-danger/45 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:w-auto"
      }
    >
      {variant === "list" ? "Delete" : "Delete routine"}
    </button>
  );
}
