import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  isValidTransition,
  requiresRejectionReason,
  shouldUnlockMasterclass,
} from "@/lib/rules/stage-transition";
import { STAGES, type Stage } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const candidateId = parseInt(id, 10);

  if (isNaN(candidateId)) {
    return NextResponse.json(
      { error: "Ungueltige Kandidaten-ID" },
      { status: 400 }
    );
  }

  let body: { stage: Stage; ablehnungsgrund?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Ungueltiger Request-Body" },
      { status: 400 }
    );
  }

  const { stage: newStage, ablehnungsgrund } = body;

  // Validate stage value
  if (!newStage || !STAGES.includes(newStage)) {
    return NextResponse.json(
      { error: `Unbekannte Stage: ${newStage}` },
      { status: 400 }
    );
  }

  // Rejection requires a reason
  if (requiresRejectionReason(newStage) && !ablehnungsgrund) {
    return NextResponse.json(
      { error: "Ablehnungsgrund ist erforderlich" },
      { status: 400 }
    );
  }

  const supabase = await createServiceClient();

  // Fetch current candidate
  const { data: candidate, error: fetchError } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", candidateId)
    .single();

  if (fetchError || !candidate) {
    return NextResponse.json(
      { error: "Kandidat nicht gefunden" },
      { status: 404 }
    );
  }

  // Validate transition
  if (!isValidTransition(candidate.stage as Stage, newStage)) {
    return NextResponse.json(
      {
        error: `Ungültiger Übergang von "${candidate.stage}" zu "${newStage}"`,
      },
      { status: 422 }
    );
  }

  // Build update payload
  const now = new Date().toISOString();
  const updatePayload: Record<string, unknown> = {
    stage: newStage,
    stage_changed_at: now,
  };

  if (newStage === "abgelehnt") {
    updatePayload.ablehnungsgrund = ablehnungsgrund;
  }

  if (shouldUnlockMasterclass(newStage)) {
    updatePayload.masterclass_freigeschaltet_am = now;
  }

  // Update candidate
  const { data: updated, error: updateError } = await supabase
    .from("candidates")
    .update(updatePayload)
    .eq("id", candidateId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: `Update fehlgeschlagen: ${updateError.message}` },
      { status: 500 }
    );
  }

  // Log to activity_log
  await supabase.from("activity_log").insert({
    entity_typ: "candidate",
    entity_id: candidateId,
    aktion: "stage_changed",
    payload: {
      from: candidate.stage,
      to: newStage,
      ...(ablehnungsgrund ? { ablehnungsgrund } : {}),
    },
  });

  return NextResponse.json({ candidate: updated });
}
