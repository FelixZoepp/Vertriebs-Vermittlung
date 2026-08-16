import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Placement } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  vorgeschlagen: "bg-blue-100 text-blue-800",
  interview: "bg-amber-100 text-amber-800",
  eingestellt: "bg-green-100 text-green-800",
  abgelehnt: "bg-red-100 text-red-800",
  abgebrochen: "bg-gray-100 text-gray-800",
};

const STATUS_LABELS: Record<string, string> = {
  vorgeschlagen: "Vorgeschlagen",
  interview: "Interview",
  eingestellt: "Eingestellt",
  abgelehnt: "Abgelehnt",
  abgebrochen: "Abgebrochen",
};

export default async function VermittlungenPage() {
  const supabase = await createClient();

  const { data: placements } = await supabase
    .from("placements")
    .select(
      "*, candidates(vorname, nachname, plz, ort), partners(firmenname, ort)"
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vermittlungen</h1>
        <Link href="/admin/vermittlungen/matching">
          <Button>Matching starten</Button>
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-3 pr-4 font-medium">Kandidat</th>
              <th className="pb-3 pr-4 font-medium">Partner</th>
              <th className="pb-3 pr-4 font-medium">Score</th>
              <th className="pb-3 pr-4 font-medium">Status</th>
              <th className="pb-3 pr-4 font-medium">Verträge</th>
              <th className="pb-3 pr-4 font-medium">Vorgeschlagen</th>
              <th className="pb-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(!placements || placements.length === 0) && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  Noch keine Vermittlungen vorhanden.
                </td>
              </tr>
            )}
            {(placements || []).map((p: any) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="py-3 pr-4">
                  <Link
                    href={`/admin/kandidaten/${p.candidate_id}`}
                    className="font-medium hover:underline"
                  >
                    {p.candidates?.vorname} {p.candidates?.nachname}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {p.candidates?.plz} {p.candidates?.ort}
                  </p>
                </td>
                <td className="py-3 pr-4">
                  <Link
                    href={`/admin/partner/${p.partner_id}`}
                    className="hover:underline"
                  >
                    {p.partners?.firmenname}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {p.partners?.ort}
                  </p>
                </td>
                <td className="py-3 pr-4">
                  {p.match_score != null ? (
                    <span className="font-mono font-medium">{p.match_score}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[p.status] || ""
                    }`}
                  >
                    {STATUS_LABELS[p.status] || p.status}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-green-500"
                        style={{
                          width: `${Math.min(100, p.vertraege_gesamt)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono">
                      {p.vertraege_gesamt}/100
                    </span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {new Date(p.vorgeschlagen_am).toLocaleDateString("de-DE")}
                </td>
                <td className="py-3">
                  <Link href={`/admin/vermittlungen/${p.id}`}>
                    <Button variant="ghost" size="sm">
                      Details
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
