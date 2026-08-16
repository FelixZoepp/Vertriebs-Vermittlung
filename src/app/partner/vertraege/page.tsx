import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Placement } from "@/lib/types";
import { TRACKING_INTERVALS } from "@/lib/placement-stages";
import { InlineTrackingForm } from "./_components/inline-tracking-form";
import { FileText, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface TrackingRow {
  id: number;
  placement_id: number;
  intervall: string;
  anzahl_vertraege: number | null;
  angefragt_am: string;
  beantwortet_am: string | null;
}

export default async function PartnerVertraegePage() {
  const user = await getAuthUser();
  const supabase = await createClient();

  const { data: partner, error: partnerError } = await supabase
    .from("partners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (partnerError || !partner) {
    return (
      <p className="text-destructive">
        Kein Partner-Konto mit diesem Benutzer verknuepft.
      </p>
    );
  }

  const { data: placements, error } = await supabase
    .from("placements")
    .select("*, candidate:candidates(*)")
    .eq("partner_id", partner.id)
    .eq("status", "eingestellt")
    .order("eingestellt_am", { ascending: false });

  if (error) {
    return (
      <p className="text-destructive">Fehler beim Laden: {error.message}</p>
    );
  }

  const typedPlacements = (placements ?? []) as Placement[];
  const placementIds = typedPlacements.map((p) => p.id);

  // Fetch all contract_tracking rows for these placements using service client
  const serviceClient = await createServiceClient();
  let trackingRows: TrackingRow[] = [];

  if (placementIds.length > 0) {
    const { data } = await serviceClient
      .from("contract_tracking")
      .select("*")
      .in("placement_id", placementIds);
    trackingRows = (data ?? []) as TrackingRow[];
  }

  // Group tracking rows by placement_id
  const trackingByPlacement = new Map<number, TrackingRow[]>();
  for (const row of trackingRows) {
    const existing = trackingByPlacement.get(row.placement_id) ?? [];
    existing.push(row);
    trackingByPlacement.set(row.placement_id, existing);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20">
          <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Vertrags-Tracking</h1>
          <p className="text-sm text-muted-foreground">
            Uebersicht ueber Vertragszahlen deiner eingestellten Vertriebler.
          </p>
        </div>
      </div>

      {typedPlacements.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 text-muted-foreground">
            Noch keine eingestellten Vermittlungen vorhanden.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {typedPlacements.map((p) => {
            const progress = Math.min(p.vertraege_gesamt, 100);
            const approaching = progress >= 80;
            const trackings = trackingByPlacement.get(p.id) ?? [];
            const kandidatName = p.candidate
              ? `${p.candidate.vorname} ${p.candidate.nachname}`
              : `Vermittlung #${p.id}`;

            return (
              <Card key={p.id} className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>{kandidatName}</span>
                    {approaching && (
                      <span
                        className="inline-block size-3 rounded-full bg-green-500 shadow-sm shadow-green-500/30"
                        title="Fast am Meilenstein!"
                      />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {p.eingestellt_am && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        Eingestellt am:{" "}
                      </span>
                      {new Date(p.eingestellt_am).toLocaleDateString("de-DE")}
                    </div>
                  )}

                  {/* Progress bar */}
                  <div>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Vertraege gesamt
                      </span>
                      <span className="font-medium tabular-nums">
                        {p.vertraege_gesamt} / 100
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${
                          approaching
                            ? "bg-green-500"
                            : "bg-gradient-to-r from-red-500 to-red-600"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Tracking timeline */}
                  <div className="space-y-0">
                    <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Tracking-Intervalle
                    </p>
                    <div className="grid gap-2">
                      {TRACKING_INTERVALS.map((interval, idx) => {
                        const tracking = trackings.find(
                          (t) => t.intervall === interval.key
                        );

                        // Determine status
                        let status: "pending" | "requested" | "answered" =
                          "pending";
                        if (tracking?.beantwortet_am) {
                          status = "answered";
                        } else if (tracking) {
                          status = "requested";
                        }

                        return (
                          <div
                            key={interval.key}
                            className="flex items-center gap-3"
                          >
                            {/* Timeline connector */}
                            <div className="flex flex-col items-center">
                              <div
                                className={`flex h-7 w-7 items-center justify-center rounded-full ${
                                  status === "answered"
                                    ? "bg-green-100 text-green-600"
                                    : status === "requested"
                                      ? "bg-amber-100 text-amber-600"
                                      : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {status === "answered" ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : status === "requested" ? (
                                  <AlertCircle className="h-4 w-4" />
                                ) : (
                                  <Clock className="h-4 w-4" />
                                )}
                              </div>
                              {idx < TRACKING_INTERVALS.length - 1 && (
                                <div
                                  className={`h-2 w-0.5 ${
                                    status === "answered"
                                      ? "bg-green-300"
                                      : "bg-muted"
                                  }`}
                                />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex flex-1 items-center justify-between min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-sm font-medium ${
                                    status === "answered"
                                      ? "text-green-700"
                                      : status === "requested"
                                        ? "text-amber-700"
                                        : "text-muted-foreground"
                                  }`}
                                >
                                  {interval.label}
                                </span>
                                {status === "answered" && (
                                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                    {tracking!.anzahl_vertraege} Vertraege
                                  </span>
                                )}
                                {status === "requested" && (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                    Bitte melden
                                  </span>
                                )}
                                {status === "pending" && (
                                  <span className="text-xs text-muted-foreground">
                                    Ausstehend
                                  </span>
                                )}
                              </div>

                              {/* Inline form for requested but unanswered */}
                              {status === "requested" && tracking && (
                                <InlineTrackingForm
                                  trackingId={tracking.id}
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
