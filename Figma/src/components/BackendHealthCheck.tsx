import { useCallback, useEffect, useState } from "react"
import {
  getSupabase,
  isSupabaseConfigured,
  type AmenityRow,
} from "../lib/supabase"

type CheckState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ok"
      amenityCount: number
      amenities: AmenityRow[]
      activeListings: number
      checkedAt: string
    }
  | { status: "error"; message: string }

export default function BackendHealthCheck() {
  const [state, setState] = useState<CheckState>({ status: "idle" })
  const configured = isSupabaseConfigured()

  const runCheck = useCallback(async () => {
    const supabase = getSupabase()
    if (!supabase) {
      setState({
        status: "error",
        message:
          "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy Figma/.env.example to Figma/.env.local and restart npm run dev.",
      })
      return
    }

    setState({ status: "loading" })

    const { data: amenities, error: amenityError } = await supabase
      .from("amenities")
      .select("id, name_en, name_zh")
      .order("name_en")
      .limit(20)

    if (amenityError) {
      setState({
        status: "error",
        message: `${amenityError.message} (code: ${amenityError.code ?? "unknown"})`,
      })
      return
    }

    const { count: listingCount, error: listingError } = await supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")

    if (listingError) {
      setState({
        status: "error",
        message: `${listingError.message} (code: ${listingError.code ?? "unknown"})`,
      })
      return
    }

    setState({
      status: "ok",
      amenityCount: amenities?.length ?? 0,
      amenities: amenities ?? [],
      activeListings: listingCount ?? 0,
      checkedAt: new Date().toLocaleTimeString(),
    })
  }, [])

  useEffect(() => {
    if (configured) runCheck()
  }, [configured, runCheck])

  const url = import.meta.env.VITE_SUPABASE_URL ?? ""

  return (
    <section className="backend-check" id="backend">
      <p className="section-kicker">Supabase backend</p>
      <h2>Live database check</h2>
      <p className="backend-check-intro">
        This reads real data from your cloud project (public tables only). Mock
        matches and flats in the demo still use sample UI data until we wire
        those screens next.
      </p>

      {!configured ? (
        <div className="backend-check-card backend-check-card--warn">
          <b>Not configured</b>
          <p>
            Create <code>Figma/.env.local</code> with{" "}
            <b>Project URL</b> (Settings → General) and the{" "}
            <b>legacy anon</b> key (Settings → API Keys → Legacy tab), then
            restart{" "}
            <code>npm run dev</code>.
          </p>
          <pre className="backend-check-snippet">{`VITE_SUPABASE_URL=https://YOUR_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key`}</pre>
        </div>
      ) : (
        <div className="backend-check-card">
          <p className="backend-check-meta">
            <span>
              Connected to{" "}
              <code>{url.replace(/^https:\/\//, "").slice(0, 32)}…</code>
            </span>
            <button
              type="button"
              className="backend-check-retry"
              onClick={runCheck}
              disabled={state.status === "loading"}
            >
              {state.status === "loading" ? "Checking…" : "Run again"}
            </button>
          </p>

          {state.status === "error" && (
            <p className="backend-check-error" role="alert">
              {state.message}
            </p>
          )}

          {state.status === "ok" && (
            <>
              <div className="backend-check-stats">
                <div>
                  <b>{state.amenityCount}</b>
                  <span>amenities loaded</span>
                </div>
                <div>
                  <b>{state.activeListings}</b>
                  <span>active listings in DB</span>
                </div>
              </div>
              <p className="backend-check-success">
                Backend is reachable — last checked {state.checkedAt}. If amenity
                count is 12, migrations and seed ran correctly.
              </p>
              <ul className="backend-check-amenities">
                {state.amenities.slice(0, 6).map((a) => (
                  <li key={a.id}>
                    {a.name_en} · {a.name_zh}
                  </li>
                ))}
                {state.amenityCount > 6 && (
                  <li>…and {state.amenityCount - 6} more</li>
                )}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  )
}
