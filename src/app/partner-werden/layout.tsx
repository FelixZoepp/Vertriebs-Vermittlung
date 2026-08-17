export default function PartnerWerdenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0505] via-[#0d0507] to-[#1a0505]">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#1a0505]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/20">
              <span className="text-xs font-bold text-white">ZM</span>
            </div>
            <span className="text-lg font-semibold text-white">
              Zoepp Media
            </span>
          </div>
          <a
            href="/login"
            className="text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            Login
          </a>
        </div>
      </header>

      {/* Main */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0d0507]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-700">
                <span className="text-[10px] font-bold text-white">ZM</span>
              </div>
              <span className="text-sm font-semibold text-white/80">
                Zoepp Media
              </span>
            </div>
            <div className="flex items-center gap-6 text-xs text-white/40">
              <a
                href="https://content-leads.de/impressum"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-white/60"
              >
                Impressum
              </a>
              <a
                href="https://content-leads.de/datenschutz"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-white/60"
              >
                Datenschutz
              </a>
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-white/20">
            &copy; {new Date().getFullYear()} Content-Leads Solutions UG. Alle
            Rechte vorbehalten.
          </p>
        </div>
      </footer>
    </div>
  );
}
