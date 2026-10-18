import { FormEvent, useState } from "react"
import { registerAsLandlord } from "../lib/landlordApi"
import {
  isValidLandlordEmail,
  setDisplayName,
  setOnboardedComplete,
  setStoredEmail,
  setUserRole,
} from "../lib/demo-session"
import { getSupabase, isSupabaseConfigured } from "../lib/supabase"

/**
 * Account created by `npm run seed:listings` — owns the 50 sample Hong Kong listings.
 * The one-click button only shows in dev, or when VITE_SHOW_DEMO_OWNER=true (judging),
 * because anyone could otherwise edit the sample listings on a public site.
 */
const DEMO_EMAIL = "testing@rentmate.local"
const DEMO_PASSWORD = "rentmate-testing-demo"
const SHOW_DEMO_OWNER =
  import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_OWNER === "true"

type Mode = "signin" | "signup"

export default function LandlordEntry({
  onBack,
  onComplete,
}: {
  onBack: () => void
  onComplete: () => void
}) {
  const [mode, setMode] = useState<Mode>("signin")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const configured = isSupabaseConfigured()
  const validEmail = isValidLandlordEmail(email)
  const validPassword = password.length >= 6
  const validName = mode === "signin" || name.trim().length >= 2

  async function authenticate(
    nextEmail: string,
    nextPassword: string,
    nextName: string,
    nextMode: Mode,
  ) {
    const sb = getSupabase()
    if (!sb) {
      setMessage("Supabase is not configured for this build.")
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      if (nextMode === "signup") {
        const { data, error } = await sb.auth.signUp({
          email: nextEmail,
          password: nextPassword,
          options: { data: { full_name: nextName } },
        })
        if (error) throw error
        if (!data.session) {
          setMessage(
            "Account created. Check your inbox to confirm your email, then sign in.",
          )
          setMode("signin")
          return
        }
      } else {
        const { error } = await sb.auth.signInWithPassword({
          email: nextEmail,
          password: nextPassword,
        })
        if (error) throw error
      }

      const profile = await registerAsLandlord(nextName)
      setUserRole("landlord")
      setDisplayName(profile.displayName)
      setStoredEmail(nextEmail)
      setOnboardedComplete()
      onComplete()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Sign-in failed")
    } finally {
      setBusy(false)
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!validEmail || !validPassword || !validName) return
    void authenticate(email.trim(), password, name.trim(), mode)
  }

  return (
    <main className="flow-shell">
      <button type="button" className="back-button" onClick={onBack}>
        ← Back
      </button>
      <section className="verify-layout">
        <div className="verify-intro">
          <p className="section-kicker">Landlords & flat owners</p>
          <h1>
            List your home
            <br />
            for <em>Hong Kong</em> renters.
          </h1>
          <p>
            Create a free owner account to publish listings on the map, mark
            them rented, or take them down. Students browse without signing
            up for an owner account.
          </p>
          <div className="trust-list">
            <div>
              <span>✓</span>
              <p>
                <b>You own your listings</b>
                <small>Only your account can edit or remove them.</small>
              </p>
            </div>
            <div>
              <span>✓</span>
              <p>
                <b>No agency fee</b>
                <small>Students contact you directly through Rent Mate.</small>
              </p>
            </div>
          </div>
        </div>

        <form className="verify-card owner-card" onSubmit={submit}>
          <h2>{mode === "signin" ? "Owner sign-in" : "Create owner account"}</h2>

          {!configured && (
            <p className="field-message error">
              Supabase env vars are missing, so owner sign-in is unavailable.
            </p>
          )}

          {mode === "signup" && (
            <>
              <label htmlFor="owner-name">Display name</label>
              <input
                id="owner-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mrs. Chan"
                autoComplete="name"
              />
            </>
          )}
          <label htmlFor="owner-email">Email</label>
          <input
            id="owner-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <label htmlFor="owner-password">Password (6+ characters)</label>
          <input
            id="owner-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
          />

          {touched && (!validEmail || !validPassword || !validName) ? (
            <p className="field-message error">
              Enter {mode === "signup" ? "a name, " : ""}a valid email and a
              password of at least 6 characters.
            </p>
          ) : null}
          {message ? <p className="field-message error">{message}</p> : null}

          <button
            type="submit"
            className="primary-button"
            disabled={busy || !configured}
          >
            {busy
              ? "Please wait…"
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>

          <p className="auth-switch">
            {mode === "signin" ? "New here? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin")
                setMessage(null)
                setTouched(false)
              }}
            >
              {mode === "signin" ? "Create an owner account" : "Sign in"}
            </button>
          </p>

          {SHOW_DEMO_OWNER && (
            <button
              type="button"
              className="outline-button"
              disabled={busy || !configured}
              onClick={() => {
                setEmail(DEMO_EMAIL)
                setPassword(DEMO_PASSWORD)
                void authenticate(DEMO_EMAIL, DEMO_PASSWORD, "testing", "signin")
              }}
            >
              Try the demo owner “testing”
            </button>
          )}
        </form>
      </section>
    </main>
  )
}
