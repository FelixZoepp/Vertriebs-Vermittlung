"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface CandidateFormProps {
  action: (formData: FormData) => Promise<void>;
}

export function CandidateForm({ action }: CandidateFormProps) {
  return (
    <form action={action} className="mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Persoenliche Daten</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="vorname">Vorname *</Label>
            <Input id="vorname" name="vorname" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nachname">Nachname *</Label>
            <Input id="nachname" name="nachname" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail *</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefon">Telefon</Label>
            <Input id="telefon" name="telefon" type="tel" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plz">PLZ</Label>
            <Input id="plz" name="plz" maxLength={5} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ort">Ort</Label>
            <Input id="ort" name="ort" />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Qualifikation</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
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
            <Label htmlFor="branchenerfahrung">
              Branchenerfahrung (kommagetrennt)
            </Label>
            <Input
              id="branchenerfahrung"
              name="branchenerfahrung"
              placeholder="Energie, Telko, Glasfaser"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="umkreis_bereitschaft_km">
              Umkreisbereitschaft (km)
            </Label>
            <Input
              id="umkreis_bereitschaft_km"
              name="umkreis_bereitschaft_km"
              type="number"
              min={0}
              defaultValue={50}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="verfuegbar_ab">Verfuegbar ab</Label>
            <Input id="verfuegbar_ab" name="verfuegbar_ab" type="date" />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              id="fuehrerschein"
              name="fuehrerschein"
              type="checkbox"
              className="size-4 rounded border-input accent-primary"
            />
            <Label htmlFor="fuehrerschein">Fuehrerschein vorhanden</Label>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Herkunft</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="quelle">Quelle *</Label>
            <select
              id="quelle"
              name="quelle"
              required
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Bitte waehlen</option>
              <option value="reel">Reel</option>
              <option value="organisch">Organisch</option>
              <option value="empfehlung">Empfehlung</option>
              <option value="anzeige">Anzeige</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quelle_detail">Quelle Detail</Label>
            <Input
              id="quelle_detail"
              name="quelle_detail"
              placeholder="z.B. Instagram Reel #42"
            />
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button type="submit">Kandidat anlegen</Button>
        </CardFooter>
      </Card>
    </form>
  );
}
