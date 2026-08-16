import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Partner, Placement, Candidate } from "@/lib/types";
import { STAGE_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STATUS_LABELS: Record<Partner["status"], string> = {
  interessent: "Interessent",
  aktiv: "Aktiv",
  pausiert: "Pausiert",
  gekuendigt: "Gekuendigt",
};

const PLACEMENT_STATUS_LABELS: Record<Placement["status"], string> = {
  vorgeschlagen: "Vorgeschlagen",
  erstgespraech: "Erstgespräch",
  vorstellungsgespraech: "Vorstellungsgespräch",
  probetag: "Probetag",
  eingestellt: "Eingestellt",
  abgelehnt: "Abgelehnt",
  abgebrochen: "Abgebrochen",
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

function PlacementStatusBadge({ status }: { status: Placement["status"] }) {
  switch (status) {
    case "eingestellt":
      return (
        <Badge
          variant="outline"
          className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
        >
          {PLACEMENT_STATUS_LABELS[status]}
        </Badge>
      );
    case "erstgespraech":
      return (
        <Badge
          variant="outline"
          className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
        >
          {PLACEMENT_STATUS_LABELS[status]}
        </Badge>
      );
    case "vorstellungsgespraech":
      return (
        <Badge
          variant="outline"
          className="border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
        >
          {PLACEMENT_STATUS_LABELS[status]}
        </Badge>
      );
    case "probetag":
      return (
        <Badge
          variant="outline"
          className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
        >
          {PLACEMENT_STATUS_LABELS[status]}
        </Badge>
      );
    case "abgelehnt":
    case "abgebrochen":
      return (
        <Badge variant="destructive">
          {PLACEMENT_STATUS_LABELS[status]}
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">{PLACEMENT_STATUS_LABELS[status]}</Badge>
      );
  }
}

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: partner, error } = await supabase
    .from("partners")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !partner) {
    notFound();
  }

  const p = partner as Partner;

  // Fetch placements with candidate data
  const { data: placements } = await supabase
    .from("placements")
    .select("*, candidate:candidates(*)")
    .eq("partner_id", p.id)
    .order("created_at", { ascending: false });

  const placementList = (placements ?? []) as (Placement & {
    candidate: Candidate;
  })[];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/partner"
            className="text-sm text-muted-foreground hover:underline"
          >
            &larr; Alle Partner
          </Link>
          <h1 className="mt-2 text-2xl font-bold">{p.firmenname}</h1>
        </div>
        <PartnerStatusBadge status={p.status} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kontakt</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              <DetailRow label="Ansprechpartner" value={p.ansprechpartner} />
              <DetailRow label="E-Mail" value={p.email} />
              <DetailRow label="Telefon" value={p.telefon} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Adresse</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              <DetailRow label="Strasse" value={p.strasse} />
              <DetailRow
                label="PLZ / Ort"
                value={`${p.plz ?? ""} ${p.ort ?? ""}`.trim()}
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stellenprofil</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              <DetailRow label="Branche" value={p.branche} />
              <DetailRow
                label="Gesuchte Profile"
                value={p.gesuchte_profile?.join(", ") || "Keine Angabe"}
              />
              <DetailRow
                label="Offene Stellen"
                value={String(p.offene_stellen)}
              />
              <DetailRow
                label="Suchradius"
                value={`${p.suchradius_km} km`}
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vertrag & Abrechnung</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              <DetailRow
                label="Status"
                value={STATUS_LABELS[p.status]}
              />
              <DetailRow
                label="Vertrag unterschrieben"
                value={
                  p.vertrag_unterschrieben_am
                    ? new Date(p.vertrag_unterschrieben_am).toLocaleDateString(
                        "de-DE"
                      )
                    : null
                }
              />
              <DetailRow
                label="SEPA-Mandat"
                value={p.sepa_mandat_ref}
              />
              <DetailRow
                label="Erstellt am"
                value={new Date(p.created_at).toLocaleDateString("de-DE")}
              />
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>
            Vermittlungen ({placementList.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {placementList.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Vermittlungen vorhanden.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium">Kandidat</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium">Match-Score</th>
                    <th className="pb-2 pr-4 font-medium">Vorgeschlagen am</th>
                    <th className="pb-2 font-medium">Eingestellt am</th>
                  </tr>
                </thead>
                <tbody>
                  {placementList.map((pl) => (
                    <tr key={pl.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        {pl.candidate ? (
                          <Link
                            href={`/admin/kandidaten/${pl.candidate_id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {pl.candidate.vorname} {pl.candidate.nachname}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">
                            Kandidat #{pl.candidate_id}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        <PlacementStatusBadge status={pl.status} />
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {pl.match_score != null
                          ? `${Math.round(pl.match_score * 100)}%`
                          : "—"}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {new Date(pl.vorgeschlagen_am).toLocaleDateString(
                          "de-DE"
                        )}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {pl.eingestellt_am
                          ? new Date(pl.eingestellt_am).toLocaleDateString(
                              "de-DE"
                            )
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value || "—"}</dd>
    </div>
  );
}
