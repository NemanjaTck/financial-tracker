"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ScheduleEntry = {
  work_log_id: string | null;
  job_id: string;
  employee_id: string;
  employee_name: string;
  job_location: string;
  client_name: string;
  default_hours: number;
  hours: number;
  checked: boolean;
  is_extra: boolean;
  notes: string | null;
};

/**
 * Get the daily schedule for a given date.
 * 1. Find active jobs scheduled for this day of week
 * 2. Get assigned employees
 * 3. Merge with existing work_logs for the date
 */
export async function getDailySchedule(dateStr: string) {
  const supabase = await createClient();
  const date = new Date(dateStr + "T00:00:00");
  // JS getDay: 0=Sun, 1=Mon ... 6=Sat -> our schema: 1=Mon ... 6=Sat, 7=Sun
  const jsDay = date.getDay();
  const dayOfWeek = jsDay === 0 ? 7 : jsDay;

  // Get all active jobs with assignments, where work_days includes today
  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select(`
      id, location_name, default_hours, employee_rate, client_rate, work_days,
      clients ( id, name ),
      job_assignments (
        id, employee_id, custom_rate,
        employees ( id, first_name, last_name )
      )
    `)
    .eq("is_active", true)
    .contains("work_days", [dayOfWeek]);

  if (jobsError) throw jobsError;

  // Get existing work logs for this date
  const { data: existingLogs, error: logsError } = await supabase
    .from("work_logs")
    .select("*")
    .eq("date", dateStr);

  if (logsError) throw logsError;

  const logMap = new Map<string, typeof existingLogs[number]>();
  for (const log of existingLogs ?? []) {
    logMap.set(`${log.job_id}_${log.employee_id}`, log);
  }

  // Build schedule entries
  const entries: ScheduleEntry[] = [];

  for (const job of jobs ?? []) {
    for (const assignment of job.job_assignments ?? []) {
      const key = `${job.id}_${assignment.employee_id}`;
      const existingLog = logMap.get(key);

      const emp = assignment.employees as unknown as { id: string; first_name: string; last_name: string };
      const client = job.clients as unknown as { id: string; name: string };

      entries.push({
        work_log_id: existingLog?.id ?? null,
        job_id: job.id,
        employee_id: assignment.employee_id,
        employee_name: `${emp.first_name} ${emp.last_name}`,
        job_location: job.location_name,
        client_name: client.name,
        default_hours: job.default_hours,
        hours: existingLog?.hours ?? job.default_hours,
        checked: existingLog?.checked ?? false,
        is_extra: existingLog?.is_extra ?? false,
        notes: existingLog?.notes ?? null,
      });

      // Remove from map so we can find extra logs
      logMap.delete(key);
    }
  }

  // Add extra/ad-hoc work logs (those not matching scheduled jobs for today)
  for (const log of existingLogs ?? []) {
    const key = `${log.job_id}_${log.employee_id}`;
    if (!logMap.has(key)) continue; // already handled above
    // This is an extra entry — need job + employee info
  }

  // Also fetch extra work logs (is_extra=true for this date, or logs for jobs not scheduled today)
  const { data: extraLogs, error: extraError } = await supabase
    .from("work_logs")
    .select(`
      *,
      jobs ( id, location_name, default_hours, clients ( id, name ) ),
      employees ( id, first_name, last_name )
    `)
    .eq("date", dateStr)
    .eq("is_extra", true);

  if (extraError) throw extraError;

  for (const log of extraLogs ?? []) {
    // Skip if already in entries
    if (entries.some((e) => e.work_log_id === log.id)) continue;

    const logEmp = log.employees as unknown as { id: string; first_name: string; last_name: string };
    const logJob = log.jobs as unknown as { id: string; location_name: string; default_hours: number; clients: { id: string; name: string } };

    entries.push({
      work_log_id: log.id,
      job_id: log.job_id,
      employee_id: log.employee_id,
      employee_name: `${logEmp.first_name} ${logEmp.last_name}`,
      job_location: logJob.location_name,
      client_name: logJob.clients.name,
      default_hours: logJob.default_hours,
      hours: log.hours,
      checked: log.checked,
      is_extra: true,
      notes: log.notes,
    });
  }

  return entries;
}

