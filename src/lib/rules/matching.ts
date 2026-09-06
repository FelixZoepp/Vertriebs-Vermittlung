import { MAX_RADIUS_KM, type Candidate, type Partner } from "@/lib/types";

/**
 * R3 – Matching mit Standort
 * Score: Distanz 60%, Branche 30%, Kapazität 10%
 * Erfahrung wird NICHT gescort (nur als Notiz angezeigt).
 * Radien sind auf MAX_RADIUS_KM (100 km) gedeckelt.
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

  // Radien auf Maximum deckeln
  const partnerRadius = Math.min(partner.suchradius_km, MAX_RADIUS_KM);
  const kandidatRadius = Math.min(candidate.umkreis_bereitschaft_km, MAX_RADIUS_KM);

  // Ausschluss: außerhalb beider Radien
  if (distanz > partnerRadius || distanz > kandidatRadius) {
    return null;
  }

  const gruende: string[] = [];

  // Distanz-Score (60%): 0km = 100, max_radius = 0
  const maxRadius = Math.min(partnerRadius, kandidatRadius);
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

  // Erfahrung: nur als Notiz, fließt nicht in den Score ein
  gruende.push(`Erfahrung: ${candidate.erfahrung_jahre} Jahre (Info)`);

  // Kapazitäts-Score (10%)
  const auslastung = partner.aktuelle_placements || 0;
  const kapazitaetScore =
    partner.offene_stellen > 0
      ? Math.max(0, 100 - (auslastung / partner.offene_stellen) * 100)
      : 0;
  gruende.push(`Kapazität: ${partner.offene_stellen - auslastung} frei (${Math.round(kapazitaetScore)}%)`);

  const score = Math.round(
    distanzScore * 0.6 +
    branchenScore * 0.3 +
    kapazitaetScore * 0.1
  );

  return { partner_id: partner.id, score, distanz_km: Math.round(distanz), gruende };
}

export function rankMatches(results: MatchResult[], limit = 5): MatchResult[] {
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
