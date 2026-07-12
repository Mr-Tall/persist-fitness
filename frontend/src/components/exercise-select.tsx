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
  onValidityChange?: (isValid: boolean) => void;
};

export function ExerciseSelect({
  exercises,
  onValidityChange,
}: ExerciseSelectProps) {
  const [query, setQuery] = useState("");
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [customName, setCustomName] = useState("");

  const selectedExercise = exercises.find(
    (exercise) => exercise.id === selectedExerciseId
  );

  const hasValidSelection = Boolean(
    selectedExerciseId || customName.trim().length > 0
  );

  function updateSelectedExercise(exerciseId: string) {
    setSelectedExerciseId(exerciseId);
    onValidityChange?.(Boolean(exerciseId || customName.trim().length > 0));
  }

  function updateCustomName(name: string) {
    setCustomName(name);
    onValidityChange?.(Boolean(selectedExerciseId || name.trim().length > 0));
  }

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
        <label className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-500">
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
        <div className="rounded-2xl border border-emerald-300/30 bg-emerald-400/[0.10] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-emerald-200">
                Selected: {selectedExercise.name}
              </p>
              <p className="mt-1 text-xs text-emerald-100/80">
                {selectedExercise.equipment || "No equipment"} ·{" "}
                {selectedExercise.primaryMuscles.join(", ") ||
                  "No muscles listed"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => updateSelectedExercise("")}
              className="rounded-lg px-2 py-1 text-xs font-bold text-emerald-200 hover:bg-emerald-300/10"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-2">
        {filteredExercises.length === 0 ? (
          <p className="p-3 text-sm text-neutral-400">
            No library exercises found. Use a custom name below.
          </p>
        ) : (
          filteredExercises.map((exercise) => {
            const isSelected = exercise.id === selectedExerciseId;

            return (
              <button
                key={exercise.id}
                type="button"
                onClick={() => updateSelectedExercise(exercise.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  isSelected
                    ? "border-emerald-300/40 bg-emerald-400/[0.10]"
                    : "border-transparent bg-white/[0.05] hover:border-white/10 hover:bg-white/[0.08]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-white">
                      {exercise.isFavorite ? "★ " : ""}
                      {exercise.name}
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">
                      {exercise.equipment || "No equipment"} ·{" "}
                      {exercise.primaryMuscles.join(", ") ||
                        "No muscles listed"}
                    </p>
                  </div>

                  {isSelected && (
                    <span className="rounded-full bg-emerald-400 px-2 py-1 text-xs font-black text-black">
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
        <label className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-500">
          Custom name
        </label>
        <input
          name="name"
          maxLength={100}
          value={customName}
          onChange={(event) => updateCustomName(event.target.value)}
          placeholder="Use this if exercise is not in library"
          className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {!hasValidSelection && (
        <p className="rounded-xl border border-amber-300/20 bg-amber-400/[0.08] px-3 py-2 text-xs font-bold leading-5 text-amber-200">
          Select an exercise or type a custom exercise name before adding.
        </p>
      )}
    </div>
  );
}
