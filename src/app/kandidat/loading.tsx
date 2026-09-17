export default function KandidatLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 rounded-md bg-muted" />
      <div className="mt-2 h-4 w-64 rounded-md bg-muted" />
      <div className="mt-6 flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg border bg-muted/40" />
        ))}
      </div>
    </div>
  );
}
