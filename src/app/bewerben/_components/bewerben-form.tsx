"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitBewerbung } from "../_actions";
import { CheckCircle2 } from "lucide-react";

export function BewerbenForm({ refParam }: { refParam: string | null }) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError("");

    const result = await submitBewerbung(formData);

    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error || "Unbekannter Fehler");
    }
    setPending(false);
  }

  if (submitted) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <CheckCircle2 className="size-12 text-green-600" />
          <h2 className="text-xl font-bold">Vielen Dank!</h2>
          <p className="text-muted-foreground">
            Deine Bewerbung ist bei uns eingegangen. Wir melden uns in
            Kürze bei dir.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Deine Bewerbung</CardTitle>
        <CardDescription>
          Alle mit * markierten Felder sind Pflichtfelder.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-5">
          <input type="hidden" name="quelle_detail" value={refParam ?? ""} />

          {/* Name */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vorname">Vorname *</Label>
              <Input id="vorname" name="vorname" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nachname">Nachname *</Label>
              <Input id="nachname" name="nachname" required />
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail *</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefon">Telefon</Label>
            <Input id="telefon" name="telefon" type="tel" />
          </div>

          {/* Location */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="plz">PLZ</Label>
              <Input id="plz" name="plz" maxLength={5} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ort">Ort</Label>
              <Input id="ort" name="ort" />
            </div>
          </div>

          {/* Experience */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="erfahrung_jahre">Erfahrung (Jahre)</Label>
              <Input
                id="erfahrung_jahre"
                name="erfahrung_jahre"
                type="number"
                min={0}
                defaultValue={0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="umkreis_bereitschaft_km">
                Umkreis-Bereitschaft (km)
              </Label>
              <Input
                id="umkreis_bereitschaft_km"
                name="umkreis_bereitschaft_km"
                type="number"
                min={0}
                defaultValue={30}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="branchenerfahrung">Branchenerfahrung</Label>
            <Input
              id="branchenerfahrung"
              name="branchenerfahrung"
              placeholder="z.B. Telko, Energie, Versicherung"
            />
            <p className="text-xs text-muted-foreground">
              Mehrere Branchen mit Komma trennen
            </p>
          </div>

          {/* Availability */}
          <div className="space-y-2">
            <Label htmlFor="verfuegbar_ab">Verfügbar ab</Label>
            <Input id="verfuegbar_ab" name="verfuegbar_ab" type="date" />
          </div>

          {/* Führerschein */}
          <div className="flex items-center gap-2">
            <input
              id="fuehrerschein"
              name="fuehrerschein"
              type="checkbox"
              className="size-4 rounded border-input accent-primary"
            />
            <Label htmlFor="fuehrerschein">Ich habe einen Führerschein</Label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Wird gesendet..." : "Jetzt bewerben"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
