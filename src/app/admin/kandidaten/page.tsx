import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Candidate } from "@/lib/types";
import { STAGE_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StageBadge } from "./_components/stage-badge";

export default async function KandidatenListPage() {
  const supabase = await createClient();

  const { data: candidates, error } = await supabase
    .from("candidates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="text-destructive">Fehler beim Laden: {error.message}</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kandidaten</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {candidates?.length ?? 0} Kandidaten insgesamt
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/kandidaten/board"
            className="text-sm font-medium text-primary hover:underline"
          >
            Board-Ansicht
          </Link>
          <Link href="/admin/kandidaten/neu">
            <Button>Neuer Kandidat</Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">E-Mail</th>
              <th className="px-4 py-3 font-medium">PLZ / Ort</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Quelle</th>
              <th className="px-4 py-3 font-medium">Erstellt</th>
            </tr>
          </thead>
          <tbody>
            {candidates?.map((c: Candidate) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/kandidaten/${c.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {c.vorname} {c.nachname}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.plz} {c.ort}
                </td>
                <td className="px-4 py-3">
                  <StageBadge stage={c.stage} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.quelle}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString("de-DE")}
                </td>
              </tr>
            ))}
            {(!candidates || candidates.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Noch keine Kandidaten vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
