import { createClient } from "@/lib/supabase/server";
import type { Candidate } from "@/lib/types";
import { CandidatesTable } from "./_components/candidates-table";

export default async function KandidatenListPage() {
  const supabase = await createClient();

  const { data: candidates, error } = await supabase
    .from("candidates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="text-destructive">Fehler beim Laden: {error.message}</p>;
  }

  return <CandidatesTable candidates={(candidates ?? []) as Candidate[]} />;
}
