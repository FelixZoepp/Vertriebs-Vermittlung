import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PartnerForm } from "./_components/partner-form";

async function createPartner(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const gesuchteProfile = (formData.get("gesuchte_profile") as string)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const { error } = await supabase.from("partners").insert({
    firmenname: formData.get("firmenname") as string,
    ansprechpartner: formData.get("ansprechpartner") as string,
    email: formData.get("email") as string,
    telefon: (formData.get("telefon") as string) || null,
    strasse: (formData.get("strasse") as string) || null,
    plz: (formData.get("plz") as string) || null,
    ort: (formData.get("ort") as string) || null,
    branche: (formData.get("branche") as string) || null,
    gesuchte_profile: gesuchteProfile,
    offene_stellen: parseInt(formData.get("offene_stellen") as string) || 0,
    suchradius_km:
      parseInt(formData.get("suchradius_km") as string) || 50,
    status: "interessent",
  });

  if (error) {
    throw new Error(`Partner konnte nicht erstellt werden: ${error.message}`);
  }

  revalidatePath("/admin/partner");
  redirect("/admin/partner");
}

export default function NeuerPartnerPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Neuer Partner</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Partnerunternehmen manuell anlegen
      </p>

      <PartnerForm action={createPartner} />
    </div>
  );
}
