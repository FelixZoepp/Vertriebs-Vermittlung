import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  calculateMatchScore,
  rankMatches,
  type MatchResult,
} from "@/lib/rules/matching";
import type { Candidate, Partner } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  const { candidateId } = await params;
  const id = parseInt(candidateId, 10);

  if (isNaN(id)) {
    return NextResponse.json(
      { error: "Ungueltige Kandidaten-ID." },
      { status: 400 }
    );
  }

  const supabase = await createServiceClient();

  // Fetch the candidate
  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", id)
    .single();

  if (candidateError || !candidate) {
    return NextResponse.json(
      { error: "Kandidat nicht gefunden." },
      { status: 404 }
    );
  }

  // Fetch all active partners with open positions
  const { data: partners, error: partnersError } = await supabase
    .from("partners")
    .select("*")
    .eq("status", "aktiv")
    .gt("offene_stellen", 0);

  if (partnersError) {
    return NextResponse.json(
      { error: "Fehler beim Laden der Partner." },
      { status: 500 }
    );
  }

  if (!partners || partners.length === 0) {
    return NextResponse.json({
      matches: [],
      candidate: {
        vorname: candidate.vorname,
        nachname: candidate.nachname,
      },
    });
  }

  // Count current active placements per partner
  const { data: placementCounts } = await supabase
    .from("placements")
    .select("partner_id")
    .in("status", ["leadeingang", "vorstellungsgespraech", "probetag", "eingestellt"]);

  const countMap: Record<number, number> = {};
  if (placementCounts) {
    for (const p of placementCounts) {
      countMap[p.partner_id] = (countMap[p.partner_id] || 0) + 1;
    }
  }

  // Calculate match scores
  const results: MatchResult[] = [];
  for (const partner of partners as Partner[]) {
    const partnerWithCount = {
      ...partner,
      aktuelle_placements: countMap[partner.id] || 0,
    };
    const result = calculateMatchScore(
      candidate as Candidate,
      partnerWithCount
    );
    if (result) {
      results.push(result);
    }
  }

  // Rank and return Top-3
  const topMatches = rankMatches(results);

  // Enrich with partner details
  const enrichedMatches = topMatches.map((m) => {
    const partner = (partners as Partner[]).find((p) => p.id === m.partner_id);
    return {
      ...m,
      partner: partner
        ? {
            id: partner.id,
            firmenname: partner.firmenname,
            ort: partner.ort,
            plz: partner.plz,
            branche: partner.branche,
            offene_stellen: partner.offene_stellen,
          }
        : null,
    };
  });

  return NextResponse.json({
    matches: enrichedMatches,
    candidate: {
      vorname: candidate.vorname,
      nachname: candidate.nachname,
    },
  });
}
