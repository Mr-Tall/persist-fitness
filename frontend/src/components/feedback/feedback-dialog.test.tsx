import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

vi.mock("next/navigation", () => ({ usePathname: () => "/workouts/example" }));
vi.mock("@/app/actions/feedback", () => ({ submitFeedback: vi.fn() }));
vi.mock("@/lib/analytics/client", () => ({ captureProductEvent: vi.fn() }));
import { FeedbackDialog } from "./feedback-dialog";

describe("FeedbackDialog", () => {
  it("opens an accessible, privacy-masked feedback form", () => {
    render(<FeedbackDialog initialCategory="bug" errorReference="ABC123" />);
    fireEvent.click(screen.getByRole("button", { name: "Send beta feedback" }));
    expect(screen.getByRole("dialog", { name: "Send feedback" })).toHaveAttribute("aria-modal", "true");
    expect(screen.getByLabelText("Category")).toHaveValue("bug");
    expect(screen.getByLabelText("What should we know?")).toHaveAttribute("maxlength", "2000");
    expect(screen.getByText("Reference: ABC123")).toBeVisible();
    expect(screen.getByRole("button", { name: "Send feedback" })).toHaveClass("min-h-12");
  });
  it("emits analytics only from the confirmed success branch", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/feedback/feedback-dialog.tsx"), "utf8");
    expect(source).toContain('state.status !== "success"');
    expect(source.indexOf('state.status !== "success"')).toBeLessThan(source.indexOf('captureProductEvent("feedback_submitted"'));
  });
});
