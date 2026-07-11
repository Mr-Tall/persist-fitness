"use client";

type DeleteRoutineButtonProps = {
  routineTitle: string;
};

export function DeleteRoutineButton({ routineTitle }: DeleteRoutineButtonProps) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        const confirmed = window.confirm(
          `Delete ${routineTitle}? This cannot be undone.`
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
      className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 sm:w-auto"
    >
      Delete routine
    </button>
  );
}