import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Building2,
  Clock,
  DollarSign,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Rocket,
  Send,
  Shield,
  Star,
  Users,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "D2D Vertriebsjobs | Kostenlos vermittelt werden | Zoepp Media",
  description:
    "Starte deine Karriere im D2D-Vertrieb. Wir vermitteln dich kostenlos an Top-Unternehmen in deiner Region — innerhalb von 48 Stunden. Jetzt bewerben!",
  openGraph: {
    title: "D2D Vertriebsjobs | Kostenlos vermittelt werden | Zoepp Media",
    description:
      "Starte deine Karriere im D2D-Vertrieb. Kostenlose Vermittlung an Top-Unternehmen in deiner Region.",
    type: "website",
    url: "https://vertriebsvermittlung.zoepp-media.de",
  },
};

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1a0505] via-[#2d0a0a] to-[#0d0507] py-20 sm:py-28 lg:py-36">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-red-600/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-sm text-red-300">
          <Zap className="h-3.5 w-3.5" />
          <span>Kostenlos und unverbindlich</span>
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          Starte deine Karriere im{" "}
          <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            D2D-Vertrieb
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60 sm:text-xl">
          Wir vermitteln dich an Top-Unternehmen in deiner Region — kostenlos
          und innerhalb von 48 Stunden.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/bewerben"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-8 text-base font-semibold text-white shadow-lg shadow-red-500/30 transition-all hover:from-red-700 hover:to-red-800 hover:shadow-xl hover:shadow-red-500/40"
          >
            Jetzt bewerben
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/partner-werden"
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 text-base font-semibold text-white transition-all hover:bg-white/10"
          >
            Partner werden
          </Link>
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    {
      value: "100+",
      label: "Partnerunternehmen",
      icon: Building2,
    },
    {
      value: "500+",
      label: "Vermittelte Vertriebler",
      icon: Users,
    },
    {
      value: "\u00D8 48h",
      label: "bis zur Vermittlung",
      icon: Clock,
    },
  ];

  return (
    <section className="border-b bg-muted/30 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-2 text-center">
              <stat.icon className="h-6 w-6 text-red-500" />
              <span className="text-3xl font-bold tracking-tight">
                {stat.value}
              </span>
              <span className="text-sm text-muted-foreground">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      step: 1,
      title: "Bewerben",
      description:
        "Fuell unser kurzes Bewerbungsformular aus — dauert nur 2 Minuten.",
      icon: Send,
    },
    {
      step: 2,
      title: "Masterclass",
      description:
        "Absolviere unsere kostenlose Vertriebs-Masterclass und qualifiziere dich.",
      icon: GraduationCap,
    },
    {
      step: 3,
      title: "Matching",
      description:
        "Wir matchen dich mit passenden Unternehmen in deiner Region.",
      icon: Handshake,
    },
    {
      step: 4,
      title: "Einstellung",
      description:
        "Du wirst direkt beim Partnerunternehmen eingestellt und startest sofort.",
      icon: Rocket,
    },
  ];

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            So funktioniert&apos;s
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            In vier einfachen Schritten zu deinem neuen Job
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item) => (
            <div key={item.step} className="group relative text-center">
              {/* Connector line (hidden on first item and mobile) */}
              {item.step > 1 && (
                <div className="absolute -left-4 top-8 hidden h-0.5 w-8 bg-gradient-to-r from-red-500/50 to-red-500/20 lg:block" />
              )}

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/10 to-red-700/10 ring-1 ring-red-500/20 transition-all group-hover:ring-red-500/40">
                <item.icon className="h-7 w-7 text-red-500" />
              </div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-red-500">
                Schritt {item.step}
              </div>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  const benefits = [
    {
      title: "Top-Verdienst",
      description:
        "Verdiene zwischen 3.000 und 10.000 Euro im Monat — je nach Branche und Leistung.",
      icon: DollarSign,
      highlight: "\u20AC3k\u201310k/Monat",
    },
    {
      title: "Beste Auswahl",
      description:
        "Wir arbeiten nur mit geprueften Top-Unternehmen zusammen, die faire Konditionen bieten.",
      icon: Shield,
      highlight: "Top-Unternehmen",
    },
    {
      title: "Persoenlicher Support",
      description:
        "Dein persoenlicher Ansprechpartner begleitet dich durch den gesamten Prozess.",
      icon: HeartHandshake,
      highlight: "1:1 Betreuung",
    },
    {
      title: "Schnelle Vermittlung",
      description:
        "Vom Bewerbungseingang bis zur Vermittlung vergehen im Schnitt nur 48 Stunden.",
      icon: Zap,
      highlight: "48h Vermittlung",
    },
  ];

  return (
    <section className="bg-gradient-to-br from-[#1a0505] via-[#2d0a0a] to-[#0d0507] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Was dich erwartet
          </h2>
          <p className="mt-3 text-lg text-white/50">
            Warum Vertriebler sich fuer Zoepp Media entscheiden
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="group rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-red-500/20 hover:bg-white/[0.07]"
            >
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/20 to-red-700/20 ring-1 ring-red-500/30">
                  <benefit.icon className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{benefit.title}</h3>
                  <span className="text-xs font-medium text-red-400">
                    {benefit.highlight}
                  </span>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-white/50">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "Innerhalb von 2 Tagen hatte ich drei Angebote auf dem Tisch. Die Vermittlung war komplett kostenlos und super professionell.",
      name: "Marko T.",
      role: "D2D-Vertriebler, Energie",
      rating: 5,
    },
    {
      quote:
        "Als Quereinsteiger hatte ich Bedenken, aber die Masterclass hat mich perfekt vorbereitet. Jetzt verdiene ich mehr als je zuvor.",
      name: "Sarah K.",
      role: "Quereinsteigerin, Telko",
      rating: 5,
    },
    {
      quote:
        "Das Matching war punktgenau — die Firma passt perfekt zu mir und liegt nur 15 Minuten von zuhause entfernt.",
      name: "Dennis R.",
      role: "D2D-Vertriebler, Glasfaser",
      rating: 5,
    },
  ];

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Das sagen unsere Vertriebler
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Echte Erfahrungen von vermittelten Vertrieblern
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border bg-card p-6 shadow-sm"
            >
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-red-500 text-red-500"
                  />
                ))}
              </div>
              <blockquote className="text-sm leading-relaxed text-muted-foreground">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="mt-4 border-t pt-4">
                <div className="font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="bg-gradient-to-r from-red-600 to-red-700 py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Bereit fuer deinen naechsten Karriereschritt?
        </h2>
        <p className="mt-4 text-lg text-white/80">
          Bewirb dich jetzt kostenlos und erhalte innerhalb von 48 Stunden
          passende Jobangebote.
        </p>
        <Link
          href="/bewerben"
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-8 text-base font-semibold text-red-700 shadow-lg transition-all hover:bg-white/90"
        >
          Jetzt kostenlos bewerben
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <HowItWorksSection />
      <BenefitsSection />
      <TestimonialsSection />
      <CtaBanner />
    </>
  );
}
