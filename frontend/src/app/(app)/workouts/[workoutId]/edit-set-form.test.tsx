import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EditSetForm } from "./edit-set-form";

const updateSetMock = vi.hoisted(() => vi.fn());
const toastMock = vi.hoisted(() =>
  Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  })
);

vi.mock("@/app/actions/workout-exercises", () => ({
  updateSetInExerciseWithState: updateSetMock,
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

const workoutSet = {
  id: "set-3",
  setNumber: 3,
  weight: 315,
  reps: 5,
  rir: 2,
  tempo: "3-1-1",
  notes: "Controlled eccentric.",
};

function renderEditSet() {
  return render(<EditSetForm workoutId="workout-1" set={workoutSet} />);
}

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  const trigger = screen.getByRole("button", { name: "Edit set 3" });
  await user.click(trigger);
  const dialog = screen.getByRole("dialog", { name: "Edit set 3" });
  await waitFor(() => expect(screen.getByLabelText("Weight")).toHaveFocus());

  return { dialog, trigger };
}

describe("EditSetForm", () => {
  beforeEach(() => {
    updateSetMock.mockReset();
    updateSetMock.mockImplementation(async () => ({
      status: "success",
      message: "Set updated.",
      submittedAt: Date.now(),
    }));
    toastMock.mockClear();
    toastMock.success.mockClear();
    toastMock.error.mockClear();
    document.body.style.overflow = "";
  });

  it("opens a labelled modal sheet, locks scrolling, and focuses Weight", async () => {
    const user = userEvent.setup();
    renderEditSet();

    const { dialog, trigger } = await openDialog(user);

    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription(
      "Update load, reps, effort, tempo, or notes."
    );
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getByLabelText("Weight")).toHaveAttribute("name", "weight");
    expect(screen.getByLabelText("Reps")).toHaveAttribute("name", "reps");
    expect(screen.getByLabelText("RIR")).toHaveAttribute("name", "rir");
    expect(screen.getByLabelText("Tempo")).toHaveAttribute("name", "tempo");
    expect(screen.getByLabelText("Notes")).toHaveAttribute("name", "notes");
  });

  it("closes on Escape, restores trigger focus, and unlocks scrolling", async () => {
    const user = userEvent.setup();
    renderEditSet();
    const { trigger } = await openDialog(user);

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(document.body.style.overflow).toBe("");
  });

  it("closes from Cancel and restores the exact trigger", async () => {
    const user = userEvent.setup();
    renderEditSet();
    const { trigger } = await openDialog(user);

    await user.click(
      screen.getByRole("button", { name: "Cancel editing set 3" })
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("contains forward and backward Tab navigation inside the sheet", async () => {
    const user = userEvent.setup();
    renderEditSet();
    await openDialog(user);
    const cancel = screen.getByRole("button", {
      name: "Cancel editing set 3",
    });
    const save = screen.getByRole("button", { name: "Save changes" });

    save.focus();
    await user.tab();
    expect(cancel).toHaveFocus();

    await user.tab({ shift: true });
    expect(save).toHaveFocus();
  });

  it("submits unchanged field names, then closes and restores focus", async () => {
    const user = userEvent.setup();
    const { container } = renderEditSet();
    const { trigger } = await openDialog(user);

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(updateSetMock).toHaveBeenCalledTimes(1));
    const submittedData = updateSetMock.mock.calls[0][1] as FormData;
    expect(submittedData.get("workoutId")).toBe("workout-1");
    expect(submittedData.get("workoutSetId")).toBe("set-3");
    expect(submittedData.get("weight")).toBe("315");
    expect(submittedData.get("reps")).toBe("5");
    expect(submittedData.get("rir")).toBe("2");
    expect(submittedData.get("tempo")).toBe("3-1-1");
    expect(submittedData.get("notes")).toBe("Controlled eccentric.");
    expect(
      container.querySelector('input[name="workoutSetId"]')
    ).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Set updated.")
    );
  });

  it("keeps failed input and focus in the open sheet", async () => {
    updateSetMock.mockResolvedValueOnce({
      status: "error",
      code: "VALIDATION_ERROR",
      message: "Please check the form and try again.",
      submittedAt: Number.MAX_SAFE_INTEGER,
    });
    const user = userEvent.setup();
    renderEditSet();
    await openDialog(user);
    const weight = screen.getByLabelText("Weight");

    await user.clear(weight);
    await user.type(weight, "325");
    const save = screen.getByRole("button", { name: "Save changes" });
    await user.click(save);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please check the form and try again."
    );
    expect(screen.getByRole("dialog", { name: "Edit set 3" })).toBeVisible();
    expect(weight).toHaveValue(325);
    expect(save).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");
    expect(toastMock.error).toHaveBeenCalledWith(
      "Please check the form and try again."
    );
  });

  it("keeps Enter in multiline notes from submitting", async () => {
    const user = userEvent.setup();
    renderEditSet();
    await openDialog(user);
    const notes = screen.getByLabelText("Notes");

    await user.clear(notes);
    await user.type(notes, "First line{enter}Second line");

    expect(notes).toHaveValue("First line\nSecond line");
    expect(updateSetMock).not.toHaveBeenCalled();
  });

  it("keeps only one Edit Set dialog open", async () => {
    const user = userEvent.setup();
    render(
      <>
        <EditSetForm workoutId="workout-1" set={workoutSet} />
        <EditSetForm
          workoutId="workout-1"
          set={{ ...workoutSet, id: "set-4", setNumber: 4 }}
        />
      </>
    );

    await user.click(screen.getByRole("button", { name: "Edit set 3" }));
    await waitFor(() => expect(screen.getByLabelText("Weight")).toHaveFocus());
    fireEvent.click(screen.getByRole("button", { name: "Edit set 4" }));

    await waitFor(() =>
      expect(screen.getAllByRole("dialog")).toHaveLength(1)
    );
    expect(screen.getByRole("dialog", { name: "Edit set 4" })).toBeVisible();
  });
});
