import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

  const { data } = await supabase
    .from("allowance_claims")
    .select("*")
    .eq("driver_id", session.driver_id)
    .order("submitted_at", { ascending: false })
    .limit(20);

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, date } = await req.json();
  if (!type || !date) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Get configured amount
  const key = type === "meal" ? "meal_allowance_amount" : "overnight_allowance_amount";
  const { data: setting } = await supabase.from("settings").select("value").eq("key", key).single();
  const amount = parseFloat(setting?.value ?? "0");

  const { data, error } = await supabase.from("allowance_claims").insert({
    driver_id: session.driver_id,
    date,
    type,
    amount,
    status: "pending",
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
