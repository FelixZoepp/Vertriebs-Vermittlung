import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  calculateMatchScore,
  rankMatches,
  type MatchResult,
} from "@/lib/rules/matching";
import {
  sendVermittelbarBenachrichtigung,
  sendAdminNeuerVermittelbarer,
  sendPartnerNeuerKandidat,
} from "@/lib/integrations/resend";
import type { Candidate, Partner } from "@/lib/types";

export async function POST(request: NextRequest) {
  let body: { module_id: number; sekunden_gesehen: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Ungueltiger Request-Body" },
      { status: 400 }
    );
  }

  const { module_id, sekunden_gesehen } = body;

  if (
    typeof module_id !== "number" ||
    typeof sekunden_gesehen !== "number" ||
    sekunden_gesehen < 0
  ) {
    return NextResponse.json(
      { error: "module_id und sekunden_gesehen sind erforderlich" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  // Get candidate record for this user
  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select("id, stage, masterclass_freigeschaltet_am")
    .eq("user_id", user.id)
    .single();

  if (candidateError || !candidate) {
    return NextResponse.json(
      { error: "Kandidat nicht gefunden" },
      { status: 404 }
    );
  }

  if (!candidate.masterclass_freigeschaltet_am) {
    return NextResponse.json(
      { error: "Masterclass nicht freigeschaltet" },
      { status: 403 }
    );
  }

  // Get the module to check dauer_sek
  const { data: module, error: moduleError } = await supabase
    .from("masterclass_modules")
    .select("id, dauer_sek, pflicht")
    .eq("id", module_id)
    .single();

  if (moduleError || !module) {
    return NextResponse.json(
      { error: "Modul nicht gefunden" },
      { status: 404 }
    );
  }

  // Get existing progress to ensure we never decrease sekunden_gesehen
  const { data: existingProgress } = await supabase
    .from("masterclass_progress")
    .select("id, sekunden_gesehen, abgeschlossen")
    .eq("candidate_id", candidate.id)
    .eq("module_id", module_id)
    .single();

  // If already completed, return early
  if (existingProgress?.abgeschlossen) {
    return NextResponse.json({
      progress: existingProgress,
      masterclass_complete: false,
    });
  }

  // sekunden_gesehen should only increase, never decrease
  const finalSekunden = existingProgress
    ? Math.max(existingProgress.sekunden_gesehen, sekunden_gesehen)
    : sekunden_gesehen;

  // Check if module is now completed (>= 95% of dauer_sek)
  const abgeschlossen = finalSekunden >= module.dauer_sek * 0.95;

  const now = new Date().toISOString();

  // Upsert progress
  const upsertData: Record<string, unknown> = {
    candidate_id: candidate.id,
    module_id,
    sekunden_gesehen: finalSekunden,
    abgeschlossen,
    zuletzt_am: now,
  };

  let progress;
  if (existingProgress) {
    const { data, error } = await supabase
      .from("masterclass_progress")
      .update({
        sekunden_gesehen: finalSekunden,
        abgeschlossen,
        zuletzt_am: now,
      })
      .eq("id", existingProgress.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Fortschritt-Update fehlgeschlagen: ${error.message}` },
        { status: 500 }
      );
    }
    progress = data;
  } else {
    const { data, error } = await supabase
      .from("masterclass_progress")
      .insert(upsertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Fortschritt-Insert fehlgeschlagen: ${error.message}` },
        { status: 500 }
      );
    }
    progress = data;
  }

  // Check if ALL pflicht modules are now abgeschlossen
  let masterclassComplete = false;

  if (abgeschlossen) {
    // Get all pflicht modules
    const { data: pflichtModules } = await supabase
      .from("masterclass_modules")
      .select("id")
      .eq("pflicht", true);

    if (pflichtModules && pflichtModules.length > 0) {
      // Get all completed progress for this candidate
      const { data: allProgress } = await supabase
        .from("masterclass_progress")
        .select("module_id, abgeschlossen")
        .eq("candidate_id", candidate.id)
        .eq("abgeschlossen", true);

      const completedModuleIds = new Set(
        (allProgress || []).map((p) => p.module_id)
      );

      const allPflichtDone = pflichtModules.every((m) =>
        completedModuleIds.has(m.id)
      );

      if (allPflichtDone && candidate.stage === "masterclass_laeuft") {
        masterclassComplete = true;

        // Update candidate stage to vermittelbar
        const { error: stageError } = await supabase
          .from("candidates")
          .update({
            stage: "vermittelbar",
            stage_changed_at: now,
            masterclass_abgeschlossen_am: now,
          })
          .eq("id", candidate.id);

        if (stageError) {
          console.error("Stage-Update fehlgeschlagen:", stageError.message);
        }

        // Log to activity_log
        const { error: logError } = await supabase
          .from("activity_log")
          .insert({
            entity_typ: "candidate",
            entity_id: candidate.id,
            aktion: "masterclass_abgeschlossen_vermittelbar",
            akteur_id: user.id,
            payload: {
              pflicht_module: pflichtModules.length,
              auto_transition: true,
            },
          });

        if (logError) {
          console.error("Activity-Log fehlgeschlagen:", logError.message);
        }

        // Fire-and-forget: send emails + auto-matching
        handleVermittelbarAutomation(candidate.id, user.id).catch((err) =>
          console.error("Vermittelbar automation failed:", err)
        );
      }
    }
  }

  return NextResponse.json({
    progress,
    masterclass_complete: masterclassComplete,
  });
}

