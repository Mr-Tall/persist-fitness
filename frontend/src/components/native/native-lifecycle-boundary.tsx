"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { flushProductAnalytics } from "@/lib/analytics/client";
import {
  HEALTH_RESUME_EVENT,
  NATIVE_RESUME_EVENT,
  NativeLifecycleCoordinator,
  createNativeBridge,
  installCapacitorHealthBridge,
  resolveNativeDeepLink,
} from "@/lib/native";
import { captureHandledException } from "@/lib/observability/sentry";
import { createCorrelationReference } from "@/lib/observability/reference";

export function NativeLifecycleBoundary() {
  const router = useRouter();

  useEffect(() => {
    let coordinator: NativeLifecycleCoordinator | null = null;
    const reportStartupFailure = (error: unknown) => {
      captureHandledException(error, createCorrelationReference());
    };
    try {
      installCapacitorHealthBridge();
      coordinator = new NativeLifecycleCoordinator(createNativeBridge(), {
        flushAnalytics: flushProductAnalytics,
        resumeOfflineSync: () => {
          window.dispatchEvent(new Event(NATIVE_RESUME_EVENT));
        },
        resumeHealthQueue: () => {
          window.dispatchEvent(new Event(HEALTH_RESUME_EVENT));
        },
        openDeepLink: (url) => {
          const destination = resolveNativeDeepLink(url, window.location.origin);
          if (destination) router.push(destination);
        },
      });
      void coordinator.start().catch(reportStartupFailure);
    } catch (error) {
      reportStartupFailure(error);
    }
    return () => {
      void coordinator?.stop();
    };
  }, [router]);

  return null;
}
