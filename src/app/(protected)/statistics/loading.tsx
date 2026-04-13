export default function StatisticsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="h-8 w-32 bg-muted rounded" />

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
        <div className="flex-1 h-9 bg-muted rounded-md" />
        <div className="flex-1 h-9 bg-muted rounded-md" />
        <div className="flex-1 h-9 bg-muted rounded-md" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 bg-muted rounded-lg" />
        <div className="h-20 bg-muted rounded-lg" />
      </div>

      {/* Chart placeholder */}
      <div className="h-64 bg-muted rounded-lg" />

      {/* Another chart */}
      <div className="h-64 bg-muted rounded-lg" />
    </div>
  );
}
