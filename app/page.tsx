"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabaseClient";

/** ---------- Types ---------- */
type CycleDay = { day: number; title: string };

type WorkoutDef = {
  exercise: string;
  sets: string;
};

type Completion = {
  id: string;
  day: number;
  title: string;
  completedAt: string; // ISO string
};

type SetEntry = { weight: string; reps: string };
type WorkoutState = Record<number, Record<string, SetEntry[]>>; // day -> exercise -> sets[]
type NotesState = Record<number, string>; // day -> notes

/** ---------- Helpers ---------- */
function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function safeParseJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function uid() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

export default function Home() {
  /** ---------- Program structure ---------- */
  const cycle: CycleDay[] = useMemo(
    () => [
      { day: 1, title: "Glutes / Hamstrings" },
      { day: 2, title: "Delts / Arms / Abs" },
      { day: 3, title: "Rest Day" },
      { day: 4, title: "Back / Posterior Chain" },
      { day: 5, title: "Quads / Adductors / Calves / Abs" },
      { day: 6, title: "Rest Day" },
      { day: 7, title: "Glutes / Ad & Abductors / Calves" },
      { day: 8, title: "Back / Hamstrings / Abs" },
      { day: 9, title: "Rest Day" },
      { day: 10, title: "Rest Day" },
    ],
    []
  );

  const workoutsByDay: Record<number, WorkoutDef[]> = useMemo(
    () => ({
      1: [
        { exercise: "Single Leg DB RDL", sets: "4 x 15, 12, 10, 6–8" },
        { exercise: "Glute Bridges", sets: "4 x 15, 12, 12, 8–10" },
        { exercise: "Single Leg Leg Press", sets: "4 x 12, 12, 10, 6–8" },
        { exercise: "Cable Glute Kickback", sets: "4 x 15" },
        { exercise: "Barbell Back Squats", sets: "4 x 10, 8, 6, 4" },
      ],
      2: [
        { exercise: "Standing DB Side Laterals", sets: "4 x 10" },
        { exercise: "Seated DB Shoulder Presses", sets: "4 x 15, 12, 10, 8" },
        { exercise: "Cable Upright Rows", sets: "4 x 12" },
        { exercise: "Standing Straight Bar Curls", sets: "5 x 10" },
        { exercise: "Cable Tricep Pushbacks", sets: "4 x 10" },
        { exercise: "Bodyweight Dips", sets: "3 x 8–10" },
        { exercise: "Decline Crunches", sets: "5 x 15" },
      ],
      3: [{ exercise: "Rest", sets: "-" }],
      4: [
        { exercise: "Assisted Pull Ups", sets: "4 x 8–10" },
        { exercise: "Lying Hamstring Curls", sets: "4 x 12, 12, 10, 10" },
        { exercise: "“Glute Builder” Machine", sets: "4 x 15" },
        { exercise: "Rope Cable Facepulls", sets: "3 x 12" },
        { exercise: "Plate Loaded Rows", sets: "4 x 12, 12, 10, 8" },
        { exercise: "Reverse Pec Deck", sets: "3 x 15" },
      ],
      5: [
        { exercise: "Adductor Machine", sets: "4 x 15" },
        { exercise: "Seated Leg Curl", sets: "4 x 15, 15, 12, 12" },
        { exercise: "Leg Press", sets: "4 x 12, 10, 8, 6–8" },
        { exercise: "DB Deficit Sumo Squat", sets: "4 x 12, 12, 10, 6–8" },
        { exercise: "Standing Calf Raises", sets: "4 x 15" },
        { exercise: "Cable Crunches", sets: "4 x 20" },
      ],
      6: [{ exercise: "Rest", sets: "-" }],
      7: [
        { exercise: "Adductor Machine SS w/ Abductor Machine", sets: "4 x 15" },
        { exercise: "Barbell Glute Bridges", sets: "4 x 15, 12, 10, 8–10" },
        { exercise: "Lying Smith Machine Kickback", sets: "4 x 15, 12, 12, 10" },
        { exercise: "DB Step Ups", sets: "4 x 10 each leg" },
        { exercise: "DB Sumo Squats", sets: "4 x 10, 10, 8, 8" },
        { exercise: "Seated Calf Raises", sets: "4 x 15" },
      ],
      8: [
        { exercise: "Bent Over Single Arm DB Row", sets: "4 x 15, 15, 12, 12" },
        { exercise: "Single Arm Underhand Pulldown", sets: "4 x 12" },
        { exercise: "Pronated Grip Plate Loaded Row", sets: "3 x 15" },
        { exercise: "DB Bent Over Stiff Legs", sets: "4 x 12, 10, 10, 8" },
        { exercise: "Standing Single Leg Leg Curls", sets: "3 x 15" },
        { exercise: "Leg Raises", sets: "4 x 15" },
      ],
      9: [{ exercise: "Rest", sets: "-" }],
      10: [{ exercise: "Rest", sets: "-" }],
    }),
    []
  );

  /** ---------- App state ---------- */
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [workoutState, setWorkoutState] = useState<WorkoutState>({});
  const [dayNotes, setDayNotes] = useState<NotesState>({});
  const [completedMeals, setCompletedMeals] = useState<number[]>([]);
  const [waterOz, setWaterOz] = useState<number>(0);

  /** ---------- Meals ---------- */
  const meals = useMemo(() => ["Meal 1", "Meal 2", "Meal 3", "Meal 4", "Meal 5"], []);
  const isSweetPotatoDay = [3, 6, 9].includes((cycle[currentDayIndex] || { day: 1 }).day);

  function toggleMeal(mealNumber: number) {
    setCompletedMeals((prev) =>
      prev.includes(mealNumber) ? prev.filter((n) => n !== mealNumber) : [...prev, mealNumber]
    );
  }

  /** ---------- Water ---------- */
  const waterGoal = 140; // adjust anytime
  const waterProgress = Math.min(100, Math.round((waterOz / waterGoal) * 100));

  /** ---------- Cloud auth/sync UI ---------- */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string>("");

  /** ---------- Derived ---------- */
  const currentDay = cycle[currentDayIndex];
  const workoutsToday = workoutsByDay[currentDay.day] || [];

  /** ---------- LocalStorage Load ---------- */
  useEffect(() => {
    const savedDayIndex = localStorage.getItem("currentDayIndex");
    if (savedDayIndex) {
      const idx = Number(savedDayIndex);
      if (Number.isFinite(idx) && idx >= 0 && idx < cycle.length) setCurrentDayIndex(idx);
    }

    setCompletions(safeParseJSON<Completion[]>(localStorage.getItem("dayCompletions"), []));
    setWorkoutState(safeParseJSON<WorkoutState>(localStorage.getItem("workoutState"), {}));
    setDayNotes(safeParseJSON<NotesState>(localStorage.getItem("dayNotes"), {}));
    setCompletedMeals(safeParseJSON<number[]>(localStorage.getItem("completedMeals"), []));

    const w = localStorage.getItem("waterOz");
    if (w) {
      const n = Number(w);
      if (Number.isFinite(n)) setWaterOz(Math.max(0, n));
    }
  }, [cycle.length]);

  /** ---------- Persist ---------- */
  useEffect(() => {
    localStorage.setItem("currentDayIndex", String(currentDayIndex));
  }, [currentDayIndex]);

  useEffect(() => {
    localStorage.setItem("dayCompletions", JSON.stringify(completions));
  }, [completions]);

  useEffect(() => {
    localStorage.setItem("workoutState", JSON.stringify(workoutState));
  }, [workoutState]);

  useEffect(() => {
    localStorage.setItem("dayNotes", JSON.stringify(dayNotes));
  }, [dayNotes]);

  useEffect(() => {
    localStorage.setItem("completedMeals", JSON.stringify(completedMeals));
  }, [completedMeals]);

  useEffect(() => {
    localStorage.setItem("waterOz", String(Math.max(0, waterOz)));
  }, [waterOz]);

  /** ---------- Auto-reset (every new day) ---------- */
  useEffect(() => {
    const last = localStorage.getItem("lastResetDate");
    const now = todayKey();

    if (last !== now) {
      setWaterOz(0);
      setCompletedMeals([]);

      localStorage.setItem("waterOz", "0");
      localStorage.setItem("completedMeals", "[]");
      localStorage.setItem("lastResetDate", now);
    }
  }, []);

  /** ---------- Supabase auth session tracking ---------- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  /** ---------- Workout Log helpers ---------- */
  function getSets(dayNum: number, exercise: string): SetEntry[] {
    const perDay = workoutState[dayNum] || {};
    const sets = perDay[exercise];
    return Array.isArray(sets) && sets.length > 0 ? sets : [{ weight: "", reps: "" }];
  }

  function setSets(dayNum: number, exercise: string, sets: SetEntry[]) {
    setWorkoutState((prev) => ({
      ...prev,
      [dayNum]: {
        ...(prev[dayNum] || {}),
        [exercise]: sets,
      },
    }));
  }

  function addSet(dayNum: number, exercise: string) {
    const sets = getSets(dayNum, exercise);
    setSets(dayNum, exercise, [...sets, { weight: "", reps: "" }]);
  }

  function removeSet(dayNum: number, exercise: string, idx: number) {
    const sets = getSets(dayNum, exercise);
    if (sets.length <= 1) return; // keep at least one row
    const next = sets.filter((_, i) => i !== idx);
    setSets(dayNum, exercise, next.length ? next : [{ weight: "", reps: "" }]);
  }

  function updateSet(dayNum: number, exercise: string, idx: number, field: keyof SetEntry, value: string) {
    const sets = getSets(dayNum, exercise);
    const next = sets.map((s, i) => (i === idx ? { ...s, [field]: value } : s));
    setSets(dayNum, exercise, next);
  }

  /** ---------- Day nav ---------- */
  function prevDay() {
    setCurrentDayIndex((prev) => (prev - 1 + cycle.length) % cycle.length);
  }
  function nextDay() {
    setCurrentDayIndex((prev) => (prev + 1) % cycle.length);
  }

  /** ---------- Completion ---------- */
  function markCurrentDayComplete() {
    const entry: Completion = {
      id: uid(),
      day: currentDay.day,
      title: currentDay.title,
      completedAt: new Date().toISOString(),
    };
    setCompletions((prev) => [entry, ...prev]);
  }

  /** ---------- Cloud snapshot ---------- */
  function buildSnapshot() {
    return {
      currentDayIndex,
      completions,
      workoutState,
      dayNotes,
      completedMeals,
      waterOz,
      lastResetDate: localStorage.getItem("lastResetDate") ?? null,
    };
  }

  function applySnapshot(snapshot: any) {
    if (!snapshot || typeof snapshot !== "object") return;

    if (typeof snapshot.currentDayIndex === "number") setCurrentDayIndex(snapshot.currentDayIndex);
    if (Array.isArray(snapshot.completions)) setCompletions(snapshot.completions);
    if (snapshot.workoutState && typeof snapshot.workoutState === "object") setWorkoutState(snapshot.workoutState);
    if (snapshot.dayNotes && typeof snapshot.dayNotes === "object") setDayNotes(snapshot.dayNotes);
    if (Array.isArray(snapshot.completedMeals)) setCompletedMeals(snapshot.completedMeals);
    if (typeof snapshot.waterOz === "number") setWaterOz(Math.max(0, snapshot.waterOz));
    if (snapshot.lastResetDate) localStorage.setItem("lastResetDate", snapshot.lastResetDate);
  }

  async function syncUp() {
    if (!userId) return;
    setSyncStatus("Syncing to cloud...");

    const snapshot = buildSnapshot();
    const { error } = await supabase
      .from("app_state")
      .upsert({ user_id: userId, state: snapshot, updated_at: new Date().toISOString() });

    setSyncStatus(error ? `Sync failed: ${error.message}` : "✅ Synced to cloud");
  }

  async function syncDown() {
    if (!userId) return;
    setSyncStatus("Loading from cloud...");

    const { data, error } = await supabase.from("app_state").select("state").eq("user_id", userId).single();

    if (error) {
      setSyncStatus(`Load failed: ${error.message}`);
      return;
    }

    applySnapshot(data?.state);
    setSyncStatus("✅ Loaded from cloud");
  }

  /** ---------- UI ---------- */
  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-700">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-700">Jess’ Bikini Prep Tracker 💪✨</h1>
          <p className="mt-1 text-gray-600">My road to the stage — November 2026</p>

          <div className="mt-4">
            <Link
              href="/calendar"
              className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-200"
            >
              <span aria-hidden>🗓️</span> Calendar
            </Link>
          </div>
        </div>

        {/* Cloud Backup Panel */}
        <div className="mt-4 rounded-2xl bg-white shadow p-5">
          <h2 className="text-lg font-semibold text-gray-700">Cloud Backup (Phone + Laptop)</h2>

          {!userId ? (
            <div className="mt-3 grid gap-3">
              <input
                className="rounded-xl border border-gray-300 p-3 text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="rounded-xl border border-gray-300 p-3 text-sm"
                placeholder="Password (min 6 chars)"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={async () => {
                    setSyncStatus("Creating account...");
                    const { error } = await supabase.auth.signUp({ email, password });
                    setSyncStatus(error ? error.message : "✅ Account created (check email if prompted), then log in.");
                  }}
                  className="rounded-xl bg-gray-700 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-600"
                >
                  Sign up
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setSyncStatus("Logging in...");
                    const { error } = await supabase.auth.signInWithPassword({ email, password });
                    setSyncStatus(error ? error.message : "✅ Logged in");
                  }}
                  className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Log in
                </button>
              </div>

              {syncStatus && <p className="text-xs text-gray-500">{syncStatus}</p>}
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={syncUp}
                className="rounded-xl bg-gray-700 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-600"
              >
                ⬆️ Sync to Cloud
              </button>

              <button
                type="button"
                onClick={syncDown}
                className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                ⬇️ Load from Cloud
              </button>

              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  setSyncStatus("Signed out");
                }}
                className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Sign out
              </button>

              {syncStatus && <p className="w-full text-xs text-gray-500 mt-2">{syncStatus}</p>}
            </div>
          )}
        </div>

        {/* Day Toggler */}
        <div className="mt-6 rounded-2xl bg-white shadow p-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={prevDay}
              className="rounded-xl bg-gray-100 px-4 py-3 text-lg font-semibold text-gray-700 hover:bg-gray-200"
              aria-label="Previous day"
            >
              ←
            </button>

            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Current Day</p>
              <p className="mt-1 text-3xl font-semibold text-gray-700">
                Day {currentDay.day} of {cycle.length}
              </p>
              <p className="mt-1 text-gray-600 font-medium">{currentDay.title}</p>
            </div>

            <button
              type="button"
              onClick={nextDay}
              className="rounded-xl bg-gray-100 px-4 py-3 text-lg font-semibold text-gray-700 hover:bg-gray-200"
              aria-label="Next day"
            >
              →
            </button>
          </div>

          <button
            type="button"
            onClick={markCurrentDayComplete}
            className="mt-5 w-full rounded-xl bg-gray-100 py-3 font-semibold text-gray-700 hover:bg-gray-200"
          >
            ✅ Mark Day {currentDay.day} Complete
          </button>
        </div>

        {/* Workout Log */}
        <div className="mt-6 rounded-2xl bg-white shadow p-6">
          <h2 className="text-2xl font-semibold text-gray-700">Workout Log</h2>

          {workoutsToday.length === 0 ? (
            <p className="mt-3 text-gray-600">No workout items set for this day.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="p-2 text-gray-700">Exercise</th>
                    <th className="p-2 text-gray-700">Program Sets</th>
                    <th className="p-2 text-gray-700">Log (Weight / Reps)</th>
                  </tr>
                </thead>

                <tbody>
                  {workoutsToday.map((w) => {
                    const sets = getSets(currentDay.day, w.exercise);

                    return (
                      <tr key={w.exercise} className="border-b border-gray-100 align-top">
                        <td className="p-2">
                          <p className="font-medium text-gray-700">{w.exercise}</p>
                        </td>

                        <td className="p-2 text-gray-600">{w.sets}</td>

                        <td className="p-2">
                          <div className="space-y-2">
                            {sets.map((s, idx) => {
                              const isLast = idx === sets.length - 1;
                              const canRemove = sets.length > 1;

                              return (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 w-12">Set {idx + 1}</span>

                                  <input
                                    type="text"
                                    placeholder="Weight"
                                    value={s.weight}
                                    onChange={(e) =>
                                      updateSet(currentDay.day, w.exercise, idx, "weight", e.target.value)
                                    }
                                    className="w-28 rounded border border-gray-300 p-2 text-sm"
                                  />

                                  <input
                                    type="text"
                                    placeholder="Reps"
                                    value={s.reps}
                                    onChange={(e) =>
                                      updateSet(currentDay.day, w.exercise, idx, "reps", e.target.value)
                                    }
                                    className="w-20 rounded border border-gray-300 p-2 text-sm"
                                  />

                                  {/* + and - to the right of reps */}
                                  {isLast ? (
                                    <button
                                      type="button"
                                      onClick={() => addSet(currentDay.day, w.exercise)}
                                      className="h-8 w-8 rounded-full bg-gray-100 text-lg font-semibold text-gray-700 hover:bg-gray-200"
                                      aria-label="Add set"
                                      title="Add set"
                                    >
                                      +
                                    </button>
                                  ) : (
                                    <div className="h-8 w-8" />
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => removeSet(currentDay.day, w.exercise, idx)}
                                    disabled={!canRemove}
                                    className={[
                                      "h-8 w-8 rounded-full text-lg font-semibold",
                                      canRemove
                                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        : "bg-gray-50 text-gray-300 cursor-not-allowed",
                                    ].join(" ")}
                                    aria-label="Remove set"
                                    title={canRemove ? "Remove set" : "At least one set is required"}
                                  >
                                    –
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Notes box under final exercise */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-700">Workout Notes</h3>
                <textarea
                  className="mt-2 w-full rounded-xl border border-gray-300 p-3 text-sm text-gray-700"
                  rows={4}
                  placeholder="Anything to remember about today’s workout (form cues, swaps, how it felt, etc.)"
                  value={dayNotes[currentDay.day] || ""}
                  onChange={(e) =>
                    setDayNotes((prev) => ({
                      ...prev,
                      [currentDay.day]: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* Water + Meals */}
        <div className="mt-6 rounded-2xl bg-white shadow p-6">
          <h2 className="text-2xl font-semibold text-gray-700">Water Tracker 💧</h2>
          <p className="mt-2 text-sm text-gray-600">Goal: {waterGoal} oz</p>

          <div className="mt-4 flex items-center gap-3">
            <input
              type="number"
              min={0}
              step={1}
              value={waterOz}
              onChange={(e) => {
                const value = Number(e.target.value);
                setWaterOz(Math.max(0, value));
              }}
              className="w-24 rounded-lg border border-gray-300 p-2 text-gray-700"
            />
            <span className="text-gray-600">oz</span>

            <button
              type="button"
              onClick={() => setWaterOz((prev) => Math.max(0, prev + 8))}
              className="ml-auto rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
            >
              +8 oz
            </button>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium text-gray-600">
              Water: {waterOz} / {waterGoal} oz ({waterProgress}%)
            </p>

            <div className="mt-2 h-3 w-full rounded-full bg-gray-200">
              <div className="h-3 rounded-full bg-gray-500 transition-all" style={{ width: `${waterProgress}%` }} />
            </div>

            <p className="mt-2 text-xs text-gray-500">Auto-resets each morning (based on your device date).</p>
          </div>

          {/* Meals */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-700">Meals ✅</h3>

            {isSweetPotatoDay && (
              <p className="mt-2 text-sm text-gray-600">
                Special note: On Days <span className="font-semibold">3, 6, and 9</span>, you can eat{" "}
                <span className="font-semibold">sweet potatoes</span>.
              </p>
            )}

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {meals.map((label, idx) => {
                const mealNumber = idx + 1;
                const checked = completedMeals.includes(mealNumber);

                return (
                  <label
                    key={label}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMeal(mealNumber)}
                      className="h-5 w-5"
                    />
                    <span className="font-semibold text-gray-700">{label}</span>
                  </label>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCompletedMeals([])}
                className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Clear meals
              </button>

              <p className="text-xs text-gray-500">Meals auto-reset each morning with water.</p>
            </div>
          </div>
        </div>

        {/* Completion History */}
        <div className="mt-6 rounded-2xl bg-white shadow p-6">
          <h2 className="text-2xl font-semibold text-gray-700">Completion History</h2>

          {completions.length === 0 ? (
            <p className="mt-3 text-gray-600">No completed days yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {completions.slice(0, 20).map((c) => (
                <li key={c.id} className="rounded-xl bg-gray-50 p-3">
                  <p className="font-semibold text-gray-700">
                    Day {c.day}: {c.title}
                  </p>
                  <p className="text-sm text-gray-600">Completed: {new Date(c.completedAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-8 text-xs text-gray-500">
          Note: This version stores data locally and can sync to the cloud when you log in.
        </p>
      </div>
    </main>
  );
}