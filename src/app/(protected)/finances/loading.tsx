export default function FinancesLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-muted rounded" />
        <div className="h-8 w-28 bg-muted rounded" />
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-center gap-3">
        <div className="h-8 w-8 bg-muted rounded" />
        <div className="h-6 w-40 bg-muted rounded" />
        <div className="h-8 w-8 bg-muted rounded" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
        <div className="flex-1 h-9 bg-muted rounded-md" />
        <div className="flex-1 h-9 bg-muted rounded-md" />
        <div className="flex-1 h-9 bg-muted rounded-md" />
      </div>

      {/* Content */}
      <div className="h-20 bg-muted rounded-lg" />
      <div className="h-4 w-32 bg-muted rounded" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  );
}
