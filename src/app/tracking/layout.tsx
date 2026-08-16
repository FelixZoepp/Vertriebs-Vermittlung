export default function TrackingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-2xl items-center px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/30">
              <span className="text-xs font-bold text-white">ZM</span>
            </div>
            <span className="text-lg font-semibold">Zoepp Media</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-1 items-start justify-center px-6 py-12">
        <div className="w-full max-w-2xl">{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Content-Leads Solutions UG
      </footer>
    </div>
  );
}
