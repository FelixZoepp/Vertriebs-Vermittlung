import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Placement } from "@/lib/types";
import { ReportForm } from "./_components/report-form";
import { FileText } from "lucide-react";

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
        Kein Partner-Konto mit diesem Benutzer verknüpft.
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20">
          <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Vertrags-Reporting</h1>
          <p className="text-sm text-muted-foreground">
            Melde abgeschlossene Verträge deiner eingestellten Vertriebler.
          </p>
        </div>
      </div>

      {/* Placement progress cards */}
      {typedPlacements.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 text-muted-foreground">
            Noch keine eingestellten Vermittlungen vorhanden.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {typedPlacements.map((p) => {
            const progress = Math.min(p.vertraege_gesamt, 100);
            const approaching = progress >= 80;

            return (
              <Card key={p.id} className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>
                      {p.candidate
                        ? `${p.candidate.vorname} ${p.candidate.nachname}`
                        : `Vermittlung #${p.id}`}
                    </span>
                    {approaching && (
                      <span
                        className="inline-block size-3 rounded-full bg-green-500 shadow-sm shadow-green-500/30"
                        title="Fast am Meilenstein!"
                      />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {p.eingestellt_am && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        Eingestellt am:{" "}
                      </span>
                      {new Date(p.eingestellt_am).toLocaleDateString("de-DE")}
                    </div>
                  )}

                  <div>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="text-muted-foreground">Verträge</span>
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Report form */}
      <ReportForm placements={typedPlacements} />
    </div>
  );
}
