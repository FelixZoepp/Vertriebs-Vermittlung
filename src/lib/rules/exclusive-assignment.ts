import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateMatchScore, rankMatches, type MatchResult } from "@/lib/rules/matching";
import { isPartnerFreigeschaltet, type Candidate, type Partner } from "@/lib/types";
import { sendPartnerNeuerKandidat } from "@/lib/integrations/resend";

/**
 * R8 – Exklusive Vermittlung
 * Ein Kandidat ist immer nur bei EINEM Partner gleichzeitig im Prozess.
 * Wird er abgelehnt (durch Partner oder Kandidat), wird er automatisch an den
 * nächstbesten Partner weitervermittelt (Score >= AUTO_MATCH_MIN_SCORE).
 * Partner, die den Kandidaten schon einmal hatten, werden ausgeschlossen.
 * Findet sich kein Partner, geht der Kandidat zurück in den Pool (stage: vermittelbar).
 */

export const OFFENE_PLACEMENT_STATUS = [
  "leadeingang",
  "vorstellungsgespraech",
  "probetag",
  "eingestellt",
] as const;

const AUTO_MATCH_MIN_SCORE = 70;

/** Prüft, ob der Kandidat bereits ein offenes Placement (bei irgendeinem Partner) hat. */
export async function hatOffenesPlacement(
  supabase: SupabaseClient,
  candidateId: number
): Promise<boolean> {
  const { data } = await supabase
    .from("placements")
    .select("id")
    .eq("candidate_id", candidateId)
    .in("status", [...OFFENE_PLACEMENT_STATUS])
    .limit(1);
  return !!data && data.length > 0;
}

/**
 * Vermittelt den Kandidaten nach einer Ablehnung an den nächstbesten Partner.
 * Idempotent: tut nichts, wenn bereits ein offenes Placement existiert.
 * @returns die neue placement_id oder null (kein Partner gefunden → zurück in Pool)
 */
export async function vermittleAnNaechstenPartner(
  supabase: SupabaseClient,
  candidateId: number
): Promise<number | null> {
  // Sicherheit: kein zweites offenes Placement erzeugen
  if (await hatOffenesPlacement(supabase, candidateId)) return null;

  const { data: candidate } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", candidateId)
    .single<Candidate>();

  if (!candidate) return null;

  // Partner ausschließen, die den Kandidaten schon einmal hatten (egal welcher Status)
  const { data: bisherige } = await supabase
    .from("placements")
    .select("partner_id")
    .eq("candidate_id", candidateId);
  const ausgeschlossen = new Set((bisherige || []).map((p) => p.partner_id));

  const { data: partners } = await supabase
    .from("partners")
    .select("*")
    .eq("status", "aktiv")
    .gt("offene_stellen", 0)
    .returns<Partner[]>();

  const kandidatenPartner = (partners || []).filter(
    (p) => !ausgeschlossen.has(p.id) && isPartnerFreigeschaltet(p)
  );

  if (kandidatenPartner.length === 0) {
    await zurueckInPool(supabase, candidateId);
    return null;
  }

  // Kapazität pro Partner
  const { data: placementCounts } = await supabase
    .from("placements")
    .select("partner_id")
    .in("status", [...OFFENE_PLACEMENT_STATUS]);
  const countMap: Record<number, number> = {};
  for (const p of placementCounts || []) {
    countMap[p.partner_id] = (countMap[p.partner_id] || 0) + 1;
  }

  const results: MatchResult[] = [];
  for (const partner of kandidatenPartner) {
    const result = calculateMatchScore(candidate, {
      ...partner,
      aktuelle_placements: countMap[partner.id] || 0,
    });
    if (result) results.push(result);
  }

  const ranked = rankMatches(results);
  const best = ranked[0];

  if (!best || best.score < AUTO_MATCH_MIN_SCORE) {
    await zurueckInPool(supabase, candidateId);
    return null;
  }

  const now = new Date().toISOString();
  const { data: placement, error } = await supabase
    .from("placements")
    .insert({
      candidate_id: candidateId,
      partner_id: best.partner_id,
      match_score: best.score,
      status: "leadeingang",
      vorgeschlagen_am: now,
      vertraege_gesamt: 0,
    })
    .select("id")
    .single();

  if (error || !placement) {
    console.error("vermittleAnNaechstenPartner: Insert fehlgeschlagen", error);
    await zurueckInPool(supabase, candidateId);
    return null;
  }

  // Kandidat bleibt/wird "vermittelt"
  await supabase
    .from("candidates")
    .update({ stage: "vermittelt", stage_changed_at: now })
    .eq("id", candidateId);

  await supabase.from("activity_log").insert({
    entity_typ: "placement",
    entity_id: placement.id,
    aktion: "auto_weitervermittlung",
    payload: {
      candidate_id: candidateId,
      partner_id: best.partner_id,
      match_score: best.score,
      ausgeschlossene_partner: [...ausgeschlossen],
    },
  });

  // Partner benachrichtigen (anonymisierter Name, kein Klarname vor aktiver Vermittlung)
  const partner = kandidatenPartner.find((p) => p.id === best.partner_id);
  if (partner?.email) {
    const anzeigeName = `${candidate.vorname} ${candidate.nachname.charAt(0)}.`;
    try {
      await sendPartnerNeuerKandidat(
        partner.email,
        partner.ansprechpartner || "Partner",
        anzeigeName,
        best.score
      );
    } catch (e) {
      console.error("sendPartnerNeuerKandidat fehlgeschlagen:", e);
    }
  }

  return placement.id;
}

/** Kein Partner gefunden → Kandidat zurück auf "vermittelbar" (wieder im Pool sichtbar). */
async function zurueckInPool(supabase: SupabaseClient, candidateId: number) {
  await supabase
    .from("candidates")
    .update({ stage: "vermittelbar", stage_changed_at: new Date().toISOString() })
    .eq("id", candidateId);

  await supabase.from("activity_log").insert({
    entity_typ: "candidate",
    entity_id: candidateId,
    aktion: "zurueck_in_pool",
    payload: { grund: "kein_passender_partner_nach_ablehnung" },
  });
}
