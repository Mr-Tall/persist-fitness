"use client";

import { useId, useState, type ReactNode } from "react";

export type WorkoutExerciseAccordionItem = {
  id: string;
  name: string;
  setCount: number;
  latestResult: string | null;
  hasPersonalRecord: boolean;
  content: ReactNode;
};

type ExerciseSelection = {
  itemIds: string[];
  currentId: string | null;
};

export function selectDefaultExercise(
  items: Pick<WorkoutExerciseAccordionItem, "id" | "setCount">[]
) {
  return items.find((item) => item.setCount === 0)?.id ?? items.at(-1)?.id ?? null;
}

export function reconcileCurrentExercise(
  previousIds: string[],
  currentId: string | null,
  items: Pick<WorkoutExerciseAccordionItem, "id" | "setCount">[]
) {
  const previousIdSet = new Set(previousIds);
  const newestAddedItem = items.filter((item) => !previousIdSet.has(item.id)).at(-1);
  if (newestAddedItem) {
    return newestAddedItem.id;
  }

  if (currentId && items.some((item) => item.id === currentId)) {
    return currentId;
  }

  if (currentId) {
    const previousIndex = previousIds.indexOf(currentId);
    if (previousIndex >= 0 && items.length > 0) {
      return items[Math.min(previousIndex, items.length - 1)].id;
    }
  }

  return selectDefaultExercise(items);
}

function sameIds(left: string[], right: string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

function ExerciseSummary({
  item,
  isCurrent = false,
}: {
  item: WorkoutExerciseAccordionItem;
  isCurrent?: boolean;
}) {
  return (
    <span className="flex min-h-12 min-w-0 flex-1 items-center gap-3 text-left">
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="min-w-0 break-words text-base font-black text-white">
            {item.name}
          </span>
          {isCurrent && (
            <span className="shrink-0 rounded-full bg-emerald-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-black">
              Current
            </span>
          )}
          {item.hasPersonalRecord && (
            <span className="shrink-0 rounded-full border border-amber-300/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-amber-200">
              PR
            </span>
          )}
        </span>

        <span className="mt-1 flex min-w-0 flex-wrap gap-x-2 gap-y-0.5 text-xs font-semibold text-neutral-400">
          <span>
            {item.setCount} {item.setCount === 1 ? "set" : "sets"}
          </span>
          {item.latestResult && (
            <>
              <span aria-hidden="true" className="text-neutral-600">
                ·
              </span>
              <span className="min-w-0 break-words">Latest {item.latestResult}</span>
            </>
          )}
        </span>
      </span>

      <span
        aria-hidden="true"
        className="shrink-0 text-sm text-neutral-500 group-open:rotate-45 motion-reduce:transform-none"
      >
        {isCurrent ? "−" : "+"}
      </span>
    </span>
  );
}

export function WorkoutExerciseAccordion({
  items,
  isCompleted,
}: {
  items: WorkoutExerciseAccordionItem[];
  isCompleted: boolean;
}) {
  const idPrefix = useId();
  const itemIds = items.map((item) => item.id);
  const [selection, setSelection] = useState<ExerciseSelection>(() => ({
    itemIds,
    currentId: selectDefaultExercise(items),
  }));

  let currentId = selection.currentId;
  if (!sameIds(selection.itemIds, itemIds)) {
    currentId = reconcileCurrentExercise(selection.itemIds, selection.currentId, items);
    setSelection({ itemIds, currentId });
  }

  if (isCompleted) {
    return (
      <div className="space-y-3">
        {items.map((item) => (
          <details
            key={item.id}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-black/20"
          >
            <summary className="flex min-h-12 cursor-pointer list-none items-center px-4 py-2 outline-none transition-colors hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-300/40 motion-reduce:transition-none [&::-webkit-details-marker]:hidden">
              <h3 className="flex min-w-0 flex-1">
                <ExerciseSummary item={item} />
              </h3>
            </summary>
            <div className="border-t border-white/10">{item.content}</div>
          </details>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isCurrent = item.id === currentId;
        const buttonId = `${idPrefix}-${item.id}-button`;
        const regionId = `${idPrefix}-${item.id}-region`;

        return (
          <article
            key={item.id}
            className={`overflow-hidden rounded-2xl border transition-colors duration-200 motion-reduce:transition-none ${
              isCurrent
                ? "border-emerald-300/35 bg-emerald-400/[0.05]"
                : "border-white/10 bg-black/20"
            }`}
          >
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isCurrent}
                aria-controls={regionId}
                onClick={() =>
                  setSelection((current) => ({ ...current, currentId: item.id }))
                }
                className="flex min-h-12 w-full min-w-0 items-center px-4 py-2 outline-none transition-colors hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-300/40 motion-reduce:transition-none"
              >
                <ExerciseSummary item={item} isCurrent={isCurrent} />
              </button>
            </h3>

            {isCurrent && (
              <div
                id={regionId}
                role="region"
                aria-labelledby={buttonId}
                className="border-t border-emerald-300/15"
              >
                {item.content}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
