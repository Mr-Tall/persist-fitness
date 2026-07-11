import { toggleFavoriteExercise } from "@/app/actions/favorite-exercises";

type FavoriteExerciseButtonProps = {
  exerciseId: string;
  isFavorite: boolean;
};

export function FavoriteExerciseButton({
  exerciseId,
  isFavorite,
}: FavoriteExerciseButtonProps) {
  return (
    <form action={toggleFavoriteExercise}>
      <input type="hidden" name="exerciseId" value={exerciseId} />
      <button
        type="submit"
        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
          isFavorite
            ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
        }`}
      >
        {isFavorite ? "★ Favorited" : "☆ Favorite"}
      </button>
    </form>
  );
}