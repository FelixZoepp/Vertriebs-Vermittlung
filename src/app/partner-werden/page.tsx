import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  MapPin,
  BarChart3,
  UserPlus,
  Send,
  Handshake,
  LineChart,
  CheckCircle2,
  ChevronDown,
  Zap,
  Shield,
  Clock,
} from "lucide-react";

export const metadata: Metadata = {
  title:
    "Partner werden – Qualifizierte D2D-Vertriebler finden | Zoepp Media",
  description:
    "Zugang zu qualifizierten, geschulten D2D-Vertrieblern — vermittelt in unter 48 Stunden. Ab 299 Euro/Monat. Jetzt Partner werden.",
  openGraph: {
    title: "Partner werden – Qualifizierte D2D-Vertriebler finden",
    description:
      "Zugang zu qualifizierten, geschulten D2D-Vertrieblern — vermittelt in unter 48 Stunden.",
    type: "website",
  },
};

const VALUE_PROPS = [
  {
    icon: Users,
    title: "Qualifizierte Bewerber",
    description:
      "Nur Masterclass-Absolventen werden vermittelt. Jeder Kandidat hat eine strukturierte Schulung durchlaufen und ist direkt einsatzbereit.",
  },
  {
    icon: MapPin,
    title: "Standortbasiertes Matching",
    description:
      "Kandidaten aus deiner Region. Unser Algorithmus matcht nach Entfernung, Branche und Erfahrung — du bekommst nur passende Profile.",
  },
  {
    icon: BarChart3,
    title: "Vertrags-Tracking",
    description:
      "Transparente Performance-Daten in Echtzeit. Verfolge Vertragsabschluesse deiner vermittelten Vertriebler direkt im Dashboard.",
  },
];

const STEPS = [
  {
    icon: UserPlus,
    step: "01",
    title: "Registrieren",
    description: "Erstelle dein Firmenprofil in unter 3 Minuten.",
  },
  {
    icon: Send,
    step: "02",
    title: "Kandidaten erhalten",
    description:
      "Wir schlagen dir passende, qualifizierte Vertriebler vor.",
  },
  {
    icon: Handshake,
    step: "03",
    title: "Einstellen",
    description: "Fuehre Gespraeche und stelle direkt ein.",
  },
  {
    icon: LineChart,
    step: "04",
    title: "Performance tracken",
    description:
      "Verfolge Vertragsabschluesse und Ergebnisse im Dashboard.",
  },
];

const FEATURES = [
  "Unbegrenzter Zugang zu qualifizierten Kandidaten",
  "Standortbasiertes Matching-System",
  "Echtzeit-Dashboard mit Performance-Tracking",
  "Persoenlicher Ansprechpartner",
  "Kandidatenvorschlaege innerhalb von 48 Stunden",
  "Keine Mindestlaufzeit",
];

const FAQ_ITEMS = [
  {
    question: "Wie funktioniert das Matching?",
    answer:
      "Unser Algorithmus beruecksichtigt Entfernung (50%), Branche (30%), Erfahrung (10%) und Kapazitaet (10%). Du erhaeltst nur Kandidaten, die zu deinem Standort und Profil passen.",
  },
  {
    question: "Was kostet die Vermittlung?",
    answer:
      "Der Plattformzugang kostet 299 Euro/Monat. Bei erfolgreicher Einstellung eines Kandidaten faellt eine einmalige Vermittlungsprovision von 750 Euro netto an. Es gibt keine versteckten Kosten.",
  },
  {
    question: "Wie schnell bekomme ich Kandidaten?",
    answer:
      "In der Regel erhaeltst du innerhalb von 48 Stunden nach Registrierung die ersten Kandidatenvorschlaege. Bei hoher Nachfrage in deiner Region kann es schneller gehen.",
  },
  {
    question: "Wie sind die Kandidaten qualifiziert?",
    answer:
      "Jeder Kandidat durchlaeuft unsere Masterclass — eine strukturierte Schulung fuer D2D-Vertrieb. Nur wer alle Pflichtmodule erfolgreich abschliesst (mind. 95% Fortschritt), wird vermittelt.",
  },
  {
    question: "Gibt es eine Mindestlaufzeit?",
    answer:
      "Nein. Du kannst dein Abo jederzeit kuendigen. Es gibt keine Bindung und keine versteckten Fristen.",
  },
  {
    question: "Was passiert nach der Einstellung?",
    answer:
      "Du trackst die Performance des Vertrieblers in unserem Dashboard. Wir schicken dir regelmaessige Abfragen zu den Vertragsabschluessen, damit du volle Transparenz hast.",
  },
];

export default function PartnerWerdenPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pb-20 pt-20 sm:px-6 sm:pt-28 lg:pt-36">
        {/* Background glow */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-red-600/5 blur-[120px]" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-sm text-red-400">
            <Zap className="h-3.5 w-3.5" />
            <span>Vermittlung in unter 48 Stunden</span>
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Die besten{" "}
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Vertriebler
            </span>{" "}
            fuer dein{" "}
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Unternehmen
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/50 sm:text-xl">
            Zugang zu qualifizierten, geschulten D2D-Vertrieblern — vermittelt
            in unter 48 Stunden.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/partner-werden/registrieren"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-8 text-base font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:from-red-700 hover:to-red-800 hover:shadow-xl hover:shadow-red-500/30"
            >
              Jetzt Partner werden
            </Link>
            <a
              href="#preise"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 px-8 text-base font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white"
            >
              Preise ansehen
            </a>
          </div>

          {/* Trust indicators */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-sm text-white/40">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-500/60" />
              <span>Keine Mindestlaufzeit</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-red-500/60" />
              <span>48h bis zum ersten Kandidaten</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-red-500/60" />
              <span>Nur geschulte Vertriebler</span>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Warum Partner werden?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/50">
              Wir liefern dir qualifizierte Vertriebler — du konzentrierst dich
              auf dein Geschaeft.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {VALUE_PROPS.map((prop) => (
              <div
                key={prop.title}
                className="group rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all hover:border-red-500/20 hover:bg-white/[0.04]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/20 to-red-700/20 text-red-500 transition-colors group-hover:from-red-500/30 group-hover:to-red-700/30">
                  <prop.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">
                  {prop.title}
                </h3>
                <p className="mt-3 leading-relaxed text-white/50">
                  {prop.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              So funktioniert&apos;s
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/50">
              Von der Registrierung bis zum ersten Vertriebler — in vier
              einfachen Schritten.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div key={step.step} className="relative text-center">
                {/* Connector line (hidden on mobile / last item) */}
                {i < STEPS.length - 1 && (
                  <div className="absolute right-0 top-8 hidden h-px w-full translate-x-1/2 bg-gradient-to-r from-red-500/30 to-transparent lg:block" />
                )}
                <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                  <step.icon className="h-7 w-7 text-red-500" />
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-[10px] font-bold text-white">
                    {step.step.replace("0", "")}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="preise" className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Transparente Preise
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/50">
              Keine versteckten Kosten. Klar, fair und einfach.
            </p>
          </div>

          <div className="mx-auto mt-14 max-w-lg">
            <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-b from-white/[0.04] to-white/[0.01]">
              {/* Highlight glow */}
              <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[400px] -translate-x-1/2 rounded-full bg-red-600/10 blur-[80px]" />

              <div className="relative p-8 sm:p-10">
                <div className="text-center">
                  <p className="text-sm font-medium uppercase tracking-wider text-red-400">
                    Partner-Abo
                  </p>
                  <div className="mt-4 flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-white">
                      299
                    </span>
                    <span className="text-xl text-white/40">&euro;</span>
                    <span className="ml-1 text-white/40">/Monat</span>
                  </div>
                  <p className="mt-2 text-sm text-white/40">
                    zzgl. MwSt. &middot; Monatlich kuendbar
                  </p>
                </div>

                <div className="mt-8 space-y-3">
                  {FEATURES.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-start gap-3"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      <span className="text-sm text-white/70">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/partner-werden/registrieren"
                  className="mt-8 flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-base font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:from-red-700 hover:to-red-800 hover:shadow-xl hover:shadow-red-500/30"
                >
                  Jetzt Partner werden
                </Link>
              </div>

              {/* Provision info */}
              <div className="border-t border-white/5 bg-white/[0.02] px-8 py-5 sm:px-10">
                <div className="flex items-start gap-3">
                  <Handshake className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
                  <p className="text-sm leading-relaxed text-white/40">
                    Bei erfolgreicher Einstellung eines Kandidaten faellt eine
                    einmalige Vermittlungsprovision von{" "}
                    <span className="font-medium text-white/60">
                      750 &euro; netto
                    </span>{" "}
                    an. Keine versteckten Kosten.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Haeufige Fragen
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/50">
              Alles, was du vor der Registrierung wissen musst.
            </p>
          </div>

          <div className="mt-14 space-y-3">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.question}
                className="group rounded-xl border border-white/5 bg-white/[0.02] transition-colors open:border-red-500/20 open:bg-white/[0.04]"
              >
                <summary className="flex cursor-pointer items-center justify-between px-6 py-5 text-sm font-medium text-white select-none [&::-webkit-details-marker]:hidden">
                  <span>{item.question}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-white/40 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-5 text-sm leading-relaxed text-white/50">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-red-950/30 to-[#1a0505] p-10 text-center sm:p-16">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/5 blur-[80px]" />
            <div className="relative">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Bereit, dein Team zu verstaerken?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-white/50">
                Registriere dich jetzt und erhalte innerhalb von 48 Stunden
                deine ersten Kandidatenvorschlaege.
              </p>
              <Link
                href="/partner-werden/registrieren"
                className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-8 text-base font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:from-red-700 hover:to-red-800 hover:shadow-xl hover:shadow-red-500/30"
              >
                Jetzt Partner werden
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
