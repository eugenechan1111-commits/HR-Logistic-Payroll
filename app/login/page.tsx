"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function DriverLoginPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  function handlePinChange(i: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...pin];
    next[i] = digit;
    setPin(next);
    if (digit && i < 3) pinRefs[i + 1].current?.focus();
  }

  function handlePinKey(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !pin[i] && i > 0) {
      pinRefs[i - 1].current?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pinStr = pin.join("");
    if (!employeeId || pinStr.length < 4) return;

    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/driver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employee_id: employeeId, pin: pinStr }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Login failed");
      setPin(["", "", "", ""]);
      pinRefs[0].current?.focus();
    } else {
      router.push("/driver");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#0F1117" }}>
      {/* Logo mark */}
      <div className="fade-up mb-10 flex flex-col items-center gap-3">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center"
          style={{ background: "#F59E0B" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M1 17h2M21 17h2M3 17V9l5-5h8l5 5v8M7 17v-4h10v4" stroke="#0F1117" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold tracking-wide text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
            FLEETPAY
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "#8B949E" }}>Driver Portal</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="fade-up fade-up-1 w-full max-w-sm flex flex-col gap-6"
      >
        {/* Employee ID */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium tracking-widest uppercase" style={{ color: "#8B949E" }}>
            Employee ID
          </label>
          <input
            type="text"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
            placeholder="e.g. DRV001"
            autoComplete="username"
            className="w-full px-4 py-3.5 rounded-xl text-white placeholder-[#30363D] text-sm font-medium focus:outline-none transition-all"
            style={{
              background: "#161B22",
              border: "1.5px solid #21262D",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#F59E0B")}
            onBlur={(e) => (e.target.style.borderColor = "#21262D")}
          />
        </div>

        {/* PIN */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium tracking-widest uppercase" style={{ color: "#8B949E" }}>
            PIN
          </label>
          <div className="flex gap-3 justify-center">
            {pin.map((digit, i) => (
              <input
                key={i}
                ref={pinRefs[i]}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(i, e.target.value)}
                onKeyDown={(e) => handlePinKey(i, e)}
                className="w-14 h-14 text-center text-xl font-bold rounded-xl text-white focus:outline-none transition-all"
                style={{
                  background: "#161B22",
                  border: digit ? "2px solid #F59E0B" : "1.5px solid #21262D",
                  fontFamily: "'Barlow Condensed', sans-serif",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#F59E0B")}
                onBlur={(e) => (e.target.style.borderColor = digit ? "#F59E0B" : "#21262D")}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm text-center font-medium" style={{ background: "rgba(248,81,73,0.12)", color: "#F85149", border: "1px solid rgba(248,81,73,0.3)" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !employeeId || pin.join("").length < 4}
          className="w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "#F59E0B",
            color: "#0F1117",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "0.95rem",
            letterSpacing: "0.12em",
          }}
          onMouseEnter={(e) => !loading && ((e.target as HTMLElement).style.background = "#D97706")}
          onMouseLeave={(e) => !loading && ((e.target as HTMLElement).style.background = "#F59E0B")}
        >
          {loading ? "Checking..." : "Clock In"}
        </button>
      </form>

      <p className="fade-up fade-up-2 mt-8 text-xs text-center" style={{ color: "#30363D" }}>
        Admin?{" "}
        <a href="/admin/login" className="underline" style={{ color: "#8B949E" }}>
          Boss login
        </a>
      </p>
    </div>
  );
}
