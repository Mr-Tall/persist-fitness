import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NewWorkoutForm } from "./new-workout-form";

const createWorkoutMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/actions/workouts", () => ({
  createWorkoutWithState: createWorkoutMock,
}));

const errorState = {
  status: "error" as const,
  code: "VALIDATION_ERROR" as const,
  message: "Please check the workout details and try again.",
  submittedAt: 1,
};

describe("NewWorkoutForm", () => {
  beforeEach(() => {
    createWorkoutMock.mockReset();
    createWorkoutMock.mockResolvedValue(errorState);
  });

  it("preserves the field contract and entered values after failure", async () => {
    const user = userEvent.setup();
    render(<NewWorkoutForm today="2026-07-19" />);

    await user.type(screen.getByLabelText("Workout title"), "Upper Strength");
    await user.selectOptions(screen.getByLabelText("Goal"), "Strength");
    fireEvent.change(screen.getByLabelText("Date"), {
      target: { value: "2026-07-18" },
    });
    await user.type(screen.getByLabelText("Notes"), "Heavy compounds");
    await user.click(
      screen.getByRole("button", { name: "Create workout and add exercises" }),
    );

    await waitFor(() => expect(createWorkoutMock).toHaveBeenCalledTimes(1));
    const submitted = createWorkoutMock.mock.calls[0][1] as FormData;
    expect(submitted.get("title")).toBe("Upper Strength");
    expect(submitted.get("goal")).toBe("Strength");
    expect(submitted.get("date")).toBe("2026-07-18");
    expect(submitted.get("notes")).toBe("Heavy compounds");
    expect(screen.getByLabelText("Workout title")).toHaveValue("Upper Strength");
    expect(screen.getByLabelText("Notes")).toHaveValue("Heavy compounds");
  });

  it("announces and focuses safe failures", async () => {
    const user = userEvent.setup();
    render(<NewWorkoutForm today="2026-07-19" />);
    await user.type(screen.getByLabelText("Workout title"), "Push Day");
    await user.click(
      screen.getByRole("button", { name: "Create workout and add exercises" }),
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(errorState.message);
    expect(alert).toHaveFocus();
    expect(alert.closest("form")).toHaveAttribute("aria-describedby", alert.id);
  });

  it("disables the primary action and prevents duplicate pending submissions", async () => {
    createWorkoutMock.mockImplementation(() => new Promise(() => undefined));
    const user = userEvent.setup();
    render(<NewWorkoutForm today="2026-07-19" />);
    await user.type(screen.getByLabelText("Workout title"), "Push Day");

    await user.click(
      screen.getByRole("button", { name: "Create workout and add exercises" }),
    );

    const pendingButton = await screen.findByRole("button", {
      name: "Creating workout...",
    });
    expect(pendingButton).toBeDisabled();
    await user.click(pendingButton);
    expect(createWorkoutMock).toHaveBeenCalledTimes(1);
  });
});
