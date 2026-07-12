import { randomUUID } from "node:crypto";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import {
  createActionErrorState,
  type ActionErrorCode,
  type ActionFormState,
} from "@/lib/actions/action-result";

const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";
const DEFAULT_VALIDATION_MESSAGE = "Please check the form and try again.";

export class ActionError extends Error {
  readonly code: ActionErrorCode;
  readonly publicMessage: string;
  readonly retryAfterSeconds?: number;

  constructor({
    code,
    message,
    retryAfterSeconds,
  }: {
    code: ActionErrorCode;
    message: string;
    retryAfterSeconds?: number;
  }) {
    super(message);
    this.name = "ActionError";
    this.code = code;
    this.publicMessage = message;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function getFieldErrors(error: z.ZodError): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).filter(
      (entry): entry is [string, string[]] => entry[1] !== undefined
    )
  );
}

export function toActionErrorState(
  error: unknown,
  {
    actionName,
    validationMessage,
  }: {
    actionName: string;
    validationMessage?: string;
  }
): ActionFormState {
  unstable_rethrow(error);

  const requestId = randomUUID();

  if (error instanceof z.ZodError) {
    return createActionErrorState({
      code: "VALIDATION_ERROR",
      message:
        validationMessage ??
        error.issues[0]?.message ??
        DEFAULT_VALIDATION_MESSAGE,
      fieldErrors: getFieldErrors(error),
      requestId,
    });
  }

  if (error instanceof ActionError) {
    return createActionErrorState({
      code: error.code,
      message: error.publicMessage,
      requestId,
      retryAfterSeconds: error.retryAfterSeconds,
    });
  }

  console.error("Server action failed", {
    actionName,
    requestId,
    errorType: error instanceof Error ? error.name : typeof error,
  });

  return createActionErrorState({
    code: "INTERNAL_ERROR",
    message: DEFAULT_ERROR_MESSAGE,
    requestId,
  });
}
