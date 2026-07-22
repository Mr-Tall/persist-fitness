"use client";

import { useMemo, useSyncExternalStore } from "react";
import { selectHealthProvider } from "./providers";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("persist-health-bridge-ready", onStoreChange);
  return () => window.removeEventListener("persist-health-bridge-ready", onStoreChange);
}

function getBridge() {
  return window.PersistHealthBridge;
}

export function useHealthProvider() {
  const bridge = useSyncExternalStore(subscribe, getBridge, () => undefined);
  return useMemo(() => selectHealthProvider(bridge), [bridge]);
}
