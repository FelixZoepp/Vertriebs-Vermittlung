"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { proposeMatch } from "../_actions/propose";

interface PartnerMatch {
  partner_id: number;
  score: number;
  distanz_km: number;
  gruende: string[];
  partner: {
    id: number;
    firmenname: string;
    ort: string | null;
    plz: string | null;
    branche: string | null;
    offene_stellen: number;
  } | null;
}

interface MatchingApiResponse {
  matches: PartnerMatch[];
  candidate: { vorname: string; nachname: string };
}

interface CandidateForMatching {
  id: number;
  vorname: string;
  nachname: string;
  plz: string | null;
  ort: string | null;
  erfahrung_jahre: number;
  branchenerfahrung: string[];
  lat: number | null;
  lng: number | null;
}

export function CandidateMatchCard({
  candidate,
}: {
  candidate: CandidateForMatching;
}) {
  const [matches, setMatches] = useState<PartnerMatch[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposed, setProposed] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();

  async function startMatching() {
    setLoading(true);
    setError(null);
    setMatches(null);

    try {
      const res = await fetch(`/api/matching/${candidate.id}`);
      const data: MatchingApiResponse | { error: string } = await res.json();

      if (!res.ok || "error" in data) {
        setError("error" in data ? data.error : "Unbekannter Fehler");
        return;
      }

      if (data.matches.length === 0) {
        setError("Keine passenden Partner gefunden.");
        return;
      }

      setMatches(data.matches);
    } catch {
      setError("Netzwerkfehler beim Matching.");
    } finally {
      setLoading(false);
    }
  }

  function handlePropose(match: PartnerMatch) {
    startTransition(async () => {
      const result = await proposeMatch(
        candidate.id,
        match.partner_id,
        match.score
      );
      if (result.success) {
        setProposed((prev) => new Set(prev).add(match.partner_id));
      } else {
        setError(result.error || "Fehler beim Vorschlagen.");
      }
    });
  }

  const hasCoords = candidate.lat != null && candidate.lng != null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {candidate.vorname} {candidate.nachname}
        </CardTitle>
        <CardDescription>
          {candidate.plz} {candidate.ort}
          {candidate.erfahrung_jahre > 0 &&
            ` \u00B7 ${candidate.erfahrung_jahre} Jahre Erfahrung`}
          {candidate.branchenerfahrung.length > 0 &&
            ` \u00B7 ${candidate.branchenerfahrung.join(", ")}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasCoords && (
          <p className="text-sm text-amber-600">
            Keine Koordinaten vorhanden. Bitte PLZ beim Kandidaten hinterlegen.
          </p>
        )}

        {!matches && !error && (
          <Button
            onClick={startMatching}
            disabled={loading || !hasCoords}
          >
            {loading ? "Matching laeuft..." : "Matching starten"}
          </Button>
        )}

        {error && (
          <div className="space-y-2">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={startMatching} disabled={loading}>
              Erneut versuchen
            </Button>
          </div>
        )}

        {matches && matches.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Top-{matches.length} Ergebnisse
            </p>
            {matches.map((m, idx) => (
              <div
                key={m.partner_id}
                className="rounded-lg border p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      #{idx + 1} {m.partner?.firmenname ?? `Partner #${m.partner_id}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.partner?.plz} {m.partner?.ort}
                      {m.partner?.branche && ` \u00B7 ${m.partner.branche}`}
                      {m.partner?.offene_stellen != null &&
                        ` \u00B7 ${m.partner.offene_stellen} offene Stellen`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-mono text-lg font-bold">{m.score}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.distanz_km} km
                      </p>
                    </div>
                  </div>
                </div>

                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {m.gruende.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>

                <div className="flex justify-end">
                  {proposed.has(m.partner_id) ? (
                    <span className="text-xs font-medium text-green-600">
                      Vorgeschlagen
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handlePropose(m)}
                      disabled={isPending}
                    >
                      {isPending ? "Wird vorgeschlagen..." : "Vorschlagen"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
