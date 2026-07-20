import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findRoutine: vi.fn(),
  findExercises: vi.fn(),
  startRoutine: vi.fn(),
  updateRoutine: vi.fn(),
  updateRoutineWithState: vi.fn(),
  deleteRoutine: vi.fn(),
  addExerciseToRoutine: vi.fn(),
  addExerciseToRoutineWithState: vi.fn(),
  updateExerciseInRoutine: vi.fn(),
  updateExerciseInRoutineWithState: vi.fn(),
  deleteExerciseFromRoutine: vi.fn(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/db", () => ({
  db: {
    exercise: {
      findMany: mocks.findExercises,
    },
    workoutTemplate: {
      findFirst: mocks.findRoutine,
    },
  },
}));

vi.mock("@/app/actions/routines", () => ({
  startRoutine: mocks.startRoutine,
  updateRoutine: mocks.updateRoutine,
  updateRoutineWithState: mocks.updateRoutineWithState,
  deleteRoutine: mocks.deleteRoutine,
  addExerciseToRoutine: mocks.addExerciseToRoutine,
  addExerciseToRoutineWithState: mocks.addExerciseToRoutineWithState,
  updateExerciseInRoutine: mocks.updateExerciseInRoutine,
  updateExerciseInRoutineWithState: mocks.updateExerciseInRoutineWithState,
  deleteExerciseFromRoutine: mocks.deleteExerciseFromRoutine,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  notFound: mocks.notFound,
}));

import RoutineDetailPage from "./page";

const longRoutineTitle =
  "Upper-body strength and controlled hypertrophy with a deliberately long routine name";
const longDescription =
  "A deliberately detailed routine description that remains available to assistive technology while wrapping safely across narrow mobile screens.";

const populatedRoutine = {
  id: "routine-1",
  title: longRoutineTitle,
  goal: "Strength and controlled hypertrophy",
  description: longDescription,
  exercises: [
    {
      id: "template-exercise-1",
      name: "Bench Press",
      sets: 3,
      reps: "8-10",
      notes: "Controlled tempo",
      order: 0,
    },
    {
      id: "template-exercise-2",
      name: "Cable Row",
      sets: 4,
      reps: null,
      notes: null,
      order: 1,
    },
  ],
};

async function renderPage() {
  render(
    await RoutineDetailPage({
      params: Promise.resolve({ routineId: "routine-1" }),
    }),
  );
}

