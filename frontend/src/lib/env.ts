import "server-only";

import {
  type RuntimeEnv,
  validateRuntimeEnv,
} from "@/lib/env-validation";

let cachedRuntimeEnv: RuntimeEnv | undefined;

export function getRuntimeEnv(): RuntimeEnv {
  cachedRuntimeEnv ??= validateRuntimeEnv(process.env);
  return cachedRuntimeEnv;
}
