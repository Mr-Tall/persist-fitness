import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EditRoutineForm } from "./edit-routine-form";

const updateRoutineMock = vi.hoisted(() => vi.fn());
const toastMock = vi.hoisted(() =>
  Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
);

vi.mock("@/app/actions/routines", () => ({
  updateRoutineWithState: updateRoutineMock,
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

const routine = {
  id: "routine-1",
  title: "Upper Body Strength",
  goal: "Strength",
  description: "Controlled compound lifts and upper-back accessories.",
};

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  const trigger = screen.getByRole("button", {
    name: "Edit Upper Body Strength routine",
  });
  await user.click(trigger);
  const dialog = screen.getByRole("dialog", { name: "Edit routine" });
  await waitFor(() => expect(screen.getByLabelText("Routine name")).toHaveFocus());
  return { dialog, trigger };
}

describe("EditRoutineForm", () => {
  beforeEach(() => {
    updateRoutineMock.mockReset();
    updateRoutineMock.mockResolvedValue({
      status: "success",
      message: "Routine updated.",
      submittedAt: Date.now(),
    });
    toastMock.mockClear();
    toastMock.success.mockClear();
    toastMock.error.mockClear();
    document.body.style.overflow = "";
  });

  it("opens a labelled modal sheet with original values and locks scrolling", async () => {
    const user = userEvent.setup();
    const { container } = render(<EditRoutineForm routine={routine} />);
    const trigger = screen.getByRole("button", {
      name: "Edit Upper Body Strength routine",
    });

    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const { dialog } = await openDialog(user);
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription(
      "Update the name, goal, or description for this routine.",
    );
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getByLabelText("Routine name")).toHaveValue(routine.title);
    expect(screen.getByLabelText("Goal")).toHaveValue(routine.goal);
    expect(screen.getByLabelText("Description")).toHaveValue(routine.description);
    expect(screen.getByLabelText("Routine name")).toHaveAttribute("name", "title");
    expect(screen.getByLabelText("Goal")).toHaveAttribute("name", "goal");
    expect(screen.getByLabelText("Description")).toHaveAttribute(
      "name",
      "description",
    );
    expect(container.querySelector('input[name="routineId"]')).toHaveValue(
      "routine-1",
    );
    expect(dialog.parentElement).toHaveClass("sm:items-center");
  });

  it("closes with Escape or Cancel and restores exact trigger focus", async () => {
    const user = userEvent.setup();
    render(<EditRoutineForm routine={routine} />);
    const { trigger } = await openDialog(user);

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(document.body.style.overflow).toBe("");

    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("closes from the named close action and contains Tab navigation", async () => {
    const user = userEvent.setup();
    render(<EditRoutineForm routine={routine} />);
    const { trigger } = await openDialog(user);
    const closeButton = screen.getByRole("button", { name: "Close edit routine" });
    const saveButton = screen.getByRole("button", { name: "Save routine" });

    closeButton.focus();
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(saveButton).toHaveFocus();
    await user.tab();
    expect(closeButton).toHaveFocus();

    await user.click(closeButton);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("submits the unchanged field contract, then closes and restores focus", async () => {
    const user = userEvent.setup();
    render(<EditRoutineForm routine={routine} />);
    const { trigger } = await openDialog(user);

    fireEvent.change(screen.getByLabelText("Routine name"), {
      target: { value: "Updated Upper Body" },
    });
    fireEvent.change(screen.getByLabelText("Goal"), {
      target: { value: "Hypertrophy" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Updated routine description." },
    });
    await user.click(screen.getByRole("button", { name: "Save routine" }));

    await waitFor(() => expect(updateRoutineMock).toHaveBeenCalledOnce());
    const formData = updateRoutineMock.mock.calls[0][1] as FormData;
    expect(formData.get("routineId")).toBe("routine-1");
    expect(formData.get("title")).toBe("Updated Upper Body");
    expect(formData.get("goal")).toBe("Hypertrophy");
    expect(formData.get("description")).toBe("Updated routine description.");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Routine updated."),
    );

    await user.click(trigger);
    expect(screen.getByLabelText("Routine name")).toHaveValue(routine.title);
    expect(screen.getByLabelText("Description")).toHaveValue(routine.description);
  });

  it("keeps failed values, focus, and a safe inline error in the open sheet", async () => {
    updateRoutineMock.mockResolvedValueOnce({
      status: "error",
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
      submittedAt: Date.now(),
    });
    const user = userEvent.setup();
    render(<EditRoutineForm routine={routine} />);
    await openDialog(user);

    const title = screen.getByLabelText("Routine name");
    const goal = screen.getByLabelText("Goal");
    const description = screen.getByLabelText("Description");
    const save = screen.getByRole("button", { name: "Save routine" });
    fireEvent.change(title, { target: { value: "My edited title" } });
    fireEvent.change(goal, { target: { value: "Technique" } });
    fireEvent.change(description, {
      target: { value: "Do not lose this detailed edit." },
    });
    await user.click(save);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again.",
    );
    expect(screen.getByRole("dialog", { name: "Edit routine" })).toBeVisible();
    expect(title).toHaveValue("My edited title");
    expect(goal).toHaveValue("Technique");
    expect(description).toHaveValue("Do not lose this detailed edit.");
    expect(save).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");
    expect(toastMock.error).toHaveBeenCalledWith(
      "Something went wrong. Please try again.",
    );
    expect(screen.queryByText(/database|prisma|connection/i)).not.toBeInTheDocument();
  });
});
