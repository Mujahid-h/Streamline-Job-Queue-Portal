"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import FileUploadCard from "@/components/FileUploadCard";
import JobDetailPanel from "@/components/JobDetailPanel";
import JobsTable from "@/components/JobsTable";
import QueueStatsCards from "@/components/QueueStatsCards";
import { getJob, getQueueStats, listJobs } from "@/services/api";

const POLL_MS = 3000;

export default function HomePage() {
  const [queue, setQueue] = useState(null);
  const [queueErr, setQueueErr] = useState(null);
  const [queueLoading, setQueueLoading] = useState(true);

  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [jobsErr, setJobsErr] = useState(null);
  const [jobsLoading, setJobsLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErr, setDetailErr] = useState(null);

  const selectedId = selected?.jobId;

  const refreshQueue = useCallback(async () => {
    setQueueErr(null);
    try {
      const res = await getQueueStats();
      setQueue(res.data);
    } catch (e) {
      setQueueErr(e.message || "Failed to load queue stats");
    } finally {
      setQueueLoading(false);
    }
  }, []);

  const refreshJobs = useCallback(async () => {
    setJobsErr(null);
    try {
      const res = await listJobs({
        status: statusFilter || undefined,
        page,
        limit: 10,
      });
      setJobs(res.data?.jobs || []);
      setPagination(res.data?.pagination || null);
    } catch (e) {
      setJobsErr(e.message || "Failed to load jobs");
    } finally {
      setJobsLoading(false);
    }
  }, [statusFilter, page]);

  const refreshDetail = useCallback(async (jobId) => {
    if (!jobId) return;
    setDetailErr(null);
    setDetailLoading(true);
    try {
      const res = await getJob(jobId);
      setDetail(res.data);
    } catch (e) {
      setDetailErr(e.message || "Failed to load job");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshQueue();
  }, [refreshQueue]);

  useEffect(() => {
    refreshJobs();
  }, [refreshJobs]);

  useEffect(() => {
    if (!selectedId) return;
    refreshDetail(selectedId);
  }, [selectedId, refreshDetail]);

  const tick = useRef(null);
  useEffect(() => {
    tick.current = setInterval(() => {
      refreshQueue();
      refreshJobs();
      if (selectedId) refreshDetail(selectedId);
    }, POLL_MS);
    return () => clearInterval(tick.current);
  }, [refreshQueue, refreshJobs, refreshDetail, selectedId]);

  const handleUploaded = () => {
    setPage(1);
    refreshQueue();
    refreshJobs();
  };

  const handleSelect = (job) => {
    setSelected(job);
    setDetail(null);
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2 border-b border-surface-border pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-400/90">
          Job queue monitor
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          CSV processing dashboard
        </h1>

      </header>

      <QueueStatsCards
        stats={queue}
        loading={queueLoading}
        error={queueErr}
      />

      <FileUploadCard onUploaded={handleUploaded} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-4">
          <JobsTable
            jobs={jobs}
            loading={jobsLoading}
            error={jobsErr}
            pagination={pagination}
            selectedId={selectedId}
            onSelect={handleSelect}
            statusFilter={statusFilter}
            onStatusFilter={handleStatusFilter}
            onPageChange={setPage}
          />
        </div>
        <JobDetailPanel
          job={detail || selected}
          isFetching={detailLoading}
          error={detailErr}
          onClose={() => {
            setSelected(null);
            setDetail(null);
            setDetailErr(null);
          }}
        />
      </div>

      <footer className="border-t border-surface-border pt-6 text-center text-xs text-accent-muted">
        All Rights Reserved . Mujahid Hussain
      </footer>
    </main>
  );
}
