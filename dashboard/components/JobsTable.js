"use client";

import StatusBadge from "./StatusBadge";

function formatBytes(n) {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function JobsTable({
  jobs,
  loading,
  error,
  pagination,
  onSelect,
  selectedId,
  statusFilter,
  onStatusFilter,
  onPageChange,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-surface-border bg-surface-card/80 ring-1 ring-white/5 backdrop-blur">
      <div className="flex flex-col gap-3 border-b border-surface-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-white">Jobs</h2>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-accent-muted">
            Status
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilter(e.target.value)}
              className="ml-2 rounded-lg border border-surface-border bg-black/75 px-2 py-1 text-sm text-white outline-none focus:ring-2 focus:ring-sky-500/50"
            >
              <option value="">All</option>
              <option value="pending">pending</option>
              <option value="processing">processing</option>
              <option value="completed">completed</option>
              <option value="failed">failed</option>
            </select>
          </label>
        </div>
      </div>

      {error && (
        <div className="border-b border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-100">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-black/20 text-xs uppercase text-accent-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Job ID</th>
              <th className="px-4 py-3 font-medium">File</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Progress</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-accent-muted">
                  Loading jobs…
                </td>
              </tr>
            )}
            {!loading &&
              jobs?.map((job) => (
                <tr
                  key={job.jobId}
                  onClick={() => onSelect(job)}
                  className={`cursor-pointer transition hover:bg-white/5 ${selectedId === job.jobId ? "bg-sky-500/10" : ""
                    }`}
                >
                  <td className="max-w-[140px] truncate px-4 py-3 font-mono text-xs text-slate-200">
                    {job.jobId}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-slate-100">
                    {job.originalFilename}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-300">
                    {job.progress ?? 0}%
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {formatBytes(job.fileSizeBytes)}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {formatDate(job.createdAt)}
                  </td>
                </tr>
              ))}
            {!loading && (!jobs || jobs.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-accent-muted">
                  No jobs yet. Upload a CSV to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between border-t border-surface-border px-4 py-3 text-sm text-accent-muted">
          <span>
            Page {pagination.page} of {pagination.pages} ({pagination.total}{" "}
            total)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="rounded-lg border border-surface-border px-3 py-1 hover:bg-white/5 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.pages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="rounded-lg border border-surface-border px-3 py-1 hover:bg-white/5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
