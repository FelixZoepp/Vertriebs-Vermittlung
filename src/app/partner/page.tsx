import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Users,
  Handshake,
  FileText,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

export default async function PartnerDashboard() {
  const user = await getAuthUser();
  const supabase = await createClient();

  // Get the partner record
  const { data: partner } = await supabase
    .from("partners")
    .select("id, firmenname")
    .eq("user_id", user.id)
    .single();

  let totalKandidaten = 0;
  let eingestellt = 0;
  let vertraege = 0;
  let offeneRechnungen = 0;

  if (partner) {
    // Count all placements
    const { count: placementCount } = await supabase
      .from("placements")
      .select("*", { count: "exact", head: true })
      .eq("partner_id", partner.id);

    totalKandidaten = placementCount ?? 0;

    // Count hired placements
    const { count: hiredCount } = await supabase
      .from("placements")
      .select("*", { count: "exact", head: true })
      .eq("partner_id", partner.id)
      .eq("status", "eingestellt");

    eingestellt = hiredCount ?? 0;

    // Sum total contracts across all placements
    const { data: contractData } = await supabase
      .from("placements")
      .select("vertraege_gesamt")
      .eq("partner_id", partner.id)
      .eq("status", "eingestellt");

    vertraege = (contractData ?? []).reduce(
      (sum, p) => sum + (p.vertraege_gesamt ?? 0),
      0
    );

    // Count open invoices
    const { count: invoiceCount } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("partner_id", partner.id)
      .in("status", ["entwurf", "versendet"]);

    offeneRechnungen = invoiceCount ?? 0;
  }

  const kpis = [
    {
      label: "Kandidaten",
      value: totalKandidaten,
      icon: Users,
      accent: true,
    },
    {
      label: "Eingestellt",
      value: eingestellt,
      icon: Handshake,
      accent: true,
    },
    {
      label: "Gemeldete Verträge",
      value: vertraege,
      icon: TrendingUp,
      accent: false,
    },
    {
      label: "Offene Rechnungen",
      value: offeneRechnungen,
      icon: FileText,
      accent: false,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">Partner-Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Willkommen zurück,{" "}
          <span className="font-medium text-foreground">
            {user.name || user.email}
          </span>
          {partner?.firmenname && (
            <span className="text-muted-foreground">
              {" "}
              — {partner.firmenname}
            </span>
          )}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className={`rounded-lg border bg-card p-6 shadow-sm ${
                kpi.accent ? "border-l-4 border-l-red-500" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <Icon className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="mt-2 text-3xl font-bold">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Schnellzugriff</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/partner/kandidaten"
            className="group flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:border-red-500/30 hover:bg-red-50/50 dark:hover:bg-red-950/10"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20">
                <Users className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-medium">Kandidaten ansehen</p>
                <p className="text-sm text-muted-foreground">
                  Vorgeschlagene Profile einsehen
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/partner/vertraege"
            className="group flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:border-red-500/30 hover:bg-red-50/50 dark:hover:bg-red-950/10"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20">
                <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-medium">Verträge melden</p>
                <p className="text-sm text-muted-foreground">
                  Abschlüsse deiner Vertriebler melden
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
