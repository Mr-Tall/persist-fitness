"use client";

import { ExerciseDetailsDialog } from "@/components/exercise-details-dialog";
import type { ExerciseLibraryOption } from "@/components/exercise-select";
import type { ExerciseLibraryCardData } from "@/lib/exercise-library-data";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { FavoriteExerciseButton } from "./favorite-exercise-button";
import {
  getTrackingTypeLabel,
  normalizeTrackingType,
} from "@/lib/exercise-tracking";

type FilterKey = "equipment" | "exerciseType" | "mechanic" | "movement" | "muscle";
type ActiveFilters = Record<FilterKey, string[]>;

const emptyFilters: ActiveFilters = {
  equipment: [],
  exerciseType: [],
  mechanic: [],
  movement: [],
  muscle: [],
};

function unique(values: (string | null | undefined)[]) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))))
    .sort((left, right) => left.localeCompare(right));
}

function matchesFilters(exercise: ExerciseLibraryCardData, filters: ActiveFilters) {
  const values: Record<FilterKey, string[]> = {
    equipment: exercise.equipment ? [exercise.equipment] : [],
    exerciseType: exercise.exerciseType ? [exercise.exerciseType] : [],
    mechanic: exercise.mechanic ? [exercise.mechanic] : [],
    movement: exercise.movementPattern ? [exercise.movementPattern] : [],
    muscle: [...exercise.primaryMuscles, ...exercise.secondaryMuscles],
  };

  return (Object.keys(filters) as FilterKey[]).every(
    (key) =>
      filters[key].length === 0 ||
      filters[key].some((filter) => values[key].includes(filter)),
  );
}

