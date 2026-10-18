import { mockProvider } from "./mock"
import type {
  ChatReply,
  ChatTurn,
  GenAIProvider,
  MatchInput,
  Narrative,
  SettlingPlan,
} from "./types"

export type * from "./types"

/**
 * Provider selection (build-time env):
 *
 *   VITE_GENAI_MODE=mock   (default) rule-based placeholder, no keys, works offline
 *   VITE_GENAI_MODE=api    call your own GenAI backend at VITE_GENAI_API_URL
 *
 * To go live with a real LLM, expose these three JSON endpoints (for example as
 * Supabase Edge Functions that hold OPENAI_API_KEY server-side):
 *
 *   POST {URL}/narrative      { match, answers }   → Narrative
 *   POST {URL}/chat           { history, message } → ChatReply
 *   POST {URL}/settling-plan  { answers }          → SettlingPlan
 *
 * Shapes live in ./types.ts. If the API is down the UI silently falls back to
 * the placeholder, so a demo never shows an error.
 */
const mode = (import.meta.env.VITE_GENAI_MODE ?? "mock").toLowerCase()
const apiUrl = (import.meta.env.VITE_GENAI_API_URL ?? "").replace(/\/$/, "")

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${apiUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`GenAI ${path} failed (${res.status})`)
  return (await res.json()) as T
}

const apiProvider: GenAIProvider = {
  narrative: (match, answers) =>
    post<Narrative>("/narrative", { match, answers }),
  chat: (history, message) => post<ChatReply>("/chat", { history, message }),
  settlingPlan: (answers) => post<SettlingPlan>("/settling-plan", { answers }),
}

async function withFallback<T>(
  live: () => Promise<T>,
  fallback: () => Promise<T>,
): Promise<T> {
  if (mode !== "api" || !apiUrl) return fallback()
  try {
    return await live()
  } catch {
    return fallback()
  }
}

export const genai: GenAIProvider = {
  narrative: (m: MatchInput, a: number[]) =>
    withFallback(() => apiProvider.narrative(m, a), () => mockProvider.narrative(m, a)),
  chat: (h: ChatTurn[], msg: string) =>
    withFallback(() => apiProvider.chat(h, msg), () => mockProvider.chat(h, msg)),
  settlingPlan: (a: number[]) =>
    withFallback(() => apiProvider.settlingPlan(a), () => mockProvider.settlingPlan(a)),
}

export const genaiMode: "mock" | "api" = mode === "api" && apiUrl ? "api" : "mock"
