import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { bestimmeMahnStufe, type MahnStufe } from "@/lib/rules/invoicing";

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
  const heuteStr = heute.toISOString().split("T")[0];

  // Fetch overdue invoices
  const { data: overdueInvoices, error } = await supabase
    .from("invoices")
    .select("*, partners(firmenname, email)")
    .eq("status", "versendet")
    .lt("faellig_am", heuteStr);

  if (error) {
    console.error("Mahnlauf query error:", error);
    return NextResponse.json(
      { error: "Database query failed" },
      { status: 500 }
    );
  }

  if (!overdueInvoices || overdueInvoices.length === 0) {
    return NextResponse.json({
      processed: 0,
      message: "Keine überfälligen Rechnungen.",
    });
  }

  const results: Array<{
    invoice_id: number;
    rechnungsnummer: string | null;
    partner: string;
    stufe: MahnStufe;
  }> = [];

  for (const inv of overdueInvoices) {
    const faelligAm = new Date(inv.faellig_am);
    const stufe = bestimmeMahnStufe(faelligAm, heute);

    if (!stufe) continue; // Not yet due for a reminder (< 3 days overdue)

    // Log to activity_log
    await supabase.from("activity_log").insert({
      entity_typ: "invoice",
      entity_id: inv.id,
      aktion: `mahnung_${stufe}`,
      akteur_id: null,
      payload: {
        rechnungsnummer: inv.rechnungsnummer,
        partner_id: inv.partner_id,
        partner_name: inv.partners?.firmenname,
        faellig_am: inv.faellig_am,
        stufe,
        tage_ueberfaellig: Math.floor(
          (heute.getTime() - faelligAm.getTime()) / (1000 * 60 * 60 * 24)
        ),
      },
    });

    results.push({
      invoice_id: inv.id,
      rechnungsnummer: inv.rechnungsnummer,
      partner: inv.partners?.firmenname || "Unbekannt",
      stufe,
    });
  }

  return NextResponse.json({
    processed: results.length,
    mahnungen: results,
  });
}
