import { FormEvent, useState } from "react"
import { clearDemoSession, isValidDemoEmail } from "../lib/demo-session"
import Shell from "../components/ui/Shell"
import Icon from "../components/ui/Icon"

export default function Verify({
  onBack,
  onVerified,
  initialEmail = "",
  onClearStoredEmail,
}: {
  onBack: () => void
  onVerified: (email: string) => void
  initialEmail?: string
  onClearStoredEmail?: () => void
}) {
  const [email, setEmail] = useState(initialEmail)
  const [touched, setTouched] = useState(false)
  const valid = isValidDemoEmail(email)

  function submit(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    if (valid) onVerified(email)
  }

  return (
    <Shell>
      <button className="back-button" onClick={onBack}>
        <Icon name="back" /> Back
      </button>
      <section className="verify-layout">
        <div className="verify-intro">
          <div className="icon-tile">
            <Icon name="mail" size={25} />
          </div>
          <p className="section-kicker">Step one · student verification</p>
          <h1>
            A trusted community
            <br />
            starts with <em>you.</em>
          </h1>
          <p>
            Rent Mate is built exclusively for Hong Kong’s student community.
            Verify your local university email to continue.
          </p>
          <div className="trust-list" id="trust">
            <div>
              <span>
                <Icon name="check" size={15} />
              </span>
              <p>
                <b>No ID upload required</b>
                <small>We only verify your email domain.</small>
              </p>
            </div>
            <div>
              <span>
                <Icon name="check" size={15} />
              </span>
              <p>
                <b>Your email stays private</b>
                <small>It is never shown on your profile.</small>
              </p>
            </div>
            <div>
              <span>
                <Icon name="check" size={15} />
              </span>
              <p>
                <b>One student, one profile</b>
                <small>Helping keep Rent Mate genuine and safe.</small>
              </p>
            </div>
          </div>
        </div>
        <form className="verify-card" onSubmit={submit}>
          <span className="card-number">01</span>
          <h2>Verify your email</h2>
          <p>
            Use a university address ending in <b>.edu.hk</b>, or another Hong
            Kong domain.
          </p>
          <label htmlFor="email">University email</label>
          <div
            className={`input-wrap ${touched && !valid ? "input-error" : ""}`}
          >
            <Icon name="mail" size={19} />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="name@university.edu.hk"
              autoComplete="email"
            />
          </div>
          {touched && !valid ? (
            <p className="field-message error">
              Enter a valid Hong Kong university email.
            </p>
          ) : (
            <p className="field-message">
              We’ll send you a secure verification link.
            </p>
          )}
          <button className="primary-button" disabled={!valid}>
            Verify & continue <Icon name="arrow" size={19} />
          </button>
          {initialEmail ? (
            <button
              type="button"
              className="back-button"
              style={{ marginTop: 12 }}
              onClick={() => {
                clearDemoSession()
                onClearStoredEmail?.()
                setEmail("")
                setTouched(false)
              }}
            >
              Use a different email
            </button>
          ) : null}
          <div className="required-note">
            <Icon name="lock" size={14} /> Required to keep our community
            trusted
          </div>
        </form>
      </section>
    </Shell>
  )
}