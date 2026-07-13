import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  isTrainingProfileComplete,
  MobileProfileNudge,
  type TrainingProfileCompletionFields,
} from "./mobile-profile-nudge";

const completeProfile: TrainingProfileCompletionFields = {
  primaryGoal: "Get stronger",
  experience: "Intermediate",
  availableDays: 4,
  equipment: ["Barbell"],
};

describe("MobileProfileNudge", () => {
  it("shows one setup cue when no profile exists", () => {
    render(<MobileProfileNudge profile={null} />);

    expect(
      screen.getByRole("region", { name: "Finish your training setup" })
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Finish setup" })
    ).toHaveAttribute("href", "/settings");
  });

  it("shows the same concise cue for a partial profile", () => {
    render(
      <MobileProfileNudge
        profile={{
          ...completeProfile,
          equipment: [],
        }}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Finish your training setup" })
    ).toBeVisible();
    expect(screen.getAllByRole("link", { name: "Finish setup" })).toHaveLength(
      1
    );
  });

  it("hides the cue once all required training context is present", () => {
    const { container } = render(
      <MobileProfileNudge profile={completeProfile} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("does not require the optional preferred split to be complete", () => {
    expect(isTrainingProfileComplete(completeProfile)).toBe(true);
    expect(
      isTrainingProfileComplete({
        ...completeProfile,
        primaryGoal: "   ",
      })
    ).toBe(false);
  });
});
