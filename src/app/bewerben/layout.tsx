export default function BewerbenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left side - branding (visible on lg+) */}
      <div className="hidden w-[420px] shrink-0 bg-gradient-to-br from-[#1a0505] via-[#2d0a0a] to-[#0d0507] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/30">
              <span className="text-sm font-bold text-white">ZM</span>
            </div>
            <span className="text-xl font-semibold text-white">Zoepp Media</span>
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight text-white">
            Vertriebsvermittlung
            <br />
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Deine Karriere startet hier.
            </span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-white/50">
            Bewirb dich jetzt und werde Teil eines starken Vertriebsteams bei
            Top-Unternehmen in deiner Region.
          </p>
        </div>
        <p className="text-sm text-white/30">
          &copy; {new Date().getFullYear()} Content-Leads Solutions UG
        </p>
      </div>

      {/* Right side - form area */}
      <div className="flex flex-1 flex-col bg-background">
        {/* Mobile header */}
        <header className="border-b lg:hidden">
          <div className="flex h-14 items-center gap-3 px-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/20">
              <span className="text-xs font-bold text-white">ZM</span>
            </div>
            <span className="text-lg font-semibold">Zoepp Media</span>
          </div>
        </header>

        {/* Main content */}
        <main className="flex flex-1 items-start justify-center px-4 py-10 lg:items-center lg:py-0">
          <div className="w-full max-w-lg">{children}</div>
        </main>

        {/* Footer (visible on mobile too) */}
        <footer className="border-t py-4 text-center text-xs text-muted-foreground lg:hidden">
          &copy; {new Date().getFullYear()} Content-Leads Solutions UG
        </footer>
      </div>
    </div>
  );
}
