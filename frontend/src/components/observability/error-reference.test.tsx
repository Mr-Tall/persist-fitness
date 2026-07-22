import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const capture = vi.hoisted(() => vi.fn());
vi.mock("@/lib/observability/sentry", () => ({ captureHandledException: capture }));

import { ErrorReference } from "./error-reference";

describe("ErrorReference", () => {
  it("shows a safe correlation reference without exposing the error message", () => {
    render(<ErrorReference error={Object.assign(new Error("database secret"), { digest: "abc-123" })} />);

    expect(screen.getByText("ABC-123")).toBeVisible();
    expect(screen.queryByText("database secret")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Report this issue" }))
      .toHaveAttribute("href", "/settings?feedback=bug&reference=ABC-123");
    expect(capture).toHaveBeenCalledWith(expect.any(Error), "ABC-123");
  });

  it("provides a descriptively labelled copy control", async () => {
    render(<ErrorReference error={Object.assign(new Error("hidden"), { digest: "support1" })} />);
    const button = screen.getByRole("button", { name: "Copy error reference SUPPORT1" });
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByRole("button", { name: "Copy error reference SUPPORT1" })).toHaveTextContent("Copied"));
  });
});
