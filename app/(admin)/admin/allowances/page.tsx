"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/client";

interface Claim {
  id: string;
  date: string;
  type: "meal" | "overnight";
  amount: number;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  driver_id: string;
  drivers: { name: string; employee_id: string } | null;
}

export default function AllowancesPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const supabase = createClient();

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("allowance_claims")
      .select("*, drivers(name, employee_id)")
      .eq("status", filter)
      .order("submitted_at", { ascending: false });
    setClaims((data as Claim[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [filter]);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function review(id: string, status: "approved" | "rejected") {
    const { error } = await supabase
      .from("allowance_claims")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) showToast(error.message, false);
    else {
      showToast(status === "approved" ? "Claim approved!" : "Claim rejected", status === "approved");
      load();
    }
  }

  const tabColor = (t: string) =>
    t === filter ? { background: "#F59E0B", color: "#0F1117" } : { background: "transparent", color: "#8B949E" };

  return (
    <div className="p-6 max-w-3xl mx-auto">
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

      <div className="fade-up mb-6">
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>ALLOWANCES</h1>
        <p className="text-xs mt-1" style={{ color: "#8B949E" }}>Review and approve driver claims</p>
      </div>

      {/* Tabs */}
      <div className="fade-up fade-up-1 flex gap-1 mb-6 rounded-xl p-1" style={{ background: "#161B22" }}>
        {(["pending", "approved", "rejected"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em", ...tabColor(t) }}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-sm py-12" style={{ color: "#30363D" }}>Loading...</p>
      ) : claims.length === 0 ? (
        <p className="text-center text-sm py-12" style={{ color: "#30363D" }}>No {filter} claims</p>
      ) : (
        <div className="fade-up fade-up-2 flex flex-col gap-3">
          {claims.map((c) => (
            <div key={c.id} className="rounded-2xl p-4" style={{ background: "#161B22", border: "1px solid #21262D" }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-white">{c.drivers?.name ?? "Unknown"}</p>
                  <p className="text-xs mt-0.5 font-mono" style={{ color: "#8B949E" }}>{c.drivers?.employee_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#F59E0B" }}>
                    RM {c.amount.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}
                >
                  {c.type === "meal" ? "Outstation Meal" : "Overnight Stay"}
                </span>
                <span className="text-xs" style={{ color: "#8B949E" }}>{format(parseISO(c.date), "d MMM yyyy")}</span>
              </div>
              <p className="text-xs mb-3" style={{ color: "#30363D" }}>
                Submitted {format(parseISO(c.submitted_at), "d MMM, HH:mm")}
              </p>
              {filter === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => review(c.id, "approved")}
                    className="flex-1 py-2 rounded-xl text-xs font-bold uppercase"
                    style={{ background: "rgba(63,185,80,0.1)", color: "#3FB950", border: "1px solid rgba(63,185,80,0.3)", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => review(c.id, "rejected")}
                    className="flex-1 py-2 rounded-xl text-xs font-bold uppercase"
                    style={{ background: "rgba(248,81,73,0.1)", color: "#F85149", border: "1px solid rgba(248,81,73,0.3)", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}
                  >
                    ✗ Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