/**
 * Check in (confirm attendance) — creates or updates a work_log
 */
export async function checkIn(
  jobId: string,
  employeeId: string,
  date: string,
  hours: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("work_logs")
    .upsert(
      {
        user_id: user.id,
        job_id: jobId,
        employee_id: employeeId,
        date,
        hours,
        checked: true,
        is_extra: false,
      },
      { onConflict: "job_id,employee_id,date" }
    );

  if (error) throw error;
  revalidatePath("/dashboard");
}

/**
 * Uncheck a work log entry
 */
export async function uncheckEntry(workLogId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("work_logs")
    .update({ checked: false })
    .eq("id", workLogId);

  if (error) throw error;
  revalidatePath("/dashboard");
}

/**
 * Update hours on an existing or new work log
 */
export async function updateHours(
  jobId: string,
  employeeId: string,
  date: string,
  hours: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("work_logs")
    .upsert(
      {
        user_id: user.id,
        job_id: jobId,
        employee_id: employeeId,
        date,
        hours,
        checked: true,
        is_extra: false,
      },
      { onConflict: "job_id,employee_id,date" }
    );

  if (error) throw error;
  revalidatePath("/dashboard");
}

/**
 * Mark as not working — delete the work log for this entry
 */
export async function markNotWorking(workLogId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("work_logs")
    .delete()
    .eq("id", workLogId);

  if (error) throw error;
  revalidatePath("/dashboard");
}

/**
 * Mark as not working by job+employee+date (when no log exists yet)
 */
export async function skipEntry(
  jobId: string,
  employeeId: string,
  date: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Create a log with 0 hours and checked=true to mark as skipped
  const { error } = await supabase
    .from("work_logs")
    .upsert(
      {
        user_id: user.id,
        job_id: jobId,
        employee_id: employeeId,
        date,
        hours: 0,
        checked: true,
        is_extra: false,
        notes: "skipped",
      },
      { onConflict: "job_id,employee_id,date" }
    );

  if (error) throw error;
  revalidatePath("/dashboard");
}

/**
 * Swap employee for a specific job on a specific day.
 * Removes the original employee's log and creates one for the replacement.
 */
export async function swapEmployee(
  jobId: string,
  originalEmployeeId: string,
  newEmployeeId: string,
  date: string,
  hours: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Delete original entry if exists
  await supabase
    .from("work_logs")
    .delete()
    .eq("job_id", jobId)
    .eq("employee_id", originalEmployeeId)
    .eq("date", date);

  // Create entry for new employee
  const { error } = await supabase
    .from("work_logs")
    .upsert(
      {
        user_id: user.id,
        job_id: jobId,
        employee_id: newEmployeeId,
        date,
        hours,
        checked: false,
        is_extra: false,
      },
      { onConflict: "job_id,employee_id,date" }
    );

  if (error) throw error;
  revalidatePath("/dashboard");
}

/**
 * Add extra/unscheduled work
 */
export async function addExtraWork(
  jobId: string,
  employeeId: string,
  date: string,
  hours: number,
  notes?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("work_logs").insert({
    user_id: user.id,
    job_id: jobId,
    employee_id: employeeId,
    date,
    hours,
    checked: true,
    is_extra: true,
    notes: notes || null,
  });

  if (error) throw error;
  revalidatePath("/dashboard");
}

/**
 * Confirm all unchecked entries for a date
 */
