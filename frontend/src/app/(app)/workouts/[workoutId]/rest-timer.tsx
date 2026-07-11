"use client";

import { useEffect, useState } from "react";

const presets = [
  { label: "90s", seconds: 90 },
  { label: "2m", seconds: 120 },
  { label: "3m", seconds: 180 },
];

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function RestTimer() {
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          setIsRunning(false);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning, secondsLeft]);

  return (
    <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
            Rest timer
          </p>
          <p className="mt-1 text-4xl font-black text-white">
            {formatTime(secondsLeft)}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
          {presets.map((preset) => (
            <button
              key={preset.seconds}
              type="button"
              onClick={() => {
                setSecondsLeft(preset.seconds);
                setIsRunning(false);
              }}
              className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-neutral-300 transition hover:bg-white/10 hover:text-white"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setIsRunning((current) => !current)}
          className="rounded-xl bg-emerald-400 px-4 py-3 text-sm font-black text-black transition hover:bg-emerald-300"
        >
          {isRunning ? "Pause" : secondsLeft === 0 ? "Restart" : "Start"}
        </button>

        <button
          type="button"
          onClick={() => {
            setSecondsLeft(120);
            setIsRunning(false);
          }}
          className="rounded-xl border border-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10"
        >
          Reset
        </button>
      </div>
    </div>
  );
}