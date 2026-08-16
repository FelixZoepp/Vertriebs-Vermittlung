"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { updateModule, deleteModule } from "../_actions";
import {
  Pencil,
  Trash2,
  GripVertical,
  Check,
  X,
  Loader2,
  Play,
  Clock,
  Star,
} from "lucide-react";
import type { MasterclassModule } from "@/lib/types";

interface ModuleCardProps {
  module: MasterclassModule;
  progressCount: number;
  completedCount: number;
}

export function ModuleCard({ module, progressCount, completedCount }: ModuleCardProps) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleUpdate(formData: FormData) {
    startTransition(async () => {
      const result = await updateModule(module.id, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setEditing(false);
        setError(null);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteModule(module.id);
      if (result.error) {
        setError(result.error);
        setDeleting(false);
      }
    });
  }

  if (editing) {
    return (
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <form action={handleUpdate} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`titel-${module.id}`}>Titel</Label>
              <Input id={`titel-${module.id}`} name="titel" defaultValue={module.titel} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`video_url-${module.id}`}>Video-URL (Google Drive)</Label>
              <Input id={`video_url-${module.id}`} name="video_url" defaultValue={module.video_url} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`dauer_sek-${module.id}`}>Dauer (Sekunden)</Label>
              <Input id={`dauer_sek-${module.id}`} name="dauer_sek" type="number" defaultValue={module.dauer_sek} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`reihenfolge-${module.id}`}>Reihenfolge</Label>
              <Input id={`reihenfolge-${module.id}`} name="reihenfolge" type="number" defaultValue={module.reihenfolge} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id={`pflicht-${module.id}`} name="pflicht" defaultChecked={module.pflicht} className="h-4 w-4" />
              <Label htmlFor={`pflicht-${module.id}`}>Pflichtmodul</Label>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending} className="gap-1.5">
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Speichern
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
              <X className="h-3.5 w-3.5" />
              Abbrechen
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-4 rounded-xl border bg-card p-5 shadow-sm transition-colors hover:bg-muted/30">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-700 text-sm font-bold text-white shadow-sm shadow-red-500/20">
        {module.reihenfolge}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold truncate">{module.titel}</h3>
          {module.pflicht ? (
            <Badge className="bg-red-100 text-red-800 text-[10px]">Pflicht</Badge>
          ) : (
            <Badge variant="outline" className="text-[10px]">Optional</Badge>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {Math.round(module.dauer_sek / 60)} Min.
          </span>
          <span className="flex items-center gap-1">
            <Play className="h-3 w-3" />
            {progressCount} gestartet
          </span>
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            {completedCount} abgeschlossen
          </span>
        </div>

        {module.video_url.includes("PLACEHOLDER") && (
          <p className="mt-1.5 text-xs text-amber-600">
            Video-URL ist noch ein Platzhalter — bitte Google Drive Link eintragen.
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="h-8 w-8 p-0">
          <Pencil className="h-3.5 w-3.5" />
        </Button>

        {deleting ? (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending} className="h-8 text-xs px-2">
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Ja"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDeleting(false)} className="h-8 text-xs px-2">
              Nein
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setDeleting(true)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
