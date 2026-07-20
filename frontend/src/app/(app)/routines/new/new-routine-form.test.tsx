import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NewRoutineForm } from "./new-routine-form";

const createRoutineMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/actions/routines", () => ({
  createRoutineWithState: createRoutineMock,
}));

describe("NewRoutineForm", () => {
  beforeEach(() => {
    createRoutineMock.mockReset();
    createRoutineMock.mockResolvedValue({
      status: "error",
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
      submittedAt: 1,
    });
  });

  it("submits unchanged field names and preserves values on server failure", async () => {
    const user = userEvent.setup();
    render(<NewRoutineForm />);
    await user.type(screen.getByLabelText("Routine title"), "Push Day");
    await user.selectOptions(screen.getByLabelText("Goal"), "Hypertrophy");
    await user.type(screen.getByLabelText("Description"), "Chest and triceps");
    await user.click(screen.getByRole("button", { name: "Create routine" }));

    await waitFor(() => expect(createRoutineMock).toHaveBeenCalledTimes(1));
    const submitted = createRoutineMock.mock.calls[0][1] as FormData;
    expect(submitted.get("title")).toBe("Push Day");
    expect(submitted.get("goal")).toBe("Hypertrophy");
    expect(submitted.get("description")).toBe("Chest and triceps");
    expect(screen.getByLabelText("Routine title")).toHaveValue("Push Day");
    expect(screen.getByLabelText("Description")).toHaveValue("Chest and triceps");
    expect(await screen.findByRole("alert")).toHaveFocus();
  });

  it("uses a 48px pending control and blocks duplicate submission", async () => {
    createRoutineMock.mockImplementation(() => new Promise(() => undefined));
    const user = userEvent.setup();
    render(<NewRoutineForm />);
    await user.type(screen.getByLabelText("Routine title"), "Push Day");
    await user.click(screen.getByRole("button", { name: "Create routine" }));

    const pendingButton = await screen.findByRole("button", {
      name: "Creating routine...",
    });
    expect(pendingButton).toBeDisabled();
    expect(pendingButton).toHaveClass("min-h-12");
    await user.click(pendingButton);
    expect(createRoutineMock).toHaveBeenCalledTimes(1);
  });
});
