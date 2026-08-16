import { createServiceClient } from "@/lib/supabase/server";
import { randomUUID } from "node:crypto";

export interface CandidateAccountResult {
  userId: string;
  email: string;
  temporaryPassword: string;
}

/**
 * R1: Auto-create a Supabase auth account for a candidate when they reach "qualifiziert".
 *
 * Idempotent: if the candidate already has a user_id, skips creation and returns null.
 * Creates the user with email_confirm: true so they can log in immediately via magic link.
 */
export async function createCandidateAccount(
  candidateId: number
): Promise<CandidateAccountResult | null> {
  const supabase = await createServiceClient();

  // Fetch candidate
  const { data: candidate, error: fetchError } = await supabase
    .from("candidates")
    .select("id, email, vorname, nachname, user_id")
    .eq("id", candidateId)
    .single();

  if (fetchError || !candidate) {
    throw new Error(
      `Kandidat ${candidateId} nicht gefunden: ${fetchError?.message}`
    );
  }

  // Idempotent: skip if already linked
  if (candidate.user_id) {
    return null;
  }

  const temporaryPassword = randomUUID();

  // Create Supabase auth user
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: candidate.email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        role: "candidate",
        name: `${candidate.vorname} ${candidate.nachname}`,
      },
    });

  if (authError) {
    throw new Error(
      `Auth-User konnte nicht erstellt werden: ${authError.message}`
    );
  }

  const userId = authData.user.id;

  // Link candidate row to the new auth user
  const { error: updateError } = await supabase
    .from("candidates")
    .update({ user_id: userId })
    .eq("id", candidateId);

  if (updateError) {
    throw new Error(
      `user_id konnte nicht gesetzt werden: ${updateError.message}`
    );
  }

  return { userId, email: candidate.email, temporaryPassword };
}