export async function confirmAll(date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get the schedule to find entries that need work logs created
  const entries = await getDailySchedule(date);

  for (const entry of entries) {
    if (!entry.checked) {
      await supabase
        .from("work_logs")
        .upsert(
          {
            user_id: user.id,
            job_id: entry.job_id,
            employee_id: entry.employee_id,
            date,
            hours: entry.hours,
            checked: true,
            is_extra: entry.is_extra,
          },
          { onConflict: "job_id,employee_id,date" }
        );
    }
  }

  revalidatePath("/dashboard");
}

/**
 * Get count of unchecked days (days with scheduled work but no confirmed logs)
 */
/**
 * Get unchecked days count. Uses job start_date when available,
 * otherwise falls back to job created_at. No arbitrary 30-day limit.
 */
export async function getUncheckedDaysCount() {
  const supabase = await createClient();
  const today = new Date();

  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("id, work_days, start_date, created_at")
    .eq("is_active", true);

  if (jobsError) throw jobsError;
  if (!jobs || jobs.length === 0) return 0;

  // Find earliest job start date, capped at 30 days back
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const startDates = (jobs ?? []).map((j) => {
    if (j.start_date) return new Date(j.start_date + "T00:00:00");
    return new Date(j.created_at);
  });
  const earliest = new Date(Math.min(...startDates.map((d) => d.getTime())));
  const lookbackStart = earliest > thirtyDaysAgo ? earliest : thirtyDaysAgo;

  const lookbackStr = lookbackStart.toISOString().split("T")[0];
  const todayStr = today.toISOString().split("T")[0];

  // Get ALL work_logs for the date range (both checked and unchecked)
  const { data: logs, error: logsError } = await supabase
    .from("work_logs")
    .select("date, job_id, checked")
    .gte("date", lookbackStr)
    .lte("date", todayStr);

  if (logsError) throw logsError;

  // Build a set of (date, job_id) that have any log entry (checked or not)
  const loggedEntries = new Set(
    (logs ?? []).map((l) => `${l.date}_${l.job_id}`)
  );

  let uncheckedCount = 0;

  for (let d = new Date(lookbackStart); d < today; d.setDate(d.getDate() + 1)) {
    const jsDay = d.getDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;
    const dateStr = d.toISOString().split("T")[0];

    // Check if any job with matching work_day had started by this date AND has no log
    const hasMissingJobs = (jobs ?? []).some((j) => {
      if (!j.work_days?.includes(dayOfWeek)) return false;
      const jobStart = j.start_date
        ? new Date(j.start_date + "T00:00:00")
        : new Date(j.created_at);
      if (d < jobStart) return false;
      // Check if this specific job has a log for this date
      return !loggedEntries.has(`${dateStr}_${j.id}`);
    });

    if (hasMissingJobs) {
      uncheckedCount++;
    }
  }

  return uncheckedCount;
}

/**
 * Get all unchecked dates (for calendar highlighting).
 * Returns array of date strings (YYYY-MM-DD) that have scheduled work but no check-in.
 */
export async function getUncheckedDates(): Promise<string[]> {
  const supabase = await createClient();
  const today = new Date();

  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("id, work_days, start_date, created_at")
    .eq("is_active", true);

  if (jobsError) throw jobsError;
  if (!jobs || jobs.length === 0) return [];

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const startDates = (jobs ?? []).map((j) => {
    if (j.start_date) return new Date(j.start_date + "T00:00:00");
    return new Date(j.created_at);
  });
  const earliest = new Date(Math.min(...startDates.map((d) => d.getTime())));
  const lookbackStart = earliest > thirtyDaysAgo ? earliest : thirtyDaysAgo;

  const lookbackStr = lookbackStart.toISOString().split("T")[0];
  const todayStr = today.toISOString().split("T")[0];

  const { data: logs, error: logsError } = await supabase
    .from("work_logs")
    .select("date, job_id")
    .gte("date", lookbackStr)
    .lte("date", todayStr);

  if (logsError) throw logsError;

  const loggedEntries = new Set(
    (logs ?? []).map((l) => `${l.date}_${l.job_id}`)
  );
  const unchecked: string[] = [];

  for (let d = new Date(lookbackStart); d < today; d.setDate(d.getDate() + 1)) {
    const jsDay = d.getDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;
    const dateStr = d.toISOString().split("T")[0];

    const hasMissingJobs = (jobs ?? []).some((j) => {
      if (!j.work_days?.includes(dayOfWeek)) return false;
      const jobStart = j.start_date
        ? new Date(j.start_date + "T00:00:00")
        : new Date(j.created_at);
      if (d < jobStart) return false;
      return !loggedEntries.has(`${dateStr}_${j.id}`);
    });

    if (hasMissingJobs) {
      unchecked.push(dateStr);
    }
  }

  return unchecked;
}

