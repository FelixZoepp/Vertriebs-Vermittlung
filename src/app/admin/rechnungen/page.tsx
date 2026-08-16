import { createClient } from "@/lib/supabase/server";
import { formatCent } from "@/lib/rules/invoicing";
import Link from "next/link";
import {
  SendInvoiceButton,
  RetryInvoiceButton,
  ConfirmReportButton,
} from "./_components";

const STATUS_COLORS: Record<string, string> = {
  entwurf: "bg-gray-100 text-gray-800",
  versendet: "bg-blue-100 text-blue-800",
  eingezogen: "bg-green-100 text-green-800",
  bezahlt: "bg-green-100 text-green-800",
  fehlgeschlagen: "bg-red-100 text-red-800",
  storniert: "bg-gray-100 text-gray-800",
};

export default async function RechnungenPage() {
  const supabase = await createClient();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, partners(firmenname), placements(candidates(vorname, nachname))")
    .order("created_at", { ascending: false });

  const { data: unconfirmedReports } = await supabase
    .from("contract_reports")
    .select(
      "*, placements(id, candidates(vorname, nachname), partners(firmenname))"
    )
    .is("bestaetigt_von_admin", null)
    .order("gemeldet_am", { ascending: false });

  const offeneSumme = (invoices || [])
    .filter((i: any) => ["entwurf", "versendet", "eingezogen"].includes(i.status))
    .reduce((sum: number, i: any) => sum + i.brutto_cent, 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rechnungen</h1>
          <p className="text-sm text-muted-foreground">
            Offener Betrag: {formatCent(offeneSumme)} brutto
          </p>
        </div>
      </div>

      {/* Unconfirmed Contract Reports */}
      {unconfirmedReports && unconfirmedReports.length > 0 && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-semibold text-amber-900">
            Offene Vertragsmeldungen ({unconfirmedReports.length})
          </h2>
          <p className="mt-1 text-xs text-amber-700">
            Diese Meldungen warten auf Admin-Bestätigung.
          </p>
          <div className="mt-3 space-y-2">
            {unconfirmedReports.map((r: any) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-md border border-amber-200 bg-white p-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {r.placements?.partners?.firmenname} &mdash;{" "}
                    {r.placements?.candidates?.vorname}{" "}
                    {r.placements?.candidates?.nachname}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.zeitraum_monat} &middot; +{r.anzahl_vertraege} Verträge
                    &middot; Gemeldet:{" "}
                    {new Date(r.gemeldet_am).toLocaleDateString("de-DE")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/vermittlungen/${r.placement_id}`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Details
                  </Link>
                  <ConfirmReportButton reportId={r.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-3 pr-4 font-medium">Nr.</th>
              <th className="pb-3 pr-4 font-medium">Partner</th>
              <th className="pb-3 pr-4 font-medium">Kandidat</th>
              <th className="pb-3 pr-4 font-medium">Typ</th>
              <th className="pb-3 pr-4 font-medium">Netto</th>
              <th className="pb-3 pr-4 font-medium">Brutto</th>
              <th className="pb-3 pr-4 font-medium">Status</th>
              <th className="pb-3 pr-4 font-medium">Fällig</th>
              <th className="pb-3 font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {(!invoices || invoices.length === 0) && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-muted-foreground">
                  Noch keine Rechnungen vorhanden.
                </td>
              </tr>
            )}
            {(invoices || []).map((inv: any) => (
              <tr key={inv.id} className="border-b last:border-0">
                <td className="py-3 pr-4 font-mono text-xs">
                  {inv.rechnungsnummer || `E-${inv.id}`}
                </td>
                <td className="py-3 pr-4">
                  <Link
                    href={`/admin/partner/${inv.partner_id}`}
                    className="hover:underline"
                  >
                    {inv.partners?.firmenname}
                  </Link>
                </td>
                <td className="py-3 pr-4">
                  {inv.placements?.candidates?.vorname}{" "}
                  {inv.placements?.candidates?.nachname}
                </td>
                <td className="py-3 pr-4">
                  {inv.typ === "einstellung" ? "Einstellung" : "100 Verträge"}
                </td>
                <td className="py-3 pr-4 font-mono">
                  {formatCent(inv.netto_cent)}
                </td>
                <td className="py-3 pr-4 font-mono">
                  {formatCent(inv.brutto_cent)}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[inv.status] || ""
                    }`}
                  >
                    {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                  </span>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {inv.faellig_am
                    ? new Date(inv.faellig_am).toLocaleDateString("de-DE")
                    : "---"}
                </td>
                <td className="py-3">
                  {inv.status === "entwurf" && (
                    <SendInvoiceButton invoiceId={inv.id} />
                  )}
                  {inv.status === "fehlgeschlagen" && (
                    <RetryInvoiceButton invoiceId={inv.id} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
