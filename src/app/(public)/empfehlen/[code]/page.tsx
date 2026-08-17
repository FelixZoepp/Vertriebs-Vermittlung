import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Gift, Users } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Empfehlung annehmen | Zoepp Media Vertriebsvermittlung",
  description:
    "Ein Freund hat dir einen D2D-Vertriebsjob empfohlen. Bewirb dich jetzt kostenlos!",
};

async function getReferrerName(
  candidateId: number
): Promise<string | null> {
  try {
    const supabase = await createServiceClient();
    const { data } = await supabase
      .from("candidates")
      .select("vorname")
      .eq("id", candidateId)
      .single();
    return data?.vorname ?? null;
  } catch {
    return null;
  }
}

export default async function EmpfehlenPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  // The code is just the candidate ID
  const candidateId = parseInt(code, 10);
  if (isNaN(candidateId)) {
    redirect("/bewerben");
  }

  const referrerName = await getReferrerName(candidateId);

  if (!referrerName) {
    redirect("/bewerben");
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1a0505] via-[#2d0a0a] to-[#0d0507] py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-red-700/20 ring-1 ring-red-500/30">
            <Gift className="h-8 w-8 text-red-400" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {referrerName} empfiehlt dir einen{" "}
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Vertriebsjob
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-white/60">
            Dein Freund {referrerName} arbeitet bereits als Vertriebler und
            empfiehlt dir, dich ebenfalls zu bewerben. Die Vermittlung ist
            komplett kostenlos.
          </p>

          <Link
            href={`/bewerben?ref=ref_${candidateId}`}
            className="mt-10 inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-8 text-base font-semibold text-white shadow-lg shadow-red-500/30 transition-all hover:from-red-700 hover:to-red-800 hover:shadow-xl hover:shadow-red-500/40"
          >
            Jetzt kostenlos bewerben
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Warum sich eine Bewerbung lohnt
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-5 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-red-500" />
              <h3 className="font-semibold">Empfohlen</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Du wurdest persoenlich empfohlen — das zeigt, dass der Job sich
                lohnt.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5 text-center">
              <Gift className="mx-auto mb-3 h-8 w-8 text-red-500" />
              <h3 className="font-semibold">Kostenlos</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Die Vermittlung ist fuer dich komplett kostenlos. Kein Haken.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5 text-center">
              <ArrowRight className="mx-auto mb-3 h-8 w-8 text-red-500" />
              <h3 className="font-semibold">Schnell</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Innerhalb von 48 Stunden bekommst du passende Angebote.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href={`/bewerben?ref=ref_${candidateId}`}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-6 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:from-red-700 hover:to-red-800"
            >
              Jetzt bewerben
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
