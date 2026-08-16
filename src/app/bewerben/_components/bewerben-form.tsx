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
import { CheckCircle2, User, Briefcase, MapPin } from "lucide-react";

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
      <Card className="border border-green-200 bg-green-50/50 shadow-lg shadow-green-500/5 dark:border-green-900/50 dark:bg-green-950/20">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold">Vielen Dank!</h2>
          <p className="max-w-sm text-muted-foreground">
            Deine Bewerbung ist bei uns eingegangen. Wir melden uns innerhalb
            von 48 Stunden bei dir.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-lg shadow-black/5">
      <CardHeader>
        <CardTitle>Deine Bewerbung</CardTitle>
        <CardDescription>
          Alle mit * markierten Felder sind Pflichtfelder.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <input type="hidden" name="quelle_detail" value={refParam ?? ""} />

          {/* Section: Persoenliche Daten */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Persoenliche Daten</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vorname">Vorname *</Label>
                <Input id="vorname" name="vorname" required className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nachname">Nachname *</Label>
                <Input id="nachname" name="nachname" required className="h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail *</Label>
              <Input id="email" name="email" type="email" required className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefon">Telefon</Label>
              <Input id="telefon" name="telefon" type="tel" className="h-11" />
            </div>
          </div>

          {/* Section: Standort */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Standort</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="plz">PLZ</Label>
                <Input id="plz" name="plz" maxLength={5} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ort">Ort</Label>
                <Input id="ort" name="ort" className="h-11" />
              </div>
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
                className="h-11"
              />
            </div>
          </div>

          {/* Section: Qualifikation */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              <span>Qualifikation</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="erfahrung_jahre">Erfahrung (Jahre)</Label>
              <Input
                id="erfahrung_jahre"
                name="erfahrung_jahre"
                type="number"
                min={0}
                defaultValue={0}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branchenerfahrung">Branchenerfahrung</Label>
              <Input
                id="branchenerfahrung"
                name="branchenerfahrung"
                placeholder="z.B. Telko, Energie, Versicherung"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Mehrere Branchen mit Komma trennen
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="verfuegbar_ab">Verfügbar ab</Label>
              <Input id="verfuegbar_ab" name="verfuegbar_ab" type="date" className="h-11" />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="fuehrerschein"
                name="fuehrerschein"
                type="checkbox"
                className="size-4 rounded border-input accent-red-600"
              />
              <Label htmlFor="fuehrerschein">Ich habe einen Führerschein</Label>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            className="h-11 w-full bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/20 hover:from-red-700 hover:to-red-800"
            disabled={pending}
          >
            {pending ? "Wird gesendet..." : "Jetzt bewerben"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