/**
 * Fire-and-forget automation when a candidate becomes vermittelbar:
 * 1. Send congratulations email to candidate
 * 2. Run matching against all active partners
 * 3. If best match >= 70: auto-create placement + notify partner
 * 4. Always notify admin
 */
async function handleVermittelbarAutomation(
  candidateId: number,
  _userId: string
): Promise<void> {
  const supabase = await createServiceClient();

  // Fetch candidate details
  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", candidateId)
    .single();

  if (candidateError || !candidate) {
    console.error("Automation: Kandidat nicht gefunden:", candidateError?.message);
    return;
  }

  const kandidatName = `${candidate.vorname} ${candidate.nachname}`;
  const adminEmail = process.env.ADMIN_EMAIL || "felixbusinessmail@gmx.de";

  // 1. Send congratulations email to candidate
  sendVermittelbarBenachrichtigung(candidate.email, candidate.vorname).catch(
    (err) => console.error("Vermittelbar email failed:", err)
  );

  // 2. Send admin notification
  sendAdminNeuerVermittelbarer(adminEmail, kandidatName, candidate.id).catch(
    (err) => console.error("Admin notification failed:", err)
  );

  // 3. Run matching against active partners
  const { data: partners, error: partnersError } = await supabase
    .from("partners")
    .select("*")
    .eq("status", "aktiv")
    .gt("offene_stellen", 0);

  if (partnersError || !partners || partners.length === 0) {
    console.log("Automation: Keine aktiven Partner gefunden.");
    return;
  }

  // Count current active placements per partner
  const { data: placementCounts } = await supabase
    .from("placements")
    .select("partner_id")
    .in("status", [
      "leadeingang",
      "vorstellungsgespraech",
      "probetag",
      "eingestellt",
    ]);

  const countMap: Record<number, number> = {};
  if (placementCounts) {
    for (const p of placementCounts) {
      countMap[p.partner_id] = (countMap[p.partner_id] || 0) + 1;
    }
  }

  // Calculate match scores
  const results: MatchResult[] = [];
  for (const partner of partners as Partner[]) {
    const partnerWithCount = {
      ...partner,
      aktuelle_placements: countMap[partner.id] || 0,
    };
    const result = calculateMatchScore(
      candidate as Candidate,
      partnerWithCount
    );
    if (result) {
      results.push(result);
    }
  }

  if (results.length === 0) {
    console.log(`Automation: Keine Matches fuer Kandidat ${candidateId}.`);
    return;
  }

  const ranked = rankMatches(results);
  const bestMatch = ranked[0];

  // 4. If best match >= 70: auto-create placement and notify partner
  if (bestMatch.score >= 70) {
    const now = new Date().toISOString();

    // Check for existing active placement
    const { data: existing } = await supabase
      .from("placements")
      .select("id")
      .eq("candidate_id", candidateId)
      .eq("partner_id", bestMatch.partner_id)
      .in("status", [
        "leadeingang",
        "vorstellungsgespraech",
        "probetag",
        "eingestellt",
      ])
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(
        `Automation: Placement bereits vorhanden fuer Kandidat ${candidateId} -> Partner ${bestMatch.partner_id}.`
      );
      return;
    }

    // Create placement
    const { data: placement, error: placementError } = await supabase
      .from("placements")
      .insert({
        candidate_id: candidateId,
        partner_id: bestMatch.partner_id,
        match_score: bestMatch.score,
        status: "leadeingang",
        vorgeschlagen_am: now,
        vertraege_gesamt: 0,
      })
      .select("id")
      .single();

    if (placementError || !placement) {
      console.error(
        "Automation: Placement-Insert fehlgeschlagen:",
        placementError?.message
      );
      return;
    }

    // Update candidate stage to vermittelt
    const { error: stageError } = await supabase
      .from("candidates")
      .update({
        stage: "vermittelt",
        stage_changed_at: now,
      })
      .eq("id", candidateId);

    if (stageError) {
      console.error("Automation: Stage update error:", stageError.message);
    }

    // Log to activity_log
    supabase
      .from("activity_log")
      .insert({
        entity_typ: "placement",
        entity_id: placement.id,
        aktion: "auto_vermittlung_erstellt",
        akteur_id: null,
        payload: {
          candidate_id: candidateId,
          partner_id: bestMatch.partner_id,
          match_score: bestMatch.score,
          auto: true,
        },
      })
      .then(({ error }) => {
        if (error) console.error("Automation: Activity log error:", error.message);
      });

    // Notify partner
    const partner = (partners as Partner[]).find(
      (p) => p.id === bestMatch.partner_id
    );
    if (partner) {
      sendPartnerNeuerKandidat(
        partner.email,
        partner.ansprechpartner,
        kandidatName,
        bestMatch.score
      ).catch((err) => console.error("Partner notification failed:", err));
    }

    console.log(
      `Automation: Auto-Placement ${placement.id} erstellt. Kandidat ${candidateId} -> Partner ${bestMatch.partner_id} (Score: ${bestMatch.score}).`
    );
  } else {
    console.log(
      `Automation: Bester Match fuer Kandidat ${candidateId} hat Score ${bestMatch.score} (< 70). Kein Auto-Placement.`
    );
  }
}