describe("RoutineDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.findRoutine.mockResolvedValue(populatedRoutine);
    mocks.findExercises.mockResolvedValue([]);
    mocks.startRoutine.mockResolvedValue(undefined);
    mocks.updateRoutine.mockResolvedValue(undefined);
    mocks.updateRoutineWithState.mockResolvedValue({
      status: "success",
      message: "Routine updated.",
      submittedAt: 1,
    });
    mocks.deleteRoutine.mockResolvedValue(undefined);
    mocks.addExerciseToRoutine.mockResolvedValue(undefined);
    mocks.addExerciseToRoutineWithState.mockResolvedValue({
      status: "success",
      message: "Exercise added to routine.",
      submittedAt: 1,
    });
    mocks.updateExerciseInRoutine.mockResolvedValue(undefined);
    mocks.updateExerciseInRoutineWithState.mockResolvedValue({
      status: "success",
      message: "Exercise plan updated.",
      submittedAt: 1,
    });
    mocks.deleteExerciseFromRoutine.mockResolvedValue(undefined);
  });

  it("renders a compact long-content-safe routine header", async () => {
    await renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: longRoutineTitle }),
    ).toHaveClass("[overflow-wrap:anywhere]");
    expect(screen.getByText(longDescription)).toHaveClass("line-clamp-3");
    expect(screen.getByRole("link", { name: "Back to routines" })).toHaveAttribute(
      "href",
      "/routines",
    );

    const details = screen.getByRole("group", { name: "Routine details" });
    expect(within(details).getByText("Strength and controlled hypertrophy")).toBeVisible();
    expect(within(details).getByText("2 exercises")).toBeVisible();
  });

  it("keeps Start primary and Edit secondary with existing wiring", async () => {
    await renderPage();

    const startButton = screen.getByRole("button", {
      name: `Start ${longRoutineTitle} workout`,
    });
    const editButton = screen.getByRole("button", {
      name: `Edit ${longRoutineTitle} routine`,
    });

    expect(startButton).toHaveClass("min-h-12", "bg-emerald-400");
    expect(editButton).toHaveClass("min-h-12", "focus-visible:ring-2");
    expect(screen.getAllByRole("button", { name: /Start .* workout/ })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /Edit .* routine/ })).toHaveLength(1);

    const startForm = startButton.closest("form");
    expect(startForm?.querySelector('input[name="routineId"]')).toHaveValue("routine-1");
    fireEvent.submit(startForm!);

    await waitFor(() => expect(mocks.startRoutine).toHaveBeenCalledOnce());
    expect(mocks.startRoutine.mock.calls[0]?.[0]).toBeInstanceOf(FormData);
  });

  it("places the plan before Add Exercise and deletion for populated routines", async () => {
    await renderPage();

    const plannedHeading = screen.getByRole("heading", { name: "Planned exercises" });
    const addHeading = screen.getByRole("heading", { name: "Add exercise" });
    const settingsHeading = screen.getByRole("heading", { name: "Routine settings" });

    expect(
      plannedHeading.compareDocumentPosition(addHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      addHeading.compareDocumentPosition(settingsHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const plan = screen.getByRole("list", { name: "Planned exercises" });
    const rows = within(plan).getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByRole("heading", { name: "Bench Press" })).toBeVisible();
    expect(within(rows[1]).getByRole("heading", { name: "Cable Row" })).toBeVisible();
  });

  it("renders compact prescriptions, optional notes, order, and specific actions", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    await renderPage();

    const rows = within(
      screen.getByRole("list", { name: "Planned exercises" }),
    ).getAllByRole("listitem");
    const benchRow = rows[0];
    const cableRow = rows[1];

    expect(within(benchRow).getByText("1")).toBeInTheDocument();
    expect(within(cableRow).getByText("2")).toBeInTheDocument();
    expect(within(benchRow).getByText("3 sets × 8-10")).toBeVisible();
    expect(within(cableRow).getByText("4 sets")).toBeVisible();
    expect(within(cableRow).queryByText("Notes")).not.toBeInTheDocument();

    const notesSummary = within(benchRow).getByText("Notes");
    expect(notesSummary.closest("details")).toHaveTextContent("Controlled tempo");

    const editButton = within(benchRow).getByRole("button", {
      name: "Edit Bench Press plan",
    });
    const removeButton = within(benchRow).getByRole("button", {
      name: "Remove Bench Press from routine",
    });
    expect(editButton).toHaveClass("min-h-11", "focus-visible:ring-2");
    expect(removeButton).toHaveClass("min-h-11", "focus-visible:ring-2");

    fireEvent.click(editButton);
    const editForm = screen
      .getByRole("button", { name: "Save exercise" })
      .closest("form");
    expect(editForm?.querySelector('input[name="routineId"]')).toHaveValue(
      "routine-1",
    );
    expect(
      editForm?.querySelector('input[name="templateExerciseId"]'),
    ).toHaveValue("template-exercise-1");
    expect(editForm?.querySelector('input[name="sets"]')).toHaveValue(3);
    expect(editForm?.querySelector('input[name="reps"]')).toHaveValue("8-10");
    expect(editForm?.querySelector('textarea[name="notes"]')).toHaveValue(
      "Controlled tempo",
    );

    const removeForm = removeButton.closest("form");
    expect(removeForm?.querySelector('input[name="routineId"]')).toHaveValue(
      "routine-1",
    );
    expect(
      removeForm?.querySelector('input[name="templateExerciseId"]'),
    ).toHaveValue("template-exercise-1");
    fireEvent.click(removeButton);
    expect(confirm).toHaveBeenCalledWith("Remove Bench Press from this routine?");
    expect(mocks.deleteExerciseFromRoutine).not.toHaveBeenCalled();
    confirm.mockRestore();
  });

  it("keeps long exercise names and notes available without widening rows", async () => {
    const longExerciseName =
      "Single-arm cable row with rotation and an intentionally long exercise name";
    const longNote =
      "Keep the rib cage stacked, pause at full contraction, and use a controlled return for every repetition in the planned set.";
    mocks.findRoutine.mockResolvedValue({
      ...populatedRoutine,
      exercises: [
        {
          id: "template-exercise-long",
          name: longExerciseName,
          sets: 5,
          reps: "12-15 with a controlled eccentric",
          notes: longNote,
          order: 7,
        },
      ],
    });

    await renderPage();

    const row = screen.getByRole("listitem");
    expect(
      within(row).getByRole("heading", { name: longExerciseName }),
    ).toHaveClass("[overflow-wrap:anywhere]");
    expect(within(row).getByText("5 sets × 12-15 with a controlled eccentric")).toHaveClass(
      "[overflow-wrap:anywhere]",
    );
    expect(within(row).getByText(longNote)).toHaveClass(
      "[overflow-wrap:anywhere]",
    );
    expect(
      within(row).getByRole("button", { name: `Edit ${longExerciseName} plan` }),
    ).toBeInTheDocument();
    expect(
      within(row).getByRole("button", {
        name: `Remove ${longExerciseName} from routine`,
      }),
    ).toBeInTheDocument();
  });

  it("moves Delete below the plan while preserving its confirmation and form wiring", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    await renderPage();

    const plannedHeading = screen.getByRole("heading", { name: "Planned exercises" });
    const deleteButton = screen.getByRole("button", {
      name: `Delete ${longRoutineTitle} routine`,
    });
    const settingsSection = screen
      .getByRole("heading", { name: "Routine settings" })
      .closest("section")!;

    expect(settingsSection).toContainElement(deleteButton);
    expect(
      plannedHeading.compareDocumentPosition(deleteButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(deleteButton).toHaveClass("min-h-11", "focus-visible:ring-2");
    expect(screen.getAllByRole("button", { name: /Delete .* routine/ })).toHaveLength(1);

    const deleteForm = deleteButton.closest("form");
    expect(deleteForm?.querySelector('input[name="routineId"]')).toHaveValue("routine-1");
    fireEvent.click(deleteButton);

    expect(confirm).toHaveBeenCalledWith(
      `Delete ${longRoutineTitle}? This cannot be undone.`,
    );
    await waitFor(() => expect(mocks.deleteRoutine).toHaveBeenCalledOnce());
    confirm.mockRestore();
  });

  it("keeps empty-routine Start behavior truthful and Add Exercise prominent", async () => {
    mocks.findRoutine.mockResolvedValue({
      ...populatedRoutine,
      description: null,
      exercises: [],
    });
    await renderPage();

    expect(screen.getByText("0 exercises")).toBeVisible();
    expect(
      screen.getByText(
        "This routine has no planned exercises. Starting it will create an empty workout you can build as you train.",
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: `Start ${longRoutineTitle} workout` }),
    ).toBeVisible();

    const addHeading = screen.getByRole("heading", { name: "Add exercise" });
    const plannedHeading = screen.getByRole("heading", { name: "Planned exercises" });
    expect(
      addHeading.compareDocumentPosition(plannedHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByText("No exercises added yet")).toBeVisible();
  });
});
