"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function reportContracts(formData: FormData) {
  const user = await getAuthUser();
  const supabase = await createClient();

  const placementId = parseInt(formData.get("placement_id") as string, 10);
  const zeitraumMonat = (formData.get("zeitraum_monat") as string)?.trim();
  const anzahlVertraege = parseInt(
    formData.get("anzahl_vertraege") as string,
    10
  );

  if (!placementId || !zeitraumMonat || !anzahlVertraege || anzahlVertraege < 1) {
    return { error: "Bitte fülle alle Felder korrekt aus." };
  }

  // Verify partner ownership
  const { data: partner } = await supabase
    .from("partners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!partner) {
    return { error: "Partner nicht gefunden." };
  }

  // Verify the placement belongs to this partner and is "eingestellt"
  const { data: placement } = await supabase
    .from("placements")
    .select("id, vertraege_gesamt")
    .eq("id", placementId)
    .eq("partner_id", partner.id)
    .eq("status", "eingestellt")
    .single();

  if (!placement) {
    return { error: "Vermittlung nicht gefunden oder nicht im Status 'Eingestellt'." };
  }

  // Insert contract report
  const { error: insertError } = await supabase
    .from("contract_reports")
    .insert({
      placement_id: placementId,
      zeitraum_monat: zeitraumMonat,
      anzahl_vertraege: anzahlVertraege,
      gemeldet_von: user.id,
    });

  if (insertError) {
    return { error: "Fehler beim Speichern der Meldung." };
  }

  // Update vertraege_gesamt on placement
  const newTotal = placement.vertraege_gesamt + anzahlVertraege;
  const { error: updateError } = await supabase
    .from("placements")
    .update({ vertraege_gesamt: newTotal })
    .eq("id", placementId)
    .eq("partner_id", partner.id);

  if (updateError) {
    return { error: "Fehler beim Aktualisieren der Gesamtverträge." };
  }

  revalidatePath("/partner/vertraege");
  return { success: true };
}
