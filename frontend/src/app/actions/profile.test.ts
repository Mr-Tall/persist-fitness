import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveProfile } from "@/app/actions/profile";

const mocks = vi.hoisted(() => ({
  requireUserId: vi.fn(),
  upsert: vi.fn(),
  redirect: vi.fn(),
  unstableRethrow: vi.fn(),
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
});
