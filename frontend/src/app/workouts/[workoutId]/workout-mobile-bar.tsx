import { Card } from "@/components/ui/card";

type WorkoutMobileBarProps = {
  totalSets: number;
  totalVolume: string;
  isCompleted: boolean;
};

export function WorkoutMobileBar({
  totalSets,
  totalVolume,
  isCompleted,
}: WorkoutMobileBarProps) {
  return (
    <Card className="fixed bottom-20 left-4 right-4 z-40 rounded-3xl bg-black/80 p-3 shadow-[0_20px_80px_rgba(0,0,0,0.55)] md:hidden">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">
            Sets
          </p>
          <p className="mt-1 text-sm font-black text-white">{totalSets}</p>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">
            Volume
          </p>
          <p className="mt-1 text-sm font-black text-white">{totalVolume}</p>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">
            Status
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {isCompleted ? "Done" : "Active"}
          </p>
        </div>
      </div>
    </Card>
  );
}