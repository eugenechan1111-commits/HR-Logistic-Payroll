-- FleetPay Schema

create extension if not exists "pgcrypto";

-- Drivers
create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  employee_id text unique not null,
  pin_hash text not null,
  base_salary numeric(10,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Attendance
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references drivers(id) on delete cascade,
  date date not null,
  clock_in timestamptz,
  clock_out timestamptz,
  hours_worked numeric(5,2),
  is_weekend boolean not null default false,
  is_public_holiday boolean not null default false,
  ot_hours numeric(5,2),
  ot_amount numeric(10,2),
  unique (driver_id, date)
);

-- Allowance Claims
create table if not exists allowance_claims (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references drivers(id) on delete cascade,
  date date not null,
  type text not null check (type in ('meal', 'overnight')),
  amount numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- Settings
create table if not exists settings (
  key text primary key,
  value text not null
);

insert into settings (key, value) values
  ('meal_allowance_amount', '15.00'),
  ('overnight_allowance_amount', '80.00'),
  ('standard_hours', '8'),
  ('weekday_ot_multiplier', '1.5'),
  ('ph_ot_multiplier', '2.0')
on conflict (key) do nothing;

-- Public Holidays (Malaysia 2025-2026)
create table if not exists public_holidays (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  description text not null
);

insert into public_holidays (date, description) values
  ('2025-01-01', 'New Year''s Day'),
  ('2025-01-29', 'Chinese New Year'),
  ('2025-01-30', 'Chinese New Year Holiday'),
  ('2025-02-01', 'Federal Territory Day'),
  ('2025-03-31', 'Hari Raya Aidilfitri'),
  ('2025-04-01', 'Hari Raya Aidilfitri Holiday'),
  ('2025-04-18', 'Good Friday'),
  ('2025-05-01', 'Labour Day'),
  ('2025-05-12', 'Wesak Day'),
  ('2025-06-02', 'Agong''s Birthday'),
  ('2025-08-09', 'Hari Raya Aidiladha'),
  ('2025-08-31', 'National Day'),
  ('2025-09-16', 'Malaysia Day'),
  ('2025-10-20', 'Deepavali'),
  ('2025-12-25', 'Christmas'),
  ('2026-01-01', 'New Year''s Day'),
  ('2026-01-28', 'Chinese New Year'),
  ('2026-01-29', 'Chinese New Year Holiday'),
  ('2026-02-01', 'Federal Territory Day'),
  ('2026-03-20', 'Hari Raya Aidilfitri'),
  ('2026-03-21', 'Hari Raya Aidilfitri Holiday'),
  ('2026-05-01', 'Labour Day'),
  ('2026-05-31', 'Wesak Day'),
  ('2026-06-01', 'Agong''s Birthday'),
  ('2026-08-31', 'National Day'),
  ('2026-09-16', 'Malaysia Day'),
  ('2026-12-25', 'Christmas')
on conflict (date) do nothing;

-- RLS Policies
alter table drivers enable row level security;
alter table attendance enable row level security;
alter table allowance_claims enable row level security;
alter table settings enable row level security;
alter table public_holidays enable row level security;

-- Service role (admin) has full access
-- Anon/authenticated only via server-side with service key or specific policies

-- Public holidays readable by all
create policy "public_holidays_read" on public_holidays for select using (true);

-- Settings readable by all (for client-side display)
create policy "settings_read" on settings for select using (true);
