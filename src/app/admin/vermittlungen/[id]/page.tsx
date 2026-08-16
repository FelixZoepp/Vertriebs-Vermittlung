import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCent, MEILENSTEIN_VERTRAEGE } from "@/lib/rules/invoicing";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CreateInvoiceButton, ConfirmReportButton } from "./_components";

export default async function VermittlungDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: placement } = await supabase
    .from("placements")
    .select(
      "*, candidates(vorname, nachname, email, telefon, plz, ort), partners(firmenname, ansprechpartner, email, ort)"
    )
    .eq("id", id)
    .single();

  if (!placement) notFound();

  const { data: reports } = await supabase
    .from("contract_reports")
    .select("*")
    .eq("placement_id", id)
    .order("gemeldet_am", { ascending: false });

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("placement_id", id)
    .order("created_at", { ascending: false });

  const hasEinstellungsInvoice = (invoices || []).some(
    (inv: any) => inv.typ === "einstellung"
  );
  const hasMeilensteinInvoice = (invoices || []).some(
    (inv: any) => inv.typ === "meilenstein_100"
  );

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/vermittlungen">
          <Button variant="ghost" size="sm">
            &larr; Zurück
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Vermittlung #{placement.id}</h1>
        <StatusBadge status={placement.status} />
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Kandidat</h2>
          <p className="mt-2">
            {placement.candidates?.vorname} {placement.candidates?.nachname}
          </p>
          <p className="text-sm text-muted-foreground">
            {placement.candidates?.email}
          </p>
          <p className="text-sm text-muted-foreground">
            {placement.candidates?.plz} {placement.candidates?.ort}
          </p>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Partner</h2>
          <p className="mt-2">{placement.partners?.firmenname}</p>
          <p className="text-sm text-muted-foreground">
            {placement.partners?.ansprechpartner}
          </p>
          <p className="text-sm text-muted-foreground">
            {placement.partners?.ort}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Match-Score</p>
            <p className="text-2xl font-bold">
              {placement.match_score ?? "---"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Verträge</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">
                {placement.vertraege_gesamt}/100
              </p>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-green-500"
                style={{
                  width: `${Math.min(100, placement.vertraege_gesamt)}%`,
                }}
              />
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Meilenstein-Frist</p>
            <p className="text-lg font-medium">
              {placement.meilenstein_frist
                ? new Date(placement.meilenstein_frist).toLocaleDateString("de-DE")
                : "---"}
            </p>
          </div>
        </div>
      </div>

      {/* Invoice generation buttons */}
      {(placement.status === "eingestellt" && !hasEinstellungsInvoice) ||
      (placement.vertraege_gesamt >= MEILENSTEIN_VERTRAEGE &&
        !hasMeilensteinInvoice) ? (
        <div className="mt-4 flex gap-3">
          {placement.status === "eingestellt" && !hasEinstellungsInvoice && (
            <CreateInvoiceButton
              placementId={placement.id}
              typ="einstellung"
              label="Rechnung erstellen"
            />
          )}
          {placement.vertraege_gesamt >= MEILENSTEIN_VERTRAEGE &&
            !hasMeilensteinInvoice && (
              <CreateInvoiceButton
                placementId={placement.id}
                typ="meilenstein_100"
                label="Meilenstein-Rechnung erstellen"
              />
            )}
        </div>
      ) : null}

      {/* Contract Reports */}
      <Separator className="my-6" />
      <h2 className="text-lg font-semibold">Vertragsmeldungen</h2>
      {!reports || reports.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Noch keine Meldungen.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {reports.map((r: any) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="text-sm font-medium">{r.zeitraum_monat}</p>
                <p className="text-xs text-muted-foreground">
                  Gemeldet: {new Date(r.gemeldet_am).toLocaleDateString("de-DE")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium">
                  +{r.anzahl_vertraege}
                </span>
                {r.bestaetigt_von_admin ? (
                  <Badge className="bg-green-100 text-green-800">Bestätigt</Badge>
                ) : (
                  <>
                    <Badge variant="outline">Offen</Badge>
                    <ConfirmReportButton reportId={r.id} />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoices */}
      <Separator className="my-6" />
      <h2 className="text-lg font-semibold">Rechnungen</h2>
      {!invoices || invoices.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Noch keine Rechnungen.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {invoices.map((inv: any) => (
            <div
              key={inv.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="text-sm font-medium">
                  {inv.rechnungsnummer || `Entwurf #${inv.id}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {inv.typ === "einstellung" ? "Einstellung" : "100 Verträge"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">
                  {formatCent(inv.netto_cent)} netto
                </span>
                <InvoiceStatusBadge status={inv.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    vorgeschlagen: "bg-blue-100 text-blue-800",
    interview: "bg-amber-100 text-amber-800",
    eingestellt: "bg-green-100 text-green-800",
    abgelehnt: "bg-red-100 text-red-800",
    abgebrochen: "bg-gray-100 text-gray-800",
  };
  const labels: Record<string, string> = {
    vorgeschlagen: "Vorgeschlagen",
    interview: "Interview",
    eingestellt: "Eingestellt",
    abgelehnt: "Abgelehnt",
    abgebrochen: "Abgebrochen",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || ""}`}
    >
      {labels[status] || status}
    </span>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    entwurf: "bg-gray-100 text-gray-800",
    versendet: "bg-blue-100 text-blue-800",
    eingezogen: "bg-green-100 text-green-800",
    bezahlt: "bg-green-100 text-green-800",
    fehlgeschlagen: "bg-red-100 text-red-800",
    storniert: "bg-gray-100 text-gray-800",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || ""}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
