import { beforeEach, describe, expect, it, vi } from "vitest";

import { completeOnboarding } from "@/app/actions/onboarding";

const mocks = vi.hoisted(() => ({
  requireUserId: vi.fn(),
  transaction: vi.fn(),
  profileUpsert: vi.fn(),
  userUpdate: vi.fn(),
  revalidatePath: vi.fn(),
  unstableRethrow: vi.fn(),
}));

vi.mock("@/lib/auth/require-user", () => ({
  requireUserId: mocks.requireUserId,
}));

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: mocks.transaction,
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next/navigation", () => ({
  unstable_rethrow: mocks.unstableRethrow,
}));

const initialState = {
  status: "idle" as const,
  message: "",
  submittedAt: null,
};

function onboardingFormData(goal = "") {
  const formData = new FormData();
  formData.set("goal", goal);
  return formData;
}

describe("completeOnboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserId.mockResolvedValue("user-1");
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        profile: { upsert: mocks.profileUpsert },
        user: { update: mocks.userUpdate },
      }),
    );
  });

  it("persists the selected goal and completion timestamp atomically", async () => {
    const result = await completeOnboarding(
      initialState,
      onboardingFormData("Build muscle"),
    );

    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.profileUpsert).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      update: { primaryGoal: "Build muscle" },
      create: {
        userId: "user-1",
        primaryGoal: "Build muscle",
        equipment: [],
      },
    });
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { onboardingCompletedAt: expect.any(Date) },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(result).toMatchObject({
      status: "success",
      message: "Welcome to Persist Fitness.",
    });
  });

  it("persists completion without creating a profile when the goal is skipped", async () => {
    const result = await completeOnboarding(initialState, onboardingFormData());

    expect(mocks.profileUpsert).not.toHaveBeenCalled();
    expect(mocks.userUpdate).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("success");
  });

  it("rejects unlisted goals without writing onboarding state", async () => {
    const result = await completeOnboarding(
      initialState,
      onboardingFormData("Internal-only goal"),
    );

    expect(result).toMatchObject({
      status: "error",
      code: "VALIDATION_ERROR",
      message: "Choose a listed goal or skip this step.",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
