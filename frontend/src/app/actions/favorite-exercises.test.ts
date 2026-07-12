import { beforeEach, describe, expect, it, vi } from "vitest";
import { toggleFavoriteExercise } from "@/app/actions/favorite-exercises";

const mocks = vi.hoisted(() => ({
  requireUserId: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  delete: vi.fn(),
  revalidatePath: vi.fn(),
  unstableRethrow: vi.fn(),
}));

vi.mock("@/lib/auth/require-user", () => ({
  requireUserId: mocks.requireUserId,
}));

vi.mock("@/lib/db", () => ({
  db: {
    favoriteExercise: {
      findUnique: mocks.findUnique,
      create: mocks.create,
      delete: mocks.delete,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next/navigation", () => ({
  unstable_rethrow: mocks.unstableRethrow,
}));

function favoriteFormData() {
  const formData = new FormData();
  formData.set("exerciseId", "exercise_1");
  return formData;
}

describe("favorite action error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserId.mockResolvedValue("user_1");
    mocks.findUnique.mockResolvedValue(null);
  });

  it("maps a missing referenced exercise to NOT_FOUND", async () => {
    mocks.create.mockRejectedValue({ code: "P2003" });

    await expect(
      toggleFavoriteExercise(favoriteFormData())
    ).rejects.toMatchObject({
      name: "ActionError",
      code: "NOT_FOUND",
      message: "The selected exercise could not be found.",
    });
  });

  it("maps a concurrent favorite write to CONFLICT", async () => {
    mocks.create.mockRejectedValue({ code: "P2002" });

    await expect(
      toggleFavoriteExercise(favoriteFormData())
    ).rejects.toMatchObject({
      name: "ActionError",
      code: "CONFLICT",
      message: "The favorite changed at the same time. Please try again.",
    });
  });

  it("preserves successful favorite creation behavior", async () => {
    mocks.create.mockResolvedValue({ id: "favorite_1" });

    await expect(
      toggleFavoriteExercise(favoriteFormData())
    ).resolves.toBeUndefined();
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        exerciseId: "exercise_1",
      },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/exercises");
  });
});
