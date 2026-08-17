"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { sendBewerberEingang } from "@/lib/integrations/resend";
import { getCoordinatesForPLZ } from "@/lib/plz-data";

export interface BewerbenResult {
  success: boolean;
  error?: string;
}

export async function submitBewerbung(
  formData: FormData
): Promise<BewerbenResult> {
  const vorname = (formData.get("vorname") as string)?.trim();
  const nachname = (formData.get("nachname") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const telefon = (formData.get("telefon") as string)?.trim() || null;
  const plz = (formData.get("plz") as string)?.trim() || null;
  const ort = (formData.get("ort") as string)?.trim() || null;
  const erfahrungRaw = formData.get("erfahrung_jahre") as string;
  const erfahrung_jahre = erfahrungRaw ? parseInt(erfahrungRaw, 10) : 0;
  const branchenerfahrungRaw = (
    formData.get("branchenerfahrung") as string
  )?.trim();
  const branchenerfahrung = branchenerfahrungRaw
    ? branchenerfahrungRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const fuehrerschein = formData.get("fuehrerschein") === "on";
  const verfuegbar_ab =
    (formData.get("verfuegbar_ab") as string)?.trim() || null;
  const umkreisRaw = formData.get("umkreis_bereitschaft_km") as string;
  const umkreis_bereitschaft_km = umkreisRaw ? parseInt(umkreisRaw, 10) : 30;
  const quelle_detail =
    (formData.get("quelle_detail") as string)?.trim() || null;

  // Validation
  if (!vorname || !nachname || !email) {
    return { success: false, error: "Bitte fülle alle Pflichtfelder aus." };
  }

  // Determine quelle based on ref parameter
  // ref_<id> = referral from candidate, seo_<city> = SEO page, else reel/organisch
  let quelle = "organisch";
  let referredBy: number | null = null;

  if (quelle_detail) {
    if (quelle_detail.startsWith("ref_")) {
      const refId = parseInt(quelle_detail.slice(4), 10);
      if (!isNaN(refId)) {
        referredBy = refId;
        quelle = "empfehlung";
      }
    } else if (quelle_detail.startsWith("seo_")) {
      quelle = "seo";
    } else {
      quelle = "reel";
    }
  }

  // Auto-resolve coordinates from PLZ
  const coords = plz ? getCoordinatesForPLZ(plz) : null;

  const supabase = await createServiceClient();

  // Validate referrer exists if referral
  if (referredBy) {
    const { data: referrer } = await supabase
      .from("candidates")
      .select("id")
      .eq("id", referredBy)
      .single();
    if (!referrer) {
      referredBy = null;
      quelle = "organisch";
    }
  }

  const { data: newCandidate, error } = await supabase
    .from("candidates")
    .insert({
      vorname,
      nachname,
      email,
      telefon,
      plz,
      ort,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      erfahrung_jahre,
      branchenerfahrung,
      fuehrerschein,
      verfuegbar_ab,
      umkreis_bereitschaft_km,
      quelle,
      quelle_detail,
      referred_by: referredBy,
      stage: "eingang",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "Eine Bewerbung mit dieser E-Mail existiert bereits.",
      };
    }
    return {
      success: false,
      error: "Es ist ein Fehler aufgetreten. Bitte versuche es erneut.",
    };
  }

  // Create referral reward if this was a referral
  if (referredBy && newCandidate?.id) {
    await supabase
      .from("referral_rewards")
      .insert({
        referrer_id: referredBy,
        referred_id: newCandidate.id,
        status: "ausstehend",
      });
  }

  // Send confirmation email (fire and forget)
  sendBewerberEingang(email, vorname).catch(() => {});

  return { success: true };
}
