export const feedbackCategories = ["bug", "feature_request", "general"] as const;
export const feedbackStatuses = ["new", "reviewing", "planned", "resolved", "dismissed"] as const;
export type FeedbackCategory = (typeof feedbackCategories)[number];
export type FeedbackStatus = (typeof feedbackStatuses)[number];

const dynamicRouteParents = new Set([
  "exercises",
  "feedback",
  "programs",
  "routines",
  "workouts",
]);

export function normalizeFeedbackRoute(route: string) {
  const segments = route.split(/[?#]/, 1)[0].split("/").filter(Boolean);
  const normalized = segments.map((segment, index) => {
    const parent = segments[index - 1];
    if (parent && dynamicRouteParents.has(parent) && segment !== "new") return ":id";
    if (/^[a-f\d]{8}-[a-f\d-]{27,}$/i.test(segment)) return ":id";
    if (/^c[a-z\d]{20,}$/i.test(segment)) return ":id";
    return segment.slice(0, 80);
  });
  return `/${normalized.join("/")}`.slice(0, 300);
}

export function normalizePlatform(userAgent: string) {
  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  if (/android/i.test(userAgent)) return "android";
  if (/windows/i.test(userAgent)) return "windows";
  if (/macintosh|mac os/i.test(userAgent)) return "macos";
  if (/linux/i.test(userAgent)) return "linux";
  return "other";
}

export function normalizeUserAgentSummary(userAgent: string) {
  const browser = /edg/i.test(userAgent)
    ? "edge"
    : /firefox/i.test(userAgent)
      ? "firefox"
      : /chrome|crios/i.test(userAgent)
        ? "chrome"
        : /safari/i.test(userAgent)
          ? "safari"
          : "other";
  const device = /mobile|iphone|android/i.test(userAgent) ? "mobile" : "desktop";
  return `${browser}-${device}`;
}

export function releaseEnvironment() {
  return (process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown").slice(0, 30);
}

export function releaseVersion() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION?.trim();
  return version ? version.slice(0, 80) : null;
}
