/**
 * GenAI contract for Rent Mate.
 *
 * Every feature goes through `GenAIProvider`. Today the `mock` provider answers
 * with deterministic rules (honest placeholder — no LLM). To plug in a real
 * model, implement the three endpoints in `./index.ts` (see `apiProvider`) and
 * set VITE_GENAI_MODE=api + VITE_GENAI_API_URL. The UI does not change.
 */

export type MatchInput = {
  name: string
  school: string
  score: number
  tags: string[]
  area: string
  budget: string
}

/** "placeholder" = rule-based preview, "ai" = produced by an LLM. */
export type GenAISource = "placeholder" | "ai"

export type Narrative = {
  headline: string
  summary: string
  strengths: string[]
  /** Honest "worth talking about" points — never empty. */
  frictions: string[]
  starters: string[]
  dimensions: { label: string; score: number }[]
  source: GenAISource
}

export type ChatTurn = { role: "user" | "assistant"; text: string }

export type ChatReply = {
  text: string
  suggestions: string[]
  source: GenAISource
}

export type PlanPhase = "Before you land" | "First week" | "First month"

export type PlanStep = {
  id: string
  phase: PlanPhase
  title: string
  detail: string
}

export type SettlingPlan = {
  summary: string
  steps: PlanStep[]
  source: GenAISource
}

export interface GenAIProvider {
  /** POST {base}/narrative   body: { match, answers }  → Narrative */
  narrative(match: MatchInput, answers: number[]): Promise<Narrative>
  /** POST {base}/chat        body: { history, message } → ChatReply */
  chat(history: ChatTurn[], message: string): Promise<ChatReply>
  /** POST {base}/settling-plan body: { answers }       → SettlingPlan */
  settlingPlan(answers: number[]): Promise<SettlingPlan>
}
