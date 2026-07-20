import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SubmitButton } from "@/components/ui/submit-button";
import { ProfileForm } from "./profile-form";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  saveProfile: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/app/actions/profile", () => ({
  saveProfileWithState: mocks.saveProfile,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess },
}));

function ProfileFields() {
  return (
    <>
      <label htmlFor="primaryGoal">Primary goal</label>
      <input id="primaryGoal" name="primaryGoal" defaultValue="Build muscle" />
      <label htmlFor="experience">Experience level</label>
      <input id="experience" name="experience" defaultValue="Beginner" />
      <label htmlFor="trainingAge">Training age</label>
      <input id="trainingAge" name="trainingAge" defaultValue="1 year" />
      <label htmlFor="availableDays">Available days</label>
      <input id="availableDays" name="availableDays" defaultValue="3" />
      <label htmlFor="preferredSplit">Preferred split</label>
      <input id="preferredSplit" name="preferredSplit" defaultValue="Full Body" />
      <label>
        <input name="equipment" type="checkbox" value="Barbell" defaultChecked />
        Barbell
      </label>
      <SubmitButton className="min-h-12" pendingText="Saving profile...">
        Save profile
      </SubmitButton>
    </>
  );
}

describe("ProfileForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.saveProfile.mockResolvedValue({
      status: "error",
      code: "VALIDATION_ERROR",
      message: "Please check your profile details and try again.",
      submittedAt: 1,
    });
  });

  it("preserves submitted fields and focuses an accessible failure", async () => {
    const user = userEvent.setup();
    render(
      <ProfileForm>
        <ProfileFields />
      </ProfileForm>,
    );

    await user.clear(screen.getByLabelText("Primary goal"));
    await user.type(screen.getByLabelText("Primary goal"), "Get stronger");
    await user.clear(screen.getByLabelText("Training age"));
    await user.type(screen.getByLabelText("Training age"), "2 years");
    await user.click(screen.getByRole("button", { name: "Save profile" }));

    await waitFor(() => expect(mocks.saveProfile).toHaveBeenCalledTimes(1));
    const submitted = mocks.saveProfile.mock.calls[0][1] as FormData;
    expect(submitted.get("primaryGoal")).toBe("Get stronger");
    expect(submitted.get("experience")).toBe("Beginner");
    expect(submitted.get("trainingAge")).toBe("2 years");
    expect(submitted.get("availableDays")).toBe("3");
    expect(submitted.get("preferredSplit")).toBe("Full Body");
    expect(submitted.getAll("equipment")).toEqual(["Barbell"]);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "Please check your profile details and try again.",
    );
    expect(alert).toHaveFocus();
    expect(screen.getByLabelText("Primary goal")).toHaveValue("Get stronger");
    expect(screen.getByLabelText("Training age")).toHaveValue("2 years");
  });

  it("shows confirmed saved feedback and navigates to the existing destination", async () => {
    mocks.saveProfile.mockResolvedValueOnce({
      status: "success",
      message: "Profile saved.",
      submittedAt: 2,
    });
    const user = userEvent.setup();
    render(
      <ProfileForm>
        <ProfileFields />
      </ProfileForm>,
    );

    await user.click(screen.getByRole("button", { name: "Save profile" }));

    await waitFor(() =>
      expect(mocks.toastSuccess).toHaveBeenCalledWith("Profile saved."),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Profile saved.");
    expect(mocks.push).toHaveBeenCalledWith("/dashboard");
  });

  it("disables the submit control while saving to prevent duplicates", async () => {
    mocks.saveProfile.mockImplementation(() => new Promise(() => undefined));
    const user = userEvent.setup();
    render(
      <ProfileForm>
        <ProfileFields />
      </ProfileForm>,
    );

    await user.click(screen.getByRole("button", { name: "Save profile" }));
    const pendingButton = await screen.findByRole("button", {
      name: "Saving profile...",
    });
    expect(pendingButton).toBeDisabled();
    await user.click(pendingButton);
    expect(mocks.saveProfile).toHaveBeenCalledTimes(1);
  });
});
