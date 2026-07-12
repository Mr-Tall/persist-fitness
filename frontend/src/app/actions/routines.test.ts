import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRoutine } from "@/app/actions/routines";

const mocks = vi.hoisted(() => {
  const redirectError = new Error("redirect control flow");

  return {
    redirectError,
    requireUserId: vi.fn(),
    create: vi.fn(),
    redirect: vi.fn(),
    unstableRethrow: vi.fn((error: unknown) => {
      if (error === redirectError) {
        throw error;
      }
    }),
  };
});

vi.mock("@/lib/auth/require-user", () => ({
  requireUserId: mocks.requireUserId,
}));

vi.mock("@/lib/db", () => ({
  db: {
    workoutTemplate: {
      create: mocks.create,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  unstable_rethrow: mocks.unstableRethrow,
}));

describe("routine action error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserId.mockResolvedValue("user_1");
  });

  it("maps routine validation failures to a safe validation error", async () => {
    const formData = new FormData();
    formData.set("title", "");

    await expect(createRoutine(formData)).rejects.toMatchObject({
      name: "ActionError",
      code: "VALIDATION_ERROR",
      message: "Routine title is required",
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("preserves the successful create redirect", async () => {
    mocks.create.mockResolvedValue({ id: "routine_1" });
    mocks.redirect.mockImplementation(() => {
      throw mocks.redirectError;
    });

    const formData = new FormData();
    formData.set("title", "Upper body");

    await expect(createRoutine(formData)).rejects.toBe(mocks.redirectError);
    expect(mocks.redirect).toHaveBeenCalledWith("/routines/routine_1");
  });
});
