import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CandidateMatchCard } from "./_components/candidate-match-card";

export default async function MatchingPage() {
  const supabase = await createClient();

  // Fetch candidates ready for matching (masterclass_abgeschlossen)
  const { data: candidates } = await supabase
    .from("candidates")
    .select(
      "id, vorname, nachname, plz, ort, erfahrung_jahre, branchenerfahrung, lat, lng"
    )
    .eq("stage", "masterclass_abgeschlossen")
    .order("stage_changed_at", { ascending: true });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Matching</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kandidaten mit abgeschlossener Masterclass an Partner vermitteln
          </p>
        </div>
        <Link href="/admin/vermittlungen">
          <Button variant="outline">Alle Vermittlungen</Button>
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {(!candidates || candidates.length === 0) && (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            <p>Keine Kandidaten im Status &quot;Masterclass abgeschlossen&quot;.</p>
            <p className="mt-1 text-sm">
              Kandidaten erscheinen hier, sobald sie alle Pflichtmodule
              abgeschlossen haben.
            </p>
          </div>
        )}

        {(candidates || []).map((c: any) => (
          <CandidateMatchCard key={c.id} candidate={c} />
        ))}
      </div>
    </div>
  );
}
