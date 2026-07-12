import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ActionError, toActionErrorState } from "@/lib/actions/action-error";
import { createActionSuccessState } from "@/lib/actions/action-result";

const navigationMocks = vi.hoisted(() => {
  const controlFlowError = new Error("framework control flow");

  return {
    controlFlowError,
    unstableRethrow: vi.fn((error: unknown) => {
      if (error === controlFlowError) {
        throw error;
      }
    }),
  };
});

vi.mock("next/navigation", () => ({
  unstable_rethrow: navigationMocks.unstableRethrow,
}));

describe("server action error mapping", () => {
  beforeEach(() => {
    navigationMocks.unstableRethrow.mockClear();
  });

  it("maps Zod errors to curated validation results", () => {
    const result = z
      .object({ title: z.string().min(1, "Workout title is required") })
      .safeParse({ title: "" });

    if (result.success) {
      throw new Error("Expected validation to fail");
    }

    const state = toActionErrorState(result.error, {
      actionName: "testValidation",
    });

    expect(state).toMatchObject({
      status: "error",
      code: "VALIDATION_ERROR",
      message: "Workout title is required",
      fieldErrors: {
        title: ["Workout title is required"],
      },
    });
    expect(state.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it("maps known domain errors to approved public messages", () => {
    const state = toActionErrorState(
      new ActionError({
        code: "NOT_FOUND",
        message: "The requested workout item could not be found.",
      }),
      { actionName: "testNotFound" }
    );

    expect(state).toMatchObject({
      status: "error",
      code: "NOT_FOUND",
      message: "The requested workout item could not be found.",
    });
  });

  it("sanitizes unexpected errors and logs only safe context", () => {
    const internalMessage = "database constraint and secret details";
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const state = toActionErrorState(new Error(internalMessage), {
      actionName: "testUnexpected",
    });

    expect(state).toMatchObject({
      status: "error",
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    });
    expect(JSON.stringify(state)).not.toContain(internalMessage);
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      internalMessage
    );
    expect(consoleError).toHaveBeenCalledWith("Server action failed", {
      actionName: "testUnexpected",
      requestId: state.requestId,
      errorType: "Error",
    });

    consoleError.mockRestore();
  });

  it("rethrows Next.js control-flow errors before mapping", () => {
    expect(() =>
      toActionErrorState(navigationMocks.controlFlowError, {
        actionName: "testControlFlow",
      })
    ).toThrow(navigationMocks.controlFlowError);
  });

  it("creates the existing successful action-state shape", () => {
    expect(createActionSuccessState("Workout updated.")).toMatchObject({
      status: "success",
      message: "Workout updated.",
      submittedAt: expect.any(Number),
    });
  });
});
