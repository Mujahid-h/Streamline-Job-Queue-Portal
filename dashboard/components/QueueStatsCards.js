export default function QueueStatsCards({ stats, loading, error }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl bg-surface-card/60 ring-1 ring-surface-border"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
        {error}
      </div>
    );
  }

  const q = stats?.queue;
  if (!q) return null;

  const items = [
    { label: "Waiting", value: q.waiting, tone: "text-amber-200" },
    { label: "Active", value: q.active, tone: "text-sky-200" },
    { label: "Completed", value: q.completed, tone: "text-emerald-200" },
    { label: "Failed", value: q.failed, tone: "text-rose-200" },
    { label: "Delayed", value: q.delayed, tone: "text-violet-200" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-surface-border bg-surface-card/80 px-4 py-3 shadow-sm backdrop-blur ring-1 ring-white/5"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-accent-muted">
            {item.label}
          </p>
          <p className={`mt-1 text-2xl font-semibold tabular-nums ${item.tone}`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
