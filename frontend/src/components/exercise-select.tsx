"use client";

import { useMemo, useState } from "react";

type ExerciseOption = {
  id: string;
  name: string;
  equipment: string | null;
  primaryMuscles: string[];
  isFavorite?: boolean;
};

type ExerciseSelectProps = {
  exercises: ExerciseOption[];
};

export function ExerciseSelect({ exercises }: ExerciseSelectProps) {
  const [query, setQuery] = useState("");
  const [selectedExerciseId, setSelectedExerciseId] = useState("");

  const selectedExercise = exercises.find(
    (exercise) => exercise.id === selectedExerciseId
  );

  const filteredExercises = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = normalizedQuery
      ? exercises.filter((exercise) => {
          const searchableText = [
            exercise.name,
            exercise.equipment,
            ...exercise.primaryMuscles,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchableText.includes(normalizedQuery);
        })
      : exercises;

    return [...filtered].sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [exercises, query]);

  return (
    <div className="space-y-4">
      <input type="hidden" name="exerciseId" value={selectedExerciseId} />

      <div>
        <label className="block text-xs font-medium text-neutral-500">
          Search exercise library
        </label>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, muscle, or equipment"
          className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {selectedExercise && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-emerald-950">
                Selected: {selectedExercise.name}
              </p>
              <p className="mt-1 text-xs text-emerald-800">
                {selectedExercise.equipment || "No equipment"} ·{" "}
                {selectedExercise.primaryMuscles.join(", ") || "No muscles listed"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedExerciseId("")}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-neutral-200 bg-neutral-50 p-2">
        {filteredExercises.length === 0 ? (
          <p className="p-3 text-sm text-neutral-500">
            No library exercises found. Use a custom name below.
          </p>
        ) : (
          filteredExercises.map((exercise) => {
            const isSelected = exercise.id === selectedExerciseId;

            return (
              <button
                key={exercise.id}
                type="button"
                onClick={() => setSelectedExerciseId(exercise.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  isSelected
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-transparent bg-white hover:border-neutral-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-950">
                      {exercise.isFavorite ? "★ " : ""}
                      {exercise.name}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {exercise.equipment || "No equipment"} ·{" "}
                      {exercise.primaryMuscles.join(", ") || "No muscles listed"}
                    </p>
                  </div>

                  {isSelected && (
                    <span className="rounded-full bg-emerald-500 px-2 py-1 text-xs font-semibold text-white">
                      Selected
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral-500">
          Custom name
        </label>
        <input
          name="name"
          placeholder="Use this if exercise is not in library"
          className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <p className="text-xs leading-5 text-neutral-500">
        Select an exercise from the library, or leave the library selection empty
        and type a custom exercise name.
      </p>
    </div>
  );
}