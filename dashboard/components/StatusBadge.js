const styles = {
  pending: "bg-amber-500/15 text-amber-200 ring-amber-500/30",
  processing: "bg-sky-500/15 text-sky-200 ring-sky-500/30",
  completed: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30",
  failed: "bg-rose-500/15 text-rose-200 ring-rose-500/30",
};

export default function StatusBadge({ status }) {
  const cls = styles[status] || "bg-slate-500/15 text-slate-200 ring-slate-500/30";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {status}
    </span>
  );
}
