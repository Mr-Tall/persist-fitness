import { addExerciseToWorkout } from "@/app/actions/workout-exercises";
import { ExerciseSelect } from "@/components/exercise-select";

type AddExerciseFormProps = {
  workoutId: string;
  exercises: {
    id: string;
    name: string;
    equipment: string | null;
    primaryMuscles: string[];
  }[];
};

export function AddExerciseForm({ workoutId, exercises }: AddExerciseFormProps) {
  return (
    <form
      action={addExerciseToWorkout}
      className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"
    >
      <input type="hidden" name="workoutId" value={workoutId} />

      <h2 className="text-lg font-semibold">Add exercise</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Choose from the library or add a custom movement.
      </p>

      <div className="mt-4">
        <ExerciseSelect exercises={exercises} />
      </div>

      <button
        type="submit"
        className="mt-4 w-full rounded-xl bg-neutral-950 px-5 py-3 font-semibold text-white transition hover:bg-neutral-800 sm:w-auto"
      >
        Add exercise
      </button>
    </form>
  );
}