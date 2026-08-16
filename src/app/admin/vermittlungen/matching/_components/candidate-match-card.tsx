"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { proposeMatch } from "../_actions/propose";
import {
  MapPin,
  Briefcase,
  Car,
  Calendar,
  Crosshair,
  Check,
  Loader2,
  Building2,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { STAGE_LABELS } from "@/lib/types";

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

interface CandidateForMatching {
  id: number;
  vorname: string;
  nachname: string;
  email: string;
  telefon: string | null;
  plz: string | null;
  ort: string | null;
  erfahrung_jahre: number;
  branchenerfahrung: string[];
  fuehrerschein: boolean;
  verfuegbar_ab: string | null;
  umkreis_bereitschaft_km: number;
  lat: number | null;
  lng: number | null;
  stage: string;
  quelle: string;
}

export function CandidateMatchCard({
  candidate,
  showStage,
}: {
  candidate: CandidateForMatching;
  showStage?: boolean;
}) {
  const [matches, setMatches] = useState<PartnerMatch[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposed, setProposed] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [proposingId, setProposingId] = useState<number | null>(null);

  async function startMatching() {
    setLoading(true);
    setError(null);
    setMatches(null);

    try {
      const res = await fetch(`/api/matching/${candidate.id}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Unbekannter Fehler");
        return;
      }

      if (data.matches.length === 0) {
        setError("Keine passenden Partner gefunden. Prüfe Standort, Radius und aktive Partner.");
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
    setProposingId(match.partner_id);
    startTransition(async () => {
      const result = await proposeMatch(candidate.id, match.partner_id, match.score);
      if (result.success) {
        setProposed((prev) => new Set(prev).add(match.partner_id));
      } else {
        setError(result.error || "Fehler beim Vorschlagen.");
      }
      setProposingId(null);
    });
  }

  function handleProposeAll() {
    if (!matches) return;
    const unproposed = matches.filter((m) => !proposed.has(m.partner_id));
    if (unproposed.length === 0) return;

    startTransition(async () => {
      for (const match of unproposed) {
        setProposingId(match.partner_id);
        const result = await proposeMatch(candidate.id, match.partner_id, match.score);
        if (result.success) {
          setProposed((prev) => new Set(prev).add(match.partner_id));
        }
      }
      setProposingId(null);
    });
  }

  const hasCoords = candidate.lat != null && candidate.lng != null;
  const allProposed = matches ? matches.every((m) => proposed.has(m.partner_id)) : false;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Candidate header */}
      <div className="flex items-start justify-between gap-4 border-b bg-muted/30 p-5">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">
              {candidate.vorname} {candidate.nachname}
            </h3>
            {showStage && (
              <Badge variant="outline" className="text-xs">
                {STAGE_LABELS[candidate.stage as keyof typeof STAGE_LABELS] || candidate.stage}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs capitalize">{candidate.quelle}</Badge>
          </div>

          {/* Detail grid */}
          <div className="mt-3 grid gap-x-6 gap-y-1.5 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {candidate.plz} {candidate.ort || "—"}
            </span>
            <span className="flex items-center gap-1.5">
              <Crosshair className="h-3.5 w-3.5" />
              {candidate.umkreis_bereitschaft_km} km Radius
            </span>
            <span className="flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" />
              {candidate.erfahrung_jahre} Jahre Erfahrung
            </span>
            <span className="flex items-center gap-1.5">
              <Car className="h-3.5 w-3.5" />
              {candidate.fuehrerschein ? "Führerschein" : "Kein Führerschein"}
            </span>
            {candidate.verfuegbar_ab && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Ab {new Date(candidate.verfuegbar_ab).toLocaleDateString("de-DE")}
              </span>
            )}
          </div>

          {/* Branchen */}
          {candidate.branchenerfahrung.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {candidate.branchenerfahrung.map((b) => (
                <Badge key={b} variant="secondary" className="text-xs">{b}</Badge>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {!hasCoords && (
            <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
              <AlertCircle className="h-3.5 w-3.5" />
              Keine Koordinaten
            </div>
          )}

          {!matches && !allProposed && (
            <Button
              onClick={startMatching}
              disabled={loading || !hasCoords}
              className="gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/20 hover:from-red-700 hover:to-red-800"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              {loading ? "Suche..." : "Matching starten"}
            </Button>
          )}

          {allProposed && (
            <div className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
              <Check className="h-4 w-4" />
              Alle zugeordnet
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 border-b bg-red-50 px-5 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-red-700 hover:text-red-900"
            onClick={() => { setError(null); startMatching(); }}
            disabled={loading}
          >
            Erneut
          </Button>
        </div>
      )}

      {/* Match results */}
      {matches && matches.length > 0 && (
        <div className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium">
              Top-{matches.length} Partner
            </p>
            {!allProposed && matches.length > 1 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleProposeAll}
                disabled={isPending}
                className="gap-1.5 text-xs"
              >
                Alle vorschlagen
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {matches.map((m, idx) => {
              const isProposed = proposed.has(m.partner_id);
              const isProposing = proposingId === m.partner_id;

              return (
                <div
                  key={m.partner_id}
                  className={`rounded-lg border p-4 transition-colors ${
                    isProposed ? "border-green-200 bg-green-50/50" : "hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Partner info */}
                    <div className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                        idx === 0
                          ? "bg-gradient-to-br from-red-500 to-red-700 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            {m.partner?.firmenname ?? `Partner #${m.partner_id}`}
                          </p>
                          {m.partner?.branche && (
                            <Badge variant="outline" className="text-xs">{m.partner.branche}</Badge>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {m.partner?.plz} {m.partner?.ort}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {m.partner?.offene_stellen} offene Stellen
                          </span>
                        </div>

                        {/* Score breakdown */}
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5">
                          {m.gruende.map((g, i) => (
                            <span key={i} className="text-xs text-muted-foreground">{g}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Score + Action */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`text-2xl font-bold tabular-nums ${
                          m.score >= 70 ? "text-green-600" : m.score >= 40 ? "text-amber-600" : "text-red-600"
                        }`}>
                          {m.score}
                        </div>
                        <p className="text-xs text-muted-foreground">{m.distanz_km} km</p>
                      </div>

                      {isProposed ? (
                        <div className="flex h-9 items-center gap-1.5 rounded-lg bg-green-100 px-3 text-sm font-medium text-green-700">
                          <Check className="h-4 w-4" />
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handlePropose(m)}
                          disabled={isPending}
                          className="gap-1.5"
                        >
                          {isProposing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Vorschlagen
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
