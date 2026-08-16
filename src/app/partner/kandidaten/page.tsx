import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import {
  PLACEMENT_PIPELINE_STAGES,
  PLACEMENT_STAGE_LABELS,
  PLACEMENT_STAGE_COLORS,
} from "@/lib/placement-stages";
import { PartnerPipelineBoard } from "./_components/partner-pipeline";
import { Users } from "lucide-react";

export default async function PartnerKandidatenPage() {
  const user = await getAuthUser();
  const supabase = await createClient();

  const { data: partner } = await supabase
    .from("partners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!partner) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Users className="h-12 w-12 text-muted-foreground/30" />
        <p className="mt-4 text-muted-foreground">Kein Partner-Konto verknüpft.</p>
      </div>
    );
  }

  const { data: placements } = await supabase
    .from("placements")
    .select("id, candidate_id, match_score, status, vorgeschlagen_am, eingestellt_am, abgelehnt_grund, vertraege_gesamt, candidates(id, vorname, nachname, plz, ort, erfahrung_jahre, branchenerfahrung, fuehrerschein, verfuegbar_ab, email, telefon)")
    .eq("partner_id", partner.id)
    .not("status", "eq", "abgebrochen")
    .order("vorgeschlagen_am", { ascending: false });

  const stageCounts: Record<string, number> = {};
  for (const p of placements || []) {
    stageCounts[p.status] = (stageCounts[p.status] || 0) + 1;
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/20">
          <Users className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Kandidaten-Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            {(placements || []).length} Kandidaten insgesamt
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {PLACEMENT_PIPELINE_STAGES.map((stage) => (
          <Badge key={stage} className={PLACEMENT_STAGE_COLORS[stage]}>
            {PLACEMENT_STAGE_LABELS[stage]}: {stageCounts[stage] || 0}
          </Badge>
        ))}
      </div>

      <div className="mt-6">
        <PartnerPipelineBoard placements={(placements || []).map((p: any) => ({
          ...p,
          candidates: Array.isArray(p.candidates) ? p.candidates[0] : p.candidates,
        }))} />
      </div>
    </div>
  );
}
