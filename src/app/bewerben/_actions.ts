"use server";

import { createServiceClient } from "@/lib/supabase/server";

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

  const quelle = quelle_detail ? "reel" : "organisch";

  const supabase = await createServiceClient();

  const { error } = await supabase.from("candidates").insert({
    vorname,
    nachname,
    email,
    telefon,
    plz,
    ort,
    erfahrung_jahre,
    branchenerfahrung,
    fuehrerschein,
    verfuegbar_ab,
    umkreis_bereitschaft_km,
    quelle,
    quelle_detail,
    stage: "eingang",
  });

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

  return { success: true };
}
