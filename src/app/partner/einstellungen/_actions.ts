"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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
  const gesuchteProfileRaw = (
    formData.get("gesuchte_profile") as string
  )?.trim();
  const gesuchte_profile = gesuchteProfileRaw
    ? gesuchteProfileRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

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
      suchradius_km: isNaN(suchradiusKm) ? 30 : suchradiusKm,
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
