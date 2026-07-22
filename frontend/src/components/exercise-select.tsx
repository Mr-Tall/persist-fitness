"use client";

import { useId, useMemo, useState, type RefObject } from "react";

export type ExerciseLibraryOption = {
  id: string;
  name: string;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  force?: string | null;
  level?: string | null;
  mechanic?: string | null;
  movementPattern?: string | null;
  exerciseType?: string | null;
  laterality?: string | null;
  trackingType?: string | null;
  instructions?: string[];
  tips?: string[];
  aliases?: string[];
  images?: string[];
  thumbnailUrl?: string | null;
  isFavorite?: boolean;
  isRecentlyUsed?: boolean;
};

type ExerciseSelectProps = {
  exercises: ExerciseLibraryOption[];
  onValidityChange?: (isValid: boolean) => void;
  onViewDetails?: (exercise: ExerciseLibraryOption) => void;
  detailsFocusExerciseId?: string | null;
  detailsTriggerRef?: RefObject<HTMLButtonElement | null>;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  selectedExerciseId?: string;
  onSelectedExerciseIdChange?: (exerciseId: string) => void;
  customName?: string;
  onCustomNameChange?: (name: string) => void;
};

type ExerciseSectionProps = {
  heading: string;
  headingId: string;
  exercises: ExerciseLibraryOption[];
  selectedExerciseId: string;
  onSelect: (exerciseId: string) => void;
  onViewDetails?: (exercise: ExerciseLibraryOption) => void;
  detailsFocusExerciseId?: string | null;
  detailsTriggerRef?: RefObject<HTMLButtonElement | null>;
};

function ExerciseSection({
  heading,
  headingId,
  exercises,
  selectedExerciseId,
  onSelect,
  onViewDetails,
  detailsFocusExerciseId,
  detailsTriggerRef,
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
            <div
              key={exercise.id}
              className={`flex min-h-12 w-full items-stretch rounded-xl border text-left transition ${
                isSelected
                  ? "border-border-strong bg-surface-elevated"
                  : "border-transparent bg-white/[0.05] hover:border-white/10 hover:bg-white/[0.08]"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(exercise.id)}
                aria-pressed={isSelected}
                className="min-w-0 flex-1 rounded-l-xl p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
              >
                <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block break-words text-sm font-black text-white">
                    {exercise.isFavorite && (
                      <span aria-hidden="true" className="mr-1 text-text-primary">
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
                  <span className="shrink-0 rounded-full bg-action px-2 py-1 text-xs font-black text-action-foreground">
                    Selected
                  </span>
                )}
                </span>
              </button>

              {onViewDetails && (
                <button
                  ref={
                    detailsFocusExerciseId === exercise.id
                      ? detailsTriggerRef
                      : undefined
                  }
                  type="button"
                  onClick={() => onViewDetails(exercise)}
                  className="flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-r-xl border-l border-border px-3 text-sm font-black text-text-secondary transition-colors hover:bg-action-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
                  aria-label={`View details for ${exercise.name}`}
                  data-exercise-details-trigger={exercise.id}
                >
                  Info
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ExerciseSelect({
  exercises,
  onValidityChange,
  onViewDetails,
  detailsFocusExerciseId,
  detailsTriggerRef,
  searchQuery,
  onSearchQueryChange,
  selectedExerciseId,
  onSelectedExerciseIdChange,
  customName,
  onCustomNameChange,
}: ExerciseSelectProps) {
  const searchId = useId();
  const customNameId = useId();
  const favoritesHeadingId = useId();
  const recentHeadingId = useId();
  const allHeadingId = useId();
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const [internalSelectedExerciseId, setInternalSelectedExerciseId] =
    useState("");
  const [internalCustomName, setInternalCustomName] = useState("");
  const query = searchQuery ?? internalSearchQuery;
  const selectedId = selectedExerciseId ?? internalSelectedExerciseId;
  const customValue = customName ?? internalCustomName;

  const selectedExercise = exercises.find(
    (exercise) => exercise.id === selectedId,
  );

  const hasValidSelection = Boolean(
    selectedId || customValue.trim().length > 0,
  );

  function updateSelectedExercise(exerciseId: string) {
    if (selectedExerciseId === undefined) {
      setInternalSelectedExerciseId(exerciseId);
    }
    onSelectedExerciseIdChange?.(exerciseId);
    onValidityChange?.(Boolean(exerciseId || customValue.trim().length > 0));
  }

  function updateCustomName(name: string) {
    if (customName === undefined) {
      setInternalCustomName(name);
    }
    onCustomNameChange?.(name);
    onValidityChange?.(Boolean(selectedId || name.trim().length > 0));
  }

  function updateSearchQuery(nextQuery: string) {
    if (searchQuery === undefined) {
      setInternalSearchQuery(nextQuery);
    }
    onSearchQueryChange?.(nextQuery);
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
      <input type="hidden" name="exerciseId" value={selectedId} />

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
            onChange={(event) => updateSearchQuery(event.target.value)}
            placeholder="Name, muscle, or equipment"
            autoComplete="off"
            enterKeyHint="search"
            className="mt-1 min-h-12 w-full rounded-xl border border-border bg-canvas/60 px-3 py-3 text-text-primary outline-none transition-colors placeholder:text-text-muted focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/25"
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
                selectedExerciseId={selectedId}
                onSelect={updateSelectedExercise}
                onViewDetails={onViewDetails}
                detailsFocusExerciseId={detailsFocusExerciseId}
                detailsTriggerRef={detailsTriggerRef}
              />
              <ExerciseSection
                heading="Recently used"
                headingId={recentHeadingId}
                exercises={sections.recentlyUsed}
                selectedExerciseId={selectedId}
                onSelect={updateSelectedExercise}
                onViewDetails={onViewDetails}
                detailsFocusExerciseId={detailsFocusExerciseId}
                detailsTriggerRef={detailsTriggerRef}
              />
              <ExerciseSection
                heading="All exercises"
                headingId={allHeadingId}
                exercises={sections.allExercises}
                selectedExerciseId={selectedId}
                onSelect={updateSelectedExercise}
                onViewDetails={onViewDetails}
                detailsFocusExerciseId={detailsFocusExerciseId}
                detailsTriggerRef={detailsTriggerRef}
              />
            </>
          )}
        </div>
      </div>

      {selectedExercise && (
        <div className="rounded-2xl border border-border-strong bg-surface-elevated p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="break-words text-sm font-black text-text-primary">
                Selected: {selectedExercise.name}
              </p>
              <p className="mt-1 break-words text-xs leading-5 text-text-secondary">
                {selectedExercise.equipment || "No equipment"} ·{" "}
                {selectedExercise.primaryMuscles.join(", ") ||
                  "No muscles listed"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => updateSelectedExercise("")}
              className="min-h-11 shrink-0 rounded-lg px-3 py-1 text-xs font-bold text-text-secondary hover:bg-action-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
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
          value={customValue}
          onChange={(event) => updateCustomName(event.target.value)}
          placeholder="Use this if the movement is not listed"
          autoComplete="off"
          enterKeyHint="done"
          className="mt-1 min-h-12 w-full rounded-xl border border-border bg-canvas/60 px-3 py-3 text-text-primary outline-none transition-colors placeholder:text-text-muted focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/25"
        />
      </div>

      {!hasValidSelection && (
        <p className="rounded-xl border border-info/20 bg-info-soft px-3 py-2 text-xs font-bold leading-5 text-info">
          Select an exercise or type a custom exercise name before adding.
        </p>
      )}
    </div>
  );
}
