"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import type { Stage } from "@/lib/types";
import {
  isValidTransition,
  shouldUnlockMasterclass,
} from "@/lib/rules/stage-transition";

export async function changeStageAction(
  candidateId: number,
  fromStage: Stage,
  toStage: Stage
): Promise<{ error?: string } | undefined> {
  if (!isValidTransition(fromStage, toStage)) {
    return {
      error: `Ungueltige Stage-Transition: ${fromStage} -> ${toStage}`,
    };
  }

  const user = await getAuthUser();
  const supabase = await createClient();
  const now = new Date().toISOString();

  // Build the update object
  const updateData: Record<string, unknown> = {
    stage: toStage,
    stage_changed_at: now,
  };

  // R1: Set masterclass_freigeschaltet_am when transitioning to 'qualifiziert'
  if (shouldUnlockMasterclass(toStage)) {
    updateData.masterclass_freigeschaltet_am = now;
  }

  const { error: updateError } = await supabase
    .from("candidates")
    .update(updateData)
    .eq("id", candidateId);

  if (updateError) {
    return { error: `Fehler beim Aktualisieren: ${updateError.message}` };
  }

  // Log to activity_log
  const { error: logError } = await supabase.from("activity_log").insert({
    entity_typ: "candidate",
    entity_id: candidateId,
    aktion: "stage_change",
    akteur_id: user.id,
    payload: { from: fromStage, to: toStage },
  });

  if (logError) {
    console.error("Activity log error:", logError.message);
  }

  revalidatePath(`/admin/kandidaten/${candidateId}`);
  revalidatePath("/admin/kandidaten");
}
