"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getClients() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

export async function createClientRecord(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("clients").insert({
    user_id: user.id,
    name: formData.get("name") as string,
    pib: (formData.get("pib") as string) || null,
    type: (formData.get("type") as string) || "regular",
  });

  if (error) throw error;
  revalidatePath("/clients");
}

export async function updateClientRecord(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("clients")
    .update({
      name: formData.get("name") as string,
      pib: (formData.get("pib") as string) || null,
      type: (formData.get("type") as string) || "regular",
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/clients");
}

export async function toggleClientActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/clients");
}

export async function deleteClientRecord(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/clients");
}
