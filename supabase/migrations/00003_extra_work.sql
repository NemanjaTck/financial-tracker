-- Extra work: simplified ad-hoc revenue entries (just a name + amount + date).
-- Unlike work_logs, these are not tied to a job, employee, or hours.
create table public.extra_work (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null check (amount >= 0),
  date date not null,
  created_at timestamptz not null default now()
);

alter table public.extra_work enable row level security;

create policy "Users can manage their own extra work"
  on public.extra_work for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_extra_work_date on public.extra_work(date);
