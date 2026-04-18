"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";

interface AttRecord {
  id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  hours_worked: number | null;
  ot_hours: number | null;
  ot_amount: number | null;
  is_weekend: boolean;
  is_public_holiday: boolean;
}

export default function HistoryPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.toISOString().slice(0, 7));
  const [records, setRecords] = useState<AttRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/attendance?month=${month}`)
      .then((r) => r.json())
      .then((d) => { setRecords(d); setLoading(false); });
  }, [month]);

  const totalDays = records.filter((r) => r.clock_in).length;
  const totalOT = records.reduce((s, r) => s + (r.ot_hours ?? 0), 0);
  const totalOTAmt = records.reduce((s, r) => s + (r.ot_amount ?? 0), 0);

  return (
    <div className="min-h-screen px-5 py-8" style={{ background: "#0F1117" }}>
      <div className="fade-up mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            HISTORY
          </h1>
          <p className="text-xs mt-1" style={{ color: "#8B949E" }}>Attendance & earnings</p>
        </div>
        <input
          type="month"
          value={month}
          max={now.toISOString().slice(0, 7)}
          onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm text-white focus:outline-none"
          style={{ background: "#161B22", border: "1.5px solid #21262D", colorScheme: "dark" }}
        />
      </div>

      {/* Summary */}
      <div className="fade-up fade-up-1 grid grid-cols-3 gap-2 mb-6">
        {[
          { label: "Days", value: totalDays },
          { label: "OT Hrs", value: `${Math.round(totalOT * 10) / 10}h` },
          { label: "OT Pay", value: `RM ${totalOTAmt.toFixed(0)}` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "#161B22", border: "1px solid #21262D" }}>
            <p className="text-xs mb-1" style={{ color: "#8B949E" }}>{s.label}</p>
            <p className="text-xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#F59E0B" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Records */}
      {loading ? (
        <p className="text-center text-sm mt-12" style={{ color: "#30363D" }}>Loading...</p>
      ) : records.length === 0 ? (
        <p className="text-center text-sm mt-12" style={{ color: "#30363D" }}>No records for this month</p>
      ) : (
        <div className="fade-up fade-up-2 flex flex-col gap-2">
          {records.map((r) => (
            <div key={r.id} className="rounded-xl px-4 py-3" style={{ background: "#161B22", border: "1px solid #21262D" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.05rem" }}>
                    {format(parseISO(r.date), "EEE, d MMM")}
                  </span>
                  {(r.is_public_holiday || r.is_weekend) && (
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}>
                      {r.is_public_holiday ? "PH" : "WE"}
                    </span>
                  )}
                </div>
                {r.clock_in ? (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(63,185,80,0.1)", color: "#3FB950" }}>Present</span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(139,148,158,0.1)", color: "#8B949E" }}>Absent</span>
                )}
              </div>
              {r.clock_in && (
                <div className="flex items-center gap-4 text-xs" style={{ color: "#8B949E" }}>
                  <span>{format(parseISO(r.clock_in), "HH:mm")} → {r.clock_out ? format(parseISO(r.clock_out), "HH:mm") : "—"}</span>
                  {r.hours_worked !== null && <span>{r.hours_worked.toFixed(1)}h</span>}
                  {(r.ot_hours ?? 0) > 0 && (
                    <span style={{ color: "#F59E0B" }}>+{r.ot_hours?.toFixed(1)}h OT</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
