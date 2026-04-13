-- Add start_date to jobs so unchecked days can look back to when the job started
alter table public.jobs add column start_date date;

-- Add daily_rate to jobs for accountant report (dnevnica per location)
alter table public.jobs add column daily_rate numeric;
