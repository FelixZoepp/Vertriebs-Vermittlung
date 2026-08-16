import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCent } from "@/lib/rules/invoicing";
import { STAGE_LABELS, type Stage, type ActivityLog, type Candidate } from "@/lib/types";
import { StageBadge } from "./kandidaten/_components/stage-badge";
import Link from "next/link";
import {
  Users,
  Handshake,
  Receipt,
  TrendingUp,
  AlertTriangle,
  Clock,
  Activity,
  UserPlus,
  ArrowRightLeft,
  Webhook,
  StickyNote,
  Mail,
  User,
  Globe,
  MapPin,
} from "lucide-react";

export default async function AdminDashboard() {
  const user = await getAuthUser();
  const supabase = await createClient();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Parallel queries
  const [
    { count: totalCandidates },
    { count: newLeadsWeek },
    { data: stageCounts },
    { count: activePlacements },
    { count: eingestelltMonth },
    { data: openInvoices },
    { count: totalPartners },
    { data: nearMilestone },
    { data: recentActivities },
    { data: newLeadsData },
  ] = await Promise.all([
    supabase.from("candidates").select("*", { count: "exact", head: true }),
    supabase
      .from("candidates")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString()),
    supabase.from("candidates").select("stage"),
    supabase
      .from("placements")
      .select("*", { count: "exact", head: true })
      .in("status", ["leadeingang", "vorstellungsgespraech", "probetag"]),
    supabase
      .from("placements")
      .select("*", { count: "exact", head: true })
      .eq("status", "eingestellt")
      .gte("eingestellt_am", new Date(now.getFullYear(), now.getMonth(), 1).toISOString()),
    supabase
      .from("invoices")
      .select("netto_cent, status")
      .in("status", ["entwurf", "versendet", "eingezogen"]),
    supabase.from("partners").select("*", { count: "exact", head: true }),
    supabase
      .from("placements")
      .select("id, vertraege_gesamt, candidate_id, candidates(vorname, nachname), partners(firmenname)")
      .eq("status", "eingestellt")
      .gte("vertraege_gesamt", 80)
      .is("meilenstein_100_erreicht_am", null),
    supabase
      .from("activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("candidates")
      .select("id, vorname, nachname, plz, ort, quelle, created_at")
      .gte("created_at", weekAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const offeneRechnungenSumme = (openInvoices || []).reduce(
    (sum, inv) => sum + inv.netto_cent,
    0
  );

  // Stage distribution for funnel
  const stageDistribution = (stageCounts || []).reduce(
    (acc, { stage }) => {
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const activities = (recentActivities ?? []) as ActivityLog[];
  const newLeads = (newLeadsData ?? []) as Array<Pick<Candidate, "id" | "vorname" | "nachname" | "plz" | "ort" | "quelle" | "created_at">>;

  // Fetch author names for activities
  const authorIds = new Set<string>();
  activities.forEach((a) => { if (a.akteur_id) authorIds.add(a.akteur_id); });

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
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-muted-foreground">
        Willkommen, {user.name || user.email}
      </p>

      {/* KPI Cards - Primary */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Neue Leads (7 Tage)"
          value={String(newLeadsWeek || 0)}
          icon={<UserPlus className="size-5 text-red-500" />}
        />
        <KPICard
          label="Offene Vermittlungen"
          value={String(activePlacements || 0)}
          icon={<Handshake className="size-5 text-blue-500" />}
        />
        <KPICard
          label="Eingestellt (Monat)"
          value={String(eingestelltMonth || 0)}
          icon={<TrendingUp className="size-5 text-green-500" />}
        />
        <KPICard
          label="Offene Rechnungen"
          value={formatCent(offeneRechnungenSumme)}
          sub={`${(openInvoices || []).length} Rechnungen`}
          icon={<Receipt className="size-5 text-amber-500" />}
        />
      </div>

      {/* KPI Cards - Secondary */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          label="Kandidaten gesamt"
          value={String(totalCandidates || 0)}
          icon={<Users className="size-5 text-muted-foreground" />}
        />
        <KPICard
          label="Partner gesamt"
          value={String(totalPartners || 0)}
          icon={<Handshake className="size-5 text-muted-foreground" />}
        />
        <KPICard
          label="Unbearbeitete Leads"
          value={String(stageDistribution["eingang"] || 0)}
          alert={(stageDistribution["eingang"] || 0) > 10}
          icon={<AlertTriangle className="size-5 text-destructive" />}
        />
      </div>

      {/* Two-column section: New Leads + Recent Activities */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* New Leads this Week */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="size-4" />
              Neue Leads diese Woche
            </CardTitle>
          </CardHeader>
          <CardContent>
            {newLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine neuen Leads diese Woche.</p>
            ) : (
              <ul className="space-y-3">
                {newLeads.map((lead) => (
                  <li key={lead.id}>
                    <Link
                      href={`/admin/kandidaten/${lead.id}`}
                      className="flex items-center justify-between gap-2 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {lead.vorname} {lead.nachname}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          {(lead.plz || lead.ort) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3" />
                              {lead.plz} {lead.ort}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-[10px]">
                          {lead.quelle}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(lead.created_at).toLocaleDateString("de-DE")}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4" />
              Letzte Aktivitaeten
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine Aktivitaeten vorhanden.</p>
            ) : (
              <ul className="space-y-3">
                {activities.map((log) => (
                  <li key={log.id} className="flex items-start gap-3 text-sm">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-card mt-0.5">
                      {getActivityIcon(log.aktion)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {formatActionLabel(log.aktion)}
                      </p>
                      {log.payload?.from != null && log.payload?.to != null && (
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs">
                          <StageBadge stage={log.payload.from as Stage} />
                          <ArrowRightLeft className="size-3 text-muted-foreground" />
                          <StageBadge stage={log.payload.to as Stage} />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <span>
                          {new Date(log.created_at).toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {log.akteur_id && authorNames[log.akteur_id] && (
                          <>
                            <span>&middot;</span>
                            <span>{authorNames[log.akteur_id]}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Near milestone */}
      {nearMilestone && nearMilestone.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="size-5" />
            Kurz vor 100 Vertraegen
          </h2>
          <div className="mt-3 space-y-2">
            {nearMilestone.map((p: any) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border bg-card p-4"
              >
                <div>
                  <p className="font-medium">
                    {p.candidates?.vorname} {p.candidates?.nachname}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    bei {p.partners?.firmenname}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32">
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-green-500"
                        style={{ width: `${Math.min(100, p.vertraege_gesamt)}%` }}
                      />
                    </div>
                  </div>
                  <Badge variant="outline">{p.vertraege_gesamt}/100</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <QuickLink href="/admin/kandidaten/board" label="Kanban-Board" icon={<Clock className="size-5 mb-1" />} />
        <QuickLink href="/admin/kandidaten" label="Alle Kandidaten" icon={<Users className="size-5 mb-1" />} />
        <QuickLink href="/admin/partner" label="Alle Partner" icon={<Handshake className="size-5 mb-1" />} />
      </div>
    </div>
  );
}

function getActivityIcon(aktion: string) {
  switch (aktion) {
    case "stage_change":
      return <ArrowRightLeft className="size-3.5 text-blue-500" />;
    case "notiz_hinzugefuegt":
      return <StickyNote className="size-3.5 text-amber-500" />;
    case "webhook":
    case "webhook_received":
      return <Webhook className="size-3.5 text-purple-500" />;
    case "account_created":
      return <User className="size-3.5 text-green-500" />;
    case "masterclass_email_sent":
      return <Mail className="size-3.5 text-red-500" />;
    case "candidate_created":
      return <UserPlus className="size-3.5 text-green-500" />;
    default:
      return <Activity className="size-3.5 text-muted-foreground" />;
  }
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

function KPICard({
  label,
  value,
  sub,
  alert,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  alert?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-5 ring-1 ring-foreground/10 ${
        alert ? "border-destructive ring-destructive/30" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon}
      </div>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function QuickLink({ href, label, icon }: { href: string; label: string; icon?: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center rounded-xl border bg-card p-5 text-center font-medium ring-1 ring-foreground/10 transition-colors hover:bg-muted"
    >
      {icon}
      {label}
    </Link>
  );
}
