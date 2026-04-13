"use server";

import { createClient } from "@/lib/supabase/server";

export type ClientReportData = {
  clientName: string;
  clientPib: string | null;
  month: string;
  entries: {
    date: string;
    employee: string;
    hours: number;
    rate: number;
    total: number;
  }[];
  totalHours: number;
  totalCost: number;
  totalVisits: number;
};

/**
 * Get client report data for a specific month
 */
export async function getClientReportData(
  clientId: string,
  month: string // YYYY-MM-01
): Promise<ClientReportData> {
  const supabase = await createClient();

  // Get client info
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("name, pib")
    .eq("id", clientId)
    .single();

  if (clientError) throw clientError;

  // Calculate month boundaries
  const monthDate = new Date(month + "T00:00:00");
  const monthStart = month;
  const lastDay = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0
  );
  const monthEnd = lastDay.toISOString().split("T")[0];

  // Get all work logs for this client's jobs in this month
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, client_rate")
    .eq("client_id", clientId);

  if (!jobs || jobs.length === 0) {
    return {
      clientName: client.name,
      clientPib: client.pib,
      month,
      entries: [],
      totalHours: 0,
      totalCost: 0,
      totalVisits: 0,
    };
  }

  const jobIds = jobs.map((j) => j.id);
  const rateMap = new Map(jobs.map((j) => [j.id, Number(j.client_rate)]));

  const { data: logs, error: logsError } = await supabase
    .from("work_logs")
    .select(`
      date, hours, job_id,
      employees ( first_name, last_name )
    `)
    .in("job_id", jobIds)
    .eq("checked", true)
    .gte("date", monthStart)
    .lte("date", monthEnd)
    .gt("hours", 0)
    .order("date");

  if (logsError) throw logsError;

  const entries = (logs ?? []).map((log) => {
    const emp = log.employees as unknown as {
      first_name: string;
      last_name: string;
    };
    const rate = rateMap.get(log.job_id) ?? 0;
    return {
      date: log.date,
      employee: `${emp.first_name} ${emp.last_name}`,
      hours: Number(log.hours),
      rate,
      total: Number(log.hours) * rate,
    };
  });

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const totalCost = entries.reduce((sum, e) => sum + e.total, 0);
  const uniqueDates = new Set(entries.map((e) => e.date));

  return {
    clientName: client.name,
    clientPib: client.pib,
    month,
    entries,
    totalHours,
    totalCost,
    totalVisits: uniqueDates.size,
  };
}
