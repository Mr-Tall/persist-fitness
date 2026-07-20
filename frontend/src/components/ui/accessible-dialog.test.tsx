import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useId, useRef, useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { AccessibleDialog } from "./accessible-dialog";

function DialogHarness({ label = "Open dialog" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  return (
    <div data-testid={`background-${label}`}>
      <button ref={triggerRef} onClick={() => setOpen(true)} type="button">
        {label}
      </button>
      <AccessibleDialog
        descriptionId={descriptionId}
        initialFocusRef={firstRef}
        onClose={() => setOpen(false)}
        open={open}
        restoreFocusRef={triggerRef}
        titleId={titleId}
      >
        <h2 id={titleId}>Dialog title</h2>
        <p id={descriptionId}>Dialog description</p>
        <input aria-label="First field" ref={firstRef} />
        <button onClick={() => setOpen(false)} type="button">
          Cancel
        </button>
      </AccessibleDialog>
    </div>
  );
}

afterEach(() => {
  document.body.style.overflow = "";
  document.body.removeAttribute("inert");
  document.body.removeAttribute("aria-hidden");
});

describe("AccessibleDialog", () => {
  it("renders through a portal with labelled modal semantics and responsive presentation", async () => {
    const user = userEvent.setup();
    const { container } = render(<DialogHarness />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    const dialog = await screen.findByRole("dialog", { name: "Dialog title" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription("Dialog description");
    expect(dialog.closest("[data-dialog-portal]")).not.toBeNull();
    expect(container.contains(dialog)).toBe(false);
    expect(dialog).toHaveClass(
      "h-[calc(100dvh-0.75rem)]",
      "rounded-t-[2rem]",
      "sm:max-w-xl",
      "sm:rounded-3xl",
      "scroll-pb-[env(safe-area-inset-bottom)]",
      "motion-reduce:transition-none",
    );
  });

  it("focuses initially, contains forward and reverse Tab, and restores the exact trigger", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    const trigger = screen.getByRole("button", { name: "Open dialog" });
    await user.click(trigger);

    const first = await screen.findByRole("textbox", { name: "First field" });
    await waitFor(() => expect(first).toHaveFocus());
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.tab();
    expect(first).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("closes on Escape and restores body and background accessibility state", async () => {
    document.body.style.overflow = "clip";
    const background = document.createElement("aside");
    background.setAttribute("aria-hidden", "false");
    background.setAttribute("inert", "preserved");
    document.body.appendChild(background);
    const user = userEvent.setup();
    render(<DialogHarness />);
    const trigger = screen.getByRole("button", { name: "Open dialog" });
    await user.click(trigger);

    expect(document.body.style.overflow).toBe("hidden");
    expect(background).toHaveAttribute("inert");
    expect(background).toHaveAttribute("aria-hidden", "true");
    const portal = document.querySelector("[data-dialog-portal]");
    expect(portal).not.toHaveAttribute("inert");
    expect(portal).not.toHaveAttribute("aria-hidden");

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(document.body.style.overflow).toBe("clip");
    expect(background).toHaveAttribute("inert", "preserved");
    expect(background).toHaveAttribute("aria-hidden", "false");
    background.remove();
  });

  it("restores isolation state on unmount", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<DialogHarness />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    await screen.findByRole("dialog");
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe("");
    expect(document.querySelector("[data-dialog-portal]")).toBeNull();
  });

  it("isolates background roots added while the dialog is open", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    await screen.findByRole("dialog");

    const lateBackgroundRoot = document.createElement("div");
    document.body.appendChild(lateBackgroundRoot);
    await waitFor(() => {
      expect(lateBackgroundRoot).toHaveAttribute("inert");
      expect(lateBackgroundRoot).toHaveAttribute("aria-hidden", "true");
    });

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(lateBackgroundRoot).not.toHaveAttribute("inert");
    expect(lateBackgroundRoot).not.toHaveAttribute("aria-hidden");
    lateBackgroundRoot.remove();
  });

  it("allows only one active dialog lifecycle", async () => {
    const user = userEvent.setup();
    render(
      <>
        <DialogHarness label="Open first" />
        <DialogHarness label="Open second" />
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Open first" }));
    await screen.findByRole("dialog");
    const secondTrigger = screen.getByRole("button", {
      name: "Open second",
      hidden: true,
    });
    fireEvent.click(secondTrigger);

    await waitFor(() => {
      expect(screen.getAllByRole("dialog")).toHaveLength(1);
      expect(document.querySelectorAll("[data-dialog-portal]")).toHaveLength(1);
    });
  });
});
