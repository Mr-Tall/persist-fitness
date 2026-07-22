import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findMany: vi.fn(),
  startRoutine: vi.fn(),
  deleteRoutine: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/db", () => ({
  db: {
    workoutTemplate: {
      findMany: mocks.findMany,
    },
  },
}));

vi.mock("@/app/actions/routines", () => ({
  startRoutine: mocks.startRoutine,
  deleteRoutine: mocks.deleteRoutine,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

import RoutinesPage from "./page";

const longRoutineTitle =
  "Upper-body strength and controlled hypertrophy with a deliberately long routine name";
const longExerciseName =
  "Single-arm cable-supported rear-delt row with an intentionally long movement name";

const populatedRoutines = [
  {
    id: "routine-1",
    title: longRoutineTitle,
    goal: "Strength",
    description: "A reusable upper-body session for deliberate strength progression.",
    exercises: [
      { id: "exercise-1", name: longExerciseName, order: 0 },
      { id: "exercise-2", name: "Bench Press", order: 1 },
      { id: "exercise-3", name: "Cable Row", order: 2 },
      { id: "exercise-4", name: "Triceps Extension", order: 3 },
      { id: "exercise-5", name: "Curl", order: 4 },
    ],
  },
  {
    id: "routine-2",
    title: "Mobility day",
    goal: null,
    description: null,
    exercises: [],
  },
];

describe("RoutinesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.findMany.mockResolvedValue(populatedRoutines);
    mocks.startRoutine.mockResolvedValue(undefined);
    mocks.deleteRoutine.mockResolvedValue(undefined);
  });

  it("renders the compact page hierarchy and primary create action", async () => {
    render(await RoutinesPage());

    expect(
      screen.getByRole("heading", { level: 1, name: "Workout routines" }),
    ).toBeVisible();
    expect(
      screen.getByText("Build reusable plans and get into your next workout faster."),
    ).toBeVisible();

    const createLink = screen.getByRole("link", { name: "Create routine" });
    expect(createLink).toHaveAttribute("href", "/routines/new");
    expect(createLink).toHaveClass("min-h-12", "focus-visible:ring-2");
    expect(screen.getByRole("link", { name: "Browse programs" })).toHaveAttribute(
      "href",
      "/programs",
    );
  });

  it("renders routines as compact semantic rows with exercise previews", async () => {
    render(await RoutinesPage());

    const list = screen.getByRole("list", { name: "Saved routines" });
    expect(list.children).toHaveLength(2);
    expect(list).toHaveClass("md:grid-cols-2");

    expect(
      screen.getByRole("heading", { level: 3, name: longRoutineTitle }),
    ).toBeVisible();
    expect(screen.getByText("5 exercises · Strength")).toBeVisible();

    const preview = screen.getByRole("list", {
      name: `${longRoutineTitle} exercise preview`,
    });
    expect(within(preview).getByText(longExerciseName)).toBeVisible();
    expect(within(preview).getByText("Bench Press")).toBeVisible();
    expect(within(preview).getByText("Cable Row")).toBeVisible();
    expect(within(preview).getByText("+2 more")).toBeVisible();
    expect(within(preview).queryByText("Triceps Extension")).not.toBeInTheDocument();

    expect(screen.getByText("0 exercises")).toBeVisible();
    expect(screen.getByText("No exercises added")).toBeVisible();
  });

  it("keeps Start primary and wires each action to the existing routine id", async () => {
    render(await RoutinesPage());

    const startButton = screen.getByRole("button", {
      name: `Start ${longRoutineTitle} workout`,
    });
    const editLink = screen.getByRole("link", {
      name: `Edit ${longRoutineTitle} routine`,
    });
    const deleteButton = screen.getByRole("button", {
      name: `Delete ${longRoutineTitle} routine`,
    });

    expect(startButton).toHaveClass("min-h-12", "bg-action");
    expect(editLink).toHaveClass("min-h-11", "focus-visible:ring-2");
    expect(deleteButton).toHaveClass("min-h-11", "focus-visible:ring-2");
    expect(editLink).toHaveAttribute("href", "/routines/routine-1");

    const startForm = startButton.closest("form");
    const deleteForm = deleteButton.closest("form");
    expect(startForm).not.toBeNull();
    expect(deleteForm).not.toBeNull();
    expect(startForm?.querySelector('input[name="routineId"]')).toHaveValue("routine-1");
    expect(deleteForm?.querySelector('input[name="routineId"]')).toHaveValue("routine-1");

    fireEvent.submit(startForm!);
    await waitFor(() => expect(mocks.startRoutine).toHaveBeenCalledOnce());
    expect(mocks.startRoutine.mock.calls[0]?.[0]).toBeInstanceOf(FormData);
  });

  it("preserves delete confirmation and existing delete action wiring", async () => {
    const confirm = vi
      .spyOn(window, "confirm")
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    render(await RoutinesPage());

    const deleteButton = screen.getByRole("button", {
      name: `Delete ${longRoutineTitle} routine`,
    });
    fireEvent.click(deleteButton);

    expect(confirm).toHaveBeenCalledWith(
      `Delete ${longRoutineTitle}? This cannot be undone.`,
    );
    expect(mocks.deleteRoutine).not.toHaveBeenCalled();

    fireEvent.click(deleteButton);
    await waitFor(() => expect(mocks.deleteRoutine).toHaveBeenCalledOnce());
    expect(mocks.deleteRoutine.mock.calls[0]?.[0]).toBeInstanceOf(FormData);

    confirm.mockRestore();
  });

  it("renders an actionable empty state without routine controls", async () => {
    mocks.findMany.mockResolvedValue([]);
    render(await RoutinesPage());

    expect(screen.getByText("No routines yet")).toBeVisible();
    expect(
      screen.getByText(
        "Create your first routine, add planned exercises, then start it whenever you are ready to train.",
      ),
    ).toBeVisible();

    const createLinks = screen.getAllByRole("link", { name: "Create routine" });
    expect(createLinks).toHaveLength(2);
    createLinks.forEach((link) => expect(link).toHaveAttribute("href", "/routines/new"));
    expect(screen.queryByRole("list", { name: "Saved routines" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Start .* workout/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Delete .* routine/ })).not.toBeInTheDocument();
  });
});
