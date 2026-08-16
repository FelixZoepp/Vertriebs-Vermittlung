"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createModule(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("masterclass_modules").insert({
    titel: formData.get("titel") as string,
    reihenfolge: parseInt(formData.get("reihenfolge") as string) || 1,
    video_url: formData.get("video_url") as string,
    dauer_sek: parseInt(formData.get("dauer_sek") as string) || 300,
    pflicht: formData.get("pflicht") === "on",
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/masterclass");
  return { success: true };
}

export async function updateModule(id: number, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("masterclass_modules")
    .update({
      titel: formData.get("titel") as string,
      reihenfolge: parseInt(formData.get("reihenfolge") as string) || 1,
      video_url: formData.get("video_url") as string,
      dauer_sek: parseInt(formData.get("dauer_sek") as string) || 300,
      pflicht: formData.get("pflicht") === "on",
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/masterclass");
  return { success: true };
}

export async function deleteModule(id: number) {
  const supabase = await createClient();

  // Check if any progress exists
  const { count } = await supabase
    .from("masterclass_progress")
    .select("*", { count: "exact", head: true })
    .eq("module_id", id);

  if (count && count > 0) {
    return { error: `Modul hat ${count} Fortschrittseinträge. Lösche zuerst den Fortschritt.` };
  }

  const { error } = await supabase
    .from("masterclass_modules")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/masterclass");
  return { success: true };
}

export async function reorderModules(orderedIds: number[]) {
  const supabase = await createClient();

  for (let i = 0; i < orderedIds.length; i++) {
    await supabase
      .from("masterclass_modules")
      .update({ reihenfolge: i + 1 })
      .eq("id", orderedIds[i]);
  }

  revalidatePath("/admin/masterclass");
  return { success: true };
}
