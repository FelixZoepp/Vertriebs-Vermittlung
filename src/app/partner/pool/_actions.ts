"use server";

import { getAuthUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { isPartnerFreigeschaltet, type Candidate, type Partner } from "@/lib/types";
import { calculateMatchScore } from "@/lib/rules/matching";
import { OFFENE_PLACEMENT_STATUS } from "@/lib/rules/exclusive-assignment";
import { sendAdminKandidatAngefragt } from "@/lib/integrations/resend";
import { revalidatePath } from "next/cache";

interface AnfrageResult {
  success: boolean;
  error?: string;
}

export async function anfrageKandidat(candidateId: number): Promise<AnfrageResult> {
  const user = await getAuthUser();
  if (user.role !== "partner") {
    return { success: false, error: "Keine Berechtigung." };
  }

  const supabase = await createServiceClient();

  const { data: partner } = await supabase
    .from("partners")
    .select("*")
    .eq("user_id", user.id)
    .single<Partner>();

  if (!partner) {
    return { success: false, error: "Partner-Profil nicht gefunden." };
  }
  if (!isPartnerFreigeschaltet(partner)) {
    return { success: false, error: "Bitte zuerst die Plattform freischalten." };
  }

  const { data: candidate } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", candidateId)
    .single<Candidate>();

  if (!candidate || candidate.stage !== "vermittelbar") {
    return { success: false, error: "Kandidat ist nicht mehr verfügbar." };
  }

  // R8: Exklusivität – Kandidat darf nur bei EINEM Partner gleichzeitig im Prozess sein
  const { data: existing } = await supabase
    .from("placements")
    .select("id, partner_id")
    .eq("candidate_id", candidateId)
    .in("status", [...OFFENE_PLACEMENT_STATUS])
    .limit(1);

  if (existing && existing.length > 0) {
    if (existing[0].partner_id === partner.id) {
      return { success: false, error: "Du hast diesen Kandidaten bereits angefragt." };
    }
    return {
      success: false,
      error: "Dieser Kandidat ist aktuell bei einem anderen Unternehmen im Prozess.",
    };
  }

  // Kapazität für Match-Score
  const { count: aktivePlacements } = await supabase
    .from("placements")
    .select("id", { count: "exact", head: true })
    .eq("partner_id", partner.id)
    .in("status", ["leadeingang", "vorstellungsgespraech", "probetag"]);

  const match = calculateMatchScore(candidate, {
    ...partner,
    aktuelle_placements: aktivePlacements || 0,
  });

  const { data: placement, error: insertError } = await supabase
    .from("placements")
    .insert({
      candidate_id: candidateId,
      partner_id: partner.id,
      match_score: match?.score ?? null,
      status: "leadeingang",
      vorgeschlagen_am: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError || !placement) {
    return { success: false, error: "Anfrage konnte nicht erstellt werden." };
  }

  await supabase.from("activity_log").insert({
    entity_typ: "placement",
    entity_id: placement.id,
    aktion: "partner_anfrage",
    akteur_id: user.id,
    payload: {
      candidate_id: candidateId,
      partner_id: partner.id,
      match_score: match?.score ?? null,
      quelle: "kandidaten_pool",
    },
  });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    try {
      await sendAdminKandidatAngefragt(
        adminEmail,
        partner.firmenname,
        `${candidate.vorname} ${candidate.nachname}`,
        placement.id
      );
    } catch (e) {
      console.error("Admin-Mail fehlgeschlagen:", e);
    }
  }

  revalidatePath("/partner/pool");
  revalidatePath("/partner/kandidaten");
  return { success: true };
}
