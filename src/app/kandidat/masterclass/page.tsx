import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { VideoPlayer } from "@/components/masterclass/video-player";
import type { MasterclassModule, MasterclassProgress } from "@/lib/types";

export default async function MasterclassPage() {
  const user = await getAuthUser();
  const supabase = await createClient();

  // Get candidate record for this user
  const { data: candidate } = await supabase
    .from("candidates")
    .select("id, masterclass_freigeschaltet_am, masterclass_abgeschlossen_am")
    .eq("user_id", user.id)
    .single();

  if (!candidate?.masterclass_freigeschaltet_am) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Masterclass</h1>
        <div className="mt-6 rounded-lg border bg-card p-8 text-center">
          <p className="text-lg font-medium">Noch nicht freigeschaltet</p>
          <p className="mt-2 text-muted-foreground">
            Die Masterclass wird freigeschaltet, sobald du qualifiziert bist.
            Stelle sicher, dass dein Profil vollständig ist.
          </p>
        </div>
      </div>
    );
  }

  // Get modules and progress
  const { data: modules } = await supabase
    .from("masterclass_modules")
    .select("*")
    .order("reihenfolge");

  const { data: progress } = await supabase
    .from("masterclass_progress")
    .select("*")
    .eq("candidate_id", candidate.id);

  const progressMap = new Map(
    (progress || []).map((p: MasterclassProgress) => [p.module_id, p])
  );

  const pflichtModule = (modules || []).filter(
    (m: MasterclassModule) => m.pflicht
  );
  const abgeschlossene = pflichtModule.filter((m: MasterclassModule) => {
    const p = progressMap.get(m.id);
    return p && p.abgeschlossen;
  });

  const gesamtFortschritt =
    pflichtModule.length > 0
      ? Math.round((abgeschlossene.length / pflichtModule.length) * 100)
      : 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Masterclass</h1>
        {candidate.masterclass_abgeschlossen_am ? (
          <Badge className="bg-green-100 text-green-800">Abgeschlossen</Badge>
        ) : (
          <Badge variant="outline">{gesamtFortschritt}% abgeschlossen</Badge>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-3 w-full rounded-full bg-muted">
        <div
          className="h-3 rounded-full bg-green-500 transition-all"
          style={{ width: `${gesamtFortschritt}%` }}
        />
      </div>

      {/* Modules */}
      <div className="mt-6 space-y-3">
        {(!modules || modules.length === 0) && (
          <p className="text-muted-foreground">
            Noch keine Module vorhanden. Bitte warte auf die Freischaltung.
          </p>
        )}
        {(modules || []).map((mod: MasterclassModule, idx: number) => {
          const prog = progressMap.get(mod.id);
          const done = prog?.abgeschlossen ?? false;
          const percent = prog
            ? Math.min(
                100,
                Math.round((prog.sekunden_gesehen / mod.dauer_sek) * 100)
              )
            : 0;

          return (
            <div
              key={mod.id}
              className={`rounded-lg border p-4 ${
                done ? "border-green-200 bg-green-50" : "bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                      done
                        ? "bg-green-100 text-green-700"
                        : "bg-muted"
                    }`}
                  >
                    {done ? (
                      <svg
                        className="size-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      idx + 1
                    )}
                  </span>
                  <div>
                    <p className="font-medium">{mod.titel}</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(mod.dauer_sek / 60)} Min.
                      {mod.pflicht && " \u00b7 Pflicht"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {done ? (
                    <span className="text-sm font-medium text-green-600">
                      Fertig
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {percent}%
                    </span>
                  )}
                </div>
              </div>

              {/* Show VideoPlayer for incomplete modules, green checkmark for done */}
              {mod.video_url && !done && (
                <VideoPlayer
                  moduleId={mod.id}
                  videoUrl={mod.video_url}
                  durationSek={mod.dauer_sek}
                  initialProgress={prog?.sekunden_gesehen ?? 0}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
