import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

        // Update candidate stage to masterclass_abgeschlossen
        const { error: stageError } = await supabase
          .from("candidates")
          .update({
            stage: "masterclass_abgeschlossen",
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
            aktion: "masterclass_abgeschlossen",
            akteur_id: user.id,
            payload: {
              pflicht_module: pflichtModules.length,
              auto_transition: true,
            },
          });

        if (logError) {
          console.error("Activity-Log fehlgeschlagen:", logError.message);
        }
      }
    }
  }

  return NextResponse.json({
    progress,
    masterclass_complete: masterclassComplete,
  });
}
