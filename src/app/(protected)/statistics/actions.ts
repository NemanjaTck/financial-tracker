"use server";

import { createClient } from "@/lib/supabase/server";

// ─── Types ───────────────────────────────────────────────────────────────────

export type MonthlyTrend = {
  month: string; // YYYY-MM
  label: string; // short label for chart
  revenue: number;
  salaries: number;
  fixedCosts: number;
  variableCosts: number;
  profit: number;
};

export type ClientRevenueTrend = {
  client_id: string;
  client_name: string;
  months: { month: string; revenue: number }[];
  total: number;
};

export type EmployeeStats = {
  employee_id: string;
  employee_name: string;
  months: { month: string; hours: number; earnings: number }[];
  totalHours: number;
  totalEarnings: number;
  workDays: number;
};

export type StatisticsData = {
  monthlyTrends: MonthlyTrend[];
  clientTrends: ClientRevenueTrend[];
  employeeStats: EmployeeStats[];
  uncheckedDays: number;
  topClient: { name: string; revenue: number } | null;
  topEmployee: { name: string; hours: number } | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMonthBounds(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

// ─── Main Data Fetcher ───────────────────────────────────────────────────────

/**
 * Get statistics for the last 6 months (including current month)
 */
export async function getStatistics(): Promise<StatisticsData> {
  const supabase = await createClient();
  const now = new Date();

  // Build month ranges for last 6 months
  const months: { year: number; month: number; start: string; end: string; label: string; key: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const { start, end } = getMonthBounds(d.getFullYear(), d.getMonth() + 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      start,
      end,
      label: `${d.getMonth() + 1}/${d.getFullYear()}`,
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    });
  }

  const overallStart = months[0].start;
  const overallEnd = months[months.length - 1].end;

  // Fetch all data needed in parallel
  const [workLogsRes, assignmentsRes, bonusesRes, monthlyCostsRes, variableCostsRes, jobsRes] =
    await Promise.all([
      supabase
        .from("work_logs")
        .select(`
          hours, employee_id, job_id, date,
          jobs ( id, client_rate, employee_rate, clients ( id, name ) ),
          employees ( id, first_name, last_name )
        `)
        .eq("checked", true)
        .gte("date", overallStart)
        .lte("date", overallEnd)
        .gt("hours", 0),
      supabase
        .from("job_assignments")
        .select("job_id, employee_id, custom_rate"),
      supabase
        .from("bonuses_penalties")
        .select("*")
        .gte("date", overallStart)
        .lte("date", overallEnd),
      supabase
        .from("monthly_cost_entries")
        .select("*")
        .gte("month", months[0].start)
        .lte("month", months[months.length - 1].start),
      supabase
        .from("variable_costs")
        .select("*")
        .gte("date", overallStart)
        .lte("date", overallEnd),
      supabase
        .from("jobs")
        .select("id, work_days")
        .eq("is_active", true),
    ]);

  if (workLogsRes.error) throw workLogsRes.error;
  if (assignmentsRes.error) throw assignmentsRes.error;
  if (bonusesRes.error) throw bonusesRes.error;
  if (monthlyCostsRes.error) throw monthlyCostsRes.error;
  if (variableCostsRes.error) throw variableCostsRes.error;
  if (jobsRes.error) throw jobsRes.error;

  const logs = workLogsRes.data ?? [];
  const assignments = assignmentsRes.data ?? [];
  const bonuses = bonusesRes.data ?? [];
  const monthlyCosts = monthlyCostsRes.data ?? [];
  const variableCosts = variableCostsRes.data ?? [];

  // Build custom rate map
  const customRateMap = new Map<string, number>();
  for (const a of assignments) {
    if (a.custom_rate != null) {
      customRateMap.set(`${a.job_id}_${a.employee_id}`, Number(a.custom_rate));
    }
  }

  // ─── Monthly Trends ──────────────────────────────────────────────────────

  const monthlyTrends: MonthlyTrend[] = months.map((m) => ({
    month: m.key,
    label: m.label,
    revenue: 0,
    salaries: 0,
    fixedCosts: 0,
    variableCosts: 0,
    profit: 0,
  }));

  function getMonthIndex(dateStr: string): number {
    const key = dateStr.substring(0, 7); // YYYY-MM
    return months.findIndex((m) => m.key === key);
  }

  // ─── Client trends + Employee stats ──────────────────────────────────────

  const clientMap = new Map<string, { name: string; byMonth: Map<string, number>; total: number }>();
  const employeeMap = new Map<string, {
    name: string;
    byMonth: Map<string, { hours: number; earnings: number }>;
    totalHours: number;
    totalEarnings: number;
    dates: Set<string>;
  }>();

  for (const log of logs) {
    const job = log.jobs as unknown as {
      id: string;
      client_rate: number;
      employee_rate: number;
      clients: { id: string; name: string };
    };
    const emp = log.employees as unknown as {
      id: string;
      first_name: string;
      last_name: string;
    };

    const hours = Number(log.hours);
    const clientRevenue = hours * Number(job.client_rate);
    const customRate = customRateMap.get(`${log.job_id}_${log.employee_id}`);
    const empRate = customRate ?? Number(job.employee_rate);
    const empCost = hours * empRate;
    const monthKey = log.date.substring(0, 7);
    const mi = getMonthIndex(log.date);

    // Monthly trend - revenue & salaries
    if (mi >= 0) {
      monthlyTrends[mi].revenue += clientRevenue;
      monthlyTrends[mi].salaries += empCost;
    }

    // Client trends
    const clientId = job.clients.id;
    if (!clientMap.has(clientId)) {
      clientMap.set(clientId, { name: job.clients.name, byMonth: new Map(), total: 0 });
    }
    const client = clientMap.get(clientId)!;
    client.byMonth.set(monthKey, (client.byMonth.get(monthKey) ?? 0) + clientRevenue);
    client.total += clientRevenue;

    // Employee stats
    if (!employeeMap.has(log.employee_id)) {
      employeeMap.set(log.employee_id, {
        name: `${emp.first_name} ${emp.last_name}`,
        byMonth: new Map(),
        totalHours: 0,
        totalEarnings: 0,
        dates: new Set(),
      });
    }
    const empStats = employeeMap.get(log.employee_id)!;
    const monthData = empStats.byMonth.get(monthKey) ?? { hours: 0, earnings: 0 };
    monthData.hours += hours;
    monthData.earnings += empCost;
    empStats.byMonth.set(monthKey, monthData);
    empStats.totalHours += hours;
    empStats.totalEarnings += empCost;
    empStats.dates.add(log.date);
  }

  // Add bonuses/penalties to salary totals
  for (const adj of bonuses) {
    const mi = getMonthIndex(adj.date);
    if (mi >= 0) {
      if (adj.type === "bonus") {
        monthlyTrends[mi].salaries += Number(adj.amount);
      } else {
        monthlyTrends[mi].salaries -= Number(adj.amount);
      }
    }
  }

  // Fixed costs per month
  for (const mc of monthlyCosts) {
    if (mc.is_disabled) continue;
    const monthKey = mc.month.substring(0, 7);
    const mi = months.findIndex((m) => m.key === monthKey);
    if (mi >= 0) {
      monthlyTrends[mi].fixedCosts += Number(mc.amount);
    }
  }

  // Variable costs per month
  for (const vc of variableCosts) {
    const mi = getMonthIndex(vc.date);
    if (mi >= 0) {
      monthlyTrends[mi].variableCosts += Number(vc.amount);
    }
  }

  // Calculate profit for each month
  for (const mt of monthlyTrends) {
    mt.profit = mt.revenue - mt.salaries - mt.fixedCosts - mt.variableCosts;
  }

  // ─── Client trends output ────────────────────────────────────────────────

  const clientTrends: ClientRevenueTrend[] = Array.from(clientMap.entries())
    .map(([client_id, data]) => ({
      client_id,
      client_name: data.name,
      months: months.map((m) => ({
        month: m.key,
        revenue: data.byMonth.get(m.key) ?? 0,
      })),
      total: data.total,
    }))
    .sort((a, b) => b.total - a.total);

  // ─── Employee stats output ───────────────────────────────────────────────

  const employeeStats: EmployeeStats[] = Array.from(employeeMap.entries())
    .map(([employee_id, data]) => ({
      employee_id,
      employee_name: data.name,
      months: months.map((m) => {
        const md = data.byMonth.get(m.key);
        return { month: m.key, hours: md?.hours ?? 0, earnings: md?.earnings ?? 0 };
      }),
      totalHours: data.totalHours,
      totalEarnings: data.totalEarnings,
      workDays: data.dates.size,
    }))
    .sort((a, b) => b.totalHours - a.totalHours);

  // ─── Unchecked days ──────────────────────────────────────────────────────

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: checkedLogs } = await supabase
    .from("work_logs")
    .select("date")
    .eq("checked", true)
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
    .lte("date", today.toISOString().split("T")[0]);

  const checkedDates = new Set((checkedLogs ?? []).map((l) => l.date));
  const jobs = jobsRes.data ?? [];
  let uncheckedDays = 0;

  for (let d = new Date(thirtyDaysAgo); d < today; d.setDate(d.getDate() + 1)) {
    const jsDay = d.getDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;
    const dateStr = d.toISOString().split("T")[0];
    const hasJobsToday = jobs.some((j) => j.work_days?.includes(dayOfWeek));
    if (hasJobsToday && !checkedDates.has(dateStr)) {
      uncheckedDays++;
    }
  }

  // ─── Top client & employee ───────────────────────────────────────────────

  // Current month only
  const currentMonthKey = months[months.length - 1].key;
  const topClient = clientTrends.length > 0
    ? {
        name: clientTrends[0].client_name,
        revenue: clientTrends[0].months.find((m) => m.month === currentMonthKey)?.revenue ?? 0,
      }
    : null;

  const topEmployee = employeeStats.length > 0
    ? {
        name: employeeStats[0].employee_name,
        hours: employeeStats[0].months.find((m) => m.month === currentMonthKey)?.hours ?? 0,
      }
    : null;

  return {
    monthlyTrends,
    clientTrends,
    employeeStats,
    uncheckedDays,
    topClient,
    topEmployee,
  };
}
