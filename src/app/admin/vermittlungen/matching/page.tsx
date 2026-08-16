import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, ArrowLeft, Users, AlertTriangle } from "lucide-react";
import { CandidateMatchCard } from "./_components/candidate-match-card";
import { STAGE_LABELS } from "@/lib/types";

export default async function MatchingPage() {
  const supabase = await createClient();

  // Candidates ready for matching: masterclass_abgeschlossen OR manually matchable stages
  const { data: readyCandidates } = await supabase
    .from("candidates")
    .select(
      "id, vorname, nachname, email, telefon, plz, ort, erfahrung_jahre, branchenerfahrung, fuehrerschein, verfuegbar_ab, umkreis_bereitschaft_km, lat, lng, stage, stage_changed_at, quelle"
    )
    .in("stage", ["masterclass_abgeschlossen", "qualifiziert", "erstgespraech"])
    .order("stage_changed_at", { ascending: true });

  // Already matched candidates (vorgestellt, interview) for overview
  const { data: matchedCandidates } = await supabase
    .from("candidates")
    .select(
      "id, vorname, nachname, plz, ort, stage"
    )
    .in("stage", ["vorgestellt", "interview"])
    .order("stage_changed_at", { ascending: false })
    .limit(10);

  // Active partner count for info
  const { count: activePartners } = await supabase
    .from("partners")
    .select("*", { count: "exact", head: true })
    .eq("status", "aktiv")
    .gt("offene_stellen", 0);

  const ready = readyCandidates || [];
  const matched = matchedCandidates || [];
  const masterclassDone = ready.filter((c: any) => c.stage === "masterclass_abgeschlossen");
  const otherStages = ready.filter((c: any) => c.stage !== "masterclass_abgeschlossen");

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/20">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Matching</h1>
            <p className="text-sm text-muted-foreground">
              Kandidaten an Partnerunternehmen vermitteln
            </p>
          </div>
        </div>
        <Link href="/admin/vermittlungen">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Alle Vermittlungen
          </Button>
        </Link>
      </div>

      {/* Stats bar */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Bereit für Matching</p>
          <p className="mt-1 text-2xl font-bold">{masterclassDone.length}</p>
          <p className="text-xs text-muted-foreground">Masterclass abgeschlossen</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Aktive Partner</p>
          <p className="mt-1 text-2xl font-bold">{activePartners || 0}</p>
          <p className="text-xs text-muted-foreground">mit offenen Stellen</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Im Vermittlungsprozess</p>
          <p className="mt-1 text-2xl font-bold">{matched.length}</p>
          <p className="text-xs text-muted-foreground">vorgestellt / interview</p>
        </div>
      </div>

      {/* No active partners warning */}
      {(activePartners || 0) === 0 && (
        <div className="mt-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-900">Keine aktiven Partner</p>
            <p className="text-xs text-amber-700">
              Erstelle zuerst Partner mit Status &quot;aktiv&quot; und offenen Stellen, bevor du Kandidaten matchen kannst.
            </p>
          </div>
          <Link href="/admin/partner/neu" className="ml-auto">
            <Button size="sm" variant="outline">Partner anlegen</Button>
          </Link>
        </div>
      )}

      {/* Priority: Masterclass abgeschlossen */}
      <div className="mt-8">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Masterclass abgeschlossen</h2>
          <Badge className="bg-green-100 text-green-800">{masterclassDone.length}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Diese Kandidaten haben alle Pflichtmodule absolviert und sind bereit für die Vermittlung.
        </p>

        <div className="mt-4 space-y-4">
          {masterclassDone.length === 0 && (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-muted-foreground">
                Keine Kandidaten mit abgeschlossener Masterclass.
              </p>
            </div>
          )}
          {masterclassDone.map((c: any) => (
            <CandidateMatchCard key={c.id} candidate={c} />
          ))}
        </div>
      </div>

      {/* Secondary: Other matchable stages */}
      {otherStages.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Weitere Kandidaten</h2>
            <Badge variant="outline">{otherStages.length}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Qualifizierte Kandidaten, die auch manuell gematcht werden können.
          </p>
          <div className="mt-4 space-y-4">
            {otherStages.map((c: any) => (
              <CandidateMatchCard key={c.id} candidate={c} showStage />
            ))}
          </div>
        </div>
      )}

      {/* Recently matched overview */}
      {matched.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold">Kürzlich vermittelt</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {matched.map((c: any) => (
              <Link key={c.id} href={`/admin/kandidaten/${c.id}`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                  {c.vorname} {c.nachname} · {STAGE_LABELS[c.stage as keyof typeof STAGE_LABELS]}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
