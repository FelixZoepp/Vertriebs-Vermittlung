import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Building2, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "D2D Vertriebsjobs in Deutschland | Zoepp Media",
  description:
    "Finde D2D Vertriebsjobs in deiner Stadt. Wir vermitteln Vertriebler kostenlos an Top-Unternehmen in ganz Deutschland. Jetzt bewerben!",
  openGraph: {
    title: "D2D Vertriebsjobs in Deutschland | Zoepp Media",
    description:
      "Finde D2D Vertriebsjobs in deiner Stadt. Kostenlose Vermittlung an Top-Unternehmen.",
    type: "website",
  },
};

const CITIES = [
  { slug: "berlin", name: "Berlin", region: "Berlin" },
  { slug: "hamburg", name: "Hamburg", region: "Hamburg" },
  { slug: "muenchen", name: "Muenchen", region: "Bayern" },
  { slug: "koeln", name: "Koeln", region: "Nordrhein-Westfalen" },
  { slug: "frankfurt", name: "Frankfurt am Main", region: "Hessen" },
  { slug: "stuttgart", name: "Stuttgart", region: "Baden-Wuerttemberg" },
  { slug: "duesseldorf", name: "Duesseldorf", region: "Nordrhein-Westfalen" },
  { slug: "dortmund", name: "Dortmund", region: "Nordrhein-Westfalen" },
  { slug: "essen", name: "Essen", region: "Nordrhein-Westfalen" },
  { slug: "leipzig", name: "Leipzig", region: "Sachsen" },
  { slug: "bremen", name: "Bremen", region: "Bremen" },
  { slug: "dresden", name: "Dresden", region: "Sachsen" },
  { slug: "hannover", name: "Hannover", region: "Niedersachsen" },
  { slug: "nuernberg", name: "Nuernberg", region: "Bayern" },
  { slug: "duisburg", name: "Duisburg", region: "Nordrhein-Westfalen" },
  { slug: "bochum", name: "Bochum", region: "Nordrhein-Westfalen" },
  { slug: "wuppertal", name: "Wuppertal", region: "Nordrhein-Westfalen" },
  { slug: "bielefeld", name: "Bielefeld", region: "Nordrhein-Westfalen" },
  { slug: "bonn", name: "Bonn", region: "Nordrhein-Westfalen" },
  { slug: "mannheim", name: "Mannheim", region: "Baden-Wuerttemberg" },
];

export default function VertriebsjobsOverview() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1a0505] via-[#2d0a0a] to-[#0d0507] py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
            D2D Vertriebsjobs in{" "}
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              ganz Deutschland
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">
            Finde Vertriebsjobs in deiner Stadt. Wir vermitteln dich kostenlos
            an Top-Unternehmen in deiner Region.
          </p>
        </div>
      </section>

      {/* City grid */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 flex items-center gap-3">
            <Building2 className="h-5 w-5 text-red-500" />
            <h2 className="text-xl font-semibold">Alle Standorte</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/vertriebsjobs/${city.slug}`}
                className="group flex items-center justify-between rounded-xl border bg-card p-4 transition-all hover:border-red-500/30 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                    <MapPin className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <div className="font-medium">{city.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {city.region}
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-red-500" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30 py-12">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold">
            Deine Stadt ist nicht dabei?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Kein Problem — wir vermitteln deutschlandweit. Bewirb dich einfach
            und wir finden Partner in deiner Region.
          </p>
          <Link
            href="/bewerben"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-6 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:from-red-700 hover:to-red-800"
          >
            Jetzt bewerben
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
