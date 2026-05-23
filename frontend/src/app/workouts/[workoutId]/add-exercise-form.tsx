import { addExerciseToWorkout } from "@/app/actions/workout-exercises";

type AddExerciseFormProps = {
  workoutId: string;
};

export function AddExerciseForm({ workoutId }: AddExerciseFormProps) {
  return (
    <form action={addExerciseToWorkout} className="rounded-2xl border border-neutral-200 p-4">
      <input type="hidden" name="workoutId" value={workoutId} />

      <label className="block text-sm font-medium">Add exercise</label>

      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <input
          name="name"
          placeholder="Example: Bench Press"
          className="w-full rounded-xl border border-neutral-300 px-3 py-2"
          required
        />

        <button
          type="submit"
          className="rounded-xl bg-neutral-950 px-5 py-2 font-semibold text-white hover:bg-neutral-800"
        >
          Add
        </button>
      </div>
    </form>
  );
}