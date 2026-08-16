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
/**
 * Normalize webhook payloads from various sources (Perspective, Typeform, custom).
 * Flattens nested structures and maps common field name variations.
 */
function normalizeWebhookBody(raw: unknown): Record<string, unknown> {
  // Already a flat object
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;

    // Perspective format: data lives in "values", profile values in "profile.*.value"
    // Also support: "data", "fields", "answers", "contact", "lead"
    const flat: Record<string, unknown> = {};

    // Priority 1: Perspective "values" object (flat key-value pairs)
    if (obj.values && typeof obj.values === "object") {
      Object.assign(flat, obj.values as Record<string, unknown>);
    }

    // Priority 2: Perspective "profile" object (key → {title, value})
    if (obj.profile && typeof obj.profile === "object") {
      for (const [k, v] of Object.entries(obj.profile as Record<string, unknown>)) {
        if (v && typeof v === "object" && "value" in (v as Record<string, unknown>)) {
          if (!(k in flat)) flat[k] = (v as Record<string, unknown>).value;
        }
      }
    }

    // Priority 3: Other nested containers
    const nested = obj.data ?? obj.fields ?? obj.answers ?? obj.contact ?? obj.lead;
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      for (const [k, v] of Object.entries(nested as Record<string, unknown>)) {
        if (!(k in flat)) flat[k] = v;
      }
    }

    // Priority 4: Top-level keys
    const skipKeys = new Set(["data", "fields", "answers", "contact", "lead", "values", "profile", "meta", "titles", "funnelId", "funnelName", "trackingVersion"]);
    for (const [k, v] of Object.entries(obj)) {
      if (!skipKeys.has(k) && !(k in flat)) flat[k] = v;
    }

    // Map common field name variations → our schema
    const aliases: Record<string, string[]> = {
      vorname: ["first_name", "firstName", "fname", "Vorname", "vorname", "name"],
      nachname: ["last_name", "lastName", "lname", "Nachname", "nachname", "surname", "family_name"],
      email: ["email", "Email", "e_mail", "E-Mail", "emailAddress", "email_address"],
      telefon: ["phone", "telefon", "Telefon", "Phone", "phone_number", "phoneNumber", "tel", "mobile"],
      plz: ["zip", "plz", "PLZ", "postal_code", "postalCode", "zipCode", "zip_code", "postleitzahl", "address#postalCode"],
      ort: ["city", "ort", "Ort", "City", "stadt", "Stadt", "location"],
      erfahrung_jahre: ["experience", "erfahrung", "erfahrung_jahre", "years_experience"],
      branchenerfahrung: ["industry", "branche", "branchenerfahrung", "industries", "branch"],
      fuehrerschein: ["drivers_license", "fuehrerschein", "führerschein", "license", "driving_license"],
      verfuegbar_ab: ["available_from", "verfuegbar_ab", "verfügbar_ab", "start_date", "startDate"],
      quelle: ["source", "quelle", "utm_source", "referrer"],
      quelle_detail: ["source_detail", "quelle_detail", "utm_campaign", "campaign", "ref", "referral"],
    };

    const result: Record<string, unknown> = {};
    for (const [target, sources] of Object.entries(aliases)) {
      for (const src of sources) {
        if (flat[src] !== undefined && flat[src] !== null && flat[src] !== "") {
          result[target] = flat[src];
          break;
        }
      }
    }

    // If we got "name" but no nachname, try to split it
    if (result.vorname && !result.nachname && typeof result.vorname === "string") {
      const parts = result.vorname.trim().split(/\s+/);
      if (parts.length >= 2) {
        result.vorname = parts[0];
        result.nachname = parts.slice(1).join(" ");
      }
    }

    // Perspective question fields: detect Führerschein, Erfahrung, Branche from answers
    for (const [k, v] of Object.entries(flat)) {
      if (typeof v !== "string") continue;
      const val = v.toLowerCase();

      // Führerschein detection
      if (!result.fuehrerschein && (k.includes("führerschein") || k.includes("fuehrerschein") || val.includes("führerschein"))) {
        result.fuehrerschein = val.includes("vorhanden") || val.includes("ja") || val === "true";
      }

      // Erfahrung detection
      if (!result.erfahrung_jahre && (k.includes("erfahrung") || val.includes("erfahrung"))) {
        if (val.includes("ja") || val.includes("bereits")) {
          result.erfahrung_jahre = 1; // at least some
        }
      }

      // Branchenerfahrung from answers
      if (!result.branchenerfahrung && (k.includes("vertrieb") || k.includes("gemacht"))) {
        result.branchenerfahrung = v; // will be parsed as comma-separated later
      }
    }

    // Pass through any extra fields not in aliases
    for (const [k, v] of Object.entries(flat)) {
      if (!(k in result)) result[k] = v;
    }

    return result;
  }

  return {};
}

export async function POST(request: Request) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger JSON-Body" }, { status: 400 });
  }

  // Normalize: Perspective sends nested or flat data — extract fields flexibly
  const body = normalizeWebhookBody(rawBody);

  // Log raw payload for debugging (stored in activity_log)
  const supabase = await createServiceClient();
  await supabase.from("activity_log").insert({
    entity_typ: "webhook",
    entity_id: 0,
    aktion: "raw_payload",
    payload: { raw: rawBody, normalized: body },
  });

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
