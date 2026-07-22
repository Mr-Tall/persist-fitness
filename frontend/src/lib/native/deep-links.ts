const NATIVE_SCHEME = "persistfitness:";

export function resolveNativeDeepLink(
  value: string,
  webOrigin: string,
): string | null {
  try {
    const url = new URL(value);
    const isNativeLink = url.protocol === NATIVE_SCHEME && url.hostname === "app";
    const isSameOriginWebLink = url.origin === webOrigin;
    if (!isNativeLink && !isSameOriginWebLink) return null;
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/login")) {
      return null;
    }
    return `${url.pathname || "/dashboard"}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
