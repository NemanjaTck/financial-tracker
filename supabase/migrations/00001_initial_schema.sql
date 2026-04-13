-- Financial Tracker - Initial Schema
-- All tables use RLS (Row Level Security) tied to the authenticated admin user

-- ============================================
-- EMPLOYEES
-- ============================================
create table public.employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.employees enable row level security;

create policy "Users can manage their own employees"
  on public.employees for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================
-- CLIENTS
-- ============================================
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  pib text,
  type text not null default 'regular' check (type in ('regular', 'one_time')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.clients enable row level security;

create policy "Users can manage their own clients"
  on public.clients for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================
-- JOBS
-- ============================================
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  location_name text not null,
  employee_rate numeric not null check (employee_rate >= 0),
  client_rate numeric not null check (client_rate >= 0),
  default_hours numeric not null check (default_hours > 0),
  work_days int[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.jobs enable row level security;

create policy "Users can manage their own jobs"
  on public.jobs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_jobs_client_id on public.jobs(client_id);

-- ============================================
-- JOB ASSIGNMENTS (employee <-> job)
-- ============================================
create table public.job_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  custom_rate numeric,
  created_at timestamptz not null default now(),
  unique (job_id, employee_id)
);

alter table public.job_assignments enable row level security;

create policy "Users can manage their own job assignments"
  on public.job_assignments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_job_assignments_job_id on public.job_assignments(job_id);
create index idx_job_assignments_employee_id on public.job_assignments(employee_id);

-- ============================================
-- WORK LOGS (daily check-ins)
-- ============================================
create table public.work_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  date date not null,
  hours numeric not null check (hours >= 0),
  checked boolean not null default false,
  is_extra boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  unique (job_id, employee_id, date)
);

alter table public.work_logs enable row level security;

create policy "Users can manage their own work logs"
  on public.work_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_work_logs_date on public.work_logs(date);
create index idx_work_logs_employee_id on public.work_logs(employee_id);
create index idx_work_logs_job_id on public.work_logs(job_id);
create index idx_work_logs_date_checked on public.work_logs(date, checked);

-- ============================================
-- BONUSES & PENALTIES
-- ============================================
create table public.bonuses_penalties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  type text not null check (type in ('bonus', 'penalty')),
  amount numeric not null check (amount > 0),
  date date not null,
  description text,
  created_at timestamptz not null default now()
);

alter table public.bonuses_penalties enable row level security;

create policy "Users can manage their own bonuses and penalties"
  on public.bonuses_penalties for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_bonuses_penalties_employee_id on public.bonuses_penalties(employee_id);
create index idx_bonuses_penalties_date on public.bonuses_penalties(date);

-- ============================================
-- FIXED COSTS (templates for recurring monthly costs)
-- ============================================
create table public.fixed_costs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null check (amount >= 0),
  day_of_month int not null default 1 check (day_of_month between 1 and 31),
  is_recurring boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.fixed_costs enable row level security;

create policy "Users can manage their own fixed costs"
  on public.fixed_costs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================
-- MONTHLY COST ENTRIES (actual cost instances per month)
-- ============================================
create table public.monthly_cost_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fixed_cost_id uuid references public.fixed_costs(id) on delete set null,
  name text not null,
  amount numeric not null check (amount >= 0),
  month date not null,
  is_disabled boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.monthly_cost_entries enable row level security;

create policy "Users can manage their own monthly cost entries"
  on public.monthly_cost_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_monthly_cost_entries_month on public.monthly_cost_entries(month);

-- ============================================
-- VARIABLE COSTS (one-off costs)
-- ============================================
create table public.variable_costs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null check (amount >= 0),
  date date not null,
  created_at timestamptz not null default now()
);

alter table public.variable_costs enable row level security;

create policy "Users can manage their own variable costs"
  on public.variable_costs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_variable_costs_date on public.variable_costs(date);
