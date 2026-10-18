/** Map API base URL in production (e.g. Render). Empty = same origin / Vite dev proxy. */
export function mapApiUrl(path: string): string {
  const base = (import.meta.env.VITE_MAP_API_URL ?? "").trim().replace(/\/$/, "")
  const normalized = path.startsWith("/") ? path : `/${path}`
  return base ? `${base}${normalized}` : normalized
}
