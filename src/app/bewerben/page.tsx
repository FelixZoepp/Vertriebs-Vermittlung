import { BewerbenForm } from "./_components/bewerben-form";

export const metadata = {
  title: "Bewirb dich jetzt – Zoepp Media Vertriebsvermittlung",
  description:
    "Werde Vertriebler bei Top-Unternehmen. Bewirb dich jetzt und starte deine Karriere im Vertrieb.",
};

export default async function BewerbenPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Werde Vertriebler bei Top-Unternehmen
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Bewirb dich jetzt und starte deine Karriere im Vertrieb
        </p>
      </div>

      <BewerbenForm refParam={ref ?? null} />
    </div>
  );
}
