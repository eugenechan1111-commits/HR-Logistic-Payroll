import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const today = new Date().toISOString().split("T")[0];

  const [{ data: drivers }, { data: todayAtt }, { data: pendingClaims }] = await Promise.all([
    supabase.from("drivers").select("id, name, employee_id, is_active").eq("is_active", true).order("name"),
    supabase.from("attendance").select("driver_id, clock_in, clock_out").eq("date", today),
    supabase.from("allowance_claims").select("id").eq("status", "pending"),
  ]);

  const clockedIn = new Set((todayAtt ?? []).filter((a) => a.clock_in).map((a) => a.driver_id));
  const clockedOut = new Set((todayAtt ?? []).filter((a) => a.clock_out).map((a) => a.driver_id));
  const total = drivers?.length ?? 0;
  const present = clockedIn.size;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="fade-up mb-8">
        <p className="text-xs font-medium tracking-widest uppercase mb-1" style={{ color: "#8B949E" }}>
          {format(new Date(), "EEEE, d MMMM yyyy")}
        </p>
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.02em" }}>
          TODAY&apos;S OVERVIEW
        </h1>
      </div>

      {/* Stats */}
      <div className="fade-up fade-up-1 grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Total Drivers", value: total, color: "#E6EDF3" },
          { label: "Present", value: present, color: "#3FB950" },
          { label: "Absent", value: total - present, color: "#F85149" },
          { label: "Pending Claims", value: pendingClaims?.length ?? 0, color: "#F59E0B" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-4" style={{ background: "#161B22", border: "1px solid #21262D" }}>
            <p className="text-xs mb-2" style={{ color: "#8B949E" }}>{s.label}</p>
            <p className="text-4xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: s.color }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Driver Grid */}
      <div className="fade-up fade-up-2">
        <p className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: "#8B949E" }}>Driver Status</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {(drivers ?? []).map((d) => {
            const isIn = clockedIn.has(d.id);
            const isOut = clockedOut.has(d.id);
            const status = isOut ? "done" : isIn ? "active" : "absent";
            return (
              <div
                key={d.id}
                className="rounded-xl px-3 py-3 flex flex-col gap-1"
                style={{
                  background: "#161B22",
                  border: `1px solid ${status === "active" ? "rgba(245,158,11,0.4)" : status === "done" ? "rgba(63,185,80,0.2)" : "#21262D"}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono" style={{ color: "#8B949E" }}>{d.employee_id}</span>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: status === "active" ? "#F59E0B" : status === "done" ? "#3FB950" : "#30363D" }}
                  />
                </div>
                <p className="text-sm font-medium text-white leading-tight">{d.name}</p>
                <span
                  className="text-xs"
                  style={{ color: status === "active" ? "#F59E0B" : status === "done" ? "#3FB950" : "#8B949E" }}
                >
                  {status === "active" ? "On Duty" : status === "done" ? "Complete" : "Absent"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
