"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerPartner } from "../_actions";
import {
  Building2,
  User,
  MapPin,
  Briefcase,
  Loader2,
} from "lucide-react";

export function RegistrierenForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError("");

    const result = await registerPartner(formData);

    // If we get here, it means redirect didn't happen (error case)
    if (!result.success) {
      setError(result.error || "Unbekannter Fehler");
    }
    setPending(false);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
      <form action={handleSubmit} className="space-y-8 p-6 sm:p-8">
        {/* Section: Unternehmen */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white/60">
            <Building2 className="h-4 w-4 text-red-500/70" />
            <span>Unternehmen</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="firmenname" className="text-white/70">
              Firmenname *
            </Label>
            <Input
              id="firmenname"
              name="firmenname"
              required
              placeholder="Muster GmbH"
              className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-red-500/50 focus-visible:ring-red-500/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branche" className="text-white/70">
              Branche
            </Label>
            <Input
              id="branche"
              name="branche"
              placeholder="z.B. Telekommunikation, Energie, Versicherung"
              className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-red-500/50 focus-visible:ring-red-500/20"
            />
          </div>
        </div>

        {/* Section: Ansprechpartner */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white/60">
            <User className="h-4 w-4 text-red-500/70" />
            <span>Ansprechpartner</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ansprechpartner" className="text-white/70">
              Name *
            </Label>
            <Input
              id="ansprechpartner"
              name="ansprechpartner"
              required
              placeholder="Max Mustermann"
              className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-red-500/50 focus-visible:ring-red-500/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/70">
              E-Mail *
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="max@mustergmbh.de"
              className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-red-500/50 focus-visible:ring-red-500/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/70">
              Passwort *
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Mindestens 8 Zeichen"
              className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-red-500/50 focus-visible:ring-red-500/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefon" className="text-white/70">
              Telefon
            </Label>
            <Input
              id="telefon"
              name="telefon"
              type="tel"
              placeholder="+49 123 456789"
              className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-red-500/50 focus-visible:ring-red-500/20"
            />
          </div>
        </div>

        {/* Section: Standort */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white/60">
            <MapPin className="h-4 w-4 text-red-500/70" />
            <span>Standort</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="strasse" className="text-white/70">
              Strasse
            </Label>
            <Input
              id="strasse"
              name="strasse"
              placeholder="Musterstrasse 1"
              className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-red-500/50 focus-visible:ring-red-500/20"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="plz" className="text-white/70">
                PLZ
              </Label>
              <Input
                id="plz"
                name="plz"
                maxLength={5}
                placeholder="10115"
                className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-red-500/50 focus-visible:ring-red-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ort" className="text-white/70">
                Ort
              </Label>
              <Input
                id="ort"
                name="ort"
                placeholder="Berlin"
                className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-red-500/50 focus-visible:ring-red-500/20"
              />
            </div>
          </div>
        </div>

        {/* Section: Stellenprofil */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white/60">
            <Briefcase className="h-4 w-4 text-red-500/70" />
            <span>Stellenprofil</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="offene_stellen" className="text-white/70">
                Offene Stellen
              </Label>
              <Input
                id="offene_stellen"
                name="offene_stellen"
                type="number"
                min={1}
                defaultValue={1}
                className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-red-500/50 focus-visible:ring-red-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="suchradius_km" className="text-white/70">
                Suchradius (km)
              </Label>
              <Input
                id="suchradius_km"
                name="suchradius_km"
                type="number"
                min={5}
                defaultValue={50}
                className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-red-500/50 focus-visible:ring-red-500/20"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Button
            type="submit"
            className="h-12 w-full rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-base font-semibold text-white shadow-lg shadow-red-500/20 hover:from-red-700 hover:to-red-800"
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird erstellt...
              </>
            ) : (
              "Registrieren & Abo starten — 299 \u20AC/Monat"
            )}
          </Button>
          <p className="text-center text-xs text-white/30">
            Nach der Registrierung wirst du zur sicheren Zahlung ueber Stripe
            weitergeleitet. Monatlich kuendbar.
          </p>
        </div>
      </form>
    </div>
  );
}
