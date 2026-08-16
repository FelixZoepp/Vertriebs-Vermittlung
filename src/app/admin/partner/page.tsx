import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Partner } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<Partner["status"], string> = {
  interessent: "Interessent",
  aktiv: "Aktiv",
  pausiert: "Pausiert",
  gekuendigt: "Gekuendigt",
};

function PartnerStatusBadge({ status }: { status: Partner["status"] }) {
  switch (status) {
    case "aktiv":
      return (
        <Badge
          variant="outline"
          className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
        >
          {STATUS_LABELS[status]}
        </Badge>
      );
    case "pausiert":
      return (
        <Badge
          variant="outline"
          className="border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
        >
          {STATUS_LABELS[status]}
        </Badge>
      );
    case "gekuendigt":
      return <Badge variant="destructive">{STATUS_LABELS[status]}</Badge>;
    default:
      return <Badge variant="secondary">{STATUS_LABELS[status]}</Badge>;
  }
}

export default async function PartnerListPage() {
  const supabase = await createClient();

  const { data: partners, error } = await supabase
    .from("partners")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="text-destructive">Fehler beim Laden: {error.message}</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Partner</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {partners?.length ?? 0} Partner insgesamt
          </p>
        </div>
        <Link href="/admin/partner/neu">
          <Button>Neuer Partner</Button>
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">Firmenname</th>
              <th className="px-4 py-3 font-medium">Ansprechpartner</th>
              <th className="px-4 py-3 font-medium">Ort</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Offene Stellen</th>
            </tr>
          </thead>
          <tbody>
            {partners?.map((p: Partner) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/partner/${p.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {p.firmenname}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {p.ansprechpartner}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.ort ?? "—"}</td>
                <td className="px-4 py-3">
                  <PartnerStatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {p.offene_stellen}
                </td>
              </tr>
            ))}
            {(!partners || partners.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Noch keine Partner vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
