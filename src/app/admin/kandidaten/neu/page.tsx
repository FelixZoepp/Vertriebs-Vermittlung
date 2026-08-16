import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CandidateForm } from "./_components/candidate-form";

async function createCandidate(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const branchenerfahrung = (formData.get("branchenerfahrung") as string)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const { error } = await supabase.from("candidates").insert({
    vorname: formData.get("vorname") as string,
    nachname: formData.get("nachname") as string,
    email: formData.get("email") as string,
    telefon: (formData.get("telefon") as string) || null,
    plz: (formData.get("plz") as string) || null,
    ort: (formData.get("ort") as string) || null,
    quelle: formData.get("quelle") as string,
    quelle_detail: (formData.get("quelle_detail") as string) || null,
    erfahrung_jahre: parseInt(formData.get("erfahrung_jahre") as string) || 0,
    branchenerfahrung,
    fuehrerschein: formData.get("fuehrerschein") === "on",
    verfuegbar_ab: (formData.get("verfuegbar_ab") as string) || null,
    umkreis_bereitschaft_km:
      parseInt(formData.get("umkreis_bereitschaft_km") as string) || 50,
    stage: "eingang",
    stage_changed_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Kandidat konnte nicht erstellt werden: ${error.message}`);
  }

  revalidatePath("/admin/kandidaten");
  redirect("/admin/kandidaten");
}

export default function NeuerKandidatPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Neuer Kandidat</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Kandidat manuell anlegen
      </p>

      <CandidateForm action={createCandidate} />
    </div>
  );
}
