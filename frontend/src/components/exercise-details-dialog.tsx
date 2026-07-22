"use client";

import { AccessibleDialog } from "@/components/ui/accessible-dialog";
import { useId, type RefObject } from "react";

import type { ExerciseLibraryOption } from "./exercise-select";

type ExerciseDetailsDialogProps = {
  exercise: ExerciseLibraryOption | null;
  onClose: () => void;
  restoreFocusRef?: RefObject<HTMLElement | null>;
};

type MetadataItem = {
  label: string;
  value: string | null | undefined;
};

function formatMetadata(value: string) {
  return value.replaceAll("_", " ");
}

function MetadataChips({
  headingId,
  items,
}: {
  headingId: string;
  items: MetadataItem[];
}) {
  const populatedItems = items.filter(
    (item): item is MetadataItem & { value: string } => Boolean(item.value),
  );

  if (populatedItems.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={headingId}>
      <h3
        id={headingId}
        className="text-xs font-black uppercase tracking-[0.16em] text-neutral-400"
      >
        Overview
      </h3>
      <dl className="mt-3 flex flex-wrap gap-2">
        {populatedItems.map((item) => (
          <div
            key={item.label}
            className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2"
          >
            <dt className="sr-only">{item.label}</dt>
            <dd className="text-xs font-bold capitalize text-neutral-200">
              <span className="text-neutral-500" aria-hidden="true">
                {item.label}: {" "}
              </span>
              {formatMetadata(item.value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function TextList({
  heading,
  items,
  ordered = false,
}: {
  heading: string;
  items: string[] | undefined;
  ordered?: boolean;
}) {
  if (!items || items.length === 0) {
    return null;
  }

  const List = ordered ? "ol" : "ul";

  return (
    <section>
      <h3 className="text-sm font-black text-white">{heading}</h3>
      <List
        className={`mt-3 space-y-3 text-sm leading-6 text-neutral-300 ${
          ordered ? "list-decimal pl-5 marker:font-black marker:text-text-primary" : ""
        }`}
      >
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className={
              ordered
                ? "pl-1"
                : "rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2"
            }
          >
            {item}
          </li>
        ))}
      </List>
    </section>
  );
}

export function ExerciseDetailsDialog({
  exercise,
  onClose,
  restoreFocusRef,
}: ExerciseDetailsDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const overviewHeadingId = useId();
  const musclesHeadingId = useId();
  const aliasesHeadingId = useId();

  const primaryMuscles = exercise?.primaryMuscles ?? [];
  const secondaryMuscles = exercise?.secondaryMuscles ?? [];
  const thumbnailUrl = exercise?.thumbnailUrl ?? exercise?.images?.[0];

  return (
    <AccessibleDialog
      descriptionId={descriptionId}
      initialFocusSelector="[data-exercise-details-close]"
      onClose={onClose}
      open={Boolean(exercise)}
      panelClassName="md:max-w-2xl"
      restoreFocusRef={restoreFocusRef}
      titleId={titleId}
    >
      {exercise && (
        <>
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-5">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-text-secondary">
                Exercise library
              </p>
              <h2
                id={titleId}
                className="mt-1 break-words text-xl font-black text-white sm:text-2xl"
              >
                {exercise.name}
              </h2>
              <p id={descriptionId} className="mt-1 text-sm text-neutral-400">
                Movement details and coaching guidance.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              data-exercise-details-close
              className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-border bg-action-secondary text-lg font-bold text-text-secondary transition-colors hover:border-border-strong hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              aria-label={`Close ${exercise.name} details`}
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-5">
            {thumbnailUrl && (
              <div
                aria-label={`${exercise.name} thumbnail`}
                className="aspect-[16/9] w-full rounded-2xl border border-white/10 bg-neutral-900 bg-cover bg-center"
                role="img"
                style={{ backgroundImage: `url(${JSON.stringify(thumbnailUrl)})` }}
              />
            )}

            <MetadataChips
              headingId={overviewHeadingId}
              items={[
                { label: "Type", value: exercise.exerciseType ?? exercise.mechanic },
                { label: "Equipment", value: exercise.equipment },
                { label: "Movement", value: exercise.movementPattern ?? exercise.force },
                { label: "Difficulty", value: exercise.level },
                { label: "Laterality", value: exercise.laterality },
                { label: "Tracking", value: exercise.trackingType },
              ]}
            />

            {(primaryMuscles.length > 0 || secondaryMuscles.length > 0) && (
              <section aria-labelledby={musclesHeadingId}>
                <h3 id={musclesHeadingId} className="text-sm font-black text-white">
                  Muscles
                </h3>
                <dl className="mt-3 space-y-3 text-sm">
                  {primaryMuscles.length > 0 && (
                    <div>
                      <dt className="font-bold text-neutral-400">Primary</dt>
                      <dd className="mt-1 flex flex-wrap gap-2">
                        {primaryMuscles.map((muscle) => (
                          <span
                            key={muscle}
                            className="rounded-full border border-border-strong bg-action-secondary px-3 py-1.5 font-bold text-text-primary"
                          >
                            {muscle}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                  {secondaryMuscles.length > 0 && (
                    <div>
                      <dt className="font-bold text-neutral-400">Secondary</dt>
                      <dd className="mt-1 flex flex-wrap gap-2">
                        {secondaryMuscles.map((muscle) => (
                          <span
                            key={muscle}
                            className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 font-bold text-neutral-300"
                          >
                            {muscle}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>
              </section>
            )}

            <TextList heading="Instructions" items={exercise.instructions} ordered />
            <TextList heading="Tips" items={exercise.tips} />

            {exercise.aliases && exercise.aliases.length > 0 && (
              <section aria-labelledby={aliasesHeadingId}>
                <h3 id={aliasesHeadingId} className="text-sm font-black text-white">
                  Also known as
                </h3>
                <p className="mt-2 text-sm leading-6 text-neutral-300">
                  {exercise.aliases.join(", ")}
                </p>
              </section>
            )}
          </div>
        </>
      )}
    </AccessibleDialog>
  );
}
