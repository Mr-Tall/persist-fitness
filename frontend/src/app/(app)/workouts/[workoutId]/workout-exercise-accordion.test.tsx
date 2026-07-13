import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  reconcileCurrentExercise,
  selectDefaultExercise,
  WorkoutExerciseAccordion,
  type WorkoutExerciseAccordionItem,
} from "./workout-exercise-accordion";

function item(
  id: string,
  setCount: number,
  latestResult: string | null = null,
  hasPersonalRecord = false
): WorkoutExerciseAccordionItem {
  return {
    id,
    name: `Exercise ${id}`,
    setCount,
    latestResult,
    hasPersonalRecord,
    content: <p>Expanded content {id}</p>,
  };
}

describe("WorkoutExerciseAccordion", () => {
  it("selects the first exercise without sets, otherwise the last exercise", () => {
    expect(selectDefaultExercise([item("a", 2), item("b", 0), item("c", 0)])).toBe(
      "b"
    );
    expect(selectDefaultExercise([item("a", 2), item("b", 3)])).toBe("b");
    expect(selectDefaultExercise([])).toBeNull();
  });

  it("expands only the current exercise and switches predictably", async () => {
    const user = userEvent.setup();
    render(
      <WorkoutExerciseAccordion
        isCompleted={false}
        items={[item("a", 2), item("b", 0), item("c", 1)]}
      />
    );

    const first = screen.getByRole("button", { name: /Exercise a/ });
    const current = screen.getByRole("button", { name: /Exercise b/ });
    const third = screen.getByRole("button", { name: /Exercise c/ });

    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(current).toHaveAttribute("aria-expanded", "true");
    expect(third).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Expanded content b")).toBeVisible();
    expect(screen.queryByText("Expanded content a")).not.toBeInTheDocument();

    await user.click(first);

    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(current).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Expanded content a")).toBeVisible();
    expect(screen.queryByText("Expanded content b")).not.toBeInTheDocument();
  });

  it("shows a compact summary with count, latest result, and PR text", () => {
    render(
      <WorkoutExerciseAccordion
        isCompleted={false}
        items={[item("a", 3, "225 lb × 8", true)]}
      />
    );

    const summary = screen.getByRole("button", { name: /Exercise a/ });
    expect(within(summary).getByText("3 sets")).toBeVisible();
    expect(within(summary).getByText("Latest 225 lb × 8")).toBeVisible();
    expect(within(summary).getByText("PR")).toBeVisible();
    expect(within(summary).getByText("Current")).toBeVisible();
  });

  it("makes a newly added exercise current without resetting on ordinary refreshes", () => {
    const { rerender } = render(
      <WorkoutExerciseAccordion
        isCompleted={false}
        items={[item("a", 1), item("b", 1)]}
      />
    );

    expect(screen.getByRole("button", { name: /Exercise b/ })).toHaveAttribute(
      "aria-expanded",
      "true"
    );

    rerender(
      <WorkoutExerciseAccordion
        isCompleted={false}
        items={[item("a", 1), item("b", 1), item("c", 0)]}
      />
    );

    expect(screen.getByRole("button", { name: /Exercise b/ })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    expect(screen.getByRole("button", { name: /Exercise c/ })).toHaveAttribute(
      "aria-expanded",
      "true"
    );

    rerender(
      <WorkoutExerciseAccordion
        isCompleted={false}
        items={[item("a", 2), item("b", 2), item("c", 1)]}
      />
    );

    expect(screen.getByRole("button", { name: /Exercise c/ })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  it("selects the following neighbor when current is deleted, then the previous at the end", () => {
    const items = [item("a", 1), item("b", 0), item("c", 1)];

    expect(reconcileCurrentExercise(["a", "b", "c"], "b", [items[0], items[2]])).toBe(
      "c"
    );
    expect(reconcileCurrentExercise(["a", "b", "c"], "c", [items[0], items[1]])).toBe(
      "b"
    );
  });

  it("applies the deterministic neighbor fallback after a current exercise is deleted", () => {
    const { rerender } = render(
      <WorkoutExerciseAccordion
        isCompleted={false}
        items={[item("a", 1), item("b", 0), item("c", 1)]}
      />
    );

    expect(screen.getByRole("button", { name: /Exercise b/ })).toHaveAttribute(
      "aria-expanded",
      "true"
    );

    rerender(
      <WorkoutExerciseAccordion
        isCompleted={false}
        items={[item("a", 1), item("c", 1)]}
      />
    );

    expect(screen.getByRole("button", { name: /Exercise c/ })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  it("uses independent native disclosures for completed history", async () => {
    const user = userEvent.setup();
    render(
      <WorkoutExerciseAccordion
        isCompleted
        items={[item("a", 2, "185 lb × 10"), item("b", 1)]}
      />
    );

    const summaries = screen.getAllByText(/Exercise [ab]/).map((name) =>
      name.closest("summary")
    );

    expect(summaries[0]).not.toBeNull();
    expect(summaries[1]).not.toBeNull();
    expect(summaries[0]?.closest("details")).not.toHaveAttribute("open");

    await user.click(summaries[0]!);

    expect(summaries[0]?.closest("details")).toHaveAttribute("open");
    expect(screen.getByText("Expanded content a")).toBeVisible();
    expect(summaries[1]?.closest("details")).not.toHaveAttribute("open");
  });

  it("keeps long names wrapped without removing the disclosure control", () => {
    const longName =
      "Single-arm cable row with an intentionally long movement name for mobile layouts";
    render(
      <WorkoutExerciseAccordion
        isCompleted={false}
        items={[{ ...item("a", 1), name: longName }]}
      />
    );

    const control = screen.getByRole("button", { name: new RegExp(longName) });
    expect(control).toBeVisible();
    expect(screen.getByText(longName)).toHaveClass("break-words");
  });
});
