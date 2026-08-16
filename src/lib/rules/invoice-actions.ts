import { createServiceClient } from "@/lib/supabase/server";
import {
  NETTO_CENT,
  UST_SATZ,
  MEILENSTEIN_VERTRAEGE,
  berechneBrutto,
  berechneFaelligkeit,
  berechneMeilensteinFrist,
  generiereRechnungsnummer,
} from "@/lib/rules/invoicing";
import {
  createCustomer,
  createInvoice,
  sendInvoice,
} from "@/lib/integrations/stripe";
import type { Invoice } from "@/lib/types";

export async function createEinstellungsRechnung(
  placementId: number
): Promise<Invoice> {
  const supabase = await createServiceClient();

  // Fetch placement + partner
  const { data: placement, error: pErr } = await supabase
    .from("placements")
    .select("*, partners(*)")
    .eq("id", placementId)
    .single();

  if (pErr || !placement) {
    throw new Error(`Vermittlung ${placementId} nicht gefunden.`);
  }

  if (placement.status !== "eingestellt") {
    throw new Error(
      `Vermittlung ${placementId} ist nicht im Status "eingestellt".`
    );
  }

  const partner = placement.partners;
  if (!partner) {
    throw new Error(`Partner für Vermittlung ${placementId} nicht gefunden.`);
  }

  // Idempotency: check if einstellungs-invoice already exists
  const { data: existing } = await supabase
    .from("invoices")
    .select("*")
    .eq("placement_id", placementId)
    .eq("typ", "einstellung")
    .limit(1)
    .single();

  if (existing) {
    return existing as Invoice;
  }

  // Ensure partner has a Stripe customer
  let stripeCustomerId = partner.stripe_customer_id;
  if (!stripeCustomerId) {
    try {
      const customer = await createCustomer(partner.email, partner.firmenname);
      stripeCustomerId = customer.id;
      await supabase
        .from("partners")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", partner.id);
    } catch (err) {
      throw new Error(
        `Stripe-Kunde konnte nicht erstellt werden: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // Generate rechnungsnummer
  const jahr = new Date().getFullYear();
  const { data: maxRow } = await supabase
    .from("invoices")
    .select("rechnungsnummer")
    .like("rechnungsnummer", `ZM-${jahr}-%`)
    .order("rechnungsnummer", { ascending: false })
    .limit(1)
    .single();

  let laufendeNr = 1;
  if (maxRow?.rechnungsnummer) {
    const parts = maxRow.rechnungsnummer.split("-");
    const lastNr = parseInt(parts[2], 10);
    if (!isNaN(lastNr)) laufendeNr = lastNr + 1;
  }

  const rechnungsnummer = generiereRechnungsnummer(jahr, laufendeNr);
  const bruttoCent = berechneBrutto(NETTO_CENT, UST_SATZ);
  const faelligAm = berechneFaelligkeit(
    placement.eingestellt_am ? new Date(placement.eingestellt_am) : new Date()
  );

  // Create invoice record in DB as entwurf first
  const { data: invoiceRecord, error: insErr } = await supabase
    .from("invoices")
    .insert({
      partner_id: partner.id,
      placement_id: placementId,
      typ: "einstellung",
      netto_cent: NETTO_CENT,
      ust_satz: UST_SATZ,
      brutto_cent: bruttoCent,
      rechnungsnummer,
      status: "entwurf",
      faellig_am: faelligAm.toISOString().split("T")[0],
    })
    .select()
    .single();

  if (insErr || !invoiceRecord) {
    throw new Error(
      `Rechnung konnte nicht erstellt werden: ${insErr?.message}`
    );
  }

  // Create and send Stripe invoice
  try {
    const stripeInvoice = await createInvoice(
      stripeCustomerId!,
      bruttoCent,
      `Vermittlungsprovision Einstellung – ${rechnungsnummer}`,
      {
        invoice_id: String(invoiceRecord.id),
        placement_id: String(placementId),
        typ: "einstellung",
      }
    );

    // Update DB with stripe_invoice_id
    await supabase
      .from("invoices")
      .update({ stripe_invoice_id: stripeInvoice.id })
      .eq("id", invoiceRecord.id);

    // Finalize / send the Stripe invoice
    await sendInvoice(stripeInvoice.id);

    // Update status to versendet
    await supabase
      .from("invoices")
      .update({ status: "versendet" })
      .eq("id", invoiceRecord.id);

    invoiceRecord.status = "versendet";
    invoiceRecord.stripe_invoice_id = stripeInvoice.id;
  } catch (err) {
    // Stripe failed — DB record remains as entwurf so admin can retry
    console.error("Stripe invoice creation/send failed:", err);
    // Don't throw — the DB record exists and can be retried
  }

  // Set meilenstein_frist on placement
  const eingestelltAm = placement.eingestellt_am
    ? new Date(placement.eingestellt_am)
    : new Date();
  const meilensteinFrist = berechneMeilensteinFrist(eingestelltAm);

  await supabase
    .from("placements")
    .update({
      meilenstein_frist: meilensteinFrist.toISOString().split("T")[0],
    })
    .eq("id", placementId);

  return invoiceRecord as Invoice;
}

export async function createMeilensteinRechnung(
  placementId: number
): Promise<Invoice> {
  const supabase = await createServiceClient();

  // Fetch placement + partner
  const { data: placement, error: pErr } = await supabase
    .from("placements")
    .select("*, partners(*)")
    .eq("id", placementId)
    .single();

  if (pErr || !placement) {
    throw new Error(`Vermittlung ${placementId} nicht gefunden.`);
  }

  const partner = placement.partners;
  if (!partner) {
    throw new Error(`Partner für Vermittlung ${placementId} nicht gefunden.`);
  }

  // Check threshold
  if (placement.vertraege_gesamt < MEILENSTEIN_VERTRAEGE) {
    throw new Error(
      `Vermittlung ${placementId} hat erst ${placement.vertraege_gesamt} Verträge (benötigt: ${MEILENSTEIN_VERTRAEGE}).`
    );
  }

  // Idempotency: check if meilenstein invoice already exists
  const { data: existing } = await supabase
    .from("invoices")
    .select("*")
    .eq("placement_id", placementId)
    .eq("typ", "meilenstein_100")
    .limit(1)
    .single();

  if (existing) {
    return existing as Invoice;
  }

  // Ensure partner has a Stripe customer
  let stripeCustomerId = partner.stripe_customer_id;
  if (!stripeCustomerId) {
    try {
      const customer = await createCustomer(partner.email, partner.firmenname);
      stripeCustomerId = customer.id;
      await supabase
        .from("partners")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", partner.id);
    } catch (err) {
      throw new Error(
        `Stripe-Kunde konnte nicht erstellt werden: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // Generate rechnungsnummer
  const jahr = new Date().getFullYear();
  const { data: maxRow } = await supabase
    .from("invoices")
    .select("rechnungsnummer")
    .like("rechnungsnummer", `ZM-${jahr}-%`)
    .order("rechnungsnummer", { ascending: false })
    .limit(1)
    .single();

  let laufendeNr = 1;
  if (maxRow?.rechnungsnummer) {
    const parts = maxRow.rechnungsnummer.split("-");
    const lastNr = parseInt(parts[2], 10);
    if (!isNaN(lastNr)) laufendeNr = lastNr + 1;
  }

  const rechnungsnummer = generiereRechnungsnummer(jahr, laufendeNr);
  const bruttoCent = berechneBrutto(NETTO_CENT, UST_SATZ);
  const faelligAm = berechneFaelligkeit(new Date());

  // Create invoice record
  const { data: invoiceRecord, error: insErr } = await supabase
    .from("invoices")
    .insert({
      partner_id: partner.id,
      placement_id: placementId,
      typ: "meilenstein_100",
      netto_cent: NETTO_CENT,
      ust_satz: UST_SATZ,
      brutto_cent: bruttoCent,
      rechnungsnummer,
      status: "entwurf",
      faellig_am: faelligAm.toISOString().split("T")[0],
    })
    .select()
    .single();

  if (insErr || !invoiceRecord) {
    throw new Error(
      `Rechnung konnte nicht erstellt werden: ${insErr?.message}`
    );
  }

  // Create and send Stripe invoice
  try {
    const stripeInvoice = await createInvoice(
      stripeCustomerId!,
      bruttoCent,
      `Meilenstein-Provision 100 Verträge – ${rechnungsnummer}`,
      {
        invoice_id: String(invoiceRecord.id),
        placement_id: String(placementId),
        typ: "meilenstein_100",
      }
    );

    await supabase
      .from("invoices")
      .update({ stripe_invoice_id: stripeInvoice.id })
      .eq("id", invoiceRecord.id);

    await sendInvoice(stripeInvoice.id);

    await supabase
      .from("invoices")
      .update({ status: "versendet" })
      .eq("id", invoiceRecord.id);

    invoiceRecord.status = "versendet";
    invoiceRecord.stripe_invoice_id = stripeInvoice.id;
  } catch (err) {
    console.error("Stripe invoice creation/send failed:", err);
  }

  // Set meilenstein_100_erreicht_am
  await supabase
    .from("placements")
    .update({
      meilenstein_100_erreicht_am: new Date().toISOString().split("T")[0],
    })
    .eq("id", placementId);

  return invoiceRecord as Invoice;
}
