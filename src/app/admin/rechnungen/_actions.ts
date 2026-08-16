"use server";

import { createServiceClient } from "@/lib/supabase/server";
import {
  createEinstellungsRechnung,
  createMeilensteinRechnung,
} from "@/lib/rules/invoice-actions";
import { MEILENSTEIN_VERTRAEGE } from "@/lib/rules/invoicing";
import { sendInvoice } from "@/lib/integrations/stripe";
import { revalidatePath } from "next/cache";

export async function generateInvoiceForPlacement(
  placementId: number,
  typ: "einstellung" | "meilenstein_100"
) {
  try {
    if (typ === "einstellung") {
      await createEinstellungsRechnung(placementId);
    } else {
      await createMeilensteinRechnung(placementId);
    }

    revalidatePath("/admin/rechnungen");
    revalidatePath(`/admin/vermittlungen/${placementId}`);
    return { success: true };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Unbekannter Fehler",
    };
  }
}

export async function resendInvoice(invoiceId: number) {
  try {
    const supabase = await createServiceClient();

    const { data: invoice } = await supabase
      .from("invoices")
      .select("stripe_invoice_id, status")
      .eq("id", invoiceId)
      .single();

    if (!invoice) {
      return { error: "Rechnung nicht gefunden." };
    }

    if (!invoice.stripe_invoice_id) {
      return { error: "Keine Stripe-Rechnung vorhanden. Bitte neu erstellen." };
    }

    if (invoice.status === "entwurf") {
      // Finalize and send
      await sendInvoice(invoice.stripe_invoice_id);
      await supabase
        .from("invoices")
        .update({ status: "versendet" })
        .eq("id", invoiceId);
    }

    revalidatePath("/admin/rechnungen");
    return { success: true };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Unbekannter Fehler",
    };
  }
}

export async function confirmContractReport(reportId: number) {
  try {
    const supabase = await createServiceClient();

    // Get the report
    const { data: report, error: rErr } = await supabase
      .from("contract_reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (rErr || !report) {
      return { error: "Meldung nicht gefunden." };
    }

    if (report.bestaetigt_von_admin) {
      return { error: "Meldung bereits bestätigt." };
    }

    // Confirm the report
    await supabase
      .from("contract_reports")
      .update({
        bestaetigt_von_admin: new Date().toISOString(),
      })
      .eq("id", reportId);

    // Recalculate vertraege_gesamt from all confirmed reports
    const { data: confirmedReports } = await supabase
      .from("contract_reports")
      .select("anzahl_vertraege")
      .eq("placement_id", report.placement_id)
      .not("bestaetigt_von_admin", "is", null);

    // Include the one we just confirmed
    const totalConfirmed =
      (confirmedReports || []).reduce(
        (sum: number, r: { anzahl_vertraege: number }) =>
          sum + r.anzahl_vertraege,
        0
      ) + report.anzahl_vertraege;

    await supabase
      .from("placements")
      .update({ vertraege_gesamt: totalConfirmed })
      .eq("id", report.placement_id);

    // Auto-trigger meilenstein invoice if threshold reached
    if (totalConfirmed >= MEILENSTEIN_VERTRAEGE) {
      try {
        await createMeilensteinRechnung(report.placement_id);
      } catch {
        // Idempotent — might already exist, which is fine
      }
    }

    revalidatePath("/admin/rechnungen");
    revalidatePath(`/admin/vermittlungen/${report.placement_id}`);
    return { success: true };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Unbekannter Fehler",
    };
  }
}
