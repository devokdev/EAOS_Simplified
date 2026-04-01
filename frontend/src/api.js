const API_BASE = "";
const DEFAULT_TIMEOUT_MS = 15000;

export async function api(path, options = {}) {
  const controller = new AbortController();
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal, headers, ...fetchOptions } = options;
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  let response;
  let data;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(headers ?? {}),
      },
      ...fetchOptions,
      signal: signal ?? controller.signal,
    });

    const contentType = response.headers.get("content-type") || "";
    data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out. Please check that the backend server is running and reachable.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data.detail || data.message || "Request failed";
    throw new Error(message);
  }

  return data;
}

export function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "EA";
}

export function formatRelativeTime(value) {
  if (!value) {
    return "No timestamp";
  }
  const date = new Date(value);
  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }
  if (diffSeconds < 3600) {
    return `${Math.floor(diffSeconds / 60)}m ago`;
  }
  if (diffSeconds < 86400) {
    return `${Math.floor(diffSeconds / 3600)}h ago`;
  }
  return date.toLocaleDateString();
}

export function formatDateTime(value) {
  if (!value) {
    return "No date";
  }
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function toTitleCase(value = "") {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
