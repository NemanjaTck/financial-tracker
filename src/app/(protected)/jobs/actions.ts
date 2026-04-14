"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getJobs() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(`
      *,
      clients ( id, name ),
      job_assignments (
        id,
        employee_id,
        custom_rate,
        employees ( id, first_name, last_name )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getJobsByClient(clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(`
      *,
      clients ( id, name ),
      job_assignments (
        id,
        employee_id,
        custom_rate,
        employees ( id, first_name, last_name )
      )
    `)
    .eq("client_id", clientId)
    .order("location_name");

  if (error) throw error;
  return data;
}

export async function createJob(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const workDaysStr = formData.get("work_days") as string;
  const workDays = workDaysStr ? workDaysStr.split(",").map(Number) : [];

  const startDate = formData.get("start_date") as string;
  const rateType = (formData.get("rate_type") as string) || "hourly";

  const { error } = await supabase.from("jobs").insert({
    user_id: user.id,
    client_id: formData.get("client_id") as string,
    location_name: formData.get("location_name") as string,
    employee_rate: parseFloat(formData.get("employee_rate") as string),
    client_rate: parseFloat(formData.get("client_rate") as string),
    default_hours: parseFloat(formData.get("default_hours") as string),
    work_days: workDays,
    start_date: startDate || null,
    rate_type: rateType,
    daily_rate: rateType === "daily" ? parseFloat(formData.get("client_rate") as string) : null,
  });

  if (error) throw error;
  revalidatePath("/jobs");
  revalidatePath("/clients");
}

export async function updateJob(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const workDaysStr = formData.get("work_days") as string;
  const workDays = workDaysStr ? workDaysStr.split(",").map(Number) : [];

  const startDate = formData.get("start_date") as string;
  const rateType = (formData.get("rate_type") as string) || "hourly";

  const { error } = await supabase
    .from("jobs")
    .update({
      client_id: formData.get("client_id") as string,
      location_name: formData.get("location_name") as string,
      employee_rate: parseFloat(formData.get("employee_rate") as string),
      client_rate: parseFloat(formData.get("client_rate") as string),
      default_hours: parseFloat(formData.get("default_hours") as string),
      work_days: workDays,
      start_date: startDate || null,
      rate_type: rateType,
      daily_rate: rateType === "daily" ? parseFloat(formData.get("client_rate") as string) : null,
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/jobs");
  revalidatePath("/clients");
}

export async function toggleJobActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("jobs")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/jobs");
  revalidatePath("/clients");
}

export async function deleteJob(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/jobs");
  revalidatePath("/clients");
}

export async function assignEmployee(
  jobId: string,
  employeeId: string,
  customRate: number | null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("job_assignments").insert({
    user_id: user.id,
    job_id: jobId,
    employee_id: employeeId,
    custom_rate: customRate,
  });

  if (error) throw error;
  revalidatePath("/jobs");
  revalidatePath("/clients");
}

export async function removeAssignment(assignmentId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("job_assignments")
    .delete()
    .eq("id", assignmentId);

  if (error) throw error;
  revalidatePath("/jobs");
  revalidatePath("/clients");
}
