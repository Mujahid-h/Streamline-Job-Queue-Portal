"use client";

import { useRef, useState } from "react";
import { uploadFile } from "@/services/api";

export default function FileUploadCard({ onUploaded }) {
  const inputRef = useRef(null);
  const [priority, setPriority] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBusy(true);
    setMessage(null);
    try {
      const res = await uploadFile(file, { priority });
      setMessage({
        type: "ok",
        text: `Queued: ${res.data?.jobId?.slice(0, 8)}…`,
      });
      onUploaded?.(res);
    } catch (err) {
      setMessage({ type: "err", text: err.message || "Upload failed" });
    } finally {
      setBusy(false);
      setPriority(0);
    }
  };

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card/80 p-5 shadow-lg ring-1 ring-white/5 backdrop-blur">
      <h2 className="text-lg font-semibold text-white">Upload CSV</h2>
      <p className="mt-1 text-sm text-accent-muted">
        Streaming upload to the API


      </p>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="text-accent-muted">Priority (0–10)</span>
          <input
            type="number"
            min={0}
            max={10}
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="w-full rounded-lg border border-surface-border bg-black/25 px-3 py-2 text-white outline-none ring-sky-500/40 focus:ring-2"
          />
        </label>
        <div className="flex flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFile}
            disabled={busy}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-sky-500 disabled:opacity-50"
          >
            {busy ? "Uploading…" : "Choose file"}
          </button>
        </div>
      </div>

      {message && (
        <p
          className={`mt-3 text-sm ${message.type === "ok" ? "text-emerald-300" : "text-rose-300"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
