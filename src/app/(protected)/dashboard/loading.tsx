export default function DashboardLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 bg-muted rounded" />
        <div className="h-6 w-28 bg-muted rounded-full" />
      </div>

      {/* Alert card */}
      <div className="h-14 bg-muted rounded-lg" />

      {/* Date nav */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-8 bg-muted rounded" />
        <div className="h-5 w-48 bg-muted rounded" />
        <div className="h-8 w-8 bg-muted rounded" />
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-32 bg-muted rounded" />
        <div className="h-8 w-36 bg-muted rounded" />
      </div>

      {/* Schedule entries */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-16 bg-muted rounded-lg" />
          <div className="h-16 bg-muted rounded-lg" />
        </div>
      ))}
    </div>
  );
}
