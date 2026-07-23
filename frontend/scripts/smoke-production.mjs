import { pathToFileURL } from "node:url";

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_REDIRECTS = 5;

/** @typedef {{ path: string, label: string, contentType: "text" | "json" }} SmokeEndpoint */
/** @typedef {{ log: (message: string) => void }} SmokeLogger */

/** @type {SmokeEndpoint[]} */
export const PRODUCTION_SMOKE_ENDPOINTS = [
  { path: "/", label: "landing page", contentType: "text" },
  { path: "/login", label: "login page", contentType: "text" },
  {
    path: "/api/auth/providers",
    label: "Auth.js providers endpoint",
    contentType: "json",
  },
  { path: "/privacy", label: "privacy page", contentType: "text" },
  { path: "/terms", label: "terms page", contentType: "text" },
];

/** @param {string | undefined} value */
export function normalizeProductionOrigin(value) {
  if (!value) throw new Error("Production origin is required.");
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Production origin must use HTTP or HTTPS.");
  }
  if (url.username || url.password) {
    throw new Error("Production origin must not contain credentials.");
  }
  return url.origin;
}

/**
 * @param {{
 *   origin: string,
 *   endpoint: SmokeEndpoint,
 *   fetchImpl?: typeof fetch,
 *   timeoutMs?: number,
 *   maxRedirects?: number
 * }} options
 */
export async function checkEndpoint({
  origin,
  endpoint,
  fetchImpl = fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxRedirects = DEFAULT_MAX_REDIRECTS,
}) {
  let currentUrl = new URL(endpoint.path, origin);
  const visited = new Set();

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    if (visited.has(currentUrl.href)) {
      throw new Error(`${endpoint.label} entered a redirect loop.`);
    }
    visited.add(currentUrl.href);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await fetchImpl(currentUrl, {
        headers: { "user-agent": "Persist-Fitness-Release-Smoke/1.0" },
        redirect: "manual",
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted || error?.name === "AbortError") {
        throw new Error(`${endpoint.label} timed out after ${timeoutMs}ms.`);
      }
      throw new Error(`${endpoint.label} could not be reached.`);
    } finally {
      clearTimeout(timeout);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new Error(`${endpoint.label} returned a redirect without a location.`);
      }
      const redirectUrl = new URL(location, currentUrl);
      if (redirectUrl.origin !== origin) {
        throw new Error(`${endpoint.label} redirected outside Production.`);
      }
      currentUrl = redirectUrl;
      continue;
    }

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`${endpoint.label} returned HTTP ${response.status}.`);
    }

    if (endpoint.contentType === "json") {
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.toLowerCase().includes("application/json")) {
        throw new Error(`${endpoint.label} did not return JSON.`);
      }
      try {
        await response.json();
      } catch {
        throw new Error(`${endpoint.label} returned invalid JSON.`);
      }
    }

    return { label: endpoint.label, path: endpoint.path, status: response.status };
  }

  throw new Error(`${endpoint.label} exceeded ${maxRedirects} redirects.`);
}

/**
 * @param {{
 *   origin: string,
 *   endpoints?: SmokeEndpoint[],
 *   fetchImpl?: typeof fetch,
 *   timeoutMs?: number,
 *   logger?: SmokeLogger
 * }} options
 */
export async function runProductionSmokeTests({
  origin,
  endpoints = PRODUCTION_SMOKE_ENDPOINTS,
  fetchImpl = fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  logger = console,
}) {
  const safeOrigin = normalizeProductionOrigin(origin);
  const results = [];
  for (const endpoint of endpoints) {
    const result = await checkEndpoint({
      origin: safeOrigin,
      endpoint,
      fetchImpl,
      timeoutMs,
    });
    logger.log(`OK ${result.status} ${result.path} (${result.label})`);
    results.push(result);
  }
  return results;
}

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runProductionSmokeTests({
    origin: argumentValue("--origin") ?? process.env.PRODUCTION_ORIGIN,
  }).catch((error) => {
    console.error(
      error instanceof Error
        ? `Production smoke test failed: ${error.message}`
        : "Production smoke test failed.",
    );
    process.exitCode = 1;
  });
}
