import type { Metadata } from "next";
import { RegistrierenForm } from "./_components/registrieren-form";
import { Shield, Clock, CreditCard } from "lucide-react";

export const metadata: Metadata = {
  title: "Partner-Registrierung – Zoepp Media Vertriebsvermittlung",
  description:
    "Registriere dein Unternehmen und erhalte Zugang zu qualifizierten D2D-Vertrieblern.",
};

export default async function RegistrierenPage({
  searchParams,
}: {
  searchParams: Promise<{ abgebrochen?: string }>;
}) {
  const { abgebrochen } = await searchParams;

  return (
    <div className="px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Partner{" "}
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              werden
            </span>
          </h1>
          <p className="mt-3 text-white/50">
            Erstelle dein Firmenprofil und starte mit dem Recruiting
          </p>
        </div>

        {/* Trust indicators */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-white/40">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-red-500/60" />
            <span>SSL-verschluesselt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-red-500/60" />
            <span>In 3 Min. fertig</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-red-500/60" />
            <span>Sicher ueber Stripe</span>
          </div>
        </div>

        {abgebrochen && (
          <div className="mt-6 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
            Der Bezahlvorgang wurde abgebrochen. Du kannst es jederzeit erneut
            versuchen.
          </div>
        )}

        <div className="mt-8">
          <RegistrierenForm />
        </div>
      </div>
    </div>
  );
}
