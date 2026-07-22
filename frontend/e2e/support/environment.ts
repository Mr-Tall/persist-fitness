const DEFAULT_BASE_URL = "http://127.0.0.1:3100";
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

function requireDisposableDatabase(databaseURL: string | undefined) {
  if (!databaseURL) {
    throw new Error(
      "E2E_DATABASE_URL is required. Copy .env.e2e.example to .env.e2e and use a disposable local database.",
    );
  }

  const parsed = new URL(databaseURL);
  const databaseName = parsed.pathname.replace(/^\//, "").toLowerCase();

  if (
    !["postgres:", "postgresql:"].includes(parsed.protocol) ||
    !LOOPBACK_HOSTS.has(parsed.hostname) ||
    (!databaseName.includes("e2e") && !databaseName.includes("test"))
  ) {
    throw new Error(
      "E2E_DATABASE_URL must target a loopback PostgreSQL database whose name contains 'e2e' or 'test'.",
    );
  }

  return databaseURL;
}

export function getE2EEnvironment() {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? DEFAULT_BASE_URL;
  const parsedBaseURL = new URL(baseURL);

  if (!LOOPBACK_HOSTS.has(parsedBaseURL.hostname)) {
    throw new Error("PLAYWRIGHT_BASE_URL must use a loopback hostname.");
  }

  return {
    baseURL,
    databaseURL: requireDisposableDatabase(process.env.E2E_DATABASE_URL),
  };
}
