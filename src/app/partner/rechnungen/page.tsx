import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { formatCent } from "@/lib/rules/invoicing";
import type { Invoice } from "@/lib/types";

const TYP_LABELS: Record<string, string> = {
  einstellung: "Einstellung",
  meilenstein_100: "Meilenstein",
};

type InvoiceStatus = Invoice["status"];

function getStatusBadgeVariant(
  status: InvoiceStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "eingezogen":
    case "bezahlt":
      return "default";
    case "versendet":
      return "secondary";
    case "fehlgeschlagen":
      return "destructive";
    case "entwurf":
    case "storniert":
    default:
      return "outline";
  }
}

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  entwurf: "Entwurf",
  versendet: "Versendet",
  eingezogen: "Eingezogen",
  bezahlt: "Bezahlt",
  fehlgeschlagen: "Fehlgeschlagen",
  storniert: "Storniert",
};

export default async function PartnerRechnungenPage() {
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

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("partner_id", partner.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <p className="text-destructive">Fehler beim Laden: {error.message}</p>
    );
  }

  const typedInvoices = (invoices ?? []) as Invoice[];

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Rechnungen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Übersicht aller Rechnungen für dein Unternehmen.
        </p>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">Rechnungsnummer</th>
              <th className="px-4 py-3 font-medium">Typ</th>
              <th className="px-4 py-3 font-medium">Betrag</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Fällig am</th>
            </tr>
          </thead>
          <tbody>
            {typedInvoices.map((inv) => (
              <tr
                key={inv.id}
                className="border-b last:border-0 hover:bg-muted/30"
              >
                <td className="px-4 py-3 font-medium">
                  {inv.rechnungsnummer ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {TYP_LABELS[inv.typ] ?? inv.typ}
                </td>
                <td className="px-4 py-3">{formatCent(inv.brutto_cent)}</td>
                <td className="px-4 py-3">
                  <Badge variant={getStatusBadgeVariant(inv.status)}>
                    {STATUS_LABELS[inv.status] ?? inv.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {inv.faellig_am
                    ? new Date(inv.faellig_am).toLocaleDateString("de-DE")
                    : "—"}
                </td>
              </tr>
            ))}
            {typedInvoices.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Noch keine Rechnungen vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
