"use client";

import { clearOfflineWorkoutCache } from "@/components/pwa/service-worker-registration";
import { resetAnalyticsIdentity } from "@/lib/analytics/client";
import { clearOfflineWorkoutDatabase } from "@/lib/offline-workout/storage";
import { setObservabilityUser } from "@/lib/observability/sentry";
import { ACCOUNT_CLEANUP_COOKIE } from "@/lib/account/constants";
import { clearLocalHealthData } from "@/lib/health/storage";

export function hasPendingAccountCleanup() {
  return typeof document !== "undefined" &&
    document.cookie.split(";").some((item) => item.trim() === `${ACCOUNT_CLEANUP_COOKIE}=1`);
}

export async function clearDeletedAccountClientData() {
  resetAnalyticsIdentity();
  setObservabilityUser(null);
  clearLocalHealthData();
  await Promise.allSettled([
    clearOfflineWorkoutDatabase(),
    clearOfflineWorkoutCache(),
  ]);
  if (typeof document !== "undefined") {
    document.cookie = `${ACCOUNT_CLEANUP_COOKIE}=; Max-Age=0; Path=/; SameSite=Strict`;
  }
}
