import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { Candidate, ActivityLog, Note } from "@/lib/types";
import { STAGE_LABELS, type Stage } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StageBadge } from "../_components/stage-badge";
import { StageChanger } from "./_components/stage-changer";
import { NoteForm } from "./_components/note-form";
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Clock,
  MapPin,
  Briefcase,
  Car,
  Target,
  GraduationCap,
  FileText,
  Activity,
  ArrowRightLeft,
  Webhook,
  StickyNote,
  User,
  Globe,
} from "lucide-react";

function getDaysInStage(stageChangedAt: string): number {
  const changed = new Date(stageChangedAt);
  const now = new Date();
  return Math.floor((now.getTime() - changed.getTime()) / (1000 * 60 * 60 * 24));
}

function getActionIcon(aktion: string) {
  switch (aktion) {
    case "stage_change":
      return <ArrowRightLeft className="size-4 text-blue-500" />;
    case "notiz_hinzugefuegt":
      return <StickyNote className="size-4 text-amber-500" />;
    case "webhook":
    case "webhook_received":
      return <Webhook className="size-4 text-purple-500" />;
    case "account_created":
      return <User className="size-4 text-green-500" />;
    case "masterclass_email_sent":
      return <Mail className="size-4 text-red-500" />;
    default:
      return <Activity className="size-4 text-muted-foreground" />;
  }
}

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
  const daysInStage = getDaysInStage(c.stage_changed_at);

  // Parallel queries for activity logs, notes, and author names
  const [{ data: activityLogs }, { data: notes }] = await Promise.all([
    supabase
      .from("activity_log")
      .select("*")
      .eq("entity_typ", "candidate")
      .eq("entity_id", c.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("notes")
      .select("*")
      .eq("entity_typ", "candidate")
      .eq("entity_id", c.id)
      .order("created_at", { ascending: false }),
  ]);

  const logs = (activityLogs ?? []) as ActivityLog[];
  const notesList = (notes ?? []) as Note[];

  // Collect unique author IDs from notes and logs to fetch names
  const authorIds = new Set<string>();
  notesList.forEach((n) => { if (n.autor_id) authorIds.add(n.autor_id); });
  logs.forEach((l) => { if (l.akteur_id) authorIds.add(l.akteur_id); });

  let authorNames: Record<string, string> = {};
  if (authorIds.size > 0) {
    const serviceClient = await createServiceClient();
    const { data: profiles } = await serviceClient
      .from("profiles")
      .select("id, name")
      .in("id", Array.from(authorIds));
    if (profiles) {
      authorNames = Object.fromEntries(
        profiles.map((p: { id: string; name: string | null }) => [p.id, p.name || "Unbekannt"])
      );
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/kandidaten"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Alle Kandidaten
      </Link>

      {/* Header Section */}
      <div className="rounded-xl border bg-card p-6 ring-1 ring-foreground/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {c.vorname} {c.nachname}
              </h1>
              <StageBadge stage={c.stage} />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {c.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  {c.email}
                </span>
              )}
              {c.telefon && (
                <a
                  href={`tel:${c.telefon}`}
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                >
                  <Phone className="size-3.5" />
                  {c.telefon}
                </a>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                Erstellt: {new Date(c.created_at).toLocaleDateString("de-DE")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {daysInStage} Tage in aktueller Phase
              </span>
              {c.quelle && (
                <Badge variant="outline" className="text-xs">
                  <Globe className="size-3 mr-1" />
                  {c.quelle}
                  {c.quelle_detail ? ` — ${c.quelle_detail}` : ""}
                </Badge>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {c.telefon && (
              <a
                href={`tel:${c.telefon}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-3 text-sm font-medium text-white transition-all hover:from-red-700 hover:to-red-800"
              >
                <Phone className="size-3.5" />
                Anrufen
              </a>
            )}
            {c.email && (
              <a
                href={`mailto:${c.email}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Mail className="size-3.5" />
                E-Mail
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Profil Section */}
      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <User className="size-5" />
          Profil
        </h2>
        <Separator />

        <div className="grid gap-4 md:grid-cols-2">
          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="size-4" />
                Persoenliche Daten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm">
                <DetailRow label="PLZ" value={c.plz} />
                <DetailRow label="Ort" value={c.ort} />
                <DetailRow
                  label="Verfuegbar ab"
                  value={
                    c.verfuegbar_ab
                      ? new Date(c.verfuegbar_ab).toLocaleDateString("de-DE")
                      : "Sofort"
                  }
                />
                <DetailRow
                  label="Fuehrerschein"
                  value={c.fuehrerschein ? "Ja" : "Nein"}
                  icon={<Car className="size-3.5 text-muted-foreground" />}
                />
                <DetailRow
                  label="Umkreis"
                  value={`${c.umkreis_bereitschaft_km} km`}
                  icon={<Target className="size-3.5 text-muted-foreground" />}
                />
              </dl>
            </CardContent>
          </Card>

          {/* Qualifikation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="size-4" />
                Qualifikation
              </CardTitle>
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
                <DetailRow label="Quelle" value={c.quelle} />
                <DetailRow label="Quelle Detail" value={c.quelle_detail} />
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Masterclass Status */}
        {(c.masterclass_freigeschaltet_am || c.masterclass_abgeschlossen_am) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="size-4" />
                Masterclass
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm md:grid-cols-2">
                {c.masterclass_freigeschaltet_am && (
                  <DetailRow
                    label="Freigeschaltet"
                    value={new Date(c.masterclass_freigeschaltet_am).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  />
                )}
                {c.masterclass_abgeschlossen_am && (
                  <DetailRow
                    label="Abgeschlossen"
                    value={new Date(c.masterclass_abgeschlossen_am).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  />
                )}
              </dl>
            </CardContent>
          </Card>
        )}

        {/* Rejection info if applicable */}
        {c.ablehnungsgrund && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Ablehnungsgrund</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{c.ablehnungsgrund}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stage Changer */}
      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ArrowRightLeft className="size-5" />
          Stage aendern
        </h2>
        <Separator />
        <Card>
          <CardContent className="pt-4">
            <StageChanger candidateId={c.id} currentStage={c.stage} />
          </CardContent>
        </Card>
      </div>

      {/* Notizen Section */}
      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <FileText className="size-5" />
          Notizen
          {notesList.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {notesList.length}
            </Badge>
          )}
        </h2>
        <Separator />

        {/* Add note form */}
        <Card>
          <CardHeader>
            <CardTitle>Notiz hinzufuegen</CardTitle>
          </CardHeader>
          <CardContent>
            <NoteForm entityTyp="candidate" entityId={c.id} />
          </CardContent>
        </Card>

        {/* Notes list */}
        {notesList.length > 0 && (
          <div className="space-y-3">
            {notesList.map((note) => (
              <Card key={note.id} size="sm">
                <CardContent className="pt-3">
                  <p className="text-sm whitespace-pre-wrap">{note.inhalt}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="size-3" />
                    <span>{note.autor_id ? (authorNames[note.autor_id] || "Unbekannt") : "System"}</span>
                    <span>&middot;</span>
                    <span>
                      {new Date(note.created_at).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {notesList.length === 0 && (
          <p className="text-sm text-muted-foreground">Noch keine Notizen vorhanden.</p>
        )}
      </div>

      {/* Aktivitaeten Section */}
      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Activity className="size-5" />
          Aktivitaeten
          {logs.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {logs.length}
            </Badge>
          )}
        </h2>
        <Separator />

        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Noch keine Aktivitaeten vorhanden.
          </p>
        ) : (
          <div className="relative space-y-0">
            {/* Timeline line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

            {logs.map((log, index) => (
              <div key={log.id} className="relative flex gap-4 py-3">
                {/* Icon circle */}
                <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-card">
                  {getActionIcon(log.aktion)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {formatActionLabel(log.aktion)}
                      </p>
                      {log.payload?.from != null && log.payload?.to != null && (
                        <div className="mt-1 flex items-center gap-2">
                          <StageBadge stage={log.payload.from as Stage} />
                          <ArrowRightLeft className="size-3 text-muted-foreground" />
                          <StageBadge stage={log.payload.to as Stage} />
                        </div>
                      )}
                      {log.payload?.ablehnungsgrund != null && (
                        <p className="mt-1 text-xs text-destructive">
                          Grund: {String(log.payload.ablehnungsgrund)}
                        </p>
                      )}
                      {log.aktion === "notiz_hinzugefuegt" && log.payload?.inhalt != null && (
                        <p className="mt-1 text-xs text-muted-foreground italic">
                          &ldquo;{String(log.payload.inhalt)}&rdquo;
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {log.akteur_id && authorNames[log.akteur_id] && (
                        <p className="text-xs text-muted-foreground">
                          {authorNames[log.akteur_id]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatActionLabel(aktion: string): string {
  switch (aktion) {
    case "stage_change":
      return "Stage geaendert";
    case "notiz_hinzugefuegt":
      return "Notiz hinzugefuegt";
    case "webhook":
    case "webhook_received":
      return "Webhook empfangen";
    case "account_created":
      return "Account erstellt";
    case "masterclass_email_sent":
      return "Masterclass-E-Mail gesendet";
    case "candidate_created":
      return "Kandidat erstellt";
    default:
      return aktion.replace(/_/g, " ");
  }
}

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="text-right font-medium">{value || "\u2014"}</dd>
    </div>
  );
}
