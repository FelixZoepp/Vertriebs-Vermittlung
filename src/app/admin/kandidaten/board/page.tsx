import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import type { Candidate } from "@/lib/types";

export default async function KandidatenBoardPage() {
  const supabase = await createClient();

  const { data: candidates, error } = await supabase
    .from("candidates")
    .select("*")
    .order("stage_changed_at", { ascending: true });

  if (error) {
    return (
      <p className="text-destructive">Fehler beim Laden: {error.message}</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kandidaten-Pipeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {candidates?.length ?? 0} Kandidaten insgesamt
          </p>
        </div>
        <Link
          href="/admin/kandidaten"
          className="text-sm font-medium text-primary hover:underline"
        >
          Listenansicht
        </Link>
      </div>

      <KanbanBoard candidates={(candidates as Candidate[]) ?? []} />
    </div>
  );
}
