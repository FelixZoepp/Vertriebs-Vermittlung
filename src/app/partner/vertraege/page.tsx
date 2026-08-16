import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Placement } from "@/lib/types";
import { ReportForm } from "./_components/report-form";

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
      <div>
        <h1 className="text-2xl font-bold">Vertrags-Reporting</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Melde abgeschlossene Verträge deiner eingestellten Vertriebler.
        </p>
      </div>

      {/* Placement progress cards */}
      {typedPlacements.length === 0 ? (
        <p className="text-center text-muted-foreground">
          Noch keine eingestellten Vermittlungen vorhanden.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {typedPlacements.map((p) => {
            const progress = Math.min(p.vertraege_gesamt, 100);
            const approaching = progress >= 80;

            return (
              <Card key={p.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>
                      {p.candidate
                        ? `${p.candidate.vorname} ${p.candidate.nachname}`
                        : `Vermittlung #${p.id}`}
                    </span>
                    {approaching && (
                      <span className="inline-block size-3 rounded-full bg-green-500" title="Fast am Meilenstein!" />
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
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Verträge
                      </span>
                      <span className="font-medium">
                        {p.vertraege_gesamt} / 100
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${
                          approaching
                            ? "bg-green-500"
                            : "bg-primary"
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
