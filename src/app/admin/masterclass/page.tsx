import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, BookOpen, Users, CheckCircle } from "lucide-react";
import { ModuleCard } from "./_components/module-card";
import { AddModuleForm } from "./_components/add-module-form";
import type { MasterclassModule } from "@/lib/types";

export default async function AdminMasterclassPage() {
  const supabase = await createClient();

  const { data: modules } = await supabase
    .from("masterclass_modules")
    .select("*")
    .order("reihenfolge");

  // Get progress stats per module
  const { data: progressStats } = await supabase
    .from("masterclass_progress")
    .select("module_id, abgeschlossen");

  const progressMap: Record<number, { started: number; completed: number }> = {};
  for (const p of progressStats || []) {
    if (!progressMap[p.module_id]) {
      progressMap[p.module_id] = { started: 0, completed: 0 };
    }
    progressMap[p.module_id].started++;
    if (p.abgeschlossen) progressMap[p.module_id].completed++;
  }

  // Overall stats
  const { count: totalCandidatesWithAccess } = await supabase
    .from("candidates")
    .select("*", { count: "exact", head: true })
    .not("masterclass_freigeschaltet_am", "is", null);

  const { count: totalCompleted } = await supabase
    .from("candidates")
    .select("*", { count: "exact", head: true })
    .not("masterclass_abgeschlossen_am", "is", null);

  const pflichtCount = (modules || []).filter((m: MasterclassModule) => m.pflicht).length;
  const totalDuration = (modules || []).reduce((sum: number, m: MasterclassModule) => sum + m.dauer_sek, 0);
  const nextOrder = (modules || []).length + 1;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/20">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Masterclass</h1>
            <p className="text-sm text-muted-foreground">Module verwalten und Fortschritt einsehen</p>
          </div>
        </div>
        <AddModuleForm nextOrder={nextOrder} />
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            Module
          </div>
          <p className="mt-1 text-2xl font-bold">{(modules || []).length}</p>
          <p className="text-xs text-muted-foreground">{pflichtCount} Pflicht, {(modules || []).length - pflichtCount} Optional</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GraduationCap className="h-4 w-4" />
            Gesamtdauer
          </div>
          <p className="mt-1 text-2xl font-bold">{Math.round(totalDuration / 60)} Min.</p>
          <p className="text-xs text-muted-foreground">{Math.round(totalDuration / 3600 * 10) / 10} Stunden</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            Freigeschaltet
          </div>
          <p className="mt-1 text-2xl font-bold">{totalCandidatesWithAccess || 0}</p>
          <p className="text-xs text-muted-foreground">Kandidaten mit Zugang</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4" />
            Abgeschlossen
          </div>
          <p className="mt-1 text-2xl font-bold">{totalCompleted || 0}</p>
          <p className="text-xs text-muted-foreground">
            {totalCandidatesWithAccess
              ? `${Math.round(((totalCompleted || 0) / totalCandidatesWithAccess) * 100)}% Quote`
              : "—"}
          </p>
        </div>
      </div>

      {/* Module list */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold">Module ({(modules || []).length})</h2>
        <div className="mt-4 space-y-3">
          {(!modules || modules.length === 0) && (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <GraduationCap className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-muted-foreground">Noch keine Module vorhanden.</p>
              <p className="text-sm text-muted-foreground">Erstelle das erste Modul mit dem Button oben.</p>
            </div>
          )}
          {(modules || []).map((mod: MasterclassModule) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              progressCount={progressMap[mod.id]?.started || 0}
              completedCount={progressMap[mod.id]?.completed || 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
