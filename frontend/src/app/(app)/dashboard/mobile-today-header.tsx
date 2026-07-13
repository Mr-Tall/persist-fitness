type MobileTodayHeaderProps = {
  firstName: string;
  statusLabel: string;
};

export function MobileTodayHeader({
  firstName,
  statusLabel,
}: MobileTodayHeaderProps) {
  return (
    <header className="flex min-w-0 flex-col gap-3 px-1 pb-4 pt-1">
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
          Today
        </p>
        <h1 className="mt-1 line-clamp-2 break-words text-3xl font-black leading-tight tracking-tight text-white [overflow-wrap:anywhere]">
          Hey, {firstName}.
        </h1>
      </div>

      <span className="inline-flex max-w-full self-start rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-bold leading-4 text-emerald-200">
        {statusLabel}
      </span>
    </header>
  );
}
