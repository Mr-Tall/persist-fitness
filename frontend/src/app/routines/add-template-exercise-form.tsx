import { addExerciseToRoutine } from "@/app/actions/routines";

type AddTemplateExerciseFormProps = {
  routineId: string;
};

export function AddTemplateExerciseForm({
  routineId,
}: AddTemplateExerciseFormProps) {
  return (
    <form
      action={addExerciseToRoutine}
      className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"
    >
      <input type="hidden" name="routineId" value={routineId} />

      <h2 className="text-lg font-semibold">Add exercise</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Add planned movements for this routine.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-neutral-500">
            Exercise
          </label>
          <input
            name="name"
            placeholder="Example: Bench Press"
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-500">
            Sets
          </label>
          <input
            name="sets"
            type="number"
            min="1"
            max="20"
            placeholder="3"
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-500">
            Reps
          </label>
          <input
            name="reps"
            placeholder="8-12"
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-500">
            Notes
          </label>
          <input
            name="notes"
            placeholder="Optional"
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3"
          />
        </div>
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