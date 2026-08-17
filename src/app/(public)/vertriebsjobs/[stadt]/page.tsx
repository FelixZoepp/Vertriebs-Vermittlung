import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  GraduationCap,
  MapPin,
  Shield,
  Users,
} from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";

const CITY_DATA: Record<
  string,
  { name: string; region: string; description: string }
> = {
  berlin: {
    name: "Berlin",
    region: "Berlin",
    description:
      "Die Hauptstadt bietet ein riesiges Potenzial fuer D2D-Vertrieb — von Energie ueber Glasfaser bis Telko.",
  },
  hamburg: {
    name: "Hamburg",
    region: "Hamburg",
    description:
      "Hamburgs wachsender Markt fuer D2D-Vertrieb bietet hervorragende Verdienstmoeglichkeiten.",
  },
  muenchen: {
    name: "Muenchen",
    region: "Bayern",
    description:
      "Muenchen und Umgebung sind eine der staerksten Regionen fuer D2D-Vertrieb in Deutschland.",
  },
  koeln: {
    name: "Koeln",
    region: "Nordrhein-Westfalen",
    description:
      "Im Grossraum Koeln gibt es zahlreiche Partnerunternehmen im D2D-Vertrieb.",
  },
  frankfurt: {
    name: "Frankfurt am Main",
    region: "Hessen",
    description:
      "Frankfurt und das Rhein-Main-Gebiet bieten starke D2D-Vertriebsmoeglichkeiten.",
  },
  stuttgart: {
    name: "Stuttgart",
    region: "Baden-Wuerttemberg",
    description:
      "Die Region Stuttgart ist ein wichtiger Markt fuer D2D-Vertrieb im Sueden.",
  },
  duesseldorf: {
    name: "Duesseldorf",
    region: "Nordrhein-Westfalen",
    description:
      "Duesseldorf und das Rheinland sind ein Hotspot fuer D2D-Vertriebsjobs.",
  },
  dortmund: {
    name: "Dortmund",
    region: "Nordrhein-Westfalen",
    description:
      "Das Ruhrgebiet rund um Dortmund bietet viele Einstiegsmoeglichkeiten im D2D-Vertrieb.",
  },
  essen: {
    name: "Essen",
    region: "Nordrhein-Westfalen",
    description:
      "Essen und das zentrale Ruhrgebiet sind ein starker Standort fuer D2D-Vertriebler.",
  },
  leipzig: {
    name: "Leipzig",
    region: "Sachsen",
    description:
      "Leipzig waechst rasant und bietet immer mehr Chancen im D2D-Vertrieb.",
  },
  bremen: {
    name: "Bremen",
    region: "Bremen",
    description:
      "Bremen und umzu bieten solide Vertriebsmoeglichkeiten im D2D-Bereich.",
  },
  dresden: {
    name: "Dresden",
    region: "Sachsen",
    description:
      "Dresden und Ostsachsen sind ein aufstrebender Markt fuer D2D-Vertrieb.",
  },
  hannover: {
    name: "Hannover",
    region: "Niedersachsen",
    description:
      "Hannover ist ein zentraler Knotenpunkt fuer D2D-Vertrieb in Norddeutschland.",
  },
  nuernberg: {
    name: "Nuernberg",
    region: "Bayern",
    description:
      "Nuernberg und die Metropolregion Franken bieten viele D2D-Vertriebsjobs.",
  },
  duisburg: {
    name: "Duisburg",
    region: "Nordrhein-Westfalen",
    description:
      "Duisburg im westlichen Ruhrgebiet bietet zahlreiche D2D-Vertriebsmoeglichkeiten.",
  },
  bochum: {
    name: "Bochum",
    region: "Nordrhein-Westfalen",
    description:
      "Bochum liegt zentral im Ruhrgebiet und bietet gute D2D-Vertriebschancen.",
  },
  wuppertal: {
    name: "Wuppertal",
    region: "Nordrhein-Westfalen",
    description:
      "Wuppertal und das Bergische Land sind ein wachsender D2D-Vertriebsstandort.",
  },
  bielefeld: {
    name: "Bielefeld",
    region: "Nordrhein-Westfalen",
    description:
      "Bielefeld und Ostwestfalen bieten spannende Vertriebsmoeglichkeiten im D2D-Bereich.",
  },
  bonn: {
    name: "Bonn",
    region: "Nordrhein-Westfalen",
    description:
      "Bonn und die Region bieten einen stabilen Markt fuer D2D-Vertriebler.",
  },
  mannheim: {
    name: "Mannheim",
    region: "Baden-Wuerttemberg",
    description:
      "Die Metropolregion Rhein-Neckar rund um Mannheim ist stark im D2D-Vertrieb.",
  },
};

const ALL_SLUGS = Object.keys(CITY_DATA);

export function generateStaticParams() {
  return ALL_SLUGS.map((stadt) => ({ stadt }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stadt: string }>;
}): Promise<Metadata> {
  const { stadt } = await params;
  const city = CITY_DATA[stadt];
  if (!city) {
    return { title: "Stadt nicht gefunden | Zoepp Media" };
  }

  return {
    title: `D2D Vertriebsjobs in ${city.name} | Zoepp Media`,
    description: `Finde D2D Vertriebsjobs in ${city.name} (${city.region}). Kostenlose Vermittlung an Top-Unternehmen. Jetzt bewerben!`,
    openGraph: {
      title: `D2D Vertriebsjobs in ${city.name} | Zoepp Media`,
      description: `D2D Vertriebsjobs in ${city.name}. Kostenlose Vermittlung an Top-Unternehmen.`,
      type: "website",
    },
  };
}

async function getPartnerCountForRegion(region: string): Promise<number> {
  try {
    const supabase = await createServiceClient();
    const { count } = await supabase
      .from("partners")
      .select("id", { count: "exact", head: true })
      .ilike("region", `%${region}%`);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export default async function StadtPage({
  params,
}: {
  params: Promise<{ stadt: string }>;
}) {
  const { stadt } = await params;
  const city = CITY_DATA[stadt];

  if (!city) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Stadt nicht gefunden</h1>
        <p className="mt-2 text-muted-foreground">
          Diese Stadt ist leider nicht in unserer Liste.
        </p>
        <Link
          href="/vertriebsjobs"
          className="mt-6 inline-flex items-center gap-2 text-red-600 hover:text-red-700"
        >
          Alle Staedte anzeigen
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const partnerCount = await getPartnerCountForRegion(city.region);
  const refTag = `seo_${stadt}`;

  const advantages = [
    {
      icon: DollarSign,
      title: "Attraktiver Verdienst",
      text: "3.000 bis 10.000 Euro monatlich — je nach Branche und Leistung.",
    },
    {
      icon: Shield,
      title: "Kostenlos",
      text: "Die Vermittlung ist fuer dich als Vertriebler komplett kostenlos.",
    },
    {
      icon: Clock,
      title: "Schnell",
      text: "Innerhalb von 48 Stunden bekommst du passende Jobangebote.",
    },
    {
      icon: GraduationCap,
      title: "Masterclass inklusive",
      text: "Kostenlose Vertriebs-Masterclass zur optimalen Vorbereitung.",
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1a0505] via-[#2d0a0a] to-[#0d0507] py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <Link href="/vertriebsjobs" className="hover:text-white/60">
              Vertriebsjobs
            </Link>
            <span>/</span>
            <span className="text-white/60">{city.name}</span>
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            D2D Vertriebsjobs in{" "}
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              {city.name}
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/60">
            {city.description}
          </p>

          {/* Quick stats */}
          <div className="mt-8 flex flex-wrap gap-6">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <MapPin className="h-4 w-4 text-red-400" />
              <span>{city.region}</span>
            </div>
            {partnerCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Building2 className="h-4 w-4 text-red-400" />
                <span>
                  {partnerCount} aktive{" "}
                  {partnerCount === 1
                    ? "Partnerunternehmen"
                    : "Partnerunternehmen"}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Users className="h-4 w-4 text-red-400" />
              <span>Laufend neue Stellen</span>
            </div>
          </div>

          <Link
            href={`/bewerben?ref=${refTag}`}
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-8 text-base font-semibold text-white shadow-lg shadow-red-500/30 transition-all hover:from-red-700 hover:to-red-800"
          >
            Jetzt in {city.name} bewerben
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Advantages */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Deine Vorteile als D2D-Vertriebler in {city.name}
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {advantages.map((a) => (
              <div
                key={a.title}
                className="flex gap-4 rounded-xl border bg-card p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                  <a.icon className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold">{a.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{a.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-muted/30 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">
            So wirst du Vertriebler in {city.name}
          </h2>
          <div className="mt-10 space-y-6">
            {[
              "Bewirb dich kostenlos ueber unser Online-Formular",
              "Absolviere unsere Vertriebs-Masterclass",
              "Erhalte passende Jobangebote in der Region " + city.region,
              "Starte direkt bei einem unserer Partnerunternehmen",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {i + 1}
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  <CheckCircle2 className="h-4 w-4 text-red-500" />
                  <span className="text-sm">{step}</span>
                </div>
              </div>
            ))}
          </div>

          <Link
            href={`/bewerben?ref=${refTag}`}
            className="mt-10 inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-6 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:from-red-700 hover:to-red-800"
          >
            Jetzt in {city.name} bewerben
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Other cities */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-xl font-semibold">
            Weitere Standorte
          </h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {ALL_SLUGS.filter((s) => s !== stadt)
              .slice(0, 12)
              .map((s) => (
                <Link
                  key={s}
                  href={`/vertriebsjobs/${s}`}
                  className="rounded-lg border bg-card px-3 py-1.5 text-sm transition-colors hover:border-red-500/30 hover:text-red-600"
                >
                  {CITY_DATA[s].name}
                </Link>
              ))}
            <Link
              href="/vertriebsjobs"
              className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10"
            >
              Alle Staedte
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