/**
 * Get all employees (for swap/extra work dialogs)
 */
export async function getAllEmployees() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, first_name, last_name")
    .eq("is_active", true)
    .order("first_name");

  if (error) throw error;
  return data;
}

/**
 * Get dashboard alerts: top client (current month), overworked employees
 */
export type DashboardAlerts = {
  topClient: { name: string; revenue: number } | null;
  overworkedEmployees: { name: string; daysWorked: number }[];
};

export async function getDashboardAlerts(): Promise<DashboardAlerts> {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  // Get current month work logs
  const { data: logs, error } = await supabase
    .from("work_logs")
    .select(`
      hours, employee_id, job_id, date,
      jobs ( client_rate, clients ( id, name ) ),
      employees ( id, first_name, last_name )
    `)
    .eq("checked", true)
    .gt("hours", 0)
    .gte("date", monthStart)
    .lte("date", monthEnd);

  if (error) throw error;

  // Top client by revenue
  const clientRevMap = new Map<string, { name: string; revenue: number }>();
  // Employee work days
  const empDaysMap = new Map<string, { name: string; dates: Set<string> }>();

  for (const log of logs ?? []) {
    const job = log.jobs as unknown as { client_rate: number; clients: { id: string; name: string } };
    const emp = log.employees as unknown as { id: string; first_name: string; last_name: string };

    // Client revenue
    const clientId = job.clients.id;
    const rev = Number(log.hours) * Number(job.client_rate);
    if (!clientRevMap.has(clientId)) {
      clientRevMap.set(clientId, { name: job.clients.name, revenue: 0 });
    }
    clientRevMap.get(clientId)!.revenue += rev;

    // Employee work days
    if (!empDaysMap.has(log.employee_id)) {
      empDaysMap.set(log.employee_id, {
        name: `${emp.first_name} ${emp.last_name}`,
        dates: new Set(),
      });
    }
    empDaysMap.get(log.employee_id)!.dates.add(log.date);
  }

  // Top client
  let topClient: DashboardAlerts["topClient"] = null;
  for (const [, data] of clientRevMap) {
    if (!topClient || data.revenue > topClient.revenue) {
      topClient = { name: data.name, revenue: data.revenue };
    }
  }

  // Overworked: employees who worked more than 24 days this month
  const overworkedEmployees: DashboardAlerts["overworkedEmployees"] = [];
  for (const [, data] of empDaysMap) {
    if (data.dates.size > 24) {
      overworkedEmployees.push({ name: data.name, daysWorked: data.dates.size });
    }
  }
  overworkedEmployees.sort((a, b) => b.daysWorked - a.daysWorked);

  return { topClient, overworkedEmployees };
}

/**
 * Get all active jobs (for extra work dialog)
 */
export async function getAllJobs() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("id, location_name, default_hours, clients ( id, name )")
    .eq("is_active", true)
    .order("location_name");

  if (error) throw error;
  return (data ?? []).map((j) => ({
    id: j.id,
    location_name: j.location_name,
    default_hours: j.default_hours,
    clients: j.clients as unknown as { id: string; name: string },
  }));
}
