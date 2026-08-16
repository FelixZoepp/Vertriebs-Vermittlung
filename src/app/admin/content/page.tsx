"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import type { ContentItem } from "@/lib/types";

const CONTENT_STAGES = [
  "idee",
  "skript",
  "dreh",
  "schnitt",
  "geplant",
  "live",
] as const;

const STAGE_LABELS: Record<string, string> = {
  idee: "Idee",
  skript: "Skript",
  dreh: "Dreh",
  schnitt: "Schnitt",
  geplant: "Geplant",
  live: "Live",
};

const STAGE_COLORS: Record<string, string> = {
  idee: "bg-gray-100 text-gray-800",
  skript: "bg-blue-100 text-blue-800",
  dreh: "bg-purple-100 text-purple-800",
  schnitt: "bg-amber-100 text-amber-800",
  geplant: "bg-cyan-100 text-cyan-800",
  live: "bg-green-100 text-green-800",
};

export default function ContentPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    const { data } = await supabase
      .from("content_items")
      .select("*")
      .order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  }

  async function createItem(formData: FormData) {
    const { error } = await supabase.from("content_items").insert({
      thema: formData.get("thema") as string,
      hook: (formData.get("hook") as string) || null,
      skript: (formData.get("skript") as string) || null,
      plattform: (formData.get("plattform") as string)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      geplant_fuer: (formData.get("geplant_fuer") as string) || null,
    });

    if (!error) {
      setShowForm(false);
      loadItems();
    }
  }

  async function updateStatus(id: number, newStatus: string) {
    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === "live") {
      updates.veroeffentlicht_am = new Date().toISOString();
    }
    await supabase.from("content_items").update(updates).eq("id", id);
    loadItems();
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Content-Planung</h1>
        <p className="mt-4 text-muted-foreground">Lade...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Content-Planung</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Abbrechen" : "Neues Reel"}
        </Button>
      </div>

      {showForm && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Neues Reel / Content</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createItem} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="thema">Thema *</Label>
                <Input id="thema" name="thema" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hook">Hook</Label>
                <Input id="hook" name="hook" placeholder="Aufmerksamkeits-Hook" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="skript">Skript</Label>
                <textarea
                  id="skript"
                  name="skript"
                  rows={3}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plattform">Plattformen</Label>
                <Input
                  id="plattform"
                  name="plattform"
                  placeholder="Instagram, TikTok, YouTube"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="geplant_fuer">Geplant für</Label>
                <Input id="geplant_fuer" name="geplant_fuer" type="date" />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit">Erstellen</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Content Board - grouped by status */}
      <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
        {CONTENT_STAGES.map((stage) => {
          const stageItems = items.filter((i) => i.status === stage);
          return (
            <div key={stage} className="w-64 shrink-0">
              <div className="mb-3 flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_COLORS[stage]}`}
                >
                  {STAGE_LABELS[stage]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {stageItems.length}
                </span>
              </div>
              <div className="space-y-2">
                {stageItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border bg-card p-3"
                  >
                    <p className="text-sm font-medium">{item.thema}</p>
                    {item.hook && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        &ldquo;{item.hook}&rdquo;
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.plattform.map((p) => (
                        <Badge key={p} variant="outline" className="text-xs">
                          {p}
                        </Badge>
                      ))}
                    </div>
                    {item.geplant_fuer && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(item.geplant_fuer).toLocaleDateString("de-DE")}
                      </p>
                    )}
                    {item.status !== "live" && (
                      <div className="mt-2">
                        <select
                          className="w-full rounded border bg-background px-2 py-1 text-xs"
                          value={item.status}
                          onChange={(e) =>
                            updateStatus(item.id, e.target.value)
                          }
                        >
                          {CONTENT_STAGES.map((s) => (
                            <option key={s} value={s}>
                              {STAGE_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {item.status === "live" && item.views > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.views.toLocaleString("de-DE")} Views &middot;{" "}
                        {item.leads_zugeordnet} Leads
                      </p>
                    )}
                  </div>
                ))}
                {stageItems.length === 0 && (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Leer
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
