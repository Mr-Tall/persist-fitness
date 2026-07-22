import Link from "next/link";

const premiumFeatures = [
  "AI weekly training report",
  "Plateau and fatigue detection",
  "Smart progression suggestions",
  "Routine optimization based on your history",
];

export function PremiumPreviewCard() {
  return (
    <section className="mt-6 overflow-hidden rounded-[2rem] border border-info/20 bg-info-soft p-5 shadow-2xl backdrop-blur sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-info/30 bg-info-soft px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-info">
              Persist Pro Preview
            </span>

            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-bold text-neutral-300">
              Coming after beta
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">
            Your future AI coach will be built from the training data you log now.
          </h2>

          <p className="mt-3 text-sm leading-6 text-neutral-300">
            Keep logging clean workouts, sets, goals, and notes. Persist will use
            that history to power premium insights like progression plans,
            plateau detection, and weekly training reports.
          </p>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {premiumFeatures.map((feature) => (
              <div
                key={feature}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
              >
                <p className="text-sm font-bold text-white">✓ {feature}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/25 p-5 lg:w-72">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
            Monetization path
          </p>

          <p className="mt-3 text-3xl font-black text-white">
            Free now
          </p>

          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Premium features will stay clearly separated from the free tracker so
            users trust the product before being asked to upgrade.
          </p>

          <Link
            href="/workouts"
            className="mt-5 inline-flex w-full justify-center rounded-xl bg-action px-4 py-3 text-sm font-black text-action-foreground transition hover:bg-action-hover"
          >
            Keep building history
          </Link>
        </div>
      </div>
    </section>
  );
}
