"use client";

import { signOut } from "next-auth/react";
import { clearOfflineWorkoutDatabase } from "@/lib/offline-workout/storage";
import { clearOfflineWorkoutCache } from "@/components/pwa/service-worker-registration";
import { resetAnalyticsIdentity } from "@/lib/analytics/client";
import { setObservabilityUser } from "@/lib/observability/sentry";
import { clearLocalHealthData } from "@/lib/health/storage";

export function LogoutButton() {
  return (
    <button
      onClick={async () => {
        resetAnalyticsIdentity();
        setObservabilityUser(null);
        clearLocalHealthData();
        await Promise.allSettled([
          clearOfflineWorkoutDatabase(),
          clearOfflineWorkoutCache(),
        ]);
        await signOut({ callbackUrl: "/" });
      }}
      className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100"
    >
      Sign out
    </button>
  );
}
