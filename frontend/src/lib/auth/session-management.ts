import "server-only";

import { headers } from "next/headers";
import { db } from "@/lib/db";

const ACTIVITY_WRITE_INTERVAL_MS = 15 * 60 * 1000;

export type ManagedSession = {
  id: string;
  createdAt: Date;
  expires: Date;
  lastActiveAt: Date;
  userAgentSummary: string;
  isCurrent: boolean;
};

export function summarizeSessionUserAgent(userAgent: string) {
  const browser = /edg/i.test(userAgent)
    ? "Edge"
    : /firefox/i.test(userAgent)
      ? "Firefox"
      : /chrome|crios/i.test(userAgent)
        ? "Chrome"
        : /safari/i.test(userAgent)
          ? "Safari"
          : "Browser";
  const platform = /iphone|ipad|ipod/i.test(userAgent)
    ? "iOS"
    : /android/i.test(userAgent)
      ? "Android"
      : /windows/i.test(userAgent)
        ? "Windows"
        : /macintosh|mac os/i.test(userAgent)
          ? "macOS"
          : /linux/i.test(userAgent)
            ? "Linux"
            : "unknown device";
  return `${browser} on ${platform}`.slice(0, 80);
}

function sessionExpiry(expires: string) {
  const value = new Date(expires);
  return Number.isNaN(value.getTime()) ? null : value;
}

export async function findCurrentSessionId(userId: string, expires: string) {
  const expiry = sessionExpiry(expires);
  if (!expiry) return null;
  const current = await db.session.findFirst({
    where: { userId, expires: expiry },
    select: { id: true },
  });
  return current?.id ?? null;
}

export async function recordCurrentSessionActivity(session: {
  user: { id: string };
  expires: string;
}) {
  const expiry = sessionExpiry(session.expires);
  if (!expiry) return null;
  const current = await db.session.findFirst({
    where: { userId: session.user.id, expires: expiry },
    select: { id: true },
  });
  if (!current) return null;

  const requestHeaders = await headers();
  const summary = summarizeSessionUserAgent(requestHeaders.get("user-agent") ?? "");
  await db.session.updateMany({
    where: {
      id: current.id,
      userId: session.user.id,
      OR: [
        { userAgentSummary: null },
        { lastActiveAt: { lt: new Date(Date.now() - ACTIVITY_WRITE_INTERVAL_MS) } },
      ],
    },
    data: { lastActiveAt: new Date(), userAgentSummary: summary },
  });
  return current.id;
}

export async function listManagedSessions(session: {
  user: { id: string };
  expires: string;
}): Promise<ManagedSession[]> {
  const currentId = await findCurrentSessionId(session.user.id, session.expires);
  const sessions = await db.session.findMany({
    where: { userId: session.user.id, expires: { gt: new Date() } },
    orderBy: { lastActiveAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      expires: true,
      lastActiveAt: true,
      userAgentSummary: true,
    },
  });
  return sessions.map((item) => ({
    ...item,
    userAgentSummary: item.userAgentSummary ?? "Unknown device",
    isCurrent: item.id === currentId,
  }));
}
