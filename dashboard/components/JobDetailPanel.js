"use client";

import StatusBadge from "./StatusBadge";

export default function JobDetailPanel({ job, isFetching, error, onClose }) {
  if (!job && !error) {
    return (
      <aside className=" max-w-xs shrink-0 rounded-xl border border-dashed border-surface-border bg-surface-card/40 p-6 text-sm text-accent-muted">
        Select a job to inspect details, progress, and processing results.
      </aside>
    );
  }

  return (
    <aside className=" max-w-md shrink-0 rounded-xl border border-surface-border bg-surface-card/90 p-5 shadow-xl ring-1 ring-white/5 backdrop-blur">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-white">Job detail</h3>
          {job?.jobId && (
            <p className="mt-1 break-all font-mono text-xs text-slate-400">
              {job.jobId}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-sm text-accent-muted hover:bg-white/10 hover:text-white"
        >
          Close
        </button>
      </div>

      {isFetching && (
        <p className="mt-2 text-xs text-sky-300/90">Syncing latest…</p>
      )}
      {error && (
        <p className="mt-4 text-sm text-rose-300">{error}</p>
      )}

      {job && (
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-accent-muted">Status</dt>
            <dd>
              <StatusBadge status={job.status} />
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-accent-muted">Progress</dt>
            <dd className="tabular-nums text-slate-200">
              {job.progress ?? 0}%
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-accent-muted">Priority</dt>
            <dd className="text-slate-200">{job.priority ?? 0}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-accent-muted">Attempts</dt>
            <dd className="text-slate-200">
              {job.attempts ?? 0} / {job.maxAttempts ?? 3}
            </dd>
          </div>
          {job.errorMessage && (
            <div>
              <dt className="text-accent-muted">Error</dt>
              <dd className="mt-1 rounded-lg bg-rose-500/10 p-2 text-rose-100">
                {job.errorMessage}
              </dd>
            </div>
          )}
          {job.result && (
            <div className="rounded-lg border border-surface-border bg-black/25 p-3">
              <p className="text-xs font-semibold uppercase text-accent-muted">
                Result
              </p>
              <ul className="mt-2 space-y-1 text-slate-200">
                <li>Total rows: {job.result.totalRows}</li>
                <li>Duplicates: {job.result.duplicateRows}</li>
                <li>Unique rows: {job.result.uniqueRows}</li>
                <li>Time: {job.result.processingTimeMs} ms</li>
              </ul>
              {/* {job.result.summary && (
                <p className="mt-3 text-xs leading-relaxed text-slate-400">
                  {job.result.summary}
                </p>
              )} */}
            </div>
          )}
        </dl>
      )}
    </aside>
  );
}

