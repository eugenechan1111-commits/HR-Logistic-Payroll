import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { employee_id, pin } = await req.json();

  if (!employee_id || !pin) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const { data: driver, error } = await supabase
    .from("drivers")
    .select("id, name, employee_id, pin_hash, is_active")
    .eq("employee_id", employee_id.trim().toUpperCase())
    .single();

  if (error || !driver) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (!driver.is_active) {
    return NextResponse.json({ error: "Account deactivated" }, { status: 403 });
  }

  const valid = await bcrypt.compare(pin, driver.pin_hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const session = JSON.stringify({
    driver_id: driver.id,
    name: driver.name,
    employee_id: driver.employee_id,
  });

  const response = NextResponse.json({ ok: true, name: driver.name });
  response.cookies.set("driver_session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 12, // 12 hours
    path: "/",
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("driver_session");
  return response;
}
