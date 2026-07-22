import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-auth/react", () => ({ signOut: vi.fn() }));
vi.mock("@/app/actions/account", () => ({
  deleteAccountWithState: vi.fn(),
  revokeSessionWithState: vi.fn(),
  signOutOtherSessionsWithState: vi.fn(),
}));
vi.mock("@/lib/account/client-cleanup", () => ({ clearDeletedAccountClientData: vi.fn() }));

import { AccountDataControls, DeleteAccountControl, SessionManagement } from "./account-management";

describe("account management UI", () => {
  it("exposes an ephemeral personal-data download", () => {
    render(<AccountDataControls />);
    expect(screen.getByRole("link", { name: "Download personal data" }))
      .toHaveAttribute("href", "/api/account/export");
  });

  it("uses an accessible keyboard confirmation dialog for account deletion", async () => {
    render(<DeleteAccountControl />);
    const trigger = screen.getByRole("button", { name: "Delete my account" });
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog", { name: "Delete your account?" })).toHaveAttribute("aria-modal", "true");
    expect(screen.getByLabelText("Confirmation")).toHaveAttribute("pattern", "DELETE");
    expect(screen.getByRole("button", { name: "Delete permanently" })).toHaveClass("min-h-12");
    await waitFor(() => expect(screen.getByLabelText("Confirmation")).toHaveFocus());
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("shows current and other sessions without offering to revoke the current row", () => {
    render(<SessionManagement sessions={[
      { id: "current", createdAt: "2026-01-01", expires: "2030-01-01", lastActiveAt: "2026-01-01", userAgentSummary: "Safari on iOS", isCurrent: true },
      { id: "other", createdAt: "2026-01-01", expires: "2030-01-01", lastActiveAt: "2026-01-01", userAgentSummary: "Chrome on Windows", isCurrent: false },
    ]} />);
    expect(screen.getByText(/Safari on iOS \(current device\)/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Sign out Chrome on Windows" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Sign out Safari on iOS" })).not.toBeInTheDocument();
  });
});
