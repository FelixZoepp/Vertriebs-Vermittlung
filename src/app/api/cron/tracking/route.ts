import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { TRACKING_INTERVALS } from "@/lib/placement-stages";
import { sendTrackingAbfrage } from "@/lib/integrations/resend";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const heute = new Date();

  // Fetch all placements with status='eingestellt' that have an eingestellt_am date
  const { data: placements, error } = await supabase
    .from("placements")
    .select("*, candidate:candidates(*), partner:partners(*)")
    .eq("status", "eingestellt")
    .not("eingestellt_am", "is", null);

  if (error) {
    console.error("Tracking cron query error:", error);
    return NextResponse.json(
      { error: "Database query failed" },
      { status: 500 }
    );
  }

  if (!placements || placements.length === 0) {
    return NextResponse.json({
      processed: 0,
      message: "Keine eingestellten Vermittlungen gefunden.",
    });
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://vertriebs-vermittlung.vercel.app";

  const results: Array<{
    placement_id: number;
    intervall: string;
    kandidat: string;
    partner: string;
    action: "created" | "skipped";
  }> = [];

  for (const placement of placements) {
    const eingestelltAm = new Date(placement.eingestellt_am!);
    const kandidatName = placement.candidate
      ? `${placement.candidate.vorname} ${placement.candidate.nachname}`
      : `Kandidat #${placement.candidate_id}`;
    const partnerEmail = placement.partner?.email;
    const ansprechpartner = placement.partner?.ansprechpartner || "Partner";
    const partnerName = placement.partner?.firmenname || "Unbekannt";

    for (const interval of TRACKING_INTERVALS) {
      // Check if this interval is due
      const dueDate = new Date(eingestelltAm);
      dueDate.setDate(dueDate.getDate() + interval.days);

      if (heute < dueDate) {
        // Not yet due
        continue;
      }

      // Check if a contract_tracking row already exists (idempotent)
      const { data: existing } = await supabase
        .from("contract_tracking")
        .select("id")
        .eq("placement_id", placement.id)
        .eq("intervall", interval.key)
        .maybeSingle();

      if (existing) {
        results.push({
          placement_id: placement.id,
          intervall: interval.key,
          kandidat: kandidatName,
          partner: partnerName,
          action: "skipped",
        });
        continue;
      }

      // Insert tracking row
      const { data: trackingRow, error: insertError } = await supabase
        .from("contract_tracking")
        .insert({
          placement_id: placement.id,
          intervall: interval.key,
          angefragt_am: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertError) {
        console.error(
          `Failed to insert tracking for placement ${placement.id}, interval ${interval.key}:`,
          insertError
        );
        continue;
      }

      // Send email to partner
      if (partnerEmail && trackingRow) {
        const trackingUrl = `${appUrl}/tracking/${trackingRow.id}`;
        try {
          await sendTrackingAbfrage(
            partnerEmail,
            ansprechpartner,
            kandidatName,
            interval.label,
            trackingUrl
          );
        } catch (emailError) {
          console.error(
            `Failed to send tracking email for placement ${placement.id}:`,
            emailError
          );
        }
      }

      // Log to activity_log
      await supabase.from("activity_log").insert({
        entity_typ: "placement",
        entity_id: placement.id,
        aktion: "tracking_abfrage",
        akteur_id: null,
        payload: {
          intervall: interval.key,
          intervall_label: interval.label,
          kandidat: kandidatName,
          partner: partnerName,
          tracking_id: trackingRow?.id,
        },
      });

      results.push({
        placement_id: placement.id,
        intervall: interval.key,
        kandidat: kandidatName,
        partner: partnerName,
        action: "created",
      });
    }
  }

  const created = results.filter((r) => r.action === "created").length;
  const skipped = results.filter((r) => r.action === "skipped").length;

  return NextResponse.json({
    processed: results.length,
    created,
    skipped,
    details: results,
  });
}
