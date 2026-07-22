import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DataUsagePage from "@/app/(public)/data-usage/page";
import PrivacyPage from "@/app/(public)/privacy/page";
import TermsPage from "@/app/(public)/terms/page";

describe("public policy placeholders", () => {
  it.each([
    ["Privacy policy", PrivacyPage],
    ["Terms of use", TermsPage],
    ["Data usage", DataUsagePage],
  ] as const)("renders %s with explicit beta and legal-review context", (heading, Page) => {
    render(<Page />);
    expect(screen.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    expect(screen.getByRole("note")).toHaveTextContent(/qualified counsel/i);
  });

  it("explains current analytics, crash reporting, feedback, and offline storage", () => {
    render(<DataUsagePage />);
    for (const heading of ["Product analytics", "Crash reporting", "Feedback and screenshots", "Offline workout storage"]) {
      expect(screen.getByRole("heading", { name: heading })).toBeVisible();
    }
  });
});
