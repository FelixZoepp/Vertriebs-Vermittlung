"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { createCustomer, createSubscriptionCheckout } from "@/lib/integrations/stripe";
import { sendPartnerWillkommen } from "@/lib/integrations/resend";
import { getCoordinatesForPLZ } from "@/lib/plz-data";
import { redirect } from "next/navigation";

export interface RegisterPartnerResult {
  success: boolean;
  error?: string;
  checkoutUrl?: string;
}

export async function registerPartner(
  formData: FormData
): Promise<RegisterPartnerResult> {
  const firmenname = (formData.get("firmenname") as string)?.trim();
  const ansprechpartner = (formData.get("ansprechpartner") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string);
  const telefon = (formData.get("telefon") as string)?.trim() || null;
  const strasse = (formData.get("strasse") as string)?.trim() || null;
  const plz = (formData.get("plz") as string)?.trim() || null;
  const ort = (formData.get("ort") as string)?.trim() || null;
  const branche = (formData.get("branche") as string)?.trim() || null;
  const offeneStellen = parseInt(formData.get("offene_stellen") as string) || 1;
  const suchradiusKm = parseInt(formData.get("suchradius_km") as string) || 50;

  // Validation
  if (!firmenname || !ansprechpartner || !email || !password) {
    return {
      success: false,
      error: "Bitte fuelle alle Pflichtfelder aus.",
    };
  }

  if (password.length < 8) {
    return {
      success: false,
      error: "Das Passwort muss mindestens 8 Zeichen lang sein.",
    };
  }

  const supabase = await createServiceClient();

  // 1. Create Supabase auth user
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "partner", name: ansprechpartner },
    });

  if (authError) {
    if (authError.message.includes("already been registered")) {
      return {
        success: false,
        error: "Diese E-Mail-Adresse ist bereits registriert.",
      };
    }
    return {
      success: false,
      error: "Fehler beim Erstellen des Accounts. Bitte versuche es erneut.",
    };
  }

  const userId = authData.user.id;

  // 2. Create Stripe customer
  let stripeCustomer;
  try {
    stripeCustomer = await createCustomer(email, firmenname);
  } catch {
    // Rollback: delete auth user
    await supabase.auth.admin.deleteUser(userId);
    return {
      success: false,
      error: "Fehler bei der Zahlungseinrichtung. Bitte versuche es erneut.",
    };
  }

  // 3. Create partner record
  const coords = plz ? getCoordinatesForPLZ(plz) : null;

  const { error: insertError } = await supabase.from("partners").insert({
    user_id: userId,
    firmenname,
    ansprechpartner,
    email,
    telefon,
    strasse,
    plz,
    ort,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
    branche,
    gesuchte_profile: [],
    offene_stellen: offeneStellen,
    suchradius_km: suchradiusKm,
    status: "interessent",
    stripe_customer_id: stripeCustomer.id,
    abo_status: "keins",
  });

  if (insertError) {
    // Rollback
    await supabase.auth.admin.deleteUser(userId);
    return {
      success: false,
      error: "Fehler beim Anlegen des Partnerprofils. Bitte versuche es erneut.",
    };
  }

  // 4. Send welcome email (fire and forget)
  sendPartnerWillkommen(email, ansprechpartner, firmenname).catch(() => {});

  // 5. Create Stripe Checkout session and redirect
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://vertriebs-vermittlung.vercel.app";

  let checkoutUrl: string;
  try {
    const session = await createSubscriptionCheckout(
      stripeCustomer.id,
      `${appUrl}/partner?abo=aktiviert`,
      `${appUrl}/partner-werden/registrieren?abgebrochen=1`
    );
    checkoutUrl = session.url!;
  } catch {
    // Account is created, but checkout failed — redirect to partner dashboard
    // They can subscribe later
    redirect("/partner");
  }

  redirect(checkoutUrl);
}
