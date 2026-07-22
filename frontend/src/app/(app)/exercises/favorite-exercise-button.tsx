"use client";

import { toggleFavoriteExercise } from "@/app/actions/favorite-exercises";

type FavoriteExerciseButtonProps = {
  exerciseId: string;
  exerciseName?: string;
  isFavorite: boolean;
};

export function FavoriteExerciseButton({
  exerciseId,
  exerciseName,
  isFavorite,
}: FavoriteExerciseButtonProps) {
  return (
    <form action={toggleFavoriteExercise}>
      <input type="hidden" name="exerciseId" value={exerciseId} />
      <button
        aria-label={
          exerciseName
            ? `${isFavorite ? "Unpin" : "Pin"} ${exerciseName}`
            : isFavorite
              ? "Unpin exercise"
              : "Pin exercise"
        }
        className={`min-h-11 rounded-full border px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
          isFavorite
            ? "border-border-strong bg-action text-action-foreground hover:bg-action-hover"
            : "border-border bg-action-secondary text-text-secondary hover:text-text-primary"
        }`}
        type="submit"
      >
        {isFavorite ? "★ Pinned" : "☆ Pin"}
      </button>
    </form>
  );
}
