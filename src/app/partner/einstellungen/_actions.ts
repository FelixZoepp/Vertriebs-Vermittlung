"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { BRANCHEN, MAX_RADIUS_KM } from "@/lib/types";

export async function updatePartnerSettings(formData: FormData) {
  const user = await getAuthUser();
  const supabase = await createClient();

  const offeneStellen = parseInt(
    formData.get("offene_stellen") as string,
    10
  );
  const suchradiusKm = parseInt(
    formData.get("suchradius_km") as string,
    10
  );
  const gesuchte_profile = formData
    .getAll("gesuchte_profile")
    .map((b) => String(b).trim())
    .filter((b) => (BRANCHEN as readonly string[]).includes(b));

  const { data: partner } = await supabase
    .from("partners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!partner) {
    return { error: "Partner nicht gefunden." };
  }

  const { error } = await supabase
    .from("partners")
    .update({
      offene_stellen: isNaN(offeneStellen) ? 0 : offeneStellen,
      suchradius_km: Math.min(isNaN(suchradiusKm) ? 30 : suchradiusKm, MAX_RADIUS_KM),
      gesuchte_profile,
    })
    .eq("id", partner.id)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Einstellungen konnten nicht gespeichert werden." };
  }

  revalidatePath("/partner/einstellungen");
  return { success: true };
}
