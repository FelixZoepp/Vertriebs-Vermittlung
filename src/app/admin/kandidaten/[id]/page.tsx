import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Candidate, ActivityLog } from "@/lib/types";
import { STAGE_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StageBadge } from "../_components/stage-badge";
import { StageChanger } from "./_components/stage-changer";

export default async function KandidatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: candidate, error } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !candidate) {
    notFound();
  }

  const c = candidate as Candidate;

  const { data: activityLogs } = await supabase
    .from("activity_log")
    .select("*")
    .eq("entity_typ", "candidate")
    .eq("entity_id", c.id)
    .order("created_at", { ascending: false });

  const logs = (activityLogs ?? []) as ActivityLog[];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/kandidaten"
            className="text-sm text-muted-foreground hover:underline"
          >
            &larr; Alle Kandidaten
          </Link>
          <h1 className="mt-2 text-2xl font-bold">
            {c.vorname} {c.nachname}
          </h1>
        </div>
        <StageBadge stage={c.stage} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kontaktdaten</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              <DetailRow label="E-Mail" value={c.email} />
              <DetailRow label="Telefon" value={c.telefon} />
              <DetailRow label="PLZ / Ort" value={`${c.plz ?? ""} ${c.ort ?? ""}`.trim()} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Qualifikation</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              <DetailRow
                label="Erfahrung"
                value={`${c.erfahrung_jahre} Jahre`}
              />
              <DetailRow
                label="Branchen"
                value={c.branchenerfahrung?.join(", ") || "Keine Angabe"}
              />
              <DetailRow
                label="Fuehrerschein"
                value={c.fuehrerschein ? "Ja" : "Nein"}
              />
              <DetailRow
                label="Umkreisbereitschaft"
                value={`${c.umkreis_bereitschaft_km} km`}
              />
              <DetailRow
                label="Verfuegbar ab"
                value={
                  c.verfuegbar_ab
                    ? new Date(c.verfuegbar_ab).toLocaleDateString("de-DE")
                    : "Sofort"
                }
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Herkunft</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              <DetailRow label="Quelle" value={c.quelle} />
              <DetailRow label="Quelle Detail" value={c.quelle_detail} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              <DetailRow
                label="Aktueller Stage"
                value={STAGE_LABELS[c.stage]}
              />
              <DetailRow
                label="Stage geaendert am"
                value={new Date(c.stage_changed_at).toLocaleDateString(
                  "de-DE",
                  { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }
                )}
              />
              {c.masterclass_freigeschaltet_am && (
                <DetailRow
                  label="Masterclass freigeschaltet"
                  value={new Date(
                    c.masterclass_freigeschaltet_am
                  ).toLocaleDateString("de-DE")}
                />
              )}
              {c.masterclass_abgeschlossen_am && (
                <DetailRow
                  label="Masterclass abgeschlossen"
                  value={new Date(
                    c.masterclass_abgeschlossen_am
                  ).toLocaleDateString("de-DE")}
                />
              )}
              {c.ablehnungsgrund && (
                <DetailRow label="Ablehnungsgrund" value={c.ablehnungsgrund} />
              )}
              <DetailRow
                label="Erstellt am"
                value={new Date(c.created_at).toLocaleDateString("de-DE")}
              />
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Stage aendern</CardTitle>
        </CardHeader>
        <CardContent>
          <StageChanger candidateId={c.id} currentStage={c.stage} />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Aktivitaeten</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Aktivitaeten vorhanden.
            </p>
          ) : (
            <ul className="space-y-3">
              {logs.map((log) => (
                <li key={log.id} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 size-2 shrink-0 rounded-full bg-muted-foreground" />
                  <div>
                    <p>
                      <span className="font-medium">{log.aktion}</span>
                      {log.payload?.from != null && log.payload?.to != null ? (
                        <span className="text-muted-foreground">
                          {" "}
                          &mdash; {STAGE_LABELS[log.payload.from as keyof typeof STAGE_LABELS] ?? String(log.payload.from)} &rarr;{" "}
                          {STAGE_LABELS[log.payload.to as keyof typeof STAGE_LABELS] ?? String(log.payload.to)}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
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
