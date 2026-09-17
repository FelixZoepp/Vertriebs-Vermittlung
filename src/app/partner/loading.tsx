export default function PartnerLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 rounded-md bg-muted" />
      <div className="mt-2 h-4 w-64 rounded-md bg-muted" />
      <div className="mt-6 flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg border bg-muted/40" />
        ))}
      </div>
    </div>
  );
}
