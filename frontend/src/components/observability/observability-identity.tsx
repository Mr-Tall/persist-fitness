"use client";

import { useEffect } from "react";
import { captureProductEvent, identifyAnalyticsUser } from "@/lib/analytics/client";
import { setObservabilityUser } from "@/lib/observability/sentry";

export function ObservabilityIdentity({ userId }: { userId: string }) {
  useEffect(() => {
    setObservabilityUser(userId);
    identifyAnalyticsUser(userId);
    captureProductEvent("account_signed_in", {}, { onceKey: userId });
    return () => setObservabilityUser(null);
  }, [userId]);
  return null;
}
