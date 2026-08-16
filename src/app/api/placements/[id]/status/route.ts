import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  isValidPlacementTransition,
  type PlacementStage,
  PLACEMENT_STAGES,
} from "@/lib/placement-stages";
import {
  berechneMeilensteinFrist,
} from "@/lib/rules/invoicing";
import { TRACKING_INTERVALS } from "@/lib/placement-stages";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const placementId = parseInt(id, 10);
  if (isNaN(placementId)) {
    return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
  }

  let body: { status: PlacementStage; abgelehnt_grund?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Body" }, { status: 400 });
  }

  const { status: newStatus, abgelehnt_grund } = body;

  if (!PLACEMENT_STAGES.includes(newStatus)) {
    return NextResponse.json({ error: `Unbekannter Status: ${newStatus}` }, { status: 400 });
  }

  if (newStatus === "abgelehnt" && !abgelehnt_grund) {
    return NextResponse.json({ error: "Ablehnungsgrund erforderlich" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  const { data: placement, error: fetchErr } = await supabase
    .from("placements")
    .select("*")
    .eq("id", placementId)
    .single();

  if (fetchErr || !placement) {
    return NextResponse.json({ error: "Placement nicht gefunden" }, { status: 404 });
  }

  if (!isValidPlacementTransition(placement.status as PlacementStage, newStatus)) {
    return NextResponse.json(
      { error: `Ungültiger Übergang: ${placement.status} → ${newStatus}` },
      { status: 422 }
    );
  }

  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = { status: newStatus };

  if (newStatus === "eingestellt") {
    updateData.eingestellt_am = now;
    updateData.meilenstein_frist = berechneMeilensteinFrist(new Date()).toISOString().split("T")[0];

    // Update candidate stage
    await supabase
      .from("candidates")
      .update({ stage: "vermittelt", stage_changed_at: now })
      .eq("id", placement.candidate_id);

    // Auto-create tracking intervals for contract reporting
    const trackingRows = TRACKING_INTERVALS.map((interval) => ({
      placement_id: placementId,
      intervall: interval.key,
      angefragt_am: now,
    }));
    await supabase.from("contract_tracking").upsert(trackingRows, {
      onConflict: "placement_id,intervall",
      ignoreDuplicates: true,
    });
  }

  if (newStatus === "abgelehnt") {
    updateData.abgelehnt_grund = abgelehnt_grund;
  }

  const { data: updated, error: updateErr } = await supabase
    .from("placements")
    .update(updateData)
    .eq("id", placementId)
    .select()
    .single();

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Activity log
  await supabase.from("activity_log").insert({
    entity_typ: "placement",
    entity_id: placementId,
    aktion: "status_changed",
    payload: { from: placement.status, to: newStatus, ...(abgelehnt_grund ? { abgelehnt_grund } : {}) },
  });

  return NextResponse.json({ placement: updated });
}
