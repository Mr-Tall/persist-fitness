"use client";

type DeleteRoutineExerciseButtonProps = {
  exerciseName: string;
};

export function DeleteRoutineExerciseButton({
  exerciseName,
}: DeleteRoutineExerciseButtonProps) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        const confirmed = window.confirm(
          `Remove ${exerciseName} from this routine?`
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
      aria-label={`Remove ${exerciseName} from routine`}
      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-300/15 bg-red-400/[0.04] px-3 py-2 text-xs font-black text-red-200 transition hover:border-red-300/30 hover:bg-red-400/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
    >
      Remove
    </button>
  );
}
