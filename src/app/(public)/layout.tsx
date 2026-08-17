import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Zoepp Media – D2D Vertriebsvermittlung",
    template: "%s | Zoepp Media",
  },
  description:
    "Wir vermitteln Vertriebler an Top-Unternehmen im D2D-Vertrieb — kostenlos, schnell und persoenlich.",
};

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/20">
        <span className="text-xs font-bold text-white">ZM</span>
      </div>
      <span className="text-lg font-semibold">Zoepp Media</span>
    </Link>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Fuer Vertriebler
          </Link>
          <Link
            href="/partner-werden"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Fuer Partner
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Login
          </Link>
          <Link
            href="/bewerben"
            className="inline-flex h-9 items-center rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 text-sm font-medium text-white shadow-lg shadow-red-500/20 transition-all hover:from-red-700 hover:to-red-800"
          >
            Jetzt bewerben
          </Link>
        </div>

        {/* Mobile nav */}
        <div className="flex items-center gap-3 md:hidden">
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground"
          >
            Login
          </Link>
          <Link
            href="/bewerben"
            className="inline-flex h-9 items-center rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 text-sm font-medium text-white shadow-lg shadow-red-500/20"
          >
            Bewerben
          </Link>
        </div>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-muted-foreground">
              Deine Vermittlungsplattform fuer den D2D-Vertrieb.
            </p>
          </div>

          {/* Vertriebler */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Fuer Vertriebler</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/bewerben" className="hover:text-foreground">
                  Jetzt bewerben
                </Link>
              </li>
              <li>
                <Link href="/vertriebsjobs" className="hover:text-foreground">
                  Vertriebsjobs
                </Link>
              </li>
            </ul>
          </div>

          {/* Partner */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Fuer Unternehmen</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/partner-werden" className="hover:text-foreground">
                  Partner werden
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground">
                  Partner-Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Rechtliches</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/impressum" className="hover:text-foreground">
                  Impressum
                </Link>
              </li>
              <li>
                <Link href="/datenschutz" className="hover:text-foreground">
                  Datenschutz
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Content-Leads Solutions UG. Alle
          Rechte vorbehalten.
        </div>
      </div>
    </footer>
  );
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
