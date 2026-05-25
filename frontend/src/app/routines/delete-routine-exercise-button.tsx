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
      className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
    >
      Remove
    </button>
  );
}