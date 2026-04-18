import type { Attendance, AllowanceClaim, PayrollRow, Settings } from "./types";

export function calcOT(att: Attendance, hourlRate: number, settings: Settings): { ot_hours: number; ot_amount: number } {
  const hours = att.hours_worked ?? 0;

  if (att.is_public_holiday || att.is_weekend) {
    const ot_hours = hours;
    const ot_amount = ot_hours * hourlRate * settings.ph_ot_multiplier;
    return { ot_hours, ot_amount };
  }

  const excess = Math.max(hours - settings.standard_hours, 0);
  const ot_amount = excess * hourlRate * settings.weekday_ot_multiplier;
  return { ot_hours: excess, ot_amount };
}

export function hourlyRate(base_salary: number): number {
  return base_salary / 26 / 8;
}

export function buildPayrollRows(
  drivers: { id: string; name: string; employee_id: string; base_salary: number }[],
  attendance: Attendance[],
  claims: AllowanceClaim[],
  settings: Settings
): PayrollRow[] {
  return drivers.map((d) => {
    const dAtt = attendance.filter((a) => a.driver_id === d.id);
    const dClaims = claims.filter((c) => c.driver_id === d.id && c.status === "approved");
    const rate = hourlyRate(d.base_salary);

    const days_worked = dAtt.filter((a) => a.clock_in !== null).length;
    let ot_hours = 0;
    let ot_amount = 0;

    for (const att of dAtt) {
      const { ot_hours: oh, ot_amount: oa } = calcOT(att, rate, settings);
      ot_hours += oh;
      ot_amount += oa;
    }

    const allowances = dClaims.reduce((sum, c) => sum + c.amount, 0);
    const total = d.base_salary + ot_amount + allowances;

    return {
      driver_id: d.id,
      name: d.name,
      employee_id: d.employee_id,
      base_salary: d.base_salary,
      days_worked,
      ot_hours: Math.round(ot_hours * 10) / 10,
      ot_amount: Math.round(ot_amount * 100) / 100,
      allowances: Math.round(allowances * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  });
}

export function fmt(n: number): string {
  return `RM ${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}
