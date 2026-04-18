"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { AllowanceClaim } from "@/lib/types";

export default function ClaimsPage() {
  const [type, setType] = useState<"meal" | "overnight">("meal");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<AllowanceClaim[]>([]);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => { loadRecent(); }, []);

  async function loadRecent() {
    const res = await fetch("/api/claims");
    setRecent(await res.json());
  }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function submit() {
    setLoading(true);
    const res = await fetch("/api/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, date }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      showToast("Claim submitted!", true);
      loadRecent();
    } else {
      showToast(data.error ?? "Error", false);
    }
  }

  const statusColor = (s: string) =>
    s === "approved" ? "#3FB950" : s === "rejected" ? "#F85149" : "#F59E0B";
  const statusBg = (s: string) =>
    s === "approved" ? "rgba(63,185,80,0.1)" : s === "rejected" ? "rgba(248,81,73,0.1)" : "rgba(245,158,11,0.1)";

  return (
    <div className="min-h-screen px-5 py-8" style={{ background: "#0F1117" }}>
      {toast && (
        <div
          className="fixed top-4 left-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium text-center"
          style={{
            background: toast.ok ? "rgba(63,185,80,0.15)" : "rgba(248,81,73,0.15)",
            color: toast.ok ? "#3FB950" : "#F85149",
            border: `1px solid ${toast.ok ? "rgba(63,185,80,0.3)" : "rgba(248,81,73,0.3)"}`,
          }}
        >
          {toast.msg}
        </div>
      )}

      <div className="fade-up mb-6">
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          CLAIM ALLOWANCE
        </h1>
        <p className="text-xs mt-1" style={{ color: "#8B949E" }}>Submit outstation claims for approval</p>
      </div>

      {/* Type Toggle */}
      <div className="fade-up fade-up-1 rounded-2xl p-1 mb-5 flex gap-1" style={{ background: "#161B22" }}>
        {(["meal", "overnight"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className="flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              background: type === t ? "#F59E0B" : "transparent",
              color: type === t ? "#0F1117" : "#8B949E",
              letterSpacing: "0.08em",
            }}
          >
            {t === "meal" ? "🍽 Outstation Meal" : "🌙 Overnight Stay"}
          </button>
        ))}
      </div>

      {/* Date */}
      <div className="fade-up fade-up-2 mb-5 flex flex-col gap-2">
        <label className="text-xs font-medium tracking-widest uppercase" style={{ color: "#8B949E" }}>Date</label>
        <input
          type="date"
          value={date}
          max={new Date().toISOString().split("T")[0]}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-3.5 rounded-xl text-white text-sm focus:outline-none"
          style={{ background: "#161B22", border: "1.5px solid #21262D", colorScheme: "dark" }}
        />
      </div>

      <p className="fade-up fade-up-2 text-xs mb-5" style={{ color: "#8B949E" }}>
        Amount will be applied as per configured rate.
      </p>

      <button
        onClick={submit}
        disabled={loading}
        className="fade-up fade-up-3 w-full py-4 rounded-xl font-bold tracking-widest uppercase transition-all disabled:opacity-40"
        style={{ background: "#F59E0B", color: "#0F1117", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.95rem", letterSpacing: "0.12em" }}
      >
        {loading ? "Submitting..." : "Submit Claim"}
      </button>

      {/* Recent */}
      {recent.length > 0 && (
        <div className="fade-up fade-up-4 mt-8">
          <p className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: "#8B949E" }}>Recent Claims</p>
          <div className="flex flex-col gap-2">
            {recent.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: "#161B22", border: "1px solid #21262D" }}>
                <div>
                  <p className="text-sm font-medium text-white">
                    {c.type === "meal" ? "Outstation Meal" : "Overnight Stay"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#8B949E" }}>{format(new Date(c.date), "d MMM yyyy")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: "#F59E0B", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    RM {c.amount.toFixed(2)}
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium uppercase" style={{ background: statusBg(c.status), color: statusColor(c.status) }}>
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
