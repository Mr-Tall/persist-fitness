"use client";

import { useEffect, useRef } from "react";
import {
  formatRestTime,
  useWorkoutTimer,
} from "./workout-experience-provider";

const presets = [
  { label: "90s", seconds: 90 },
  { label: "2m", seconds: 120 },
  { label: "3m", seconds: 180 },
];

export function RestTimer() {
  const timer = useWorkoutTimer();
  const panelRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (!timer?.controlsOpen) return;
    const frame = window.requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView?.({ block: "nearest" });
      panelRef.current?.querySelector<HTMLElement>("summary")?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [timer?.controlsOpen]);

  if (!timer) {
    return null;
  }

  return (
    <details
      className="mt-4 rounded-2xl border border-border bg-surface"
      onToggle={(event) => timer.setControlsOpen(event.currentTarget.open)}
      open={timer.controlsOpen}
      ref={panelRef}
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between rounded-2xl px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-focus [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">
            Rest timer
          </span>
          <span className="mt-0.5 block text-xl font-black text-text-primary">
            {formatRestTime(timer.secondsLeft)}
          </span>
        </span>
        <span className="text-xs font-bold text-text-secondary">
          {timer.isRunning ? "Running · Controls" : "Timer controls"}
        </span>
      </summary>

      <div className="border-t border-border p-4">
        <div className="grid grid-cols-3 gap-2">
          {presets.map((preset) => (
            <button
              className="min-h-11 rounded-xl border border-border px-3 py-2 text-xs font-black text-text-secondary hover:bg-action-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              key={preset.seconds}
              onClick={() => timer.setPreset(preset.seconds)}
              type="button"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            className="min-h-12 rounded-xl bg-warning px-4 py-3 text-sm font-black text-black hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            onClick={timer.toggleRunning}
            type="button"
          >
            {timer.isRunning
              ? "Pause"
              : timer.secondsLeft === 0
                ? "Restart"
                : "Start"}
          </button>
          <button
            className="min-h-12 rounded-xl border border-border px-4 py-3 text-sm font-black text-text-primary hover:bg-action-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            onClick={timer.reset}
            type="button"
          >
            Reset
          </button>
        </div>
      </div>
    </details>
  );
}
