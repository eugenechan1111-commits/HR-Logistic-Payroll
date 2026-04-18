"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface SettingField {
  key: string;
  label: string;
  description: string;
  prefix?: string;
  suffix?: string;
  step?: string;
}

const FIELDS: SettingField[] = [
  { key: "meal_allowance_amount", label: "Outstation Meal Allowance", description: "Amount per outstation trip (meal)", prefix: "RM", step: "0.01" },
  { key: "overnight_allowance_amount", label: "Overnight Stay Allowance", description: "Amount per night away from base", prefix: "RM", step: "0.01" },
  { key: "standard_hours", label: "Standard Hours Per Day", description: "Hours before OT kicks in on weekdays", suffix: "hours", step: "0.5" },
  { key: "weekday_ot_multiplier", label: "Weekday OT Rate", description: "Multiplier for hours beyond standard (e.g. 1.5 = 1.5×)", suffix: "×", step: "0.1" },
  { key: "ph_ot_multiplier", label: "Weekend / Public Holiday Rate", description: "Multiplier for all hours on weekends and PH", suffix: "×", step: "0.1" },
];

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const supabase = createClient();

  async function load() {
    const { data } = await supabase.from("settings").select("*");
    const map: Record<string, string> = {};
    (data ?? []).forEach((r) => { map[r.key] = r.value; });
    setValues(map);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const updates = Object.entries(values).map(([key, value]) => ({ key, value }));
    const { error } = await supabase.from("settings").upsert(updates, { onConflict: "key" });
    setSaving(false);
    if (error) showToast(error.message, false);
    else showToast("Settings saved!", true);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg"
          style={{
            background: toast.ok ? "rgba(63,185,80,0.15)" : "rgba(248,81,73,0.15)",
            color: toast.ok ? "#3FB950" : "#F85149",
            border: `1px solid ${toast.ok ? "rgba(63,185,80,0.3)" : "rgba(248,81,73,0.3)"}`,
          }}
        >
          {toast.msg}
        </div>
      )}

      <div className="fade-up mb-8">
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>SETTINGS</h1>
        <p className="text-xs mt-1" style={{ color: "#8B949E" }}>Configure allowance rates and OT rules</p>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "#30363D" }}>Loading...</p>
      ) : (
        <form onSubmit={save} className="flex flex-col gap-4">
          {/* Allowances Section */}
          <div className="fade-up fade-up-1">
            <p className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: "#F59E0B" }}>Allowance Amounts</p>
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #21262D" }}>
              {FIELDS.slice(0, 2).map((f, i) => (
                <div key={f.key} className="px-5 py-4 flex items-center justify-between gap-4" style={{ borderTop: i > 0 ? "1px solid #21262D" : "none", background: "#161B22" }}>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{f.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#8B949E" }}>{f.description}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {f.prefix && <span className="text-sm" style={{ color: "#8B949E" }}>{f.prefix}</span>}
                    <input
                      type="number"
                      step={f.step}
                      min="0"
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                      className="w-24 px-3 py-2 rounded-xl text-sm text-white text-right focus:outline-none"
                      style={{ background: "#0F1117", border: "1px solid #21262D" }}
                    />
                    {f.suffix && <span className="text-sm" style={{ color: "#8B949E" }}>{f.suffix}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* OT Section */}
          <div className="fade-up fade-up-2">
            <p className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: "#F59E0B" }}>OT Rules</p>
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #21262D" }}>
              {FIELDS.slice(2).map((f, i) => (
                <div key={f.key} className="px-5 py-4 flex items-center justify-between gap-4" style={{ borderTop: i > 0 ? "1px solid #21262D" : "none", background: "#161B22" }}>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{f.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#8B949E" }}>{f.description}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {f.prefix && <span className="text-sm" style={{ color: "#8B949E" }}>{f.prefix}</span>}
                    <input
                      type="number"
                      step={f.step}
                      min="0"
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                      className="w-24 px-3 py-2 rounded-xl text-sm text-white text-right focus:outline-none"
                      style={{ background: "#0F1117", border: "1px solid #21262D" }}
                    />
                    {f.suffix && <span className="text-sm" style={{ color: "#8B949E" }}>{f.suffix}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="fade-up fade-up-3 w-full py-4 rounded-xl font-bold tracking-widest uppercase disabled:opacity-40 mt-2"
            style={{ background: "#F59E0B", color: "#0F1117", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.95rem", letterSpacing: "0.12em" }}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </form>
      )}
    </div>
  );
}
