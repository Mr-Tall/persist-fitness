import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const SCHEMA_PATH = "frontend/prisma/schema.prisma";
const MIGRATION_PREFIX = "frontend/prisma/migrations/";

export function databaseSchemaFingerprint(schema) {
  return schema
    .replace(/\b(?:generator|datasource)\s+\w+\s*\{[^}]*\}/gs, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/\s+/g, "")
    .trim();
}

export function evaluateMigrationConsistency({
  baseSchema,
  currentSchema,
  changedFiles,
  override = false,
  justification = "",
}) {
  const schemaChanged = changedFiles.some(
    (file) => file === SCHEMA_PATH || file === "prisma/schema.prisma",
  );
  if (!schemaChanged) {
    return { ok: true, reason: "Prisma schema was not changed." };
  }

  if (
    databaseSchemaFingerprint(baseSchema) ===
    databaseSchemaFingerprint(currentSchema)
  ) {
    return {
      ok: true,
      reason: "Only non-database Prisma configuration or formatting changed.",
    };
  }

  const migrationChanged = changedFiles.some(
    (file) =>
      (file.startsWith(MIGRATION_PREFIX) ||
        file.startsWith("prisma/migrations/")) &&
      file.endsWith(".sql"),
  );
  if (migrationChanged) {
    return {
      ok: true,
      reason: "Database schema and migration SQL changed together.",
    };
  }

  if (override && justification.trim().length >= 10) {
    return {
      ok: true,
      reason: `Maintainer-approved non-migrating exception: ${justification.trim()}`,
    };
  }

  return {
    ok: false,
    reason:
      "Database-significant prisma/schema.prisma changes require a checked-in migration under prisma/migrations/. If this is intentionally non-migrating, a maintainer must apply the prisma-no-migration label with an explicit justification.",
  };
}

function git(repositoryRoot, args) {
  return execFileSync("git", args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function parseArguments(arguments_) {
  const options = {};
  for (let index = 0; index < arguments_.length; index += 1) {
    if (arguments_[index] === "--base") options.base = arguments_[index + 1];
    if (arguments_[index] === "--head") options.head = arguments_[index + 1];
  }
  return options;
}

export function runMigrationConsistencyCheck({
  base,
  head = "HEAD",
  repositoryRoot,
  override = false,
  justification = "",
}) {
  if (!base) {
    throw new Error("A base Git revision is required for the Prisma migration check.");
  }

  const changedFiles = git(repositoryRoot, [
    "diff",
    "--name-only",
    `${base}...${head}`,
  ])
    .split(/\r?\n/)
    .filter(Boolean);
  const currentSchema = git(repositoryRoot, ["show", `${head}:${SCHEMA_PATH}`]);
  let baseSchema = "";
  try {
    baseSchema = git(repositoryRoot, ["show", `${base}:${SCHEMA_PATH}`]);
  } catch {
    // A newly introduced schema is necessarily database-significant.
  }

  return evaluateMigrationConsistency({
    baseSchema,
    currentSchema,
    changedFiles,
    override,
    justification,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const arguments_ = parseArguments(process.argv.slice(2));
    const repositoryRoot = git(process.cwd(), ["rev-parse", "--show-toplevel"]);
    const result = runMigrationConsistencyCheck({
      base: arguments_.base ?? process.env.BASE_SHA,
      head: arguments_.head ?? process.env.HEAD_SHA ?? "HEAD",
      repositoryRoot,
      override: process.env.PRISMA_SCHEMA_OVERRIDE === "true",
      justification: process.env.PRISMA_SCHEMA_CHANGE_JUSTIFICATION ?? "",
    });
    console.log(result.reason);
    if (!result.ok) process.exitCode = 1;
  } catch (error) {
    console.error(
      error instanceof Error
        ? `Prisma migration consistency check failed: ${error.message}`
        : "Prisma migration consistency check failed.",
    );
    process.exitCode = 1;
  }
}
