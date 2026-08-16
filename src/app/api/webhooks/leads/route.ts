import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCoordinatesForPLZ } from "@/lib/plz-data";
import { sendBewerberEingang } from "@/lib/integrations/resend";

/**
 * POST /api/webhooks/leads
 *
 * Webhook endpoint for external funnels (e.g. Typeform, Calendly, custom).
 * Creates a candidate with stage='eingang'.
 *
 * Expected JSON body:
 * {
 *   "vorname": "Max",
 *   "nachname": "Mustermann",
 *   "email": "max@example.com",
 *   "telefon": "0171...",        // optional
 *   "plz": "10315",              // optional
 *   "ort": "Berlin",             // optional
 *   "erfahrung_jahre": 2,        // optional, default 0
 *   "branchenerfahrung": ["Energie", "Telko"],  // optional, string[] or comma-separated string
 *   "fuehrerschein": true,       // optional, default false
 *   "verfuegbar_ab": "2026-09-01", // optional
 *   "umkreis_bereitschaft_km": 30, // optional, default 30
 *   "quelle": "reel",            // optional: reel | organisch | empfehlung | anzeige
 *   "quelle_detail": "reel_abc123", // optional: tracking ID
 *   "secret": "your-webhook-secret" // optional: for auth
 * }
 *
 * Returns: { success: true, candidate_id: number } or { error: string }
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger JSON-Body" }, { status: 400 });
  }

  // Optional webhook secret auth
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (webhookSecret && body.secret !== webhookSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vorname = String(body.vorname || "").trim();
  const nachname = String(body.nachname || "").trim();
  const email = String(body.email || "").trim();

  if (!vorname || !nachname || !email) {
    return NextResponse.json(
      { error: "vorname, nachname und email sind Pflichtfelder" },
      { status: 400 }
    );
  }

  // Parse branchenerfahrung: accept string[] or comma-separated string
  let branchenerfahrung: string[] = [];
  if (Array.isArray(body.branchenerfahrung)) {
    branchenerfahrung = body.branchenerfahrung.map(String).filter(Boolean);
  } else if (typeof body.branchenerfahrung === "string") {
    branchenerfahrung = body.branchenerfahrung.split(",").map((s: string) => s.trim()).filter(Boolean);
  }

  const plz = String(body.plz || "").trim() || null;
  const coords = plz ? getCoordinatesForPLZ(plz) : null;

  const quelle = ["reel", "organisch", "empfehlung", "anzeige"].includes(String(body.quelle))
    ? String(body.quelle)
    : body.quelle_detail ? "reel" : "organisch";

  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("candidates")
    .insert({
      vorname,
      nachname,
      email,
      telefon: String(body.telefon || "").trim() || null,
      plz,
      ort: String(body.ort || "").trim() || null,
      lat: coords?.lat || null,
      lng: coords?.lng || null,
      erfahrung_jahre: Number(body.erfahrung_jahre) || 0,
      branchenerfahrung,
      fuehrerschein: Boolean(body.fuehrerschein),
      verfuegbar_ab: body.verfuegbar_ab ? String(body.verfuegbar_ab) : null,
      umkreis_bereitschaft_km: Number(body.umkreis_bereitschaft_km) || 30,
      quelle,
      quelle_detail: String(body.quelle_detail || "").trim() || null,
      stage: "eingang",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ein Kandidat mit dieser E-Mail existiert bereits" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send confirmation email (fire and forget)
  sendBewerberEingang(email, vorname).catch(() => {});

  // Log to activity_log
  await supabase.from("activity_log").insert({
    entity_typ: "candidate",
    entity_id: data.id,
    aktion: "webhook_eingang",
    payload: { quelle, quelle_detail: body.quelle_detail || null },
  });

  return NextResponse.json({ success: true, candidate_id: data.id });
}
