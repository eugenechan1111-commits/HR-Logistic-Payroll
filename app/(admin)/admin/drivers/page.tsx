"use client";

import { useEffect, useState } from "react";
import bcrypt from "bcryptjs";
import { createClient } from "@/lib/supabase/client";
import type { Driver } from "@/lib/types";

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", employee_id: "", pin: "", base_salary: "" });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const supabase = createClient();

  async function load() {
    const { data } = await supabase.from("drivers").select("*").order("name");
    setDrivers(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function addDriver(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const pin_hash = await bcrypt.hash(form.pin, 10);
    const { error } = await supabase.from("drivers").insert({
      name: form.name.trim(),
      employee_id: form.employee_id.trim().toUpperCase(),
      pin_hash,
      base_salary: parseFloat(form.base_salary),
    });
    setSubmitting(false);
    if (error) {
      showToast(error.message, false);
    } else {
      showToast("Driver added!", true);
      setShowAdd(false);
      setForm({ name: "", employee_id: "", pin: "", base_salary: "" });
      load();
    }
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from("drivers").update({ is_active: !current }).eq("id", id);
    load();
  }

  async function resetPin(id: string) {
    const newPin = prompt("Enter new 4-digit PIN:");
    if (!newPin || newPin.length !== 4 || !/^\d+$/.test(newPin)) return;
    const pin_hash = await bcrypt.hash(newPin, 10);
    const { error } = await supabase.from("drivers").update({ pin_hash }).eq("id", id);
    if (error) showToast(error.message, false);
    else showToast("PIN updated", true);
  }

  const filtered = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.employee_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
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

      <div className="fade-up flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>DRIVERS</h1>
          <p className="text-xs mt-1" style={{ color: "#8B949E" }}>{drivers.filter((d) => d.is_active).length} active drivers</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: "#F59E0B", color: "#0F1117", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}
        >
          + ADD DRIVER
        </button>
      </div>

      {/* Search */}
      <div className="fade-up fade-up-1 mb-4">
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-72 px-4 py-2.5 rounded-xl text-sm text-white placeholder-[#30363D] focus:outline-none"
          style={{ background: "#161B22", border: "1.5px solid #21262D" }}
        />
      </div>

      {/* Table */}
      <div className="fade-up fade-up-2 rounded-2xl overflow-hidden" style={{ border: "1px solid #21262D" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#161B22" }}>
              {["Employee ID", "Name", "Base Salary", "Status", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium tracking-widest uppercase" style={{ color: "#8B949E" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: "#30363D" }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: "#30363D" }}>No drivers found</td></tr>
            ) : (
              filtered.map((d) => (
                <tr key={d.id} style={{ borderTop: "1px solid #21262D", background: "#0F1117" }}>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "#8B949E" }}>{d.employee_id}</td>
                  <td className="px-4 py-3 font-medium text-white">{d.name}</td>
                  <td className="px-4 py-3" style={{ color: "#F59E0B", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    RM {d.base_salary.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        background: d.is_active ? "rgba(63,185,80,0.1)" : "rgba(248,81,73,0.1)",
                        color: d.is_active ? "#3FB950" : "#F85149",
                      }}
                    >
                      {d.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => resetPin(d.id)}
                        className="text-xs px-2.5 py-1 rounded-lg transition-colors"
                        style={{ background: "#21262D", color: "#8B949E" }}
                      >
                        Reset PIN
                      </button>
                      <button
                        onClick={() => toggleActive(d.id, d.is_active)}
                        className="text-xs px-2.5 py-1 rounded-lg transition-colors"
                        style={{ background: "#21262D", color: d.is_active ? "#F85149" : "#3FB950" }}
                      >
                        {d.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#161B22", border: "1px solid #21262D" }}>
            <h2 className="text-xl font-bold text-white mb-5" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>ADD DRIVER</h2>
            <form onSubmit={addDriver} className="flex flex-col gap-4">
              {[
                { label: "Full Name", key: "name", type: "text", ph: "Ahmad bin Abdullah" },
                { label: "Employee ID", key: "employee_id", type: "text", ph: "DRV001" },
                { label: "4-Digit PIN", key: "pin", type: "password", ph: "••••" },
                { label: "Base Salary (RM)", key: "base_salary", type: "number", ph: "2500.00" },
              ].map(({ label, key, type, ph }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-xs tracking-wider uppercase" style={{ color: "#8B949E" }}>{label}</label>
                  <input
                    type={type}
                    required
                    placeholder={ph}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none"
                    style={{ background: "#0F1117", border: "1px solid #21262D" }}
                  />
                </div>
              ))}
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: "#21262D", color: "#8B949E" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
                  style={{ background: "#F59E0B", color: "#0F1117", fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {submitting ? "Adding..." : "Add Driver"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
