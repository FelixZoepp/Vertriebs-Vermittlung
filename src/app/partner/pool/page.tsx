import { getAuthUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { calculateMatchScore } from "@/lib/rules/matching";
import { OFFENE_PLACEMENT_STATUS } from "@/lib/rules/exclusive-assignment";
import type { Candidate, Partner } from "@/lib/types";
import { redirect } from "next/navigation";
import { Target } from "lucide-react";
import { PoolGrid, type PoolCandidate } from "./_components/pool-grid";

export const dynamic = "force-dynamic";

export default async function PoolPage() {
  const user = await getAuthUser();
  if (user.role !== "partner") redirect("/");

  const supabase = await createServiceClient();

  const { data: partner } = await supabase
    .from("partners")
    .select("*")
    .eq("user_id", user.id)
    .single<Partner>();

  if (!partner) redirect("/");

  // Vorqualifizierte Kandidaten auf dem Markt (Service-Client wegen RLS,
  // Daten werden vor dem Rendern anonymisiert)
  const { data: candidates } = await supabase
    .from("candidates")
    .select("*")
    .eq("stage", "vermittelbar")
    .order("created_at", { ascending: false })
    .returns<Candidate[]>();

  // Alle offenen Placements (R8: Exklusivität – Kandidat nur bei EINEM Partner sichtbar)
  const { data: offenePlacements } = await supabase
    .from("placements")
    .select("candidate_id, partner_id, status")
    .in("status", [...OFFENE_PLACEMENT_STATUS]);

  // Eigene offene Anfragen → "bereits angefragt"
  const angefragteIds = new Set(
    (offenePlacements || [])
      .filter((p) => p.partner_id === partner.id)
      .map((p) => p.candidate_id)
  );

  // Kandidaten, die bei einem ANDEREN Partner im Prozess sind → ausblenden
  const vergebeneIds = new Set(
    (offenePlacements || [])
      .filter((p) => p.partner_id !== partner.id)
      .map((p) => p.candidate_id)
  );

  const aktivePlacements = (offenePlacements || []).filter(
    (p) =>
      p.partner_id === partner.id &&
      ["leadeingang", "vorstellungsgespraech", "probetag"].includes(p.status)
  ).length;

  const partnerMitKapazitaet = { ...partner, aktuelle_placements: aktivePlacements };

  // Anonymisieren + Match-Score (kein Klarname vor aktiver Vermittlung)
  const poolCandidates: PoolCandidate[] = (candidates || [])
    .filter((c) => !vergebeneIds.has(c.id))
    .map((c) => {
    const match = calculateMatchScore(c, partnerMitKapazitaet);
    return {
      id: c.id,
      anzeigeName: `${c.vorname} ${c.nachname.charAt(0)}.`,
      ort: c.ort,
      plz: c.plz ? `${c.plz.slice(0, 2)}xxx` : null,
      erfahrungJahre: c.erfahrung_jahre,
      branchen: c.branchenerfahrung,
      fuehrerschein: c.fuehrerschein,
      verfuegbarAb: c.verfuegbar_ab,
      masterclassAbgeschlossen: !!c.masterclass_abgeschlossen_am,
      umkreisKm: c.umkreis_bereitschaft_km,
      score: match?.score ?? null,
      distanzKm: match?.distanz_km ?? null,
      bereitsAngefragt: angefragteIds.has(c.id),
    };
  });

  // Sortierung: gematchte zuerst (Score desc), dann Rest
  poolCandidates.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  const empfehlungen = poolCandidates.filter((c) => c.score !== null && !c.bereitsAngefragt).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
          <Target className="h-5 w-5 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Kandidaten-Pool</h1>
          <p className="text-sm text-muted-foreground">
            {poolCandidates.length} vorqualifizierte Kandidaten auf dem Markt
            {empfehlungen > 0 && ` — ${empfehlungen} passen zu deinem Suchprofil`}
          </p>
        </div>
      </div>

      <PoolGrid candidates={poolCandidates} suchradiusKm={partner.suchradius_km} />
    </div>
  );
}
