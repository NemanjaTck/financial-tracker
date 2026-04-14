-- Add start_date to jobs so unchecked days can look back to when the job started
alter table public.jobs add column if not exists start_date date;

-- Add rate_type to jobs: 'hourly' (satnica) or 'daily' (dnevnica)
alter table public.jobs add column if not exists rate_type text not null default 'hourly';

-- daily_rate kept for backward compat / accountant report
alter table public.jobs add column if not exists daily_rate numeric;
