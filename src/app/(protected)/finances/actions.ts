"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ─── Types ───────────────────────────────────────────────────────────────────

export type RevenueByClient = {
  client_id: string;
  client_name: string;
  total_hours: number;
  total_revenue: number;
};

export type SalaryByEmployee = {
  employee_id: string;
  employee_name: string;
  total_hours: number;
  base_salary: number;
  bonuses: number;
  penalties: number;
  net_salary: number;
};

export type FixedCost = {
  id: string;
  name: string;
  amount: number;
  day_of_month: number;
  is_recurring: boolean;
  is_active: boolean;
  created_at: string;
};

export type MonthlyCostEntry = {
  id: string;
  fixed_cost_id: string | null;
  name: string;
  amount: number;
  month: string;
  is_disabled: boolean;
};

export type VariableCost = {
  id: string;
  name: string;
  amount: number;
  date: string;
  created_at: string;
};

export type MonthlyFinancials = {
  revenue: RevenueByClient[];
  salaries: SalaryByEmployee[];
  fixedCosts: FixedCost[];
  monthlyCostEntries: MonthlyCostEntry[];
  variableCosts: VariableCost[];
  totals: {
    revenue: number;
    salaries: number;
    fixedCosts: number;
    variableCosts: number;
    profit: number;
  };
};

// ─── Revenue Calculation ─────────────────────────────────────────────────────

/**
 * Calculate revenue for a month: SUM(checked_hours * client_rate) grouped by client
 */
async function getMonthlyRevenue(
  monthStart: string,
  monthEnd: string
): Promise<RevenueByClient[]> {
  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from("work_logs")
    .select(`
      hours, job_id,
      jobs ( id, client_rate, clients ( id, name ) )
    `)
    .eq("checked", true)
    .gte("date", monthStart)
    .lte("date", monthEnd)
    .gt("hours", 0);

  if (error) throw error;

  const byClient = new Map<
    string,
    { client_name: string; total_hours: number; total_revenue: number }
  >();

  for (const log of logs ?? []) {
    const job = log.jobs as unknown as {
      id: string;
      client_rate: number;
      clients: { id: string; name: string };
    };
    const clientId = job.clients.id;
    const existing = byClient.get(clientId) ?? {
      client_name: job.clients.name,
      total_hours: 0,
      total_revenue: 0,
    };
    existing.total_hours += Number(log.hours);
    existing.total_revenue += Number(log.hours) * Number(job.client_rate);
    byClient.set(clientId, existing);
  }

  return Array.from(byClient.entries()).map(([client_id, data]) => ({
    client_id,
    ...data,
  }));
}

// ─── Salary Calculation ──────────────────────────────────────────────────────

/**
 * Calculate salaries for a month:
 * SUM(checked_hours * employee_rate) + bonuses - penalties, grouped by employee
 */
async function getMonthlySalaries(
  monthStart: string,
  monthEnd: string
): Promise<SalaryByEmployee[]> {
  const supabase = await createClient();

  // Get work logs with job rates and employee info
  const { data: logs, error: logsError } = await supabase
    .from("work_logs")
    .select(`
      hours, employee_id, job_id,
      jobs ( id, employee_rate ),
      employees ( id, first_name, last_name )
    `)
    .eq("checked", true)
    .gte("date", monthStart)
    .lte("date", monthEnd)
    .gt("hours", 0);

  if (logsError) throw logsError;

  // Get job assignments for custom rates
  const { data: assignments, error: assignError } = await supabase
    .from("job_assignments")
    .select("job_id, employee_id, custom_rate");

  if (assignError) throw assignError;

  const customRateMap = new Map<string, number>();
  for (const a of assignments ?? []) {
    if (a.custom_rate != null) {
      customRateMap.set(`${a.job_id}_${a.employee_id}`, Number(a.custom_rate));
    }
  }

  // Get bonuses/penalties for the month
  const { data: adjustments, error: adjError } = await supabase
    .from("bonuses_penalties")
    .select("*")
    .gte("date", monthStart)
    .lte("date", monthEnd);

  if (adjError) throw adjError;

  const byEmployee = new Map<
    string,
    {
      employee_name: string;
      total_hours: number;
      base_salary: number;
      bonuses: number;
      penalties: number;
    }
  >();

  for (const log of logs ?? []) {
    const job = log.jobs as unknown as { id: string; employee_rate: number };
    const emp = log.employees as unknown as {
      id: string;
      first_name: string;
      last_name: string;
    };

    const customRate = customRateMap.get(`${log.job_id}_${log.employee_id}`);
    const rate = customRate ?? Number(job.employee_rate);

    const existing = byEmployee.get(log.employee_id) ?? {
      employee_name: `${emp.first_name} ${emp.last_name}`,
      total_hours: 0,
      base_salary: 0,
      bonuses: 0,
      penalties: 0,
    };
    existing.total_hours += Number(log.hours);
    existing.base_salary += Number(log.hours) * rate;
    byEmployee.set(log.employee_id, existing);
  }

  // Add bonuses/penalties
  for (const adj of adjustments ?? []) {
    const existing = byEmployee.get(adj.employee_id);
    if (existing) {
      if (adj.type === "bonus") {
        existing.bonuses += Number(adj.amount);
      } else {
        existing.penalties += Number(adj.amount);
      }
    }
  }

  return Array.from(byEmployee.entries()).map(([employee_id, data]) => ({
    employee_id,
    ...data,
    net_salary: data.base_salary + data.bonuses - data.penalties,
  }));
}

