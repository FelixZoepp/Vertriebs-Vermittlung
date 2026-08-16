"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import type { Stage } from "@/lib/types";
import {
  isValidTransition,
  shouldUnlockMasterclass,
  requiresRejectionReason,
} from "@/lib/rules/stage-transition";
import { createCandidateAccount } from "@/lib/rules/candidate-account";
import {
  sendMasterclassFreischaltung,
  sendVermittelbarBenachrichtigung,
  sendAdminNeuerVermittelbarer,
} from "@/lib/integrations/resend";

export async function changeStageAction(
  candidateId: number,
  fromStage: Stage,
  toStage: Stage,
  rejectionReason?: string
): Promise<{ error?: string } | undefined> {
  if (!isValidTransition(fromStage, toStage)) {
    return {
      error: `Ungueltige Stage-Transition: ${fromStage} -> ${toStage}`,
    };
  }

  if (requiresRejectionReason(toStage) && !rejectionReason?.trim()) {
    return { error: "Ablehnungsgrund ist erforderlich." };
  }

  const user = await getAuthUser();
  const supabase = await createClient();
  const now = new Date().toISOString();

  // Build the update object
  const updateData: Record<string, unknown> = {
    stage: toStage,
    stage_changed_at: now,
  };

  if (requiresRejectionReason(toStage) && rejectionReason?.trim()) {
    updateData.ablehnungsgrund = rejectionReason.trim();
  }

  // R1: Set masterclass_freigeschaltet_am when transitioning to 'qualifiziert'
  if (shouldUnlockMasterclass(toStage)) {
    updateData.masterclass_freigeschaltet_am = now;
  }

  const { error: updateError } = await supabase
    .from("candidates")
    .update(updateData)
    .eq("id", candidateId);

  if (updateError) {
    return { error: `Fehler beim Aktualisieren: ${updateError.message}` };
  }

  // R1: Create auth account & send masterclass email with magic link
  if (shouldUnlockMasterclass(toStage)) {
    let temporaryPassword: string | undefined;

    // Create candidate auth account (idempotent)
    try {
      const accountResult = await createCandidateAccount(candidateId);
      if (accountResult) {
        temporaryPassword = accountResult.temporaryPassword;
      }
    } catch (err) {
      console.error("Candidate account creation failed:", err);
    }

    // Fetch candidate data & generate magic link
    const { data: candidate } = await supabase
      .from("candidates")
      .select("email, vorname")
      .eq("id", candidateId)
      .single();

    if (candidate) {
      let loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://vertriebs-vermittlung.vercel.app"}/login`;

      // Generate magic link via admin API
      try {
        const serviceClient = await createServiceClient();
        const { data: linkData } =
          await serviceClient.auth.admin.generateLink({
            type: "magiclink",
            email: candidate.email,
          });
        if (linkData?.properties?.action_link) {
          loginUrl = linkData.properties.action_link;
        }
      } catch (err) {
        console.error("Magic link generation failed:", err);
      }

      sendMasterclassFreischaltung(
        candidate.email,
        candidate.vorname,
        loginUrl,
        temporaryPassword
      ).catch(() => {});
    }
  }

  // Send notifications when transitioning to vermittelbar
  if (toStage === "vermittelbar") {
    const { data: candidateForEmail } = await supabase
      .from("candidates")
      .select("email, vorname, nachname")
      .eq("id", candidateId)
      .single();

    if (candidateForEmail) {
      const kandidatName = `${candidateForEmail.vorname} ${candidateForEmail.nachname}`;
      const adminEmail =
        process.env.ADMIN_EMAIL || "felixbusinessmail@gmx.de";

      // Fire-and-forget: congratulations email to candidate
      sendVermittelbarBenachrichtigung(
        candidateForEmail.email,
        candidateForEmail.vorname
      ).catch(() => {});

      // Fire-and-forget: admin notification
      sendAdminNeuerVermittelbarer(
        adminEmail,
        kandidatName,
        candidateId
      ).catch(() => {});
    }
  }

  // Log to activity_log
  const { error: logError } = await supabase.from("activity_log").insert({
    entity_typ: "candidate",
    entity_id: candidateId,
    aktion: "stage_change",
    akteur_id: user.id,
    payload: {
      from: fromStage,
      to: toStage,
      ...(rejectionReason?.trim() ? { ablehnungsgrund: rejectionReason.trim() } : {}),
    },
  });

  if (logError) {
    console.error("Activity log error:", logError.message);
  }

  revalidatePath(`/admin/kandidaten/${candidateId}`);
  revalidatePath("/admin/kandidaten");
}
