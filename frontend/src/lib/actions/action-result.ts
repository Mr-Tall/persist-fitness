export const actionErrorCodes = [
  "VALIDATION_ERROR",
  "UNAUTHENTICATED",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
] as const;

export type ActionErrorCode = (typeof actionErrorCodes)[number];

export type ActionFormState = {
  status: "idle" | "success" | "error";
  message: string;
  submittedAt: number | null;
  code?: ActionErrorCode;
  fieldErrors?: Record<string, string[]>;
  requestId?: string;
  retryAfterSeconds?: number;
};

export function createActionSuccessState(message: string): ActionFormState {
  return {
    status: "success",
    message,
    submittedAt: Date.now(),
  };
}

export function createActionErrorState({
  code,
  message,
  fieldErrors,
  requestId,
  retryAfterSeconds,
}: {
  code: ActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
  requestId?: string;
  retryAfterSeconds?: number;
}): ActionFormState {
  return {
    status: "error",
    code,
    message,
    submittedAt: Date.now(),
    ...(fieldErrors ? { fieldErrors } : {}),
    ...(requestId ? { requestId } : {}),
    ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
  };
}
