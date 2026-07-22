import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HealthStrengthWorkout, NativeHealthBridge } from "@/lib/health";
import { WorkoutHealthSync } from "./workout-health-sync";

const workout: HealthStrengthWorkout = {
  externalId: "workout-1",
  title: "Strength day",
  startedAt: "2026-07-21T10:00:00.000Z",
  endedAt: "2026-07-21T11:00:00.000Z",
  durationSeconds: 3600,
};

function bridge(): NativeHealthBridge {
  return {
    platform: "android",
    getStatus: vi.fn().mockResolvedValue({ connected: false, permissions: {} }),
    requestPermissions: vi.fn().mockResolvedValue({
      connected: true,
      permissions: { strength_workouts: "granted" },
    }),
    readRecords: vi.fn().mockResolvedValue([]),
    writeStrengthWorkout: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
  };
}

describe("WorkoutHealthSync", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => delete window.PersistHealthBridge);

  it("does not change the completed workout experience on web", () => {
    const { container } = render(<WorkoutHealthSync workout={workout} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("exports only after confirmation and remembers a disabled prompt preference", async () => {
    const nativeBridge = bridge();
    window.PersistHealthBridge = nativeBridge;
    render(<WorkoutHealthSync workout={workout} />);
    const syncButton = await screen.findByRole("button", { name: "Sync to Health Connect" });
    expect(nativeBridge.writeStrengthWorkout).not.toHaveBeenCalled();
    fireEvent.click(syncButton);
    await waitFor(() => expect(nativeBridge.writeStrengthWorkout).toHaveBeenCalledWith(workout));
    expect(await screen.findByRole("status")).toHaveTextContent("Synced to Health Connect");

    fireEvent.click(screen.getByRole("button", { name: "Don't offer again" }));
    expect(screen.queryByRole("button", { name: "Sync to Health Connect" })).not.toBeInTheDocument();
    expect(localStorage.getItem("persist.health.preference.v1")).toContain(
      '"showWorkoutPrompt":false',
    );
  });

  it("does not export when the platform denies strength-workout permission", async () => {
    const nativeBridge = bridge();
    nativeBridge.requestPermissions = vi.fn().mockResolvedValue({
      connected: false,
      permissions: { strength_workouts: "denied" },
    });
    window.PersistHealthBridge = nativeBridge;
    render(<WorkoutHealthSync workout={workout} />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Sync to Health Connect" }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Could not sync");
    expect(nativeBridge.writeStrengthWorkout).not.toHaveBeenCalled();
  });
});
