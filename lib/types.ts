export interface Driver {
  id: string;
  name: string;
  employee_id: string;
  pin_hash: string;
  base_salary: number;
  is_active: boolean;
  created_at: string;
}

export interface Attendance {
  id: string;
  driver_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  hours_worked: number | null;
  is_weekend: boolean;
  is_public_holiday: boolean;
  ot_hours: number | null;
  ot_amount: number | null;
}

export interface AllowanceClaim {
  id: string;
  driver_id: string;
  date: string;
  type: "meal" | "overnight";
  amount: number;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  reviewed_at: string | null;
  driver?: { name: string; employee_id: string };
}

export interface Settings {
  meal_allowance_amount: number;
  overnight_allowance_amount: number;
  standard_hours: number;
  weekday_ot_multiplier: number;
  ph_ot_multiplier: number;
}

export interface PayrollRow {
  driver_id: string;
  name: string;
  employee_id: string;
  base_salary: number;
  days_worked: number;
  ot_hours: number;
  ot_amount: number;
  allowances: number;
  total: number;
}

export interface DriverSession {
  driver_id: string;
  name: string;
  employee_id: string;
}
