"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createModule } from "../_actions";
import { Plus, Loader2, X } from "lucide-react";

export function AddModuleForm({ nextOrder }: { nextOrder: number }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createModule(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setError(null);
      }
    });
  }

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/20 hover:from-red-700 hover:to-red-800"
      >
        <Plus className="h-4 w-4" />
        Neues Modul
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Neues Modul hinzufügen</CardTitle>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titel">Titel *</Label>
            <Input id="titel" name="titel" placeholder="z.B. Mindset im Vertrieb" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video_url">Video-URL *</Label>
            <Input
              id="video_url"
              name="video_url"
              placeholder="https://drive.google.com/file/d/.../preview"
              required
            />
            <p className="text-xs text-muted-foreground">
              Google Drive Link im Format: https://drive.google.com/file/d/FILE_ID/preview
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dauer_sek">Dauer (Sekunden)</Label>
              <Input id="dauer_sek" name="dauer_sek" type="number" defaultValue={300} min={1} />
              <p className="text-xs text-muted-foreground">300 = 5 Minuten</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reihenfolge">Reihenfolge</Label>
              <Input id="reihenfolge" name="reihenfolge" type="number" defaultValue={nextOrder} min={1} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="pflicht" name="pflicht" defaultChecked className="h-4 w-4" />
            <Label htmlFor="pflicht">Pflichtmodul (muss zu 95% angesehen werden)</Label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={isPending} className="gap-1.5">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Modul erstellen
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
