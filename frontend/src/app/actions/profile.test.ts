import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveProfile, saveProfileWithState } from "@/app/actions/profile";

const mocks = vi.hoisted(() => ({
  requireUserId: vi.fn(),
  upsert: vi.fn(),
  redirect: vi.fn(),
  unstableRethrow: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/require-user", () => ({
  requireUserId: mocks.requireUserId,
}));

vi.mock("@/lib/db", () => ({
  db: {
    profile: {
      upsert: mocks.upsert,
    },
  },
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  unstable_rethrow: mocks.unstableRethrow,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

function validProfileFormData() {
  const formData = new FormData();
  formData.set("primaryGoal", "Strength");
  formData.set("experience", "Intermediate");
  formData.set("trainingAge", "");
  formData.set("availableDays", "4");
  formData.set("preferredSplit", "");
  return formData;
}

describe("profile action error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserId.mockResolvedValue("user_1");
  });

  it("sanitizes unexpected profile failures without logging values", async () => {
    const internalMessage = "profile data and private database details";
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mocks.upsert.mockRejectedValue(new Error(internalMessage));

    await expect(saveProfile(validProfileFormData())).rejects.toMatchObject({
      name: "ActionError",
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    });

    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      internalMessage
    );
    expect(consoleError).toHaveBeenCalledWith("Server action failed", {
      actionName: "saveProfile",
      requestId: expect.any(String),
      errorType: "Error",
    });

    consoleError.mockRestore();
  });

  it("returns success and preserves profile revalidation in the state wrapper", async () => {
    mocks.upsert.mockResolvedValue({ id: "profile_1" });

    const result = await saveProfileWithState(
      { status: "idle", message: "", submittedAt: null },
      validProfileFormData(),
    );

    expect(result).toMatchObject({ status: "success", message: "Profile saved." });
    expect(mocks.upsert).toHaveBeenCalledWith({
      where: { userId: "user_1" },
      update: expect.objectContaining({
        primaryGoal: "Strength",
        experience: "Intermediate",
        availableDays: 4,
      }),
      create: expect.objectContaining({ userId: "user_1" }),
    });
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(1, "/settings");
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(2, "/dashboard");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("returns safe validation without writing profile data", async () => {
    const formData = validProfileFormData();
    formData.set("primaryGoal", "");

    const result = await saveProfileWithState(
      { status: "idle", message: "", submittedAt: null },
      formData,
    );

    expect(result).toMatchObject({
      status: "error",
      code: "VALIDATION_ERROR",
      message: "Please check your profile details and try again.",
    });
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("sanitizes database failures in the recoverable profile wrapper", async () => {
    const internalMessage = "private profile constraint and connection details";
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mocks.upsert.mockRejectedValue(new Error(internalMessage));

    const result = await saveProfileWithState(
      { status: "idle", message: "", submittedAt: null },
      validProfileFormData(),
    );

    expect(result).toMatchObject({
      status: "error",
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    });
    expect(JSON.stringify(result)).not.toContain(internalMessage);
    expect(consoleError).toHaveBeenCalledWith("Server action failed", {
      actionName: "saveProfileWithState",
      requestId: expect.any(String),
      errorType: "Error",
    });
    consoleError.mockRestore();
  });

  it("keeps the original redirecting public profile action compatible", async () => {
    mocks.upsert.mockResolvedValue({ id: "profile_1" });

    await saveProfile(validProfileFormData());

    expect(mocks.redirect).toHaveBeenCalledWith("/dashboard");
  });
});
