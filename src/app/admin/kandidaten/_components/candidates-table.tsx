"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Candidate, Stage } from "@/lib/types";
import { STAGES, STAGE_LABELS } from "@/lib/types";
import { StageBadge } from "./stage-badge";
import { Search, LayoutGrid, Plus, Phone } from "lucide-react";

function getDaysInStage(stageChangedAt: string): number {
  const changed = new Date(stageChangedAt);
  const now = new Date();
  return Math.floor((now.getTime() - changed.getTime()) / (1000 * 60 * 60 * 24));
}

const FILTER_STAGES: { value: Stage | "alle"; label: string }[] = [
  { value: "alle", label: "Alle" },
  { value: "eingang", label: "Eingang" },
  { value: "kontaktiert", label: "Kontaktiert" },
  { value: "erstgespraech", label: "Erstgespraech" },
  { value: "qualifiziert", label: "Qualifiziert" },
  { value: "masterclass_laeuft", label: "MC laeuft" },
  { value: "masterclass_abgeschlossen", label: "MC fertig" },
  { value: "vorgestellt", label: "Vorgestellt" },
  { value: "interview", label: "Interview" },
  { value: "eingestellt", label: "Eingestellt" },
  { value: "abgelehnt", label: "Abgelehnt" },
];

interface CandidatesTableProps {
  candidates: Candidate[];
}

export function CandidatesTable({ candidates }: CandidatesTableProps) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "alle">("alle");

  const filtered = useMemo(() => {
    let result = candidates;

    // Stage filter
    if (stageFilter !== "alle") {
      result = result.filter((c) => c.stage === stageFilter);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          `${c.vorname} ${c.nachname}`.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.plz && c.plz.toLowerCase().includes(q)) ||
          (c.ort && c.ort.toLowerCase().includes(q)) ||
          (c.telefon && c.telefon.includes(q))
      );
    }

    return result;
  }, [candidates, search, stageFilter]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kandidaten</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} von {candidates.length} Kandidaten
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/kandidaten/board"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            <LayoutGrid className="size-4" />
            Board-Ansicht
          </Link>
          <Link href="/admin/kandidaten/neu">
            <Button className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800">
              <Plus className="size-4" />
              Neuer Kandidat
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="mt-4 relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suche nach Name, E-Mail, PLZ, Ort oder Telefon..."
          className="pl-9"
        />
      </div>

      {/* Stage Filter */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {FILTER_STAGES.map(({ value, label }) => {
          const isActive = stageFilter === value;
          const count =
            value === "alle"
              ? candidates.length
              : candidates.filter((c) => c.stage === value).length;

          return (
            <button
              key={value}
              onClick={() => setStageFilter(value)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "border-red-600/50 bg-red-600/10 text-red-600 dark:border-red-500/50 dark:bg-red-500/10 dark:text-red-400"
                  : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {label}
              <span className="tabular-nums">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">E-Mail</th>
              <th className="px-4 py-3 font-medium">Telefon</th>
              <th className="px-4 py-3 font-medium">PLZ / Ort</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Tage</th>
              <th className="px-4 py-3 font-medium">Quelle</th>
              <th className="px-4 py-3 font-medium">Erstellt</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const daysInStage = getDaysInStage(c.stage_changed_at);
              const isStale = daysInStage >= 7;

              return (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/kandidaten/${c.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {c.vorname} {c.nachname}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-3">
                    {c.telefon ? (
                      <a
                        href={`tel:${c.telefon}`}
                        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Phone className="size-3" />
                        {c.telefon}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">&mdash;</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.plz} {c.ort}
                  </td>
                  <td className="px-4 py-3">
                    <StageBadge stage={c.stage} />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs tabular-nums ${
                        isStale ? "font-medium text-red-600" : "text-muted-foreground"
                      }`}
                    >
                      {daysInStage}d
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.quelle}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString("de-DE")}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  {search || stageFilter !== "alle"
                    ? "Keine Kandidaten gefunden."
                    : "Noch keine Kandidaten vorhanden."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
