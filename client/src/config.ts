const env = import.meta.env;

export const API_BASE = (env.VITE_API_BASE as string | undefined)?.replace(
  /\/$/,
  ""
) || "";

export const REQUEST_TIMEOUT_MS = Number(
  env.VITE_REQUEST_TIMEOUT_MS || "20000"
);

export const PUBLIC_DEMO_BUILD =
  env.VITE_PUBLIC_DEMO === "true" || env.VITE_PUBLIC_DEMO === "1";

export const MOOD_MAX_CHARS_UX = 500;

export function apiUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}
