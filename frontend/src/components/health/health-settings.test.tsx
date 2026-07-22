import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NativeHealthBridge } from "@/lib/health";
import { HealthSettings } from "./health-settings";

function bridge(): NativeHealthBridge {
  return {
    platform: "ios",
    getStatus: vi.fn().mockResolvedValue({ connected: false, permissions: {} }),
    requestPermissions: vi.fn().mockResolvedValue({
      connected: true,
      permissions: { body_weight: "granted", strength_workouts: "granted" },
    }),
    readRecords: vi.fn().mockResolvedValue([]),
    writeStrengthWorkout: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
  };
}

describe("HealthSettings", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => delete window.PersistHealthBridge);

  it("keeps the web experience available without exposing native controls", () => {
    render(<HealthSettings />);
    expect(screen.getByText("Native app required")).toBeVisible();
    expect(screen.getByText(/Install the native iOS or Android app/)).toBeVisible();
  });

  it("supports granular native permission, manual sync, and disconnect controls", async () => {
    const nativeBridge = bridge();
    window.PersistHealthBridge = nativeBridge;
    render(<HealthSettings />);

    const bodyWeight = await screen.findByRole("checkbox", { name: "Body weight" });
    fireEvent.click(bodyWeight);
    fireEvent.click(screen.getByRole("button", { name: "Connect Apple Health" }));
    await waitFor(() =>
      expect(nativeBridge.requestPermissions).toHaveBeenCalledWith({
        read: ["body_weight"],
        write: ["strength_workouts"],
      }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Connected to Apple Health");
    expect(screen.getByRole("button", { name: "Manual sync" })).toHaveClass("min-h-12");

    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    await waitFor(() => expect(nativeBridge.disconnect).toHaveBeenCalledOnce());
  });
});
