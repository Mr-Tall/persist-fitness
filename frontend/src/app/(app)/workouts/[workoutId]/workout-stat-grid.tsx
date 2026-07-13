type WorkoutStatGridProps = {
  exerciseCount: number;
  totalSets: number;
  totalVolume: string;
};

export function WorkoutStatGrid({
  exerciseCount,
  totalSets,
  totalVolume,
}: WorkoutStatGridProps) {
  return (
    <dl
      role="group"
      aria-label="Workout momentum"
      className="grid min-w-0 grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-black/25"
    >
      <div className="min-w-0 px-2 py-2.5 text-center sm:px-4 sm:py-3">
        <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500 sm:text-xs">
          Exercises
        </dt>
        <dd className="mt-0.5 text-lg font-black text-white sm:text-xl">
          {exerciseCount}
        </dd>
      </div>

      <div className="min-w-0 px-2 py-2.5 text-center sm:px-4 sm:py-3">
        <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500 sm:text-xs">
          Sets
        </dt>
        <dd className="mt-0.5 text-lg font-black text-white sm:text-xl">
          {totalSets}
        </dd>
      </div>

      <div className="min-w-0 px-2 py-2.5 text-center sm:px-4 sm:py-3">
        <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500 sm:text-xs">
          Volume
        </dt>
        <dd
          title={totalVolume}
          className="mt-0.5 truncate text-base font-black text-white sm:text-xl"
        >
          {totalVolume}
        </dd>
      </div>
    </dl>
  );
}
