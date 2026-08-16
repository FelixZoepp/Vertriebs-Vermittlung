"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PLACEMENT_PIPELINE_STAGES,
  PLACEMENT_STAGE_LABELS,
  PLACEMENT_STAGE_COLORS,
  type PlacementStage,
} from "@/lib/placement-stages";
import {
  ChevronRight,
  Check,
  X,
  MapPin,
  Briefcase,
  Car,
  Calendar,
  Phone,
  Mail,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

interface PlacementData {
  id: number;
  candidate_id: number;
  match_score: number | null;
  status: string;
  vorgeschlagen_am: string;
  eingestellt_am: string | null;
  abgelehnt_grund: string | null;
  vertraege_gesamt: number;
  candidates: {
    id: number;
    vorname: string;
    nachname: string;
    plz: string | null;
    ort: string | null;
    erfahrung_jahre: number;
    branchenerfahrung: string[];
    fuehrerschein: boolean;
    verfuegbar_ab: string | null;
    email: string;
    telefon: string | null;
  } | null;
}

export function PartnerPipelineBoard({ placements }: { placements: PlacementData[] }) {
  const [items, setItems] = useState(placements);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  async function moveToStage(placementId: number, newStatus: PlacementStage) {
    setUpdating(placementId);
    setError(null);

    try {
      const res = await fetch(`/api/placements/${placementId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Fehler");
        return;
      }

      setItems((prev) =>
        prev.map((p) => (p.id === placementId ? { ...p, status: newStatus } : p))
      );
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setUpdating(null);
    }
  }

  async function rejectPlacement(placementId: number) {
    if (!rejectReason.trim()) return;
    setUpdating(placementId);
    setError(null);

    try {
      const res = await fetch(`/api/placements/${placementId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "abgelehnt", abgelehnt_grund: rejectReason }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Fehler");
        return;
      }

      setItems((prev) =>
        prev.map((p) => (p.id === placementId ? { ...p, status: "abgelehnt" } : p))
      );
      setRejecting(null);
      setRejectReason("");
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setUpdating(null);
    }
  }

  const activeStages = PLACEMENT_PIPELINE_STAGES;

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Pipeline columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {activeStages.map((stage) => {
          const stageItems = items.filter((p) => p.status === stage);
          const isAnonymized = stage === "vorgeschlagen";
          const nextStage = activeStages[activeStages.indexOf(stage) + 1] as PlacementStage | undefined;

          return (
            <div key={stage} className="w-72 shrink-0">
              {/* Column header */}
              <div className={`mb-3 flex items-center justify-between rounded-lg px-3 py-2 ${PLACEMENT_STAGE_COLORS[stage]}`}>
                <span className="text-xs font-semibold">{PLACEMENT_STAGE_LABELS[stage]}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {stageItems.length}
                </Badge>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {stageItems.length === 0 && (
                  <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                    Keine Kandidaten
                  </div>
                )}

                {stageItems.map((p) => {
                  const c = p.candidates;
                  if (!c) return null;
                  const isUpdating = updating === p.id;

                  return (
                    <div key={p.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                      {/* Candidate info */}
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isAnonymized ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-green-600" />
                            )}
                            <h4 className="font-semibold text-sm">
                              {isAnonymized ? `Kandidat #${c.id}` : `${c.vorname} ${c.nachname}`}
                            </h4>
                          </div>
                          {p.match_score != null && (
                            <span className={`text-sm font-bold tabular-nums ${
                              p.match_score >= 70 ? "text-green-600" : p.match_score >= 40 ? "text-amber-600" : "text-red-600"
                            }`}>
                              {p.match_score}
                            </span>
                          )}
                        </div>

                        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3" />
                            {c.plz} {c.ort || "—"}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="h-3 w-3" />
                            {c.erfahrung_jahre} Jahre Erfahrung
                          </div>
                          {c.fuehrerschein && (
                            <div className="flex items-center gap-1.5">
                              <Car className="h-3 w-3" />
                              Führerschein vorhanden
                            </div>
                          )}
                          {c.verfuegbar_ab && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3" />
                              Ab {new Date(c.verfuegbar_ab).toLocaleDateString("de-DE")}
                            </div>
                          )}
                        </div>

                        {c.branchenerfahrung.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {c.branchenerfahrung.map((b) => (
                              <Badge key={b} variant="secondary" className="text-[10px]">{b}</Badge>
                            ))}
                          </div>
                        )}

                        {/* Contact info (only visible after vorgeschlagen) */}
                        {!isAnonymized && (
                          <div className="mt-3 space-y-1 border-t pt-3">
                            <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                              <Mail className="h-3 w-3" />
                              {c.email}
                            </a>
                            {c.telefon && (
                              <a href={`tel:${c.telefon}`} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                                <Phone className="h-3 w-3" />
                                {c.telefon}
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {stage !== "eingestellt" && (
                        <div className="flex items-center gap-2 border-t bg-muted/30 px-4 py-2.5">
                          {nextStage && (
                            <Button
                              size="sm"
                              className="flex-1 gap-1.5 text-xs"
                              onClick={() => moveToStage(p.id, nextStage)}
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                              {PLACEMENT_STAGE_LABELS[nextStage]}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-destructive hover:text-destructive"
                            onClick={() => setRejecting(rejecting === p.id ? null : p.id)}
                            disabled={isUpdating}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      {stage === "eingestellt" && (
                        <div className="flex items-center gap-2 border-t bg-green-50 px-4 py-2.5 text-xs font-medium text-green-700">
                          <Check className="h-4 w-4" />
                          Eingestellt
                          {p.eingestellt_am && (
                            <span className="ml-auto text-green-600/70">
                              {new Date(p.eingestellt_am).toLocaleDateString("de-DE")}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Reject form */}
                      {rejecting === p.id && (
                        <div className="border-t bg-red-50/50 p-3 space-y-2">
                          <textarea
                            className="w-full rounded-md border bg-background px-3 py-2 text-xs"
                            placeholder="Grund für die Ablehnung..."
                            rows={2}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="text-xs"
                              onClick={() => rejectPlacement(p.id)}
                              disabled={isUpdating || !rejectReason.trim()}
                            >
                              Ablehnen
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs"
                              onClick={() => { setRejecting(null); setRejectReason(""); }}
                            >
                              Abbrechen
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Abgelehnt column */}
        {(() => {
          const rejected = items.filter((p) => p.status === "abgelehnt");
          if (rejected.length === 0) return null;
          return (
            <div className="w-72 shrink-0">
              <div className="mb-3 flex items-center justify-between rounded-lg bg-red-100 px-3 py-2 text-red-800">
                <span className="text-xs font-semibold">Abgelehnt</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{rejected.length}</Badge>
              </div>
              <div className="space-y-3">
                {rejected.map((p) => {
                  const c = p.candidates;
                  if (!c) return null;
                  return (
                    <div key={p.id} className="rounded-xl border border-red-200 bg-red-50/50 p-4 opacity-70">
                      <h4 className="text-sm font-medium">{c.vorname} {c.nachname}</h4>
                      <p className="mt-1 text-xs text-muted-foreground">{c.plz} {c.ort}</p>
                      {p.abgelehnt_grund && (
                        <p className="mt-2 text-xs text-red-600">Grund: {p.abgelehnt_grund}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
