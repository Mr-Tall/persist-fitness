import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ clear: vi.fn(), pending: vi.fn() }));
vi.mock("@/lib/account/client-cleanup", () => ({
  clearDeletedAccountClientData: mocks.clear,
  hasPendingAccountCleanup: mocks.pending,
}));

import { AccountCleanupBoundary } from "./account-cleanup-boundary";

describe("AccountCleanupBoundary", () => {
  it("retries local account cleanup on the next application launch", async () => {
    mocks.pending.mockReturnValue(true);
    mocks.clear.mockResolvedValue(undefined);
    render(<AccountCleanupBoundary />);
    await waitFor(() => expect(mocks.clear).toHaveBeenCalledOnce());
  });
});
