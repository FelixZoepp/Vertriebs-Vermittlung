import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatCent } from "@/lib/rules/invoicing";
import Link from "next/link";

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
      .in("status", ["vorgeschlagen", "interview"]),
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

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-muted-foreground">
        Willkommen, {user.name || user.email}
      </p>

      {/* KPI Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Neue Leads (7 Tage)" value={String(newLeadsWeek || 0)} />
        <KPICard label="Offene Vermittlungen" value={String(activePlacements || 0)} />
        <KPICard label="Eingestellt (Monat)" value={String(eingestelltMonth || 0)} />
        <KPICard
          label="Offene Rechnungen"
          value={formatCent(offeneRechnungenSumme)}
          sub={`${(openInvoices || []).length} Rechnungen`}
        />
      </div>

      {/* Secondary row */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard label="Kandidaten gesamt" value={String(totalCandidates || 0)} />
        <KPICard label="Partner gesamt" value={String(totalPartners || 0)} />
        <KPICard
          label="Unbearbeitete Leads"
          value={String(stageDistribution["eingang"] || 0)}
          alert={(stageDistribution["eingang"] || 0) > 10}
        />
      </div>

      {/* Near milestone */}
      {nearMilestone && nearMilestone.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Kurz vor 100 Verträgen</h2>
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
        <QuickLink href="/admin/kandidaten/board" label="Kanban-Board" />
        <QuickLink href="/admin/kandidaten" label="Alle Kandidaten" />
        <QuickLink href="/admin/partner" label="Alle Partner" />
      </div>
    </div>
  );
}

function KPICard({
  label,
  value,
  sub,
  alert,
}: {
  label: string;
  value: string;
  sub?: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border bg-card p-5 ${
        alert ? "border-destructive" : ""
      }`}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border bg-card p-4 text-center font-medium transition-colors hover:bg-accent"
    >
      {label}
    </Link>
  );
}
