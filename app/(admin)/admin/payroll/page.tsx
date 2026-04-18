"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { buildPayrollRows, fmt } from "@/lib/payroll";
import type { PayrollRow, Settings } from "@/lib/types";

export default function PayrollPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.toISOString().slice(0, 7));
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => { load(); }, [month]);

  async function load() {
    setLoading(true);
    const [start, end] = [`${month}-01`, `${month}-31`];

    const [{ data: drivers }, { data: attendance }, { data: claims }, { data: settingsRows }] = await Promise.all([
      supabase.from("drivers").select("id, name, employee_id, base_salary").eq("is_active", true).order("name"),
      supabase.from("attendance").select("*").gte("date", start).lte("date", end),
      supabase.from("allowance_claims").select("*").gte("date", start).lte("date", end).eq("status", "approved"),
      supabase.from("settings").select("*"),
    ]);

    const settings: Settings = {
      meal_allowance_amount: 15,
      overnight_allowance_amount: 80,
      standard_hours: 8,
      weekday_ot_multiplier: 1.5,
      ph_ot_multiplier: 2.0,
    };
    (settingsRows ?? []).forEach((r) => {
      (settings as unknown as Record<string, number>)[r.key] = parseFloat(r.value);
    });

    const computed = buildPayrollRows(
      (drivers ?? []) as { id: string; name: string; employee_id: string; base_salary: number }[],
      (attendance ?? []) as Parameters<typeof buildPayrollRows>[1],
      (claims ?? []) as Parameters<typeof buildPayrollRows>[2],
      settings
    );
    setRows(computed);
    setLoading(false);
  }

  function exportCsv() {
    const header = "Employee ID,Name,Base Salary,Days Worked,OT Hours,OT Pay,Allowances,Total\n";
    const body = rows
      .map((r) => `${r.employee_id},${r.name},${r.base_salary},${r.days_worked},${r.ot_hours},${r.ot_amount},${r.allowances},${r.total}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-${month}.csv`;
    a.click();
  }

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="fade-up flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>PAYROLL</h1>
          <p className="text-xs mt-1" style={{ color: "#8B949E" }}>Monthly auto-calculated payroll</p>
        </div>
        <div className="flex gap-3 items-center">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm text-white focus:outline-none"
            style={{ background: "#161B22", border: "1.5px solid #21262D", colorScheme: "dark" }}
          />
          <button
            onClick={exportCsv}
            className="px-4 py-2 rounded-xl text-xs font-bold uppercase"
            style={{ background: "#161B22", color: "#F59E0B", border: "1px solid #21262D", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Grand Total */}
      <div className="fade-up fade-up-1 rounded-2xl p-5 mb-6 flex items-center justify-between" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
        <div>
          <p className="text-xs font-medium tracking-widest uppercase mb-1" style={{ color: "#8B949E" }}>Total Payroll</p>
          <p className="text-4xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#F59E0B" }}>
            {fmt(grandTotal)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: "#8B949E" }}>{rows.length} drivers</p>
          <p className="text-sm mt-1 font-medium" style={{ color: "#E6EDF3" }}>{month}</p>
        </div>
      </div>

      {/* Table */}
      <div className="fade-up fade-up-2 rounded-2xl overflow-x-auto" style={{ border: "1px solid #21262D" }}>
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr style={{ background: "#161B22" }}>
              {["#", "Name", "Base", "Days", "OT Hrs", "OT Pay", "Allowances", "Total"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium tracking-widest uppercase" style={{ color: "#8B949E" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center" style={{ color: "#30363D" }}>Calculating...</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.driver_id} style={{ borderTop: "1px solid #21262D", background: "#0F1117" }}>
                <td className="px-4 py-3 text-xs" style={{ color: "#30363D" }}>{i + 1}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{r.name}</p>
                  <p className="text-xs font-mono" style={{ color: "#8B949E" }}>{r.employee_id}</p>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: "#E6EDF3" }}>{fmt(r.base_salary)}</td>
                <td className="px-4 py-3 text-center">
                  <span className="text-lg font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: r.days_worked > 0 ? "#3FB950" : "#8B949E" }}>
                    {r.days_worked}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span style={{ color: r.ot_hours > 0 ? "#F59E0B" : "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {r.ot_hours > 0 ? `${r.ot_hours}h` : "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: r.ot_amount > 0 ? "#F59E0B" : "#8B949E" }}>
                  {r.ot_amount > 0 ? fmt(r.ot_amount) : "—"}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: r.allowances > 0 ? "#E3B341" : "#8B949E" }}>
                  {r.allowances > 0 ? fmt(r.allowances) : "—"}
                </td>
                <td className="px-4 py-3 font-bold" style={{ color: "#F59E0B", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1rem" }}>
                  {fmt(r.total)}
                </td>
              </tr>
            ))}
            {!loading && rows.length > 0 && (
              <tr style={{ borderTop: "2px solid #F59E0B", background: "#161B22" }}>
                <td colSpan={7} className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-right" style={{ color: "#8B949E" }}>Grand Total</td>
                <td className="px-4 py-3 font-bold text-lg" style={{ color: "#F59E0B", fontFamily: "'Barlow Condensed', sans-serif" }}>{fmt(grandTotal)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
