type ExerciseProgressPoint = {
  label: string;
  estimatedOneRepMax: number;
  bestWeight: number;
  bestReps: number;
};

type ExerciseProgressChartProps = {
  points: ExerciseProgressPoint[];
};

function buildPath(values: number[], width: number, height: number) {
  if (values.length === 0) {
    return "";
  }

  if (values.length === 1) {
    const y = height / 2;
    return `M 0 ${y} L ${width} ${y}`;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

export function ExerciseProgressChart({ points }: ExerciseProgressChartProps) {
  const width = 640;
  const height = 180;

  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 p-6 text-center">
        <p className="font-medium">No chart data yet</p>
        <p className="mt-2 text-sm text-neutral-600">
          Log weighted sets for this exercise to see progress over time.
        </p>
      </div>
    );
  }

  const estimatedValues = points.map((point) => point.estimatedOneRepMax);
  const path = buildPath(estimatedValues, width, height);

  const latest = points[points.length - 1];
  const first = points[0];
  const change = latest.estimatedOneRepMax - first.estimatedOneRepMax;

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-xl font-semibold">Progress trend</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Estimated 1RM trend based on your best set each workout.
          </p>
        </div>

        <div className="rounded-2xl bg-neutral-50 px-4 py-3 text-sm">
          <p className="text-neutral-500">Change</p>
          <p className="mt-1 font-semibold text-neutral-950">
            {change >= 0 ? "+" : ""}
            {Math.round(change)} lb
          </p>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-48 min-w-[520px] w-full overflow-visible"
          role="img"
          aria-label="Estimated one rep max progress chart"
        >
          <line
            x1="0"
            y1={height}
            x2={width}
            y2={height}
            stroke="currentColor"
            className="text-neutral-200"
            strokeWidth="2"
          />

          <path
            d={path}
            fill="none"
            stroke="currentColor"
            className="text-info"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point, index) => {
            const min = Math.min(...estimatedValues);
            const max = Math.max(...estimatedValues);
            const range = max - min || 1;
            const x =
              points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
            const y =
              points.length === 1
                ? height / 2
                : height - ((point.estimatedOneRepMax - min) / range) * height;

            return (
              <g key={`${point.label}-${index}`}>
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill="currentColor"
                  className="text-info"
                />
                <text
                  x={x}
                  y={Math.max(14, y - 12)}
                  textAnchor="middle"
                  className="fill-neutral-600 text-[12px]"
                >
                  {Math.round(point.estimatedOneRepMax)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-2xl bg-neutral-50 p-3">
          <p className="text-xs text-neutral-500">First logged</p>
          <p className="mt-1 text-sm font-semibold">
            {Math.round(first.estimatedOneRepMax)} lb est. 1RM
          </p>
        </div>

        <div className="rounded-2xl bg-neutral-50 p-3">
          <p className="text-xs text-neutral-500">Latest</p>
          <p className="mt-1 text-sm font-semibold">
            {Math.round(latest.estimatedOneRepMax)} lb est. 1RM
          </p>
        </div>

        <div className="rounded-2xl bg-neutral-50 p-3">
          <p className="text-xs text-neutral-500">Latest best set</p>
          <p className="mt-1 text-sm font-semibold">
            {latest.bestWeight} lb × {latest.bestReps}
          </p>
        </div>
      </div>
    </div>
  );
}
