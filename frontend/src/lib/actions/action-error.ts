import { randomUUID } from "node:crypto";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import {
  createActionErrorState,
  type ActionErrorCode,
  type ActionFormState,
} from "@/lib/actions/action-result";
import { captureServerException } from "@/lib/observability/sentry";

const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";
const DEFAULT_VALIDATION_MESSAGE = "Please check the form and try again.";

type ActionErrorContext = {
  actionName: string;
  validationMessage?: string;
};

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
  { actionName, validationMessage }: ActionErrorContext
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
  captureServerException(error, { actionName, reference: requestId });

  return createActionErrorState({
    code: "INTERNAL_ERROR",
    message: DEFAULT_ERROR_MESSAGE,
    requestId,
  });
}

export function throwSafeActionError(
  error: unknown,
  context: ActionErrorContext
): never {
  const state = toActionErrorState(error, context);

  throw new ActionError({
    code: state.code ?? "INTERNAL_ERROR",
    message: state.message,
    retryAfterSeconds: state.retryAfterSeconds,
  });
}

export async function runActionWithSafeErrors<T>(
  context: ActionErrorContext & {
    mapError?: (error: unknown) => unknown;
  },
  action: () => Promise<T>
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    throwSafeActionError(context.mapError?.(error) ?? error, context);
  }
}
