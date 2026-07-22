import fs from "node:fs";
import path from "node:path";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WorkoutMobileBar } from "./workout-mobile-bar";
import { RestTimer } from "./rest-timer";
import { WorkoutExperienceProvider } from "./workout-experience-provider";

vi.mock("@/app/actions/workouts", () => ({
  finishWorkout: vi.fn(),
  reopenWorkout: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: vi.fn(),
}));

const originalInnerHeight = Object.getOwnPropertyDescriptor(window, "innerHeight");
const originalMatchMedia = Object.getOwnPropertyDescriptor(window, "matchMedia");
const originalVisualViewport = Object.getOwnPropertyDescriptor(
  window,
  "visualViewport",
);
const originalScrollIntoView = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "scrollIntoView",
);

class TestVisualViewport extends EventTarget {
  height = 800;
  offsetTop = 0;
}

function setWindowValue(name: string, value: unknown) {
  Object.defineProperty(window, name, {
    configurable: true,
    writable: true,
    value,
  });
}

function installMobileViewport({
  desktop = false,
  withVisualViewport = true,
} = {}) {
  const viewport = new TestVisualViewport();
  setWindowValue("innerHeight", 800);
  setWindowValue("visualViewport", withVisualViewport ? viewport : undefined);
  setWindowValue("matchMedia", () => ({
    matches: desktop,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  return viewport;
}

function mockScrollIntoView() {
  const mock = vi.fn();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: mock,
  });
  return mock;
}

function renderActiveDockWithEditor() {
  return render(
    <>
      <form data-add-set-editor>
        <input aria-label="Set weight" />
      </form>
      <button type="button">Outside editor</button>
      <WorkoutMobileBar
        workoutId="workout-1"
        workoutStatus="active"
        totalSets={7}
        duration="In progress"
      />
    </>,
  );
}

afterEach(() => {
  for (const [name, descriptor] of [
    ["innerHeight", originalInnerHeight],
    ["matchMedia", originalMatchMedia],
    ["visualViewport", originalVisualViewport],
  ] as const) {
    if (descriptor) {
      Object.defineProperty(window, name, descriptor);
    } else {
      Reflect.deleteProperty(window, name);
    }
  }

  if (originalScrollIntoView) {
    Object.defineProperty(
      HTMLElement.prototype,
      "scrollIntoView",
      originalScrollIntoView,
    );
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
  }
});

describe("WorkoutMobileBar", () => {
  it("renders active workout status, concise metrics, and Finish", () => {
    render(
      <WorkoutMobileBar
        workoutId="workout-1"
        workoutStatus="active"
        totalSets={7}
        duration="In progress"
      />
    );

    const dock = screen.getByRole("complementary", {
      name: "Workout controls",
    });

    expect(within(dock).getByText("Active workout")).toBeVisible();
    expect(within(dock).getByText(/7 sets/)).toHaveTextContent(
      "7 sets · Duration In progress"
    );
    expect(
      within(dock).getByRole("button", { name: "Finish workout" })
    ).toBeVisible();
  });

  it("shows a running rest timer and opens its controls from the dock", async () => {
    const user = userEvent.setup();
    mockScrollIntoView();
    render(
      <WorkoutExperienceProvider>
        <RestTimer />
        <WorkoutMobileBar
          workoutId="workout-1"
          workoutStatus="active"
          totalSets={7}
          duration="In progress"
        />
      </WorkoutExperienceProvider>,
    );

    const timerPanel = screen.getByText("Rest timer").closest("details");
    expect(timerPanel).not.toHaveAttribute("open");
    await user.click(screen.getByText("Timer controls"));
    await user.click(screen.getByRole("button", { name: "Start" }));
    await user.click(screen.getByText(/Running/));

    const dockTimer = screen.getByRole("button", {
      name: /Rest timer 2:00, open controls/,
    });
    expect(timerPanel).not.toHaveAttribute("open");
    await user.click(dockTimer);
    expect(timerPanel).toHaveAttribute("open");
    await waitFor(() => expect(timerPanel?.querySelector("summary")).toHaveFocus());
  });

  it("preserves lifecycle form wiring and the workout identifier", () => {
    render(
      <WorkoutMobileBar
        workoutId="workout-42"
        workoutStatus="active"
        totalSets={1}
        duration="In progress"
      />
    );

    const finishButton = screen.getByRole("button", {
      name: "Finish workout",
    });
    const lifecycleForm = finishButton.closest("form");

    expect(lifecycleForm).not.toBeNull();
    expect(
      within(lifecycleForm!).getByDisplayValue("workout-42")
    ).toHaveAttribute("name", "workoutId");
  });

  it("does not duplicate Reopen controls for completed workouts", () => {
    render(
      <WorkoutMobileBar
        workoutId="workout-1"
        workoutStatus="completed"
        totalSets={7}
        duration="52m"
      />
    );

    expect(
      screen.queryByRole("complementary", { name: "Workout controls" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reopen workout" })
    ).not.toBeInTheDocument();
  });

  it("is mobile-only and positions itself from the safe-area-aware nav height", () => {
    render(
      <WorkoutMobileBar
        workoutId="workout-1"
        workoutStatus="active"
        totalSets={99999}
        duration="In progress"
      />
    );

    const dock = screen.getByRole("complementary", {
      name: "Workout controls",
    });

    expect(dock).toHaveClass("md:hidden");
    expect(dock.className).toContain("var(--mobile-nav-height)");
  });

  it("keeps shell and page clearance for both fixed mobile regions", () => {
    const appLayout = fs.readFileSync(
      path.join(process.cwd(), "src/app/(app)/layout.tsx"),
      "utf8"
    );
    const workoutPage = fs.readFileSync(
      path.join(process.cwd(), "src/app/(app)/workouts/[workoutId]/page.tsx"),
      "utf8"
    );

    expect(appLayout).toContain(
      "--mobile-nav-height:calc(3.75rem_+_max(0.75rem,env(safe-area-inset-bottom)))"
    );
    expect(appLayout).toContain(
      "pb-[calc(5rem+env(safe-area-inset-bottom))]"
    );
    expect(workoutPage).toContain(
      "pb-[calc(var(--mobile-nav-height)_+_7rem)]",
    );
  });

  it("hides for a meaningful Visual Viewport reduction while an Add Set field is focused", async () => {
    const viewport = installMobileViewport();
    const scrollIntoView = mockScrollIntoView();
    renderActiveDockWithEditor();
    const weight = screen.getByRole("textbox", { name: "Set weight" });
    vi.spyOn(weight, "getBoundingClientRect").mockReturnValue({
      bottom: 760,
    } as DOMRect);

    weight.focus();
    viewport.height = 500;
    viewport.dispatchEvent(new Event("resize"));

    await waitFor(() =>
      expect(
        screen.queryByRole("complementary", { name: "Workout controls" }),
      ).not.toBeInTheDocument(),
    );
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
  });

  it("restores the dock when the keyboard closes or focus leaves the editor", async () => {
    const viewport = installMobileViewport();
    mockScrollIntoView();
    const user = userEvent.setup();
    renderActiveDockWithEditor();
    const weight = screen.getByRole("textbox", { name: "Set weight" });
    weight.focus();
    viewport.height = 500;
    viewport.dispatchEvent(new Event("resize"));
    await waitFor(() =>
      expect(screen.queryByLabelText("Workout controls")).not.toBeInTheDocument(),
    );

    viewport.height = 800;
    viewport.dispatchEvent(new Event("resize"));
    await waitFor(() =>
      expect(screen.getByLabelText("Workout controls")).toBeInTheDocument(),
    );

    viewport.height = 500;
    viewport.dispatchEvent(new Event("resize"));
    await waitFor(() =>
      expect(screen.queryByLabelText("Workout controls")).not.toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "Outside editor" }));
    await waitFor(() =>
      expect(screen.getByLabelText("Workout controls")).toBeInTheDocument(),
    );
  });

  it("uses the window-height fallback when Visual Viewport is unavailable", async () => {
    installMobileViewport({ withVisualViewport: false });
    renderActiveDockWithEditor();
    screen.getByRole("textbox", { name: "Set weight" }).focus();
    setWindowValue("innerHeight", 500);
    fireEvent(window, new Event("resize"));

    await waitFor(() =>
      expect(screen.queryByLabelText("Workout controls")).not.toBeInTheDocument(),
    );
  });

  it("ignores minor viewport changes without causing a layout jump", async () => {
    const viewport = installMobileViewport();
    renderActiveDockWithEditor();
    screen.getByRole("textbox", { name: "Set weight" }).focus();
    viewport.height = 710;
    viewport.dispatchEvent(new Event("resize"));

    await waitFor(() =>
      expect(screen.getByLabelText("Workout controls")).toBeInTheDocument(),
    );
  });

  it("does not suppress the dock at the desktop breakpoint", async () => {
    const viewport = installMobileViewport({ desktop: true });
    renderActiveDockWithEditor();
    screen.getByRole("textbox", { name: "Set weight" }).focus();
    viewport.height = 500;
    viewport.dispatchEvent(new Event("resize"));

    await waitFor(() =>
      expect(screen.getByLabelText("Workout controls")).toBeInTheDocument(),
    );
  });

  it("does not suppress the dock for editable fields outside Add Set", async () => {
    const viewport = installMobileViewport();
    render(
      <>
        <input aria-label="Edit Set weight" />
        <WorkoutMobileBar
          workoutId="workout-1"
          workoutStatus="active"
          totalSets={7}
          duration="In progress"
        />
      </>,
    );
    screen.getByRole("textbox", { name: "Edit Set weight" }).focus();
    viewport.height = 500;
    viewport.dispatchEvent(new Event("resize"));

    await waitFor(() =>
      expect(screen.getByLabelText("Workout controls")).toBeInTheDocument(),
    );
  });

  it("removes viewport and focus listeners on unmount", () => {
    const viewport = installMobileViewport();
    const removeViewportListener = vi.spyOn(viewport, "removeEventListener");
    const removeWindowListener = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderActiveDockWithEditor();

    unmount();

    expect(removeViewportListener).toHaveBeenCalledWith(
      "resize",
      expect.any(Function),
    );
    expect(removeViewportListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
    );
    expect(removeWindowListener).toHaveBeenCalledWith(
      "focusin",
      expect.any(Function),
    );
    expect(removeWindowListener).toHaveBeenCalledWith(
      "focusout",
      expect.any(Function),
    );
    removeWindowListener.mockRestore();
  });
});
