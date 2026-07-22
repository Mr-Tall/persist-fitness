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
      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-danger/20 bg-danger-soft px-3 py-2 text-xs font-black text-danger transition hover:border-danger/40 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
    >
      Remove
    </button>
  );
}
