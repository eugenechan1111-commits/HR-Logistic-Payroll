"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      router.push("/admin");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#0F1117" }}>
      <div className="fade-up mb-10 flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: "#F59E0B" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M1 17h2M21 17h2M3 17V9l5-5h8l5 5v8M7 17v-4h10v4" stroke="#0F1117" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold tracking-wide text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
            FLEETPAY
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "#F59E0B" }}>Boss Portal</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="fade-up fade-up-1 w-full max-w-sm flex flex-col gap-4">
        {[
          { label: "Email", type: "email", val: email, set: setEmail },
          { label: "Password", type: "password", val: password, set: setPassword },
        ].map(({ label, type, val, set }) => (
          <div key={label} className="flex flex-col gap-2">
            <label className="text-xs font-medium tracking-widest uppercase" style={{ color: "#8B949E" }}>{label}</label>
            <input
              type={type}
              value={val}
              onChange={(e) => set(e.target.value)}
              required
              className="w-full px-4 py-3.5 rounded-xl text-white text-sm focus:outline-none transition-all"
              style={{ background: "#161B22", border: "1.5px solid #21262D" }}
              onFocus={(e) => (e.target.style.borderColor = "#F59E0B")}
              onBlur={(e) => (e.target.style.borderColor = "#21262D")}
            />
          </div>
        ))}

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm text-center" style={{ background: "rgba(248,81,73,0.12)", color: "#F85149", border: "1px solid rgba(248,81,73,0.3)" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl font-bold tracking-widest uppercase disabled:opacity-40 mt-2"
          style={{ background: "#F59E0B", color: "#0F1117", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.95rem", letterSpacing: "0.12em" }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="fade-up fade-up-2 mt-8 text-xs" style={{ color: "#30363D" }}>
        Driver?{" "}
        <a href="/login" className="underline" style={{ color: "#8B949E" }}>Driver login</a>
      </p>
    </div>
  );
}
