import { z } from "zod";

const nonBlankString = z.string().refine((value) => value.trim().length > 0);
const urlString = z.string().trim().min(1).url();

const runtimeEnvSchema = z.object({
  DATABASE_URL: urlString,
  AUTH_SECRET: nonBlankString,
  AUTH_GOOGLE_ID: nonBlankString,
  AUTH_GOOGLE_SECRET: nonBlankString,
  AUTH_URL: urlString,
});

export type RuntimeEnv = z.infer<typeof runtimeEnvSchema>;

const environmentVariableLabels: Record<keyof RuntimeEnv, string> = {
  DATABASE_URL: "DATABASE_URL",
  AUTH_SECRET: "AUTH_SECRET",
  AUTH_GOOGLE_ID: "AUTH_GOOGLE_ID",
  AUTH_GOOGLE_SECRET: "AUTH_GOOGLE_SECRET",
  AUTH_URL: "AUTH_URL or NEXTAUTH_URL",
};

export function validateRuntimeEnv(
  source: Record<string, string | undefined>
): RuntimeEnv {
  const result = runtimeEnvSchema.safeParse({
    DATABASE_URL: source.DATABASE_URL,
    AUTH_SECRET: source.AUTH_SECRET,
    AUTH_GOOGLE_ID: source.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: source.AUTH_GOOGLE_SECRET,
    AUTH_URL: source.AUTH_URL?.trim() || source.NEXTAUTH_URL?.trim(),
  });

  if (!result.success) {
    const invalidVariables = Array.from(
      new Set(
        result.error.issues.map((issue) => {
          const variableName = issue.path[0] as keyof RuntimeEnv;
          return environmentVariableLabels[variableName] ?? "UNKNOWN";
        })
      )
    ).sort();

    throw new Error(
      `Invalid or missing environment variables: ${invalidVariables.join(", ")}`
    );
  }

  return Object.freeze(result.data);
}
