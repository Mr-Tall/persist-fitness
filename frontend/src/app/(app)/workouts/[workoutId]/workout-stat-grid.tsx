type WorkoutStatGridProps = {
  completedExercises: number;
  totalExercises: number;
  totalSets: number;
  totalVolume: string;
  personalRecordCount: number;
  estimatedDuration: string;
};

export function WorkoutStatGrid({
  completedExercises,
  totalExercises,
  totalSets,
  totalVolume,
  personalRecordCount,
  estimatedDuration,
}: WorkoutStatGridProps) {
  const metrics = [
    { label: "Total volume", value: totalVolume, title: totalVolume },
    {
      label: "Exercises completed",
      value: `${completedExercises} / ${totalExercises}`,
    },
    { label: "Sets logged", value: totalSets },
    { label: "PRs earned", value: personalRecordCount },
    { label: "Estimated duration", value: estimatedDuration },
  ];

  return (
    <dl
      role="group"
      aria-label="Workout summary"
      className="grid min-w-0 grid-cols-2 overflow-hidden rounded-2xl border border-border bg-black/25 sm:grid-cols-5"
    >
      {metrics.map((metric) => (
        <div
          className="min-w-0 border-b border-r border-border px-2 py-2.5 text-center last:col-span-2 sm:border-b-0 sm:last:col-span-1 sm:last:border-r-0"
          key={metric.label}
        >
          <dt className="text-[10px] font-bold uppercase tracking-[0.11em] text-text-muted">
            {metric.label}
          </dt>
          <dd
            className="mt-0.5 break-words text-base font-black text-text-primary sm:text-lg"
            title={metric.title}
          >
            {metric.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
