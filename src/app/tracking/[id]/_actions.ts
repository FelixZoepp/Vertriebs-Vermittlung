"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { MEILENSTEIN_VERTRAEGE } from "@/lib/rules/invoicing";

export async function submitTrackingReport(trackingId: number, anzahl: number) {
  if (!trackingId || anzahl < 0 || !Number.isInteger(anzahl)) {
    return { error: "Bitte gib eine gueltige Anzahl ein." };
  }

  const supabase = await createServiceClient();

  // Fetch the tracking row
  const { data: tracking, error: fetchError } = await supabase
    .from("contract_tracking")
    .select("id, placement_id, intervall, beantwortet_am")
    .eq("id", trackingId)
    .single();

  if (fetchError || !tracking) {
    return { error: "Tracking-Eintrag nicht gefunden." };
  }

  // Already answered
  if (tracking.beantwortet_am) {
    return { error: "Diese Abfrage wurde bereits beantwortet." };
  }

  // Update tracking row
  const { error: updateError } = await supabase
    .from("contract_tracking")
    .update({
      anzahl_vertraege: anzahl,
      beantwortet_am: new Date().toISOString(),
    })
    .eq("id", trackingId);

  if (updateError) {
    return { error: "Fehler beim Speichern." };
  }

  // Sum all answered trackings for this placement
  const { data: allTrackings } = await supabase
    .from("contract_tracking")
    .select("anzahl_vertraege")
    .eq("placement_id", tracking.placement_id)
    .not("beantwortet_am", "is", null)
    .not("anzahl_vertraege", "is", null);

  const total = (allTrackings ?? []).reduce(
    (sum, t) => sum + (t.anzahl_vertraege ?? 0),
    0
  );

  // Update vertraege_gesamt on placement
  const { error: placementError } = await supabase
    .from("placements")
    .update({ vertraege_gesamt: total })
    .eq("id", tracking.placement_id);

  if (placementError) {
    console.error("Failed to update vertraege_gesamt:", placementError);
  }

  // Check if meilenstein reached (>= 100)
  if (total >= MEILENSTEIN_VERTRAEGE) {
    // Fetch placement to check if milestone was already logged
    const { data: placement } = await supabase
      .from("placements")
      .select("id, meilenstein_100_erreicht_am")
      .eq("id", tracking.placement_id)
      .single();

    if (placement && !placement.meilenstein_100_erreicht_am) {
      // Set the milestone date
      await supabase
        .from("placements")
        .update({ meilenstein_100_erreicht_am: new Date().toISOString() })
        .eq("id", tracking.placement_id);

      // Log the milestone
      await supabase.from("activity_log").insert({
        entity_typ: "placement",
        entity_id: tracking.placement_id,
        aktion: "meilenstein_100_erreicht",
        akteur_id: null,
        payload: {
          vertraege_gesamt: total,
          tracking_id: trackingId,
        },
      });
    }
  }

  // Log the tracking submission
  await supabase.from("activity_log").insert({
    entity_typ: "placement",
    entity_id: tracking.placement_id,
    aktion: "tracking_beantwortet",
    akteur_id: null,
    payload: {
      tracking_id: trackingId,
      intervall: tracking.intervall,
      anzahl_vertraege: anzahl,
      vertraege_gesamt: total,
    },
  });

  return { success: true, total };
}
