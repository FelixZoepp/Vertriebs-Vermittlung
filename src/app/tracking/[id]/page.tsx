import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TRACKING_INTERVALS } from "@/lib/placement-stages";
import { TrackingForm } from "./_components/tracking-form";

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trackingId = parseInt(id, 10);

  if (isNaN(trackingId)) {
    notFound();
  }

  const supabase = await createServiceClient();

  // Fetch tracking row with placement + candidate + partner
  const { data: tracking, error } = await supabase
    .from("contract_tracking")
    .select("*, placement:placements(*, candidate:candidates(*), partner:partners(*))")
    .eq("id", trackingId)
    .single();

  if (error || !tracking) {
    notFound();
  }

  const placement = tracking.placement;
  const candidate = placement?.candidate;
  const kandidatName = candidate
    ? `${candidate.vorname} ${candidate.nachname}`
    : `Kandidat #${placement?.candidate_id}`;

  const intervalConfig = TRACKING_INTERVALS.find(
    (i) => i.key === tracking.intervall
  );
  const intervallLabel = intervalConfig?.label ?? tracking.intervall;

  // Already answered
  if (tracking.beantwortet_am) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-7 w-7 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Danke, bereits gemeldet!</h1>
          <p className="mt-2 text-muted-foreground">
            Du hast fuer <strong>{kandidatName}</strong> im Zeitraum{" "}
            <strong>{intervallLabel}</strong> bereits{" "}
            <strong>{tracking.anzahl_vertraege}</strong>{" "}
            {tracking.anzahl_vertraege === 1 ? "Vertrag" : "Vertraege"}{" "}
            gemeldet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vertragszahlen melden</h1>
        <p className="mt-1 text-muted-foreground">
          Bitte melde die Anzahl der Vertraege fuer den folgenden Zeitraum.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Kandidat</span>
            <span className="font-medium">{kandidatName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Zeitraum</span>
            <span className="font-medium">{intervallLabel}</span>
          </div>
          {placement?.eingestellt_am && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Eingestellt am</span>
              <span className="font-medium">
                {new Date(placement.eingestellt_am).toLocaleDateString("de-DE")}
              </span>
            </div>
          )}
        </div>
      </div>

      <TrackingForm trackingId={trackingId} kandidatName={kandidatName} />
    </div>
  );
}
