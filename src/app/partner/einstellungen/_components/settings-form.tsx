"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Partner } from "@/lib/types";
import { updatePartnerSettings } from "../_actions";

export function SettingsForm({ partner }: { partner: Partner }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setMessage(null);

    const result = await updatePartnerSettings(formData);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({
        type: "success",
        text: "Einstellungen erfolgreich gespeichert.",
      });
    }
    setPending(false);
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Suchprofil</CardTitle>
        <CardDescription>
          Passe an, welche Kandidaten du suchst und wie viele Stellen offen
          sind.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="offene_stellen">Offene Stellen</Label>
            <Input
              id="offene_stellen"
              name="offene_stellen"
              type="number"
              min={0}
              defaultValue={partner.offene_stellen}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="suchradius_km">Suchradius (km)</Label>
            <Input
              id="suchradius_km"
              name="suchradius_km"
              type="number"
              min={0}
              defaultValue={partner.suchradius_km}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gesuchte_profile">Gesuchte Profile</Label>
            <Input
              id="gesuchte_profile"
              name="gesuchte_profile"
              defaultValue={partner.gesuchte_profile.join(", ")}
              placeholder="z.B. Telko, Energie, Glasfaser"
            />
            <p className="text-xs text-muted-foreground">
              Mehrere Profile mit Komma trennen
            </p>
          </div>

          {message && (
            <p
              className={`text-sm ${message.type === "error" ? "text-destructive" : "text-green-600"}`}
            >
              {message.text}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Wird gespeichert..." : "Speichern"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
