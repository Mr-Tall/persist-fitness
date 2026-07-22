"use client";

import { useEffect } from "react";
import {
  clearDeletedAccountClientData,
  hasPendingAccountCleanup,
} from "@/lib/account/client-cleanup";

export function AccountCleanupBoundary() {
  useEffect(() => {
    if (hasPendingAccountCleanup()) void clearDeletedAccountClientData();
  }, []);
  return null;
}
