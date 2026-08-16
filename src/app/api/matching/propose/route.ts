import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { candidate_id, partner_id, match_score } = await request.json();

  if (!candidate_id || !partner_id) {
    return NextResponse.json({ error: "candidate_id und partner_id erforderlich" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  // Create placement
  const { data: placement, error: placementError } = await supabase
    .from("placements")
    .insert({
      candidate_id,
      partner_id,
      match_score,
      status: "vorgeschlagen",
    })
    .select()
    .single();

  if (placementError) {
    return NextResponse.json({ error: placementError.message }, { status: 500 });
  }

  // Update candidate stage to 'vorgestellt'
  await supabase
    .from("candidates")
    .update({ stage: "vorgestellt", stage_changed_at: new Date().toISOString() })
    .eq("id", candidate_id);

  // Log to activity_log
  await supabase.from("activity_log").insert({
    entity_typ: "placement",
    entity_id: placement.id,
    aktion: "vorgeschlagen",
    payload: { candidate_id, partner_id, match_score },
  });

  return NextResponse.json({ placement });
}
