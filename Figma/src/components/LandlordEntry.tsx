import { FormEvent, useState } from "react"
import {
  isValidLandlordEmail,
  setDisplayName,
  setOnboardedComplete,
  setStoredEmail,
  setUserRole,
} from "../lib/demo-session"

export default function LandlordEntry({
  onBack,
  onComplete,
}: {
  onBack: () => void
  onComplete: () => void
}) {
  const [name, setName] = useState("testing")
  const [email, setEmail] = useState("testing@rentmate.local")
  const [touched, setTouched] = useState(false)

  const validName = name.trim().length >= 2
  const validEmail = isValidLandlordEmail(email)

  function submit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!validName || !validEmail) return
    setUserRole("landlord")
    setDisplayName(name.trim())
    setStoredEmail(email.trim())
    setOnboardedComplete()
    onComplete()
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
            Demo mode: no password yet. Use the demo account{" "}
            <b>testing</b> to manage seeded listings or add new ones on the
            map.
          </p>
        </div>
        <form className="verify-card" onSubmit={submit}>
          <h2>Owner sign-in</h2>
          <label htmlFor="owner-name">Display name</label>
          <input
            id="owner-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="testing"
          />
          <label htmlFor="owner-email">Contact email</label>
          <input
            id="owner-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          {touched && (!validName || !validEmail) ? (
            <p className="field-message error">Enter a name and valid email.</p>
          ) : null}
          <button type="submit" className="primary-button">
            Enter landlord dashboard
          </button>
        </form>
      </section>
    </main>
  )
}
