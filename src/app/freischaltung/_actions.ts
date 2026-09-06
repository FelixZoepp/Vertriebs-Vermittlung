"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  createCustomer,
  createFreischaltungCheckout,
} from "@/lib/integrations/stripe";
import { redirect } from "next/navigation";

export async function startFreischaltungCheckout(): Promise<{
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const serviceClient = await createServiceClient();
  const { data: partner } = await serviceClient
    .from("partners")
    .select("id, email, firmenname, stripe_customer_id, freischaltung_status, abo_status")
    .eq("user_id", user.id)
    .single();

  if (!partner) {
    return { error: "Kein Partnerprofil gefunden." };
  }

  if (
    partner.freischaltung_status === "bezahlt" ||
    partner.freischaltung_status === "befreit" ||
    partner.abo_status === "aktiv"
  ) {
    redirect("/partner");
  }

  // Stripe-Customer sicherstellen
  let customerId = partner.stripe_customer_id;
  if (!customerId) {
    const customer = await createCustomer(partner.email, partner.firmenname);
    customerId = customer.id;
    await serviceClient
      .from("partners")
      .update({ stripe_customer_id: customerId })
      .eq("id", partner.id);
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://vertriebs-vermittlung.vercel.app";

  let checkoutUrl: string;
  try {
    const session = await createFreischaltungCheckout(
      customerId,
      `${appUrl}/partner?freischaltung=aktiviert`,
      `${appUrl}/freischaltung?abgebrochen=1`
    );
    checkoutUrl = session.url!;
  } catch {
    return {
      error: "Zahlung konnte nicht gestartet werden. Bitte versuche es erneut.",
    };
  }

  redirect(checkoutUrl);
}
