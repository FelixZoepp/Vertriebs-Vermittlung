"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";

export async function addNoteAction(
  entityTyp: string,
  entityId: number,
  inhalt: string
): Promise<{ error?: string } | undefined> {
  if (!inhalt.trim()) {
    return { error: "Notiz darf nicht leer sein." };
  }

  const user = await getAuthUser();
  const supabase = await createClient();

  const { error: insertError } = await supabase.from("notes").insert({
    entity_typ: entityTyp,
    entity_id: entityId,
    inhalt: inhalt.trim(),
    autor_id: user.id,
  });

  if (insertError) {
    return { error: `Fehler beim Speichern: ${insertError.message}` };
  }

  // Also log to activity_log
  await supabase.from("activity_log").insert({
    entity_typ: entityTyp,
    entity_id: entityId,
    aktion: "notiz_hinzugefuegt",
    akteur_id: user.id,
    payload: { inhalt: inhalt.trim().slice(0, 100) },
  });

  revalidatePath(`/admin/kandidaten/${entityId}`);
}
