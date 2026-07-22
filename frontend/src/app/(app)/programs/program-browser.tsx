"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type ProgramBrowserItem = {
  category: string;
  description: string | null;
  difficulty: string;
  estimatedWeeks: number;
  id: string;
  isCurrent: boolean;
  name: string;
  workoutCount: number;
};

const difficulties = ["Beginner", "Intermediate", "Advanced"];
const categories = [
  "Strength",
  "Hypertrophy",
  "Powerlifting",
  "Athletic",
  "General Fitness",
];

export function ProgramBrowser({ programs }: { programs: ProgramBrowserItem[] }) {
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const visiblePrograms = useMemo(
    () =>
      programs.filter(
        (program) =>
          (!difficulty || program.difficulty === difficulty) &&
          (!category || program.category === category),
      ),
    [category, difficulty, programs],
  );

  return (
    <div className="space-y-6">
      <section aria-label="Filter training programs" className="rounded-2xl border border-border bg-surface p-3 sm:p-4">
        <div aria-label="Difficulty" role="group">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-text-muted">
            Difficulty
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {difficulties.map((value) => (
              <button
                aria-pressed={difficulty === value}
                className={`min-h-11 rounded-full border px-3 py-2 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                  difficulty === value
                    ? "border-border-strong bg-action text-action-foreground"
                    : "border-border bg-action-secondary text-text-secondary"
                }`}
                key={value}
                onClick={() => setDifficulty((current) => (current === value ? null : value))}
                type="button"
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div aria-label="Category" className="mt-4" role="group">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-text-muted">
            Category
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map((value) => (
              <button
                aria-pressed={category === value}
                className={`min-h-11 rounded-full border px-3 py-2 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                  category === value
                    ? "border-border-strong bg-action text-action-foreground"
                    : "border-border bg-action-secondary text-text-secondary"
                }`}
                key={value}
                onClick={() => setCategory((current) => (current === value ? null : value))}
                type="button"
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </section>

      {visiblePrograms.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border p-7 text-center" role="status">
          <h2 className="text-lg font-black text-text-primary">No programs match</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Try another difficulty or training category.
          </p>
        </section>
      ) : (
        <ul aria-label="Training programs" className="grid gap-3 md:grid-cols-2">
          {visiblePrograms.map((program) => (
            <li key={program.id}>
              <article className="h-full rounded-2xl border border-border bg-surface p-4 sm:p-5">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words text-lg font-black text-text-primary">
                      {program.name}
                    </h2>
                    <p className="mt-1 text-xs font-bold text-text-secondary">
                      {program.difficulty} · {program.category}
                    </p>
                  </div>
                  {program.isCurrent && (
                    <span className="shrink-0 rounded-full border border-info/30 bg-info-soft px-2.5 py-1 text-[11px] font-black text-info">
                      Current
                    </span>
                  )}
                </div>

                {program.description && (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-text-secondary">
                    {program.description}
                  </p>
                )}

                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-black/20 p-3">
                    <dt className="font-bold text-text-muted">Duration</dt>
                    <dd className="mt-1 font-black text-text-primary">
                      {program.estimatedWeeks} weeks
                    </dd>
                  </div>
                  <div className="rounded-xl bg-black/20 p-3">
                    <dt className="font-bold text-text-muted">Schedule</dt>
                    <dd className="mt-1 font-black text-text-primary">
                      {program.workoutCount} workouts
                    </dd>
                  </div>
                </dl>

                <Link
                  aria-label={`View ${program.name} program`}
                  className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-action px-4 py-3 text-sm font-black text-action-foreground hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  href={`/programs/${program.id}`}
                >
                  View program
                </Link>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
