import { BewerbenForm } from "./_components/bewerben-form";
import { Building2, Clock, Shield } from "lucide-react";

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
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Werde Vertriebler bei{" "}
          <span className="bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
            Top-Unternehmen
          </span>
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Bewirb dich jetzt und starte deine Karriere im Vertrieb
        </p>
      </div>

      {/* Trust indicators */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-red-500" />
          <span>100+ Partnerunternehmen</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-red-500" />
          <span>Kostenlos bewerben</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-red-500" />
          <span>Innerhalb von 48h Rückmeldung</span>
        </div>
      </div>

      <BewerbenForm refParam={ref ?? null} />
    </div>
  );
}
