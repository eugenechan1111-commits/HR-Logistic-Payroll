"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

interface AttendanceToday {
  id: string;
  clock_in: string | null;
  clock_out: string | null;
  hours_worked: number | null;
  ot_hours: number | null;
  ot_amount: number | null;
}

export default function DriverHome() {
  const [attendance, setAttendance] = useState<AttendanceToday | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [now, setNow] = useState(new Date());
  const [session, setSession] = useState<{ name: string } | null>(null);
  const [monthStats, setMonthStats] = useState({ days: 0, ot: 0 });

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    // Get session from cookie name via document
    try {
      const raw = document.cookie.split(";").find((c) => c.trim().startsWith("driver_session="));
      if (raw) {
        const val = decodeURIComponent(raw.split("=").slice(1).join("="));
        setSession(JSON.parse(val));
      }
    } catch {}
    loadToday();
    loadMonthStats();
  }, []);

  async function loadToday() {
    const today = new Date().toISOString().split("T")[0];
    const month = today.slice(0, 7);
    const res = await fetch(`/api/attendance?month=${month}`);
    const all = await res.json();
    const todayRec = all.find((a: AttendanceToday & { date: string }) => a.date === today) ?? null;
    setAttendance(todayRec);
    setLoading(false);
  }

  async function loadMonthStats() {
    const month = new Date().toISOString().slice(0, 7);
    const res = await fetch(`/api/attendance?month=${month}`);
    const all = await res.json();
    const days = all.filter((a: { clock_in: string | null }) => a.clock_in).length;
    const ot = all.reduce((sum: number, a: { ot_hours: number | null }) => sum + (a.ot_hours ?? 0), 0);
    setMonthStats({ days, ot: Math.round(ot * 10) / 10 });
  }

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleClock() {
    setActionLoading(true);
    const action = attendance?.clock_in && !attendance?.clock_out ? "clock_out" : "clock_in";
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setActionLoading(false);
    if (!res.ok) {
      showToast(data.error ?? "Error", "error");
    } else {
      showToast(action === "clock_in" ? "Clocked in!" : `Clocked out — ${data.hours_worked?.toFixed(1)}h worked`, "success");
      loadToday();
      loadMonthStats();
    }
  }

  const isClockedIn = !!attendance?.clock_in && !attendance?.clock_out;
  const isClockedOut = !!attendance?.clock_out;

  const greetHour = now.getHours();
  const greeting = greetHour < 12 ? "Good morning" : greetHour < 17 ? "Good afternoon" : "Good evening";
  const firstName = session?.name?.split(" ")[0] ?? "Driver";

  return (
    <div className="min-h-screen px-5 py-8" style={{ background: "#0F1117" }}>
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 left-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium text-center shadow-lg"
          style={{
            background: toast.type === "success" ? "rgba(63,185,80,0.15)" : "rgba(248,81,73,0.15)",
            color: toast.type === "success" ? "#3FB950" : "#F85149",
            border: `1px solid ${toast.type === "success" ? "rgba(63,185,80,0.3)" : "rgba(248,81,73,0.3)"}`,
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="fade-up flex items-start justify-between mb-8">
        <div>
          <p className="text-sm" style={{ color: "#8B949E" }}>{greeting},</p>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.02em" }}>
            {firstName.toUpperCase()}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "#8B949E" }}>
            {format(now, "EEEE, d MMM yyyy")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#F59E0B" }}>
            {format(now, "HH:mm")}
          </p>
          <p className="text-xs" style={{ color: "#30363D" }}>{format(now, "ss")}s</p>
        </div>
      </div>

      {/* Status Card */}
      <div className="fade-up fade-up-1 rounded-2xl p-5 mb-6" style={{ background: "#161B22", border: "1px solid #21262D" }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "#8B949E" }}>Today&apos;s Status</span>
          <span
            className="px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase"
            style={{
              background: loading ? "#21262D" : isClockedOut ? "rgba(63,185,80,0.1)" : isClockedIn ? "rgba(245,158,11,0.12)" : "rgba(139,148,158,0.1)",
              color: loading ? "#8B949E" : isClockedOut ? "#3FB950" : isClockedIn ? "#F59E0B" : "#8B949E",
            }}
          >
            {loading ? "—" : isClockedOut ? "Complete" : isClockedIn ? "On Duty" : "Not Started"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3" style={{ background: "#0F1117" }}>
            <p className="text-xs mb-1" style={{ color: "#8B949E" }}>Clock In</p>
            <p className="text-lg font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: attendance?.clock_in ? "#F59E0B" : "#30363D" }}>
              {attendance?.clock_in ? format(new Date(attendance.clock_in), "HH:mm") : "--:--"}
            </p>
          </div>
          <div className="rounded-xl p-3" style={{ background: "#0F1117" }}>
            <p className="text-xs mb-1" style={{ color: "#8B949E" }}>Clock Out</p>
            <p className="text-lg font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: attendance?.clock_out ? "#3FB950" : "#30363D" }}>
              {attendance?.clock_out ? format(new Date(attendance.clock_out), "HH:mm") : "--:--"}
            </p>
          </div>
        </div>

        {attendance?.hours_worked !== null && attendance?.hours_worked !== undefined && (
          <div className="mt-3 flex items-center gap-4">
            <span className="text-xs" style={{ color: "#8B949E" }}>
              {attendance.hours_worked.toFixed(1)}h worked
            </span>
            {(attendance.ot_hours ?? 0) > 0 && (
              <span className="text-xs font-medium" style={{ color: "#F59E0B" }}>
                +{attendance.ot_hours?.toFixed(1)}h OT
              </span>
            )}
          </div>
        )}
      </div>

      {/* Clock Button */}
      {!isClockedOut && (
        <div className="fade-up fade-up-2 flex justify-center my-8">
          <button
            onClick={handleClock}
            disabled={actionLoading || loading}
            className="relative flex flex-col items-center justify-center rounded-full disabled:opacity-50 transition-transform active:scale-95"
            style={{
              width: 160,
              height: 160,
              background: isClockedIn ? "#161B22" : "#F59E0B",
              border: isClockedIn ? "3px solid #F59E0B" : "none",
              boxShadow: isClockedIn ? "0 0 0 0 rgba(245,158,11,0.4)" : "0 8px 40px rgba(245,158,11,0.3)",
            }}
          >
            {isClockedIn && (
              <span className="absolute inset-0 rounded-full clock-pulse" />
            )}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="mb-2">
              {isClockedIn ? (
                <rect x="6" y="6" width="12" height="12" rx="2" fill="#F59E0B"/>
              ) : (
                <path d="M12 6v6l4 2M12 2a10 10 0 100 20A10 10 0 0012 2z" stroke="#0F1117" strokeWidth="2" strokeLinecap="round"/>
              )}
            </svg>
            <span
              className="font-bold text-sm tracking-widest uppercase"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: isClockedIn ? "#F59E0B" : "#0F1117",
              }}
            >
              {actionLoading ? "..." : isClockedIn ? "Clock Out" : "Clock In"}
            </span>
          </button>
        </div>
      )}

      {/* Month Summary */}
      <div className="fade-up fade-up-3">
        <p className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: "#8B949E" }}>
          {format(now, "MMMM")} Summary
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4" style={{ background: "#161B22", border: "1px solid #21262D" }}>
            <p className="text-xs mb-1" style={{ color: "#8B949E" }}>Days Worked</p>
            <p className="text-3xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>
              {monthStats.days}
            </p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: "#161B22", border: "1px solid #21262D" }}>
            <p className="text-xs mb-1" style={{ color: "#8B949E" }}>OT Hours</p>
            <p className="text-3xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: monthStats.ot > 0 ? "#F59E0B" : "#E6EDF3" }}>
              {monthStats.ot}h
            </p>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="fade-up fade-up-4 mt-8 flex justify-center">
        <button
          onClick={async () => {
            await fetch("/api/auth/driver", { method: "DELETE" });
            window.location.href = "/login";
          }}
          className="text-xs"
          style={{ color: "#30363D" }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
