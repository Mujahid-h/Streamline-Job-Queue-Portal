const DEFAULT_SERVER_API = "http://localhost:3000";

function resolveApiUrl(path) {
  const clean = path.replace(/^\/+/, "");
  if (typeof window !== "undefined") {
    return `/api-proxy/${clean}`;
  }
  const base =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    DEFAULT_SERVER_API;
  return `${base.replace(/\/$/, "")}/api/${clean}`;
}

async function parseJsonSafe(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function apiFetch(path, options = {}) {
  const url = resolveApiUrl(path);
  const { headers: userHeaders, ...rest } = options;
  const headers = new Headers(userHeaders || {});

  if (
    rest.body &&
    typeof rest.body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...rest,
    headers,
    cache: "no-store",
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    const err = new Error(
      data?.error || data?.message || `Request failed (${response.status})`,
    );
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export function uploadFile(file, { priority = 0 } = {}) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("priority", String(priority));

  const url = resolveApiUrl("upload");
  return fetch(url, {
    method: "POST",
    body: formData,
    cache: "no-store",
  }).then(async (response) => {
    const data = await parseJsonSafe(response);
    if (!response.ok) {
      const err = new Error(
        data?.error || data?.message || `Upload failed (${response.status})`,
      );
      err.status = response.status;
      err.data = data;
      throw err;
    }
    return data;
  });
}

export function getQueueStats() {
  return apiFetch("queue/stats");
}

export function listJobs(query = {}) {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  const qs = params.toString();
  return apiFetch(`jobs${qs ? `?${qs}` : ""}`);
}

export function getJob(jobId) {
  return apiFetch(`job/${encodeURIComponent(jobId)}`);
}
