"use client";

import { useId, useState, useSyncExternalStore, type ReactNode } from "react";

const AUTO_COLLAPSE_KEY = "persist-fitness:auto-collapse-completed-exercises";
const AUTO_COLLAPSE_EVENT = "persist-fitness:auto-collapse-change";

export type WorkoutExerciseAccordionItem = {
  id: string;
  name: string;
  setCount: number;
  latestResult: string | null;
  hasPersonalRecord: boolean;
  content: ReactNode;
};

type ExerciseSelection = {
  expandedIds: string[];
  itemIds: string[];
  currentId: string | null;
};

export type ExerciseStatus = "completed" | "in-progress" | "not-started";

export function getExerciseStatus(
  item: Pick<WorkoutExerciseAccordionItem, "setCount">,
  isCurrent: boolean,
): ExerciseStatus {
  if (item.setCount > 0) {
    return "completed";
  }

  return isCurrent ? "in-progress" : "not-started";
}

function subscribeToAutoCollapse(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(AUTO_COLLAPSE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(AUTO_COLLAPSE_EVENT, callback);
  };
}

function getAutoCollapsePreference() {
  return window.localStorage.getItem(AUTO_COLLAPSE_KEY) !== "false";
}

function useAutoCollapsePreference() {
  const enabled = useSyncExternalStore(
    subscribeToAutoCollapse,
    getAutoCollapsePreference,
    () => true,
  );

  function setEnabled(nextEnabled: boolean) {
    window.localStorage.setItem(AUTO_COLLAPSE_KEY, String(nextEnabled));
    window.dispatchEvent(new Event(AUTO_COLLAPSE_EVENT));
  }

  return [enabled, setEnabled] as const;
}

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
  status,
}: {
  item: WorkoutExerciseAccordionItem;
  isCurrent?: boolean;
  status: ExerciseStatus;
}) {
  const statusLabel =
    status === "completed"
      ? "Completed"
      : status === "in-progress"
        ? "In progress"
        : "Not started";
  const statusClassName =
    status === "completed"
      ? "border-success/30 bg-success-soft text-success"
      : status === "in-progress"
        ? "border-info/30 bg-info-soft text-info"
        : "border-border bg-action-secondary text-text-muted";

  return (
    <span className="flex min-h-12 min-w-0 flex-1 items-center gap-3 text-left">
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="min-w-0 break-words text-base font-black text-white">
            {item.name}
          </span>
          {isCurrent && (
            <span className="shrink-0 rounded-full bg-action px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-action-foreground">
              Current
            </span>
          )}
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] ${statusClassName}`}
          >
            {statusLabel}
          </span>
          {item.hasPersonalRecord && (
            <span className="shrink-0 rounded-full border border-success/30 bg-success-soft px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-success">
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
  const [autoCollapse, setAutoCollapse] = useAutoCollapsePreference();
  const itemIds = items.map((item) => item.id);
  const [selection, setSelection] = useState<ExerciseSelection>(() => {
    const currentId = selectDefaultExercise(items);
    return {
      expandedIds: currentId ? [currentId] : [],
      itemIds,
      currentId,
    };
  });

  let currentId = selection.currentId;
  if (!sameIds(selection.itemIds, itemIds)) {
    currentId = reconcileCurrentExercise(selection.itemIds, selection.currentId, items);
    const survivingExpandedIds = selection.expandedIds.filter((id) =>
      itemIds.includes(id),
    );
    setSelection({
      expandedIds: autoCollapse
        ? currentId
          ? [currentId]
          : []
        : Array.from(
            new Set([
              ...survivingExpandedIds,
              ...(currentId ? [currentId] : []),
            ]),
          ),
      itemIds,
      currentId,
    });
  }

  if (isCompleted) {
    return (
      <div className="space-y-3">
        {items.map((item) => (
          <details
            key={item.id}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-black/20"
          >
            <summary className="flex min-h-12 cursor-pointer list-none items-center px-4 py-2 outline-none transition-colors hover:bg-action-secondary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus motion-reduce:transition-none [&::-webkit-details-marker]:hidden">
              <h3 className="flex min-w-0 flex-1">
                <ExerciseSummary
                  item={item}
                  status={item.setCount > 0 ? "completed" : "not-started"}
                />
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
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-3 py-2">
        <div>
          <p className="text-xs font-black text-text-primary">Auto-collapse completed</p>
          <p className="text-[11px] text-text-muted">Saved on this device</p>
        </div>
        <button
          aria-checked={autoCollapse}
          className={`relative min-h-11 min-w-16 rounded-full border px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
            autoCollapse
              ? "border-border-strong bg-action-secondary"
              : "border-border bg-action-secondary"
          }`}
          onClick={() => {
            const nextEnabled = !autoCollapse;
            setAutoCollapse(nextEnabled);
            if (nextEnabled) {
              setSelection((current) => ({
                ...current,
                expandedIds: current.currentId ? [current.currentId] : [],
              }));
            }
          }}
          role="switch"
          type="button"
        >
          <span className="sr-only">Auto-collapse completed exercises</span>
          <span
            aria-hidden="true"
            className={`block h-7 w-7 rounded-full bg-text-primary transition-transform motion-reduce:transition-none ${
              autoCollapse ? "translate-x-7" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {items.map((item) => {
        const isCurrent = item.id === currentId;
        const isExpanded = selection.expandedIds.includes(item.id);
        const status = getExerciseStatus(item, isCurrent);
        const buttonId = `${idPrefix}-${item.id}-button`;
        const regionId = `${idPrefix}-${item.id}-region`;

        return (
          <article
            key={item.id}
            className={`rounded-2xl border transition-colors duration-200 motion-reduce:transition-none ${
              isCurrent
                ? "border-border-strong bg-surface-elevated"
                : "border-white/10 bg-black/20"
            }`}
          >
            <h3
              className={
                isCurrent
                  ? "sticky top-0 z-20 bg-surface-elevated md:static"
                  : ""
              }
            >
              <button
                id={buttonId}
                type="button"
                aria-expanded={isExpanded}
                aria-controls={regionId}
                onClick={() =>
                  setSelection((current) => {
                    const isAlreadyExpanded = current.expandedIds.includes(item.id);
                    return {
                      ...current,
                      currentId: item.id,
                      expandedIds: autoCollapse
                        ? [item.id]
                        : isAlreadyExpanded
                          ? current.expandedIds.filter((id) => id !== item.id)
                          : [...current.expandedIds, item.id],
                    };
                  })
                }
                className="flex min-h-12 w-full min-w-0 items-center px-4 py-2 outline-none transition-colors hover:bg-action-secondary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus motion-reduce:transition-none"
              >
                <ExerciseSummary item={item} isCurrent={isCurrent} status={status} />
              </button>
            </h3>

            {isExpanded && (
              <div
                id={regionId}
                role="region"
                aria-labelledby={buttonId}
                className="border-t border-border"
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
