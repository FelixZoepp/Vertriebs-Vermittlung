"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";

export interface ProposeResult {
  success: boolean;
  error?: string;
  placementId?: number;
}

export async function proposeMatch(
  candidateId: number,
  partnerId: number,
  matchScore: number
): Promise<ProposeResult> {
  const user = await getAuthUser();
  const supabase = await createServiceClient();
  const now = new Date().toISOString();

  // Check for existing active placement between this candidate and partner
  const { data: existing } = await supabase
    .from("placements")
    .select("id")
    .eq("candidate_id", candidateId)
    .eq("partner_id", partnerId)
    .in("status", ["vorgeschlagen", "erstgespraech", "vorstellungsgespraech", "probetag", "eingestellt"])
    .limit(1);

  if (existing && existing.length > 0) {
    return {
      success: false,
      error: "Dieser Kandidat wurde diesem Partner bereits vorgeschlagen.",
    };
  }

  // Insert placement
  const { data: placement, error: insertError } = await supabase
    .from("placements")
    .insert({
      candidate_id: candidateId,
      partner_id: partnerId,
      match_score: matchScore,
      status: "vorgeschlagen",
      vorgeschlagen_am: now,
      vertraege_gesamt: 0,
    })
    .select("id")
    .single();

  if (insertError || !placement) {
    return {
      success: false,
      error: `Vermittlung konnte nicht erstellt werden: ${insertError?.message}`,
    };
  }

  // Update candidate stage to 'vorgestellt'
  const { error: stageError } = await supabase
    .from("candidates")
    .update({
      stage: "vorgestellt",
      stage_changed_at: now,
    })
    .eq("id", candidateId);

  if (stageError) {
    console.error("Stage update error:", stageError.message);
  }

  // Log to activity_log
  const { error: logError } = await supabase.from("activity_log").insert({
    entity_typ: "placement",
    entity_id: placement.id,
    aktion: "vorgeschlagen",
    akteur_id: user.id,
    payload: {
      candidate_id: candidateId,
      partner_id: partnerId,
      match_score: matchScore,
    },
  });

  if (logError) {
    console.error("Activity log error:", logError.message);
  }

  revalidatePath("/admin/vermittlungen");
  revalidatePath("/admin/vermittlungen/matching");
  revalidatePath("/admin/kandidaten");
  revalidatePath(`/admin/kandidaten/${candidateId}`);

  return { success: true, placementId: placement.id };
}
