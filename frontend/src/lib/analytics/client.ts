"use client";

import posthog from "posthog-js";
import type { ProductEventMap, ProductEventName } from "./events";

const analyticsEnabled =
  process.env.NODE_ENV !== "test" &&
  Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST);

let initialized = false;
const emitted = new Set<string>();

export function initializeProductAnalytics() {
  if (!analyticsEnabled || initialized) return false;
  try {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording:
        process.env.NODE_ENV === "development" ||
        process.env.NEXT_PUBLIC_POSTHOG_REPLAY_ENABLED !== "true",
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: "[data-ph-mask], [data-sensitive]",
        blockSelector: "[data-ph-no-capture], img, video, [data-screenshot-preview]",
      },
      person_profiles: "identified_only",
    });
    initialized = true;
    return true;
  } catch {
    return false;
  }
}

export function identifyAnalyticsUser(userId: string) {
  if (!analyticsEnabled) return;
  initializeProductAnalytics();
  if (!initialized) return;
  try {
    posthog.identify(userId);
  } catch {
    // Product analytics must never interrupt the application flow.
  }
}

export function resetAnalyticsIdentity() {
  emitted.clear();
  if (!analyticsEnabled || !initialized) return;
  try {
    posthog.reset();
  } catch {
    // Sign-out must remain functional if the analytics SDK is unavailable.
  }
}

export function captureProductEvent<Name extends ProductEventName>(
  name: Name,
  properties: ProductEventMap[Name],
  options?: { onceKey?: string },
) {
  if (!analyticsEnabled) return;
  initializeProductAnalytics();
  if (!initialized) return;
  if (options?.onceKey) {
    const key = `${name}:${options.onceKey}`;
    if (emitted.has(key)) return;
    emitted.add(key);
  }
  try {
    posthog.capture(name, properties);
  } catch {
    // Explicit product events are best-effort and cannot block user actions.
  }
}

export function isProductAnalyticsEnabled() {
  return analyticsEnabled;
}

export async function flushProductAnalytics() {
  if (!analyticsEnabled || !initialized) return;
  try {
    const flushablePosthog = posthog as typeof posthog & {
      flush(transport?: "XHR" | "fetch" | "sendBeacon"): Promise<void>;
    };
    await flushablePosthog.flush("sendBeacon");
  } catch {
    // Native backgrounding and termination must not interrupt the app lifecycle.
  }
}