// ─── Fixed Costs ─────────────────────────────────────────────────────────────

export async function getFixedCosts(): Promise<FixedCost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fixed_costs")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

export async function createFixedCost(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("fixed_costs").insert({
    user_id: user.id,
    name: formData.get("name") as string,
    amount: parseFloat(formData.get("amount") as string),
    day_of_month: parseInt(formData.get("day_of_month") as string, 10),
    is_recurring: formData.get("is_recurring") === "true",
  });

  if (error) throw error;
  revalidatePath("/finances");
}

export async function updateFixedCost(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("fixed_costs")
    .update({
      name: formData.get("name") as string,
      amount: parseFloat(formData.get("amount") as string),
      day_of_month: parseInt(formData.get("day_of_month") as string, 10),
      is_recurring: formData.get("is_recurring") === "true",
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/finances");
}

export async function deleteFixedCost(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("fixed_costs").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/finances");
}

// ─── Monthly Cost Entries ────────────────────────────────────────────────────

/**
 * Ensure monthly_cost_entries exist for the given month based on active fixed_costs.
 * Creates entries that don't exist yet.
 */
async function ensureMonthlyCostEntries(month: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: fixedCosts } = await supabase
    .from("fixed_costs")
    .select("*")
    .eq("is_active", true);

  const { data: existing } = await supabase
    .from("monthly_cost_entries")
    .select("fixed_cost_id")
    .eq("month", month);

  const existingIds = new Set(
    (existing ?? []).map((e) => e.fixed_cost_id).filter(Boolean)
  );

  const toInsert = (fixedCosts ?? [])
    .filter((fc) => !existingIds.has(fc.id))
    .map((fc) => ({
      user_id: user.id,
      fixed_cost_id: fc.id,
      name: fc.name,
      amount: fc.amount,
      month,
      is_disabled: false,
    }));

  if (toInsert.length > 0) {
    const { error } = await supabase
      .from("monthly_cost_entries")
      .insert(toInsert);
    if (error) throw error;
  }
}

export async function toggleMonthlyCostDisabled(
  entryId: string,
  isDisabled: boolean
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("monthly_cost_entries")
    .update({ is_disabled: isDisabled })
    .eq("id", entryId);

  if (error) throw error;
  revalidatePath("/finances");
}

export async function updateMonthlyCostAmount(
  entryId: string,
  amount: number
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("monthly_cost_entries")
    .update({ amount })
    .eq("id", entryId);

  if (error) throw error;
  revalidatePath("/finances");
}

// ─── Variable Costs ──────────────────────────────────────────────────────────

export async function createVariableCost(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("variable_costs").insert({
    user_id: user.id,
    name: formData.get("name") as string,
    amount: parseFloat(formData.get("amount") as string),
    date: formData.get("date") as string,
  });

  if (error) throw error;
  revalidatePath("/finances");
}

export async function updateVariableCost(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("variable_costs")
    .update({
      name: formData.get("name") as string,
      amount: parseFloat(formData.get("amount") as string),
      date: formData.get("date") as string,
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/finances");
}

export async function deleteVariableCost(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("variable_costs")
    .delete()
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/finances");
}

// ─── Main Data Fetcher ───────────────────────────────────────────────────────

/**
 * Get all financial data for a given month (YYYY-MM-01 format)
 */
export async function getMonthlyFinancials(
  month: string
): Promise<MonthlyFinancials> {
  const supabase = await createClient();

  // Calculate month boundaries
  const monthDate = new Date(month + "T00:00:00");
  const monthStart = month;
  const lastDay = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0
  );
  const monthEnd = lastDay.toISOString().split("T")[0];

  // Ensure monthly cost entries are generated
  await ensureMonthlyCostEntries(month);

  // Fetch all data in parallel
  const [revenue, salaries, fixedCosts, monthlyCostEntries, variableCostsData] =
    await Promise.all([
      getMonthlyRevenue(monthStart, monthEnd),
      getMonthlySalaries(monthStart, monthEnd),
      getFixedCosts(),
      supabase
        .from("monthly_cost_entries")
        .select("*")
        .eq("month", month)
        .order("name"),
      supabase
        .from("variable_costs")
        .select("*")
        .gte("date", monthStart)
        .lte("date", monthEnd)
        .order("date"),
    ]);

  if (monthlyCostEntries.error) throw monthlyCostEntries.error;
  if (variableCostsData.error) throw variableCostsData.error;

  const totalRevenue = revenue.reduce((sum, r) => sum + r.total_revenue, 0);
  const totalSalaries = salaries.reduce((sum, s) => sum + s.net_salary, 0);
  const totalFixedCosts = (monthlyCostEntries.data ?? [])
    .filter((e) => !e.is_disabled)
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const totalVariableCosts = (variableCostsData.data ?? []).reduce(
    (sum, v) => sum + Number(v.amount),
    0
  );

  return {
    revenue,
    salaries,
    fixedCosts,
    monthlyCostEntries: monthlyCostEntries.data ?? [],
    variableCosts: variableCostsData.data ?? [],
    totals: {
      revenue: totalRevenue,
      salaries: totalSalaries,
      fixedCosts: totalFixedCosts,
      variableCosts: totalVariableCosts,
      profit: totalRevenue - totalSalaries - totalFixedCosts - totalVariableCosts,
    },
  };
}

// ─── Accountant Report Data ─────────────────────────────────────────────────

export type AccountantClientData = {
  name: string;
  pib: string | null;
  hours: number;
  amount: number;
  dailyRate: number | null;
  days: number | null;
  locations: { name: string; days: number }[];
};

/**
 * Get enriched data for the accountant report:
 * Each client with PIB, hours, revenue, daily_rate, and location breakdowns
 */
export async function getAccountantReportData(
  month: string
): Promise<AccountantClientData[]> {
  const supabase = await createClient();

  const monthDate = new Date(month + "T00:00:00");
  const monthStart = month;
  const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const monthEnd = lastDay.toISOString().split("T")[0];

  // Get work logs with job + client info
  const { data: logs, error } = await supabase
    .from("work_logs")
    .select(`
      hours, job_id, date,
      jobs ( id, client_rate, daily_rate, location_name, clients ( id, name, pib ) )
    `)
    .eq("checked", true)
    .gte("date", monthStart)
    .lte("date", monthEnd)
    .gt("hours", 0);

  if (error) throw error;

  // Group by client
  const clientMap = new Map<
    string,
    {
      name: string;
      pib: string | null;
      hours: number;
      amount: number;
      dailyRate: number | null;
      locationDays: Map<string, Set<string>>; // location -> set of unique dates
    }
  >();

  for (const log of logs ?? []) {
    const job = log.jobs as unknown as {
      id: string;
      client_rate: number;
      daily_rate: number | null;
      location_name: string;
      clients: { id: string; name: string; pib: string | null };
    };
    const clientId = job.clients.id;

    if (!clientMap.has(clientId)) {
      clientMap.set(clientId, {
        name: job.clients.name,
        pib: job.clients.pib,
        hours: 0,
        amount: 0,
        dailyRate: job.daily_rate ? Number(job.daily_rate) : null,
        locationDays: new Map(),
      });
    }

    const client = clientMap.get(clientId)!;
    client.hours += Number(log.hours);
    client.amount += Number(log.hours) * Number(job.client_rate);

    // Track unique days per location
    if (!client.locationDays.has(job.location_name)) {
      client.locationDays.set(job.location_name, new Set());
    }
    client.locationDays.get(job.location_name)!.add(log.date);

    // Use daily_rate from any job that has one
    if (job.daily_rate && !client.dailyRate) {
      client.dailyRate = Number(job.daily_rate);
    }
  }

  return Array.from(clientMap.values()).map((c) => ({
    name: c.name,
    pib: c.pib,
    hours: c.hours,
    amount: c.amount,
    dailyRate: c.dailyRate,
    days: Array.from(c.locationDays.values()).reduce(
      (sum, dates) => sum + dates.size,
      0
    ),
    locations: Array.from(c.locationDays.entries()).map(([name, dates]) => ({
      name,
      days: dates.size,
    })),
  }));
}
