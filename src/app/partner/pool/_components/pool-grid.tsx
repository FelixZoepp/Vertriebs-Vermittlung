"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { anfrageKandidat } from "../_actions";
import {
  MapPin,
  Briefcase,
  Car,
  GraduationCap,
  CalendarClock,
  Search,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export interface PoolCandidate {
  id: number;
  anzeigeName: string;
  ort: string | null;
  plz: string | null;
  erfahrungJahre: number;
  branchen: string[];
  fuehrerschein: boolean;
  verfuegbarAb: string | null;
  masterclassAbgeschlossen: boolean;
  umkreisKm: number;
  score: number | null;
  distanzKm: number | null;
  bereitsAngefragt: boolean;
}

export function PoolGrid({
  candidates,
  suchradiusKm,
}: {
  candidates: PoolCandidate[];
  suchradiusKm: number;
}) {
  const [suche, setSuche] = useState("");
  const [nurMatches, setNurMatches] = useState(false);
  const [angefragt, setAngefragt] = useState<Set<number>>(new Set());
  const [fehler, setFehler] = useState<Record<number, string>>({});
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase();
    return candidates.filter((c) => {
      if (nurMatches && c.score === null) return false;
      if (!q) return true;
      return (
        c.ort?.toLowerCase().includes(q) ||
        c.branchen.some((b) => b.toLowerCase().includes(q))
      );
    });
  }, [candidates, suche, nurMatches]);

  function handleAnfrage(id: number) {
    setPendingId(id);
    setFehler((f) => ({ ...f, [id]: "" }));
    startTransition(async () => {
      const result = await anfrageKandidat(id);
      if (result.success) {
        setAngefragt((prev) => new Set(prev).add(id));
      } else {
        setFehler((f) => ({ ...f, [id]: result.error || "Fehler" }));
      }
      setPendingId(null);
    });
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            placeholder="Ort oder Branche suchen..."
            className="pl-9"
          />
        </div>
        <Button
          variant={nurMatches ? "default" : "outline"}
          size="sm"
          onClick={() => setNurMatches((v) => !v)}
        >
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          Nur Empfehlungen
        </Button>
      </div>

      {gefiltert.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          Keine Kandidaten gefunden.
          {nurMatches &&
            ` Tipp: Erweitere deinen Suchradius (aktuell ${suchradiusKm} km) in den Einstellungen.`}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {gefiltert.map((c) => {
            const istAngefragt = c.bereitsAngefragt || angefragt.has(c.id);
            const istPending = pendingId === c.id;
            return (
              <div
                key={c.id}
                className="flex flex-col rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{c.anzeigeName}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {c.plz ? `${c.plz} ` : ""}
                      {c.ort || "Ort unbekannt"}
                      {c.distanzKm !== null && ` · ${c.distanzKm} km entfernt`}
                    </p>
                  </div>
                  {c.score !== null ? (
                    <Badge
                      className={
                        c.score >= 70
                          ? "bg-green-500/15 text-green-600 hover:bg-green-500/15"
                          : "bg-amber-500/15 text-amber-600 hover:bg-amber-500/15"
                      }
                    >
                      {c.score}% Match
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Außerhalb Radius
                    </Badge>
                  )}
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-3.5 w-3.5" />
                    {c.erfahrungJahre > 0
                      ? `${c.erfahrungJahre} Jahre D2D-Erfahrung`
                      : "Quereinsteiger"}
                  </p>
                  {c.branchen.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {c.branchen.map((b) => (
                        <Badge key={b} variant="secondary" className="text-xs">
                          {b}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3 pt-1 text-xs text-muted-foreground">
                    {c.fuehrerschein && (
                      <span className="flex items-center gap-1">
                        <Car className="h-3 w-3" /> Führerschein
                      </span>
                    )}
                    {c.masterclassAbgeschlossen && (
                      <span className="flex items-center gap-1 text-red-500">
                        <GraduationCap className="h-3 w-3" /> Masterclass zertifiziert
                      </span>
                    )}
                    {c.verfuegbarAb && (
                      <span className="flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" /> ab{" "}
                        {new Date(c.verfuegbarAb).toLocaleDateString("de-DE")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  {fehler[c.id] && (
                    <p className="mb-2 text-xs text-red-500">{fehler[c.id]}</p>
                  )}
                  {istAngefragt ? (
                    <Button variant="outline" className="w-full" disabled>
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                      Angefragt
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
                      disabled={istPending}
                      onClick={() => handleAnfrage(c.id)}
                    >
                      {istPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Wird angefragt...
                        </>
                      ) : (
                        "Kandidat anfragen"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
