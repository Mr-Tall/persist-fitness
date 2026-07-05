import { Card } from "@/components/ui/card";

type WorkoutStatGridProps = {
  exerciseCount: number;
  totalSets: number;
  totalVolume: string;
  isCompleted: boolean;
};

export function WorkoutStatGrid({
  exerciseCount,
  totalSets,
  totalVolume,
  isCompleted,
}: WorkoutStatGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:min-w-[420px] sm:grid-cols-4">
      <Card className="rounded-2xl bg-black/25 p-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
          Exercises
        </p>
        <p className="mt-1 text-2xl font-black text-white">{exerciseCount}</p>
      </Card>

      <Card className="rounded-2xl bg-black/25 p-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
          Sets
        </p>
        <p className="mt-1 text-2xl font-black text-white">{totalSets}</p>
      </Card>

      <Card className="rounded-2xl bg-black/25 p-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
          Volume
        </p>
        <p className="mt-1 text-xl font-black text-white">{totalVolume}</p>
      </Card>

      <Card className="rounded-2xl bg-black/25 p-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
          Status
        </p>
        <p className="mt-1 text-xl font-black text-white">
          {isCompleted ? "Done" : "Active"}
        </p>
      </Card>
    </div>
  );
}