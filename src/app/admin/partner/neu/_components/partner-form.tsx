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
import { BRANCHEN } from "@/lib/types";

interface PartnerFormProps {
  action: (formData: FormData) => Promise<void>;
}

export function PartnerForm({ action }: PartnerFormProps) {
  return (
    <form action={action} className="mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Firmendaten</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="firmenname">Firmenname *</Label>
            <Input id="firmenname" name="firmenname" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ansprechpartner">Ansprechpartner *</Label>
            <Input id="ansprechpartner" name="ansprechpartner" required />
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
            <Label htmlFor="branche">Branche</Label>
            <Input id="branche" name="branche" placeholder="z.B. Energie" />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Adresse</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="strasse">Strasse</Label>
            <Input id="strasse" name="strasse" />
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
          <CardTitle>Stellenprofil</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Gesuchte Vertriebsbereiche</Label>
            <div className="space-y-2">
              {BRANCHEN.map((b) => (
                <label
                  key={b}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    name="gesuchte_profile"
                    value={b}
                    defaultChecked={b === "D2D Vertrieb"}
                    className="size-4 rounded border-input accent-primary"
                  />
                  {b}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="offene_stellen">Offene Stellen</Label>
            <Input
              id="offene_stellen"
              name="offene_stellen"
              type="number"
              min={0}
              defaultValue={0}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="suchradius_km">Suchradius (km, max 100)</Label>
            <Input
              id="suchradius_km"
              name="suchradius_km"
              type="number"
              min={0}
              max={100}
              defaultValue={50}
            />
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button type="submit">Partner anlegen</Button>
        </CardFooter>
      </Card>
    </form>
  );
}
