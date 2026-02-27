"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CycleDay = { day: number; title: string };
type Completion = { id: string; day: number; title: string; completedAt: string };

/* Helpers */
function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatShortDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function CalendarPage() {
  // Keep these titles EXACTLY the same as your main page cycle
  const cycle: CycleDay[] = useMemo(
    () => [
      { day: 1, title: "Quads / Glutes" },
      { day: 2, title: "Delts / Arms / Abs" },
      { day: 3, title: "Rest" },
      { day: 4, title: "Posterior Chain" },
      { day: 5, title: "Quads/Adductors/Calves/Abs" },
      { day: 6, title: "Rest" },
      { day: 7, title: "Glutes/Ad & Abductors/Calves" },
      { day: 8, title: "Back/Hamstrings/Abs" },
      { day: 9, title: "Rest" },
      { day: 10, title: "Rest" },
    ],
    []
  );

  const [currentDayIndex, setCurrentDayIndex] = useState<number>(0);
  const [completions, setCompletions] = useState<Completion[]>([]);

  // Load from localStorage
  useEffect(() => {
    const savedIdx = localStorage.getItem("currentDayIndex");
    if (savedIdx) {
      const idx = Number(savedIdx);
      if (Number.isFinite(idx) && idx >= 0 && idx < cycle.length) {
        setCurrentDayIndex(idx);
      }
    }

    const savedCompletions = localStorage.getItem("dayCompletions");
    if (savedCompletions) {
      try {
        const parsed = JSON.parse(savedCompletions);
        if (Array.isArray(parsed)) setCompletions(parsed);
      } catch {}
    }
  }, [cycle.length]);

  // Map: last completion per Day number (for ✅ + tooltip)
  const lastCompletionByDay = useMemo(() => {
    const map = new Map<number, Completion>();
    for (const c of completions) {
      if (!map.has(c.day)) map.set(c.day, c);
    }
    return map;
  }, [completions]);

  // Tiles: 28 days starting TODAY, cycle labels follow currentDayIndex
  const tiles = useMemo(() => {
    const today = new Date();
    const arr: {
      idx: number; // index into cycle[]
      cycleDay: CycleDay;
      date: Date;
      isToday: boolean;
      offset: number; // days from today
    }[] = [];

    for (let i = 0; i < 28; i++) {
      const idx = (currentDayIndex + i) % cycle.length;
      arr.push({
        idx,
        cycleDay: cycle[idx],
        date: addDays(today, i),
        isToday: i === 0,
        offset: i,
      });
    }

    return arr;
  }, [currentDayIndex, cycle]);

  // Tile click: jump to that day on main screen
  function setDayAndGoHome(idx: number) {
    localStorage.setItem("currentDayIndex", idx.toString());
    window.location.href = "/";
  }

  // Set Today button: re-align cycle so this tile becomes Today (no navigation)
  function setThisTileAsToday(tileOffset: number) {
    const newIndex = (currentDayIndex + tileOffset) % cycle.length;
    setCurrentDayIndex(newIndex);
    localStorage.setItem("currentDayIndex", newIndex.toString());
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-700">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-700">
              Jess’ Bikini Prep Tracker 💪✨
            </h1>
            <p className="mt-1 text-gray-600">My road to the stage — November 2026</p>
          </div>

          <Link
            href="/"
            className="rounded-xl bg-gray-100 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-200"
          >
            ← Back
          </Link>
        </div>

        {/* Calendar Card */}
        <div className="mt-6 rounded-2xl bg-white shadow p-6">
          <h2 className="text-xl font-semibold text-gray-700">Calendar</h2>
          <p className="mt-2 text-sm text-gray-500">
            Starts at <span className="font-semibold">today</span>. Tap a tile to jump your
            main screen. Use <span className="font-semibold">Set Today</span> to realign the
            cycle.
          </p>

          {/* Grid */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tiles.map((t) => {
              const dayNum = t.cycleDay.day;
              const completed = lastCompletionByDay.get(dayNum);

              return (
                <button
                  key={`${t.idx}-${t.offset}`}
                  type="button"
                  onClick={() => setDayAndGoHome(t.idx)}
                  className={[
                    "rounded-2xl border p-4 text-left hover:shadow transition",
                    t.isToday ? "border-gray-700 ring-2 ring-gray-200" : "border-gray-200",
                    completed ? "bg-gray-50" : "bg-white",
                  ].join(" ")}
                  title={
                    completed
                      ? `Last completed: ${new Date(completed.completedAt).toLocaleString()}`
                      : "Not completed yet"
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-500">
                        {formatShortDate(t.date)}
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-700">
                        Day {dayNum}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">{t.cycleDay.title}</p>
                    </div>

                    <div className="text-lg">{completed ? "✅" : "⬜️"}</div>
                  </div>

                  {t.isToday && (
                    <p className="mt-3 text-xs font-semibold text-gray-500">Today</p>
                  )}

                  {!t.isToday && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation(); // don't trigger tile click
                          setThisTileAsToday(t.offset);
                        }}
                        className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                      >
                        Set Today
                      </button>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <p className="mt-5 text-xs text-gray-500">
            Note: If you swap rest/workout days, use <span className="font-semibold">Set Today</span>{" "}
            to keep the calendar aligned with what you’re actually doing.
          </p>
        </div>
      </div>
    </main>
  );
}