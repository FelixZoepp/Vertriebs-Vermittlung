import type { Candidate, Partner } from "@/lib/types";

/**
 * R3 – Matching mit Standort
 * Score: Distanz 50%, Branche 30%, Erfahrung 10%, Kapazität 10%
 */

export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface MatchResult {
  partner_id: number;
  score: number;
  distanz_km: number;
  gruende: string[];
}

export function calculateMatchScore(
  candidate: Candidate,
  partner: Partner & { aktuelle_placements?: number }
): MatchResult | null {
  if (!candidate.lat || !candidate.lng || !partner.lat || !partner.lng) {
    return null;
  }

  const distanz = haversineKm(candidate.lat, candidate.lng, partner.lat, partner.lng);

  // Ausschluss: außerhalb beider Radien
  if (distanz > partner.suchradius_km || distanz > candidate.umkreis_bereitschaft_km) {
    return null;
  }

  const gruende: string[] = [];

  // Distanz-Score (50%): 0km = 100, max_radius = 0
  const maxRadius = Math.min(partner.suchradius_km, candidate.umkreis_bereitschaft_km);
  const distanzScore = Math.max(0, 100 - (distanz / maxRadius) * 100);
  gruende.push(`Distanz: ${Math.round(distanz)} km (${Math.round(distanzScore)}%)`);

  // Branchen-Score (30%)
  let branchenScore = 0;
  if (partner.gesuchte_profile.length === 0) {
    branchenScore = 50; // keine Anforderung = neutral
  } else {
    const matches = candidate.branchenerfahrung.filter((b) =>
      partner.gesuchte_profile.includes(b)
    ).length;
    branchenScore = (matches / partner.gesuchte_profile.length) * 100;
  }
  gruende.push(`Branche: ${Math.round(branchenScore)}%`);

  // Erfahrungs-Score (10%)
  const erfahrungScore = Math.min(100, candidate.erfahrung_jahre * 20);
  gruende.push(`Erfahrung: ${candidate.erfahrung_jahre} Jahre (${Math.round(erfahrungScore)}%)`);

  // Kapazitäts-Score (10%)
  const auslastung = partner.aktuelle_placements || 0;
  const kapazitaetScore =
    partner.offene_stellen > 0
      ? Math.max(0, 100 - (auslastung / partner.offene_stellen) * 100)
      : 0;
  gruende.push(`Kapazität: ${partner.offene_stellen - auslastung} frei (${Math.round(kapazitaetScore)}%)`);

  const score = Math.round(
    distanzScore * 0.5 +
    branchenScore * 0.3 +
    erfahrungScore * 0.1 +
    kapazitaetScore * 0.1
  );

  return { partner_id: partner.id, score, distanz_km: Math.round(distanz), gruende };
}

export function rankMatches(results: MatchResult[], limit = 5): MatchResult[] {
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
