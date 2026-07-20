"use client";

import { useId, useMemo, useState } from "react";

type ExerciseOption = {
  id: string;
  name: string;
  equipment: string | null;
  primaryMuscles: string[];
  isFavorite?: boolean;
  isRecentlyUsed?: boolean;
};

type ExerciseSelectProps = {
  exercises: ExerciseOption[];
  onValidityChange?: (isValid: boolean) => void;
};

type ExerciseSectionProps = {
  heading: string;
  headingId: string;
  exercises: ExerciseOption[];
  selectedExerciseId: string;
  onSelect: (exerciseId: string) => void;
};

function ExerciseSection({
  heading,
  headingId,
  exercises,
  selectedExerciseId,
  onSelect,
}: ExerciseSectionProps) {
  if (exercises.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={headingId} className="space-y-2">
      <h3
        id={headingId}
        className="px-1 text-xs font-black uppercase tracking-[0.16em] text-neutral-400"
      >
        {heading}
      </h3>

      <div className="space-y-2">
        {exercises.map((exercise) => {
          const isSelected = exercise.id === selectedExerciseId;

          return (
            <button
              key={exercise.id}
              type="button"
              onClick={() => onSelect(exercise.id)}
              aria-pressed={isSelected}
              className={`min-h-12 w-full rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                isSelected
                  ? "border-emerald-300/40 bg-emerald-400/[0.10]"
                  : "border-transparent bg-white/[0.05] hover:border-white/10 hover:bg-white/[0.08]"
              }`}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block break-words text-sm font-black text-white">
                    {exercise.isFavorite && (
                      <span aria-hidden="true" className="mr-1 text-amber-300">
                        ★
                      </span>
                    )}
                    {exercise.name}
                  </span>
                  <span className="mt-1 block break-words text-xs leading-5 text-neutral-400">
                    {exercise.equipment || "No equipment"} ·{" "}
                    {exercise.primaryMuscles.join(", ") || "No muscles listed"}
                  </span>
                </span>

                {isSelected && (
                  <span className="shrink-0 rounded-full bg-emerald-400 px-2 py-1 text-xs font-black text-black">
                    Selected
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function ExerciseSelect({
  exercises,
  onValidityChange,
}: ExerciseSelectProps) {
  const searchId = useId();
  const customNameId = useId();
  const favoritesHeadingId = useId();
  const recentHeadingId = useId();
  const allHeadingId = useId();
  const [query, setQuery] = useState("");
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [customName, setCustomName] = useState("");

  const selectedExercise = exercises.find(
    (exercise) => exercise.id === selectedExerciseId,
  );

  const hasValidSelection = Boolean(
    selectedExerciseId || customName.trim().length > 0,
  );

  function updateSelectedExercise(exerciseId: string) {
    setSelectedExerciseId(exerciseId);
    onValidityChange?.(Boolean(exerciseId || customName.trim().length > 0));
  }

  function updateCustomName(name: string) {
    setCustomName(name);
    onValidityChange?.(Boolean(selectedExerciseId || name.trim().length > 0));
  }

  const sections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filteredExercises = exercises
      .filter((exercise) => {
        if (!normalizedQuery) {
          return true;
        }

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
      .sort((a, b) => a.name.localeCompare(b.name));

    const favorites = filteredExercises.filter((exercise) => exercise.isFavorite);
    const recentlyUsed = filteredExercises.filter(
      (exercise) => exercise.isRecentlyUsed && !exercise.isFavorite,
    );
    const allExercises = filteredExercises.filter(
      (exercise) => !exercise.isFavorite && !exercise.isRecentlyUsed,
    );

    return { favorites, recentlyUsed, allExercises };
  }, [exercises, query]);

  const resultCount =
    sections.favorites.length +
    sections.recentlyUsed.length +
    sections.allExercises.length;

  return (
    <div className="space-y-4">
      <input type="hidden" name="exerciseId" value={selectedExerciseId} />

      <div
        role="region"
        aria-label="Exercise results"
        className="max-h-[min(28rem,52dvh)] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-black/20 scroll-pb-24"
      >
        <div className="sticky top-0 z-10 border-b border-white/10 bg-neutral-950/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/90">
          <label
            htmlFor={searchId}
            className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-400"
          >
            Search exercises
          </label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, muscle, or equipment"
            autoComplete="off"
            enterKeyHint="search"
            className="mt-1 min-h-12 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-3 text-white outline-none transition placeholder:text-neutral-500 focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400/30"
          />
        </div>

        <div className="space-y-5 p-2 pb-20 md:pb-3">
          {resultCount === 0 ? (
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl border border-dashed border-white/15 px-4 py-6 text-center"
            >
              <p className="text-sm font-bold text-white">No exercises found</p>
              <p className="mt-1 text-xs leading-5 text-neutral-400">
                Try another search or add a custom movement below.
              </p>
            </div>
          ) : (
            <>
              <ExerciseSection
                heading="Favorites"
                headingId={favoritesHeadingId}
                exercises={sections.favorites}
                selectedExerciseId={selectedExerciseId}
                onSelect={updateSelectedExercise}
              />
              <ExerciseSection
                heading="Recently used"
                headingId={recentHeadingId}
                exercises={sections.recentlyUsed}
                selectedExerciseId={selectedExerciseId}
                onSelect={updateSelectedExercise}
              />
              <ExerciseSection
                heading="All exercises"
                headingId={allHeadingId}
                exercises={sections.allExercises}
                selectedExerciseId={selectedExerciseId}
                onSelect={updateSelectedExercise}
              />
            </>
          )}
        </div>
      </div>

      {selectedExercise && (
        <div className="rounded-2xl border border-emerald-300/30 bg-emerald-400/[0.10] p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="break-words text-sm font-black text-emerald-200">
                Selected: {selectedExercise.name}
              </p>
              <p className="mt-1 break-words text-xs leading-5 text-emerald-100/80">
                {selectedExercise.equipment || "No equipment"} ·{" "}
                {selectedExercise.primaryMuscles.join(", ") ||
                  "No muscles listed"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => updateSelectedExercise("")}
              className="min-h-11 shrink-0 rounded-lg px-3 py-1 text-xs font-bold text-emerald-200 hover:bg-emerald-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              aria-label={`Clear selected exercise ${selectedExercise.name}`}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor={customNameId}
          className="block text-xs font-black uppercase tracking-[0.16em] text-neutral-400"
        >
          Custom name
        </label>
        <input
          id={customNameId}
          name="name"
          maxLength={100}
          value={customName}
          onChange={(event) => updateCustomName(event.target.value)}
          placeholder="Use this if the movement is not listed"
          autoComplete="off"
          enterKeyHint="done"
          className="mt-1 min-h-12 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-3 text-white outline-none transition placeholder:text-neutral-500 focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400/30"
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