function matchesSearch(exercise: ExerciseLibraryCardData, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return [
    exercise.name,
    exercise.equipment,
    exercise.movementPattern,
    exercise.exerciseType,
    exercise.mechanic,
    ...exercise.primaryMuscles,
    ...exercise.secondaryMuscles,
    ...exercise.aliases,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}

function ExerciseCard({
  exercise,
  onViewDetails,
}: {
  exercise: ExerciseLibraryCardData;
  onViewDetails: (exercise: ExerciseLibraryCardData, trigger: HTMLButtonElement) => void;
}) {
  const metadata = unique([
    exercise.primaryMuscles[0],
    exercise.equipment,
    exercise.movementPattern,
    exercise.exerciseType ?? exercise.mechanic,
    getTrackingTypeLabel(exercise.trackingType),
  ]);

  return (
    <article className="rounded-2xl border border-border bg-surface p-4 shadow-sm transition-colors hover:border-border-strong motion-reduce:transition-none">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            href={`/exercises/${exercise.id}`}
          >
            <h3 className="break-words text-base font-black text-text-primary">
              {exercise.name}
            </h3>
          </Link>
          {metadata.length > 0 && (
            <ul aria-label={`${exercise.name} metadata`} className="mt-2 flex flex-wrap gap-1.5">
              {metadata.map((value) => (
                <li
                  className="rounded-full border border-border bg-action-secondary px-2.5 py-1 text-[11px] font-bold capitalize text-text-secondary"
                  key={value}
                >
                  {value.replaceAll("_", " ")}
                </li>
              ))}
            </ul>
          )}
        </div>

        <FavoriteExerciseButton
          exerciseId={exercise.id}
          exerciseName={exercise.name}
          isFavorite={exercise.isFavorite}
        />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl border border-border bg-black/20 p-2.5">
          <dt className="font-bold text-text-muted">Last performed</dt>
          <dd className="mt-1 min-w-0 break-words font-bold text-text-primary">
            {exercise.lastPerformed ? (
              <Link
                className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                href={exercise.lastPerformed.workoutHref}
                aria-label={`View ${exercise.name} workout from ${exercise.lastPerformed.dateLabel}`}
              >
                {exercise.lastPerformed.dateLabel}
              </Link>
            ) : (
              "Not logged yet"
            )}
          </dd>
        </div>
        <div className="rounded-xl border border-border bg-black/20 p-2.5">
          <dt className="font-bold text-text-muted">Personal record</dt>
          <dd className="mt-1 break-words font-bold text-text-primary">
            {exercise.personalRecord ? (
              <Link
                className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                href={exercise.personalRecord.workoutHref}
                aria-label={`View ${exercise.name} personal record workout`}
              >
                {exercise.personalRecord.label}
              </Link>
            ) : (
              normalizeTrackingType(exercise.trackingType) === "weight_reps"
                ? "No weighted PR"
                : "No record yet"
            )}
          </dd>
        </div>
      </dl>

      {exercise.lastPerformance && (
        <p className="mt-2 break-words text-xs leading-5 text-text-secondary">
          <span className="font-bold text-text-muted">Last performance:</span>{" "}
          {exercise.lastPerformance}
        </p>
      )}

      {exercise.relatedExercises.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">
            Related exercises
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {exercise.relatedExercises.map((related) => (
              <Link
                className="min-h-11 rounded-lg px-2 py-2 text-xs font-bold text-text-secondary hover:bg-action-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                href={`/exercises/${related.id}`}
                key={related.id}
              >
                {related.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex justify-end border-t border-border pt-3">
        <button
          className="min-h-11 rounded-xl border border-border px-3 py-2 text-xs font-black text-text-secondary hover:bg-action-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          onClick={(event) => onViewDetails(exercise, event.currentTarget)}
          type="button"
          aria-label={`View details for ${exercise.name}`}
        >
          View details
        </button>
      </div>
    </article>
  );
}

function ExerciseSection({
  exercises,
  title,
  onViewDetails,
}: {
  exercises: ExerciseLibraryCardData[];
  title: string;
  onViewDetails: (exercise: ExerciseLibraryCardData, trigger: HTMLButtonElement) => void;
}) {
  if (exercises.length === 0) return null;

  const headingId = `exercise-section-${title.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <section aria-labelledby={headingId}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={headingId} className="text-lg font-black text-text-primary">
          {title}
        </h2>
        <p className="text-xs font-bold text-text-muted">
          {exercises.length} {exercises.length === 1 ? "exercise" : "exercises"}
        </p>
      </div>
      <ul className="mt-3 grid gap-3 md:grid-cols-2">
        {exercises.map((exercise) => (
          <li key={exercise.id}>
            <ExerciseCard exercise={exercise} onViewDetails={onViewDetails} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ExerciseLibraryBrowser({
  exercises,
}: {
  exercises: ExerciseLibraryCardData[];
}) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ActiveFilters>(emptyFilters);
  const [detailsExercise, setDetailsExercise] =
    useState<ExerciseLibraryCardData | null>(null);
  const detailsTriggerRef = useRef<HTMLButtonElement>(null);

  const filterGroups = useMemo(
    () => [
      {
        key: "muscle" as const,
        label: "Muscle",
        values: unique(exercises.flatMap((exercise) => [
          ...exercise.primaryMuscles,
          ...exercise.secondaryMuscles,
        ])),
      },
      {
        key: "equipment" as const,
        label: "Equipment",
        values: unique(exercises.map((exercise) => exercise.equipment)),
      },
      {
        key: "movement" as const,
        label: "Movement pattern",
        values: unique(exercises.map((exercise) => exercise.movementPattern)),
      },
      {
        key: "exerciseType" as const,
        label: "Exercise type",
        values: unique(exercises.map((exercise) => exercise.exerciseType)),
      },
      {
        key: "mechanic" as const,
        label: "Compound or isolation",
        values: unique(
          exercises
            .map((exercise) => exercise.mechanic)
            .filter((value) => value && ["compound", "isolation"].includes(value.toLowerCase())),
        ),
      },
    ],
    [exercises],
  );

  const activeFilterCount = Object.values(filters).reduce(
    (total, values) => total + values.length,
    0,
  );
  const sections = useMemo(() => {
    const matches = exercises.filter(
      (exercise) => matchesSearch(exercise, query) && matchesFilters(exercise, filters),
    );
    const favorites = matches.filter((exercise) => exercise.isFavorite);
    const recent = matches.filter(
      (exercise) => exercise.isRecentlyUsed && !exercise.isFavorite,
    );
    const recommendations = matches.filter(
      (exercise) =>
        exercise.isRecommended && !exercise.isFavorite && !exercise.isRecentlyUsed,
    );
    const assigned = new Set(
      [...favorites, ...recent, ...recommendations].map((exercise) => exercise.id),
    );
    const remaining = matches.filter((exercise) => !assigned.has(exercise.id));
    return { favorites, recent, recommendations, remaining, count: matches.length };
  }, [exercises, filters, query]);

  function viewDetails(exercise: ExerciseLibraryCardData, trigger: HTMLButtonElement) {
    detailsTriggerRef.current = trigger;
    setDetailsExercise(exercise);
  }

  return (
    <div className="space-y-6">
      <section aria-label="Search and filter exercises" className="rounded-2xl border border-border bg-surface p-3 sm:p-4">
        <label className="text-xs font-black uppercase tracking-[0.14em] text-text-muted" htmlFor="exercise-library-search">
          Search exercises
        </label>
        <input
          autoComplete="off"
          className="mt-1 min-h-12 w-full rounded-xl border border-border bg-canvas px-3 py-3 text-text-primary outline-none placeholder:text-text-muted focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/25"
          enterKeyHint="search"
          id="exercise-library-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name, muscle, equipment, or alias"
          type="search"
          value={query}
        />

        <details className="mt-3 rounded-xl border border-border bg-black/20">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between rounded-xl px-3 py-2 text-sm font-black text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-focus [&::-webkit-details-marker]:hidden">
            <span>Filter exercises</span>
            <span className="text-xs font-bold text-text-muted">
              {activeFilterCount === 0 ? "All" : `${activeFilterCount} active`}
            </span>
          </summary>
          <div className="space-y-4 border-t border-border p-3">
            {filterGroups.map((group) =>
              group.values.length > 0 ? (
                <div aria-label={group.label} key={group.key} role="group">
                  <p className="text-xs font-bold text-text-muted">{group.label}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {group.values.map((value) => {
                      const isActive = filters[group.key].includes(value);
                      return (
                        <button
                          aria-pressed={isActive}
                          className={`min-h-11 rounded-full border px-3 py-2 text-xs font-bold capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                            isActive
                              ? "border-border-strong bg-action text-action-foreground"
                              : "border-border bg-action-secondary text-text-secondary hover:text-text-primary"
                          }`}
                          key={value}
                          onClick={() =>
                            setFilters((current) => ({
                              ...current,
                              [group.key]: isActive
                                ? current[group.key].filter((filter) => filter !== value)
                                : [...current[group.key], value],
                            }))
                          }
                          type="button"
                        >
                          {value.replaceAll("_", " ")}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null,
            )}
            {activeFilterCount > 0 && (
              <button
                className="min-h-11 rounded-xl px-3 py-2 text-xs font-black text-text-secondary hover:bg-action-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                onClick={() => setFilters(emptyFilters)}
                type="button"
              >
                Clear filters
              </button>
            )}
          </div>
        </details>
      </section>

      <p aria-live="polite" className="sr-only">
        {sections.count} exercise {sections.count === 1 ? "result" : "results"}
      </p>

      {sections.count === 0 ? (
        <section className="rounded-2xl border border-dashed border-border p-6 text-center" role="status">
          <h2 className="text-lg font-black text-text-primary">No exercises match</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Try a broader search or remove one of the active filters.
          </p>
        </section>
      ) : (
        <div className="space-y-8">
          <ExerciseSection exercises={sections.favorites} title="Favorites" onViewDetails={viewDetails} />
          <ExerciseSection exercises={sections.recent} title="Recently used" onViewDetails={viewDetails} />
          <ExerciseSection exercises={sections.recommendations} title="Recommendations" onViewDetails={viewDetails} />
          <ExerciseSection exercises={sections.remaining} title="All exercises" onViewDetails={viewDetails} />
        </div>
      )}

      <ExerciseDetailsDialog
        exercise={detailsExercise as ExerciseLibraryOption | null}
        onClose={() => setDetailsExercise(null)}
        restoreFocusRef={detailsTriggerRef}
      />
    </div>
  );
}
