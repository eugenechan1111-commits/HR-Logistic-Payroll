import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calcOT, hourlyRate } from "@/lib/payroll";
import type { Settings } from "@/lib/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getSession(req: NextRequest) {
  const cookie = req.cookies.get("driver_session");
  if (!cookie?.value) return null;
  try { return JSON.parse(cookie.value); } catch { return null; }
}

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM

  let query = supabase
    .from("attendance")
    .select("*")
    .eq("driver_id", session.driver_id)
    .order("date", { ascending: false });

  if (month) {
    query = query.gte("date", `${month}-01`).lte("date", `${month}-31`);
  }

  const { data } = await query;
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action } = await req.json(); // "clock_in" | "clock_out"
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  const { data: existing } = await supabase
    .from("attendance")
    .select("*")
    .eq("driver_id", session.driver_id)
    .eq("date", today)
    .single();

  if (action === "clock_in") {
    if (existing?.clock_in) {
      return NextResponse.json({ error: "Already clocked in" }, { status: 400 });
    }

    const isWeekend = [0, 6].includes(now.getDay());
    const { data: ph } = await supabase
      .from("public_holidays")
      .select("id")
      .eq("date", today)
      .single();

    if (existing) {
      await supabase.from("attendance").update({ clock_in: now.toISOString() }).eq("id", existing.id);
    } else {
      await supabase.from("attendance").insert({
        driver_id: session.driver_id,
        date: today,
        clock_in: now.toISOString(),
        is_weekend: isWeekend,
        is_public_holiday: !!ph,
      });
    }
    return NextResponse.json({ ok: true, clocked_in_at: now.toISOString() });
  }

  if (action === "clock_out") {
    if (!existing?.clock_in) {
      return NextResponse.json({ error: "Not clocked in" }, { status: 400 });
    }
    if (existing?.clock_out) {
      return NextResponse.json({ error: "Already clocked out" }, { status: 400 });
    }

    const clockIn = new Date(existing.clock_in);
    const hours_worked = (now.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

    // Fetch driver salary + settings for OT calc
    const { data: driver } = await supabase
      .from("drivers")
      .select("base_salary")
      .eq("id", session.driver_id)
      .single();

    const { data: settingsRows } = await supabase.from("settings").select("*");
    const settings: Settings = {
      meal_allowance_amount: 15,
      overnight_allowance_amount: 80,
      standard_hours: 8,
      weekday_ot_multiplier: 1.5,
      ph_ot_multiplier: 2.0,
    };
    if (settingsRows) {
      settingsRows.forEach((r) => {
        (settings as Record<string, number>)[r.key] = parseFloat(r.value);
      });
    }

    const rate = hourlyRate(driver?.base_salary ?? 0);
    const attRecord = { ...existing, hours_worked, clock_out: now.toISOString() };
    const { ot_hours, ot_amount } = calcOT(attRecord as Parameters<typeof calcOT>[0], rate, settings);

    await supabase.from("attendance").update({
      clock_out: now.toISOString(),
      hours_worked: Math.round(hours_worked * 100) / 100,
      ot_hours: Math.round(ot_hours * 100) / 100,
      ot_amount: Math.round(ot_amount * 100) / 100,
    }).eq("id", existing.id);

    return NextResponse.json({ ok: true, hours_worked, ot_hours, ot_amount });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
