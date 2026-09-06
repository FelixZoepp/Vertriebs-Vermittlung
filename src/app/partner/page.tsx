import { getAuthUser } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { calculateMatchScore } from "@/lib/rules/matching";
import type { Candidate, Partner } from "@/lib/types";
import Link from "next/link";
import {
  Users,
  Handshake,
  FileText,
  TrendingUp,
  ArrowRight,
  Target,
  Sparkles,
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
  let empfehlungen = 0;

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

    // Passende Kandidaten im Pool zählen (Service-Client wegen RLS,
    // es werden nur aggregierte Zahlen gerendert)
    const serviceClient = await createServiceClient();
    const { data: fullPartner } = await serviceClient
      .from("partners")
      .select("*")
      .eq("id", partner.id)
      .single<Partner>();

    if (fullPartner) {
      const [{ data: poolCandidates }, { data: partnerPlacements }] =
        await Promise.all([
          serviceClient
            .from("candidates")
            .select("*")
            .eq("stage", "vermittelbar")
            .returns<Candidate[]>(),
          serviceClient
            .from("placements")
            .select("candidate_id, status")
            .eq("partner_id", partner.id),
        ]);

      const angefragteIds = new Set(
        (partnerPlacements || [])
          .filter((p) => p.status !== "abgelehnt" && p.status !== "abgebrochen")
          .map((p) => p.candidate_id)
      );
      const aktivePlacements = (partnerPlacements || []).filter((p) =>
        ["leadeingang", "vorstellungsgespraech", "probetag"].includes(p.status)
      ).length;

      empfehlungen = (poolCandidates || []).filter(
        (c) =>
          !angefragteIds.has(c.id) &&
          calculateMatchScore(c, {
            ...fullPartner,
            aktuelle_placements: aktivePlacements,
          }) !== null
      ).length;
    }
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

      {/* Empfehlungen aus dem Kandidaten-Pool */}
      {empfehlungen > 0 && (
        <Link
          href="/partner/pool"
          className="group flex items-center justify-between rounded-xl border border-red-500/30 bg-gradient-to-r from-red-50 to-transparent p-5 transition-colors hover:border-red-500/50 dark:from-red-950/20"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold">
                {empfehlungen}{" "}
                {empfehlungen === 1
                  ? "neuer Kandidat passt"
                  : "neue Kandidaten passen"}{" "}
                zu deinem Suchprofil
              </p>
              <p className="text-sm text-muted-foreground">
                Vorqualifiziert und in deinem Suchradius — jetzt im Pool ansehen
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-red-500 transition-transform group-hover:translate-x-1" />
        </Link>
      )}

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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/partner/pool"
            className="group flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:border-red-500/30 hover:bg-red-50/50 dark:hover:bg-red-950/10"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20">
                <Target className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-medium">Kandidaten-Pool</p>
                <p className="text-sm text-muted-foreground">
                  Vorqualifizierte Vertriebler anfragen
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>

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
