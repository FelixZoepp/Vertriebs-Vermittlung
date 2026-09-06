"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { closeCompetingPlacements } from "@/lib/rules/competing-placements";
import { vermittleAnNaechstenPartner } from "@/lib/rules/exclusive-assignment";
import { revalidatePath } from "next/cache";

export async function updatePlacementStatus(
  placementId: number,
  newStatus: "vorstellungsgespraech" | "probetag" | "eingestellt" | "abgelehnt"
) {
  const user = await getAuthUser();
  const supabase = await createClient();

  // Verify this placement belongs to the current partner
  const { data: partner } = await supabase
    .from("partners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!partner) {
    return { error: "Partner nicht gefunden." };
  }

  const updateData: Record<string, unknown> = { status: newStatus };

  if (newStatus === "eingestellt") {
    updateData.eingestellt_am = new Date().toISOString().split("T")[0];
  }

  const { data: updated, error } = await supabase
    .from("placements")
    .update(updateData)
    .eq("id", placementId)
    .eq("partner_id", partner.id)
    .select("candidate_id")
    .single();

  if (error || !updated) {
    return { error: "Status konnte nicht aktualisiert werden." };
  }

  if (newStatus === "eingestellt") {
    // R7: Konkurrierende Anfragen anderer Partner automatisch beenden
    // (Service-Client nötig, da RLS Partnern nur eigene Placements erlaubt)
    const serviceClient = await createServiceClient();
    await closeCompetingPlacements(serviceClient, updated.candidate_id, placementId);
  }

  if (newStatus === "abgelehnt") {
    // R8: Kandidat automatisch an den nächstbesten Partner weitervermitteln
    const serviceClient = await createServiceClient();
    await vermittleAnNaechstenPartner(serviceClient, updated.candidate_id);
  }

  revalidatePath("/partner/kandidaten");
  return { success: true };
}

export async function expressInterest(placementId: number) {
  const user = await getAuthUser();
  const supabase = await createClient();

  const { data: partner } = await supabase
    .from("partners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!partner) {
    return { error: "Partner nicht gefunden." };
  }

  const { error } = await supabase
    .from("placements")
    .update({ status: "vorstellungsgespraech" })
    .eq("id", placementId)
    .eq("partner_id", partner.id)
    .eq("status", "leadeingang");

  if (error) {
    return { error: "Interesse konnte nicht vermerkt werden." };
  }

  revalidatePath("/partner/kandidaten");
  return { success: true };
}
