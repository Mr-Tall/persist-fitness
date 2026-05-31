type ExerciseOption = {
  id: string;
  name: string;
  equipment: string | null;
  primaryMuscles: string[];
};

type ExerciseSelectProps = {
  exercises: ExerciseOption[];
};

export function ExerciseSelect({ exercises }: ExerciseSelectProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-neutral-500">
          Choose from library
        </label>
        <select
          name="exerciseId"
          defaultValue=""
          className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3"
        >
          <option value="">Custom exercise</option>
          {exercises.map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name}
              {exercise.equipment ? ` · ${exercise.equipment}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral-500">
          Custom name
        </label>
        <input
          name="name"
          placeholder="Use this if exercise is not in library"
          className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3"
        />
      </div>

      <p className="text-xs leading-5 text-neutral-500">
        Pick an exercise from the library, or leave it as custom and type your own.
      </p>
    </div>
  );
}