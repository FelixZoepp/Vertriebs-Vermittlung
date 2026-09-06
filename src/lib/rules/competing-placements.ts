import type { SupabaseClient } from "@supabase/supabase-js";
import { sendPartnerKandidatVergeben } from "@/lib/integrations/resend";

/**
 * R7 – Konkurrierende Anfragen schließen
 * Wird ein Kandidat eingestellt, werden alle anderen offenen Placements
 * desselben Kandidaten automatisch auf "abgebrochen" gesetzt und die
 * betroffenen Partner per E-Mail informiert.
 * Idempotent: bereits geschlossene Placements werden nicht erneut angefasst.
 */
export async function closeCompetingPlacements(
  supabase: SupabaseClient,
  candidateId: number,
  winningPlacementId: number
): Promise<number> {
  const { data: competing } = await supabase
    .from("placements")
    .select("id, partner_id, partner:partners(email, ansprechpartner)")
    .eq("candidate_id", candidateId)
    .neq("id", winningPlacementId)
    .in("status", ["leadeingang", "vorstellungsgespraech", "probetag"]);

  if (!competing || competing.length === 0) return 0;

  const ids = competing.map((p) => p.id);

  const { error } = await supabase
    .from("placements")
    .update({
      status: "abgebrochen",
      abgelehnt_grund: "Kandidat wurde anderweitig vermittelt",
    })
    .in("id", ids);

  if (error) {
    console.error("closeCompetingPlacements: Update fehlgeschlagen", error);
    return 0;
  }

  await supabase.from("activity_log").insert(
    ids.map((id) => ({
      entity_typ: "placement",
      entity_id: id,
      aktion: "auto_abgebrochen",
      payload: {
        grund: "kandidat_vergeben",
        gewinner_placement_id: winningPlacementId,
      },
    }))
  );

  // Anonymisierter Name für Partner-Mail (kein Klarname bei beendeter Anfrage)
  const { data: candidate } = await supabase
    .from("candidates")
    .select("vorname, nachname")
    .eq("id", candidateId)
    .single();

  const anzeigeName = candidate
    ? `${candidate.vorname} ${candidate.nachname.charAt(0)}.`
    : "Der Kandidat";

  for (const p of competing) {
    const partner = Array.isArray(p.partner) ? p.partner[0] : p.partner;
    if (!partner?.email) continue;
    try {
      await sendPartnerKandidatVergeben(
        partner.email,
        partner.ansprechpartner || "Partner",
        anzeigeName
      );
    } catch (e) {
      console.error("sendPartnerKandidatVergeben fehlgeschlagen:", e);
    }
  }

  return ids.length;
}
