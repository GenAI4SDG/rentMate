import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react"

import {
  QUIZ,
  QUIZ_PAGES,
  SECTIONS,
  answersFromProfile,
  answersToProfile,
  type Answer,
  type QuizQuestion,
} from "./lib/quiz"
import { CURATED_CAST, DEMO_EMAIL, isAdminEmail, isCuratedEmail } from "./lib/demoData"
import {
  LISTINGS,
  LISTING_DISTRICTS,
  STATUS_LABEL,
  householdCeiling,
  priceContext,
  satisfiesMustHaves,
  sharePerPerson,
  type Listing,
  type ListingStatus,
} from "./lib/listings"
import {
  INSTITUTIONS,
  TOTAL_DOMAINS,
  validateInstitutionEmail,
  type Institution,
} from "./lib/institutions"
import { areaFit, commuteMinutes, flatSizeWarningForHome } from "./lib/matching"
import {
  REACTIONS,
  openerPrompt,
  reactionLabel,
  replyFor,
  type Hook,
  type ReactionId,
} from "./lib/hooks"
import {
  backendMode,
  getMatches,
  getBlocks,
  getReports,
  loadAccount,
  rememberAccount,
  requestVerification,
  saveProfile,
  sendMessage as sendChatMessage,
  getHistory,
  storedEmail,
  subscribeMessages,
  reportMessage,
  blockUser,
  getBlockedEmails,
  deleteAccount,
  forgetAccount,
  type BlockRow,
  type HiddenMatch,
  type LoadedAccount,
  type MatchFeed,
  type MatchView,
  type ProfileSync,
  type ReportRow,
  type ChatMessage,
} from "./lib/api"
import type { GateFinding, Profile } from "./lib/matching"
import { SAFETY_NOTES } from "./lib/safetyNotes"
import { areaGuideFor } from "./lib/areaGuides"
import { agentFor, agentThread, bookingRequestLine } from "./lib/agentUpdates"
import { HkMap } from "./lib/HkMap"
import {
  DEMO_SEED,
  EMPTY_PERSONAL,
  clearPersonal,
  loadPersonal,
  savePersonal,
  type PersonalState,
  type Viewing,
} from "./lib/personalStore"
import {
  deleteRemotePersonal,
  loadListingPool,
  loadRemotePersonal,
  saveRemotePersonal,
} from "./lib/homesApi"
import { FormEvent, ReactNode, useMemo, useRef, useState } from "react"
import {
  clearDemoSession,
  getQuizAnswers,
  getStoredEmail,
  getUserRole,
  isOnboarded,
  isValidDemoEmail,
  setOnboardedComplete,
  setQuizAnswers,
  setStoredEmail,
  setUserRole,
} from "./lib/demo-session"
import BackendHealthCheck from "./components/BackendHealthCheck"
import FlatsMapExplorer from "./components/FlatsMapExplorer"
import LandlordDashboard from "./components/LandlordDashboard"
import LandlordEntry from "./components/LandlordEntry"
import MatchNarrative from "./components/MatchNarrative"
import RentChatbot from "./components/RentChatbot"
import SettlingPlan from "./components/SettlingPlan"

type Screen =
  | "home"
  | "verify"
  | "quiz"
  | "matches"
  | "landlord-entry"
  | "landlord-dashboard"

type Question = {
  eyebrow: string
  title: string
  hint: string
  options: { title: string; detail?: string; tone?: string }[]
}

const heroImage =
  "https://images.unsplash.com/photo-1562755484-8225ee5215ae?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=88&w=1600"

const questions = QUIZ

// Human labels for the scored factors, used in the factor breakdown.
const FACTOR_LABELS: Record<string, string> = {
  sleep_schedule: "Sleep rhythm",
  shared_space_habits: "Shared-space habits",
  social_guest_preference: "Hosting style",
  noise_preference: "Noise level",
  personal_space_preference: "Need for space",
  bill_splitting_style: "Shared costs",
  mbti: "Communication style",
}

// A safe placeholder so the workspace can render before matches resolve.
const EMPTY_MATCH: MatchView = {
  id: "",
  name: "—",
  school: "",
  area: "",
  budget: "",
  image: "",
  score: null,
  status: "insufficient_data",
  narrative: null,
  factors: {},
  hooks: [],
}

type Message = { id?: string; from: "them" | "me"; text: string; time: string }

/**
 * One card in the match deck.
 *
 * `gate` is non-null only for the second tier — someone the hard filter removed,
 * carried onto a card with the reason attached rather than dropped into a list.
 * `passed` marks someone you already said "not for me" to, who is only back
 * because the top tier ran out.
 */
type DeckEntry = {
  view: MatchView
  gate: GateFinding[] | null
  passed: boolean
}

/**
 * A gated person, rendered as a card.
 *
 * The hard gate never scored them, so there is no score, no hook and no
 * narrative to show — and inventing one would be the exact dishonesty the
 * "Others" list exists to avoid. The card says what it has and no more.
 */
function hiddenToView(person: HiddenMatch): MatchView {
  return {
    id: person.id,
    name: person.name,
    school: person.school ?? "Institution not shown",
    area: "Not shown",
    budget: "Not shown",
    image: person.image,
    score: null,
    status: "insufficient_data",
    narrative: null,
    factors: {},
    hooks: [],
  }
}

/**
 * The commute note for a match's target area. Deliberately shows the word
 * "estimated" — there is no journey API behind this, only district centroids.
 */
function commuteNote(
  area: string,
  campusDistrict: string | null,
  limit: number | null,
): string | null {
  if (!campusDistrict) return null
  const fit = areaFit(area, campusDistrict, limit)
  return fit ? fit.note : null
}

/**
 * Compatibility in words, not a number.
 *
 * The owner asked for every explicit "score" reference to go (14 Oct). The
 * factor-by-factor comparison still runs underneath — it is what decides which
 * hooks you are shown — but a percentage on a person's face reads like a rating
 * of them, so the UI says what it means instead.
 */
function fitPhrase(score: number | null): string {
  if (score === null) return "Not enough overlap yet"
  if (score >= 85) return "Very similar rhythm"
  if (score >= 70) return "Broadly similar"
  if (score >= 55) return "Some overlap"
  return "Different habits"
}

/**
 * The one line under your own name: university, then year, then field.
 *
 * The demo cast has always shown "CUHK · Year 2 · Sociology" because it is baked
 * into their `school` string; your own profile showed a university and stopped,
 * because study year and major were not fields. They are now (see the "About
 * you" quiz page), so this is the same sentence for you as for them.
 */
function identityLine(
  profile: Profile | null,
  institution: Institution | null,
  email: string,
): string {
  const parts = [
    institution?.name,
    profile?.study_year ?? undefined,
    profile?.major ?? undefined,
  ].filter((part): part is string => Boolean(part))
  return parts.length ? parts.join(" · ") : email
}

/** Marks a feature that is AI-generated in production but pre-written in this demo. */
const GenBadge = ({ label }: { label: string }) => (
  <span className="gen-demo-badge" title="AI in production; pre-written content in this demo">
    AI · {label} (demo)
  </span>
)

// `flats` used to be the module constant LISTINGS. It is component state now so
// the pool can come from Postgres when a project is configured — see
// lib/homesApi.ts. LISTINGS stays the fallback, so nothing changes offline.

/**
 * Travel time from a district to a campus, as a sentence. Deliberately says
 * "estimated" — there is no journey API behind this, only an offline model of
 * district-to-district time in lib/matching.ts.
 */
function travelNote(area: string, campusDistrict: string | null): string | null {
  if (!campusDistrict) return null
  const minutes = commuteMinutes(area, campusDistrict)
  if (minutes === null) return null
  return `About ${minutes} min travel to ${campusDistrict} (estimated)`
}

function Icon({
  name,
  size = 20,
  strokeWidth = 1.8,
}: {
  name: "arrow" | "back" | "check" | "home" | "lock" | "mail" | "spark" | "user" | "heart" | "chat" | "search" | "send" | "video" | "list"
  size?: number
  strokeWidth?: number
}) {
  const paths: Record<string, ReactNode> = {
    video: (
      <>
        <rect x="2" y="6" width="13" height="12" rx="2" />
        <path d="m15 10 6-3v10l-6-3" />
      </>
    ),
    list: (
      <>
        <path d="M9 6h11M9 12h11M9 18h11" />
        <path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m14 7 5 5-5 5" />
      </>
    ),
    back: (
      <>
        <path d="m15 18-6-6 6-6" />
      </>
    ),
    check: (
      <>
        <path d="m5 12 4 4L19 6" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z" />
        <path d="m18.5 14 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    ),
    chat: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 10h.01M12 10h.01M16 10h.01" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </>
    ),
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <button
      className={`logo ${light ? "logo-light" : ""}`}
      onClick={() => window.location.reload()}
      aria-label="Rent Mate home"
    >
      <span className="logo-mark">
        <Icon name="home" size={18} strokeWidth={2.2} />
      </span>
      <span>rent mate</span>
    </button>
  )
}

function Home({
  onStartTenant,
  onStartLandlord,
}: {
  onStartTenant: () => void
  onStartLandlord: () => void
}) {
  return (
    <main className="home-screen">
      <nav className="home-nav">
        <Logo light />
        <div className="nav-links">
          <a href="#how">How it works</a>
          <a href="#roles">Who it&apos;s for</a>
          <a href="#backend">Backend test</a>
        </div>
      </nav>

      <section className="hero">
        <img
          src={heroImage}
          alt="Students spending time together on a Hong Kong campus"
        />
        <div className="hero-shade" />
        <div className="hero-copy">
          <div className="community-pill">
            <span className="avatar-stack" aria-hidden="true">
              {CURATED_CAST.slice(0, 6).map((candidate) => (
                <img key={candidate.id} src={candidate.image} alt="" />
              ))}
            </span>
            <span>Built for Hong Kong students</span>
          </div>
          <p className="hero-kicker">Roommates, matched differently</p>
          <h1>
            Meet your
            <br />
            <em>kind of people.</em>
          </h1>
          <p className="hero-subtitle">
            Students find compatible flatmates; landlords list homes on an
            OpenStreetMap — one Hong Kong housing community.
          </p>
          <div className="hero-role-grid" id="roles">
            <button type="button" className="hero-cta" onClick={onStartTenant}>
              <span>
                <b>I&apos;m a student tenant</b>
                <small>Match · chat · find a flat</small>
              </span>
              <span className="cta-icon">
                <Icon name="arrow" />
              </span>
            </button>
            <button
              type="button"
              className="hero-cta hero-cta--landlord"
              onClick={onStartLandlord}
            >
              <span>
                <b>I&apos;m a landlord or flat owner</b>
                <small>List & manage properties on the map</small>
              </span>
              <span className="cta-icon">
                <Icon name="home" />
              </span>
            </button>
          </div>
        </div>
        <div className="hero-stats" id="trust">
          <span>
            <b>Verified</b> student community
          </span>
          <span>
            <b>{questions.length}</b> thoughtful questions
          </span>
          <span>
            <b>Private</b> by design
          </span>
        </div>
      </section>

      <BackendHealthCheck />

      <section className="how-section" id="how">
        <p className="section-kicker">Less scrolling. More certainty.</p>
        <h2>
          A better way to find the person
          <br />
          behind the spare room.
        </h2>
        <div className="step-grid">
          {[
            [
              "01",
              "Verify your student status",
              "A university email keeps the community local and trusted.",
            ],
            [
              "02",
              "Share how you really live",
              "A quick lifestyle quiz goes beyond generic filters.",
            ],
            [
              "03",
              "Open with something real",
              "Every match arrives with one thing you actually have in common — not a ranking.",
            ],
          ].map(([number, title, body]) => (
            <article key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

function Shell({
  children,
  progress,
}: {
  children: ReactNode
  progress?: number
}) {
  return (
    <main className="flow-shell">
      {progress !== undefined && (
        <div className="top-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
      )}
      <header className="flow-header">
        <Logo />
        <div className="trust-note">
          <Icon name="lock" size={15} /> Private & secure
        </div>
      </header>
      {children}
    </main>
  )
}

function Verify({
  onBack,
  onVerified,
  initialEmail = "",
  onClearStoredEmail,
}: {
  onBack: () => void
  /** `existing` is the account already on file for that email, or null. */
  onVerified: (
    email: string,
    institution: Institution | null,
    existing: LoadedAccount | null,
  ) => void
}) {
  const [email, setEmail] = useState(DEMO_EMAIL)
  const [touched, setTouched] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  // Exact allowlist match — see lib/institutions.ts (CP.validate_institution_email.v1).
  const check = validateInstitutionEmail(email)
  const valid = check.eligible//isValidDemoEmail(email)
  // The curated demo cast is reached through a demo/admin local part, never a
  // normal student address. See lib/demoData.ts.
  const curated = isCuratedEmail(email)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    if (!valid) return
    setSending(true)
    setError("")
    try {
      await requestVerification(email)
      // DO YOU ALREADY HAVE AN ACCOUNT? Signing out does not delete anything —
      // the row is still there keyed on this email — so making a returning user
      // re-answer twenty questions was both pointless and a data-loss risk: the
      // old profile sat there until the first "Continue" overwrote it.
      const existing = await loadAccount(email.trim().toLowerCase())
      onVerified(email, check.institution, existing)
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not send the verification email.",
      )
    } finally {
      setSending(false)
    }
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
          <div className="trust-list" id="verify-trust">
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
            Use the email your university issued you. We check it against{" "}
            {INSTITUTIONS.length} Hong Kong institutions, then use your campus
            as the anchor for every commute estimate.
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
              That domain isn’t on our list yet. We accept {INSTITUTIONS.length}{" "}
              Hong Kong institutions across {TOTAL_DOMAINS} email domains —
              check the address.
            </p>
          ) : valid && check.institution ? (
            <p className="field-message">
              Recognised as <b>{check.institution.name}</b>{" "}
              <span className="zh-name">{check.institution.nameZh}</span>.{" "}
              We only check your email domain — no email is sent.
            </p>
          ) : (
            <p className="field-message">
              We’ll send you a secure verification link.
            </p>
          )}
          {valid && curated && (
            <p className="field-message demo-note">
              <Icon name="spark" size={14} /> Demo sign-in — this unlocks the
              curated cast, with real place stories and replies.
            </p>
          )}
          {error && <p className="field-message error">{error}</p>}
          <button className="primary-button" disabled={!valid || sending}>
            {sending ? "Sending…" : "Verify & continue"}{" "}
            <Icon name="arrow" size={19} />
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

/** One question block inside a page. Answers are keyed by the global index. */
function QuestionBlock({
  question,
  index,
  answer,
  onAnswer,
}: {
  question: QuizQuestion
  index: number
  answer: Answer
  onAnswer: (index: number, value: Answer) => void
}) {
  const multi = question.kind === "multi"
  const selectedIndices = multi
    ? Array.isArray(answer)
      ? answer
      : []
    : typeof answer === "number"
      ? [answer]
      : []
  const maxed =
    multi && question.max !== undefined && selectedIndices.length >= question.max

  function choose(optionIndex: number) {
    if (!multi) {
      onAnswer(index, optionIndex)
      return
    }
    const current = selectedIndices
    if (current.includes(optionIndex)) {
      onAnswer(
        index,
        current.filter((i) => i !== optionIndex),
      )
    } else if (question.max === undefined || current.length < question.max) {
      onAnswer(index, [...current, optionIndex])
    }
  }

  if (question.kind === "text") {
    const value = typeof answer === "string" ? answer : ""
    return (
      <div className="question-block free-text-block">
        <p className="question-eyebrow">{question.eyebrow}</p>
        <h1>{question.title}</h1>
        <p className="question-hint">{question.hint}</p>
        <textarea
          className="free-text-input"
          value={value}
          maxLength={question.maxLength ?? 90}
          rows={3}
          placeholder={question.placeholder ?? "Say something only you would say."}
          onChange={(event) => onAnswer(index, event.target.value)}
        />
        <small className="free-text-count">
          {value.length} / {question.maxLength ?? 90} · this is the first thing
          people read
        </small>
      </div>
    )
  }

  return (
    <div className="question-block">
      <p className="question-eyebrow">{question.eyebrow}</p>
      <h1>{question.title}</h1>
      <p className="question-hint">{question.hint}</p>
      <div
        className={`option-grid ${multi ? "multi-options" : ""} ${
          question.options.some((option) => option.tone) ? "colour-options" : ""
        }`}
      >
        {question.options.map((option, optionIndex) => {
          const isSelected = selectedIndices.includes(optionIndex)
          const isDisabled = multi && !isSelected && maxed
          return (
            <button
              key={option.title}
              className={`option-card ${isSelected ? "selected" : ""} ${
                isDisabled ? "dimmed" : ""
              }`}
              onClick={() => choose(optionIndex)}
              disabled={isDisabled}
            >
              {option.tone ? (
                <span
                  className="colour-swatch"
                  style={{ background: option.tone }}
                />
              ) : (
                <span className="option-letter">
                  {multi
                    ? isSelected
                      ? "✓"
                      : "+"
                    : String.fromCharCode(65 + optionIndex)}
                </span>
              )}
              <span className="option-copy">
                <b>{option.title}</b>
                {option.detail && <small>{option.detail}</small>}
              </span>
              <span className="option-check">
                <Icon name="check" size={15} />
              </span>
            </button>
          )
        })}
      </div>

      {/* THE AI AREA SUGGESTER — and it belongs on this question, not on the
          Homes tab. The owner's framing (IP.rentmate.transparency) is that you
          choose an area by its vibe and reputation, not only by its rent; the
          guide was sitting one screen away, after you had already committed to
          a district. It now appears here, as you tick.
          Same source as the Homes district step (lib/areaGuides.ts), so the
          two can never tell you different things about the same place. */}
      {question.factor === "target_areas" && selectedIndices.length > 0 && (
        <div className="area-suggester">
          <p className="area-suggester-head">
            <GenBadge label="area guide" />
            <b>What you just picked, in a sentence.</b>
          </p>
          <ul>
            {selectedIndices
              .map((optionIndex) => question.options[optionIndex]?.tag)
              .filter((tag): tag is string => Boolean(tag))
              .map((tag) => {
                const guide = areaGuideFor(tag)
                if (!guide) return null
                return (
                  <li key={tag}>
                    <b>{tag}</b>
                    <em>{guide.vibe}</em>
                    <small>{guide.communityReputation}</small>
                  </li>
                )
              })}
          </ul>
        </div>
      )}

      <p className="question-footer-note">
        {multi
          ? `${selectedIndices.length} selected${
              question.max !== undefined ? ` · up to ${question.max}` : ""
            }`
          : question.optional && selectedIndices.length === 0
            ? "Optional — skip if you'd rather not say"
            : selectedIndices.length === 0
              ? "Choose one to continue"
              : "Looking good — ready when you are"}
      </p>
    </div>
  )
}

function Quiz({
  onBack,
  onComplete,
  initialAnswers,
}: {
  onBack: () => void
  onComplete: (answers: Answer[]) => void
  /** Pre-filled when you come back to edit your answers. */
  initialAnswers?: Answer[]
}) {
  const [pageIndex, setPageIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>(
    () => initialAnswers ?? Array(QUIZ.length).fill(undefined),
  )
  const page = QUIZ_PAGES[pageIndex]
  const percent = ((pageIndex + 1) / QUIZ_PAGES.length) * 100
  const section = SECTIONS[page.section]

  function answered(entry: { question: QuizQuestion; index: number }): boolean {
    if (entry.question.optional) return true
    const value = answers[entry.index]
    if (value === undefined) return false
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === "string") return value.trim().length > 0
    return true
  }

  const canContinue = page.questions.every(answered)

  function setAnswer(index: number, value: Answer) {
    setAnswers((current) => {
      const next = [...current]
      next[index] = value
      return next
    })
  }

  function previous() {
    if (pageIndex === 0) onBack()
    else setPageIndex(pageIndex - 1)
  }

  function next() {
    if (!canContinue) return
    if (pageIndex === QUIZ_PAGES.length - 1) onComplete(answers)
    if (selected === undefined) return
    if (index === questions.length - 1) onComplete(answers)
    else {
      setPageIndex(pageIndex + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <Shell progress={percent}>
      <section className="quiz-layout">
        <aside className="quiz-aside">
          <p className="section-kicker">Your Rent Mate profile</p>
          <h2>Little choices tell us a lot.</h2>
          <p>
            We turn your everyday preferences into matches we can explain.
          </p>
          <div className="quiz-metrics">
            <span>
              <b>{String(pageIndex + 1).padStart(2, "0")}</b> current
            </span>
            <span>
              <b>{String(QUIZ_PAGES.length).padStart(2, "0")}</b> screens
            </span>
          </div>
          <div className={`quiz-section-note ${page.section}`}>
            <b>{section.label}</b>
            <span>{section.blurb}</span>
          </div>
          <div className="aside-quote">
            “Compatibility is not about being identical. It’s about knowing
            where you naturally align.”
          </div>
        </aside>
        <div className="question-panel">
          <div className="question-nav">
            <button onClick={previous}>
              <Icon name="back" /> Back
            </button>
            <span>
              {pageIndex + 1} of {QUIZ_PAGES.length}
            </span>
          </div>
          <div className="quiz-progress" aria-hidden="true">
            <span style={{ width: `${percent}%` }} />
          </div>
          {page.questions.map((entry, position) => (
            <div
              key={entry.question.id}
              className={position > 0 ? "stacked-question" : undefined}
            >
              <QuestionBlock
                question={entry.question}
                index={entry.index}
                answer={answers[entry.index]}
                onAnswer={setAnswer}
              />
            </div>
          ))}
          <div className="quiz-footer">
            <span>
              {canContinue
                ? pageIndex === QUIZ_PAGES.length - 1
                  ? "Ready when you are"
                  : "Looking good"
                : page.questions.length > 1
                  ? "Answer both to continue"
                  : "Choose one to continue"}
            </span>
            <button
              className="primary-button"
              disabled={!canContinue}
              onClick={next}
            >
              {pageIndex === QUIZ_PAGES.length - 1
                ? "See my starters"
                : "Continue"}{" "}
              <Icon name="arrow" />
            </button>
          </div>
        </div>
      </section>
    </Shell>
  )
}

const HOOK_FLAGS: Record<Hook["kind"], string> = {
  story: "They know this area",
  interest: "You both…",
  area: "Same search",
  lifestyle: "How you'd live",
  mbti: "How you'd get on",
}

/**
 * What to tell someone whose pool came back empty. The point is to name the one
 * filter doing the most damage, because "loosen your filters" is not advice.
 */
const FILTER_ADVICE: Record<string, string> = {
  budget:
    "Your budget ceiling is doing the most work here. Raising it — or looking with more people, which raises the household total — opens the most doors.",
  location:
    "Your travel-time limit is the tightest one. Ten more minutes adds whole districts.",
  gender:
    "Your roommate-gender preference is what's holding people back. Switching it to “anyone” is the single biggest change you can make.",
  belief:
    "Asking a flatmate to share your belief system is the narrowest filter most people set. Most people say no to it.",
  smoking:
    "Requiring a smoke-free home is ruling people out. You can raise it in the chat instead.",
}

function HookCard({
  match,
  campusDistrict,
  limit,
  reacted,
  viewing,
  onReact,
  onOpen,
  onSayHi,
  onPass,
}: {
  match: MatchView
  campusDistrict: string | null
  limit: number | null
  reacted: { reaction: ReactionId; reply: string } | undefined
  /** A viewing you have agreed with this person, if any. */
  viewing?: Viewing
  onReact: (id: ReactionId) => void
  onOpen: () => void
  /** Straight into the conversation. Was the "Next" button. */
  onSayHi: () => void
  /** Discard this profile. Was the big primary button. */
  onPass: () => void
}) {
  const first = match.name.split(" ")[0]
  const hook = match.hooks[0] ?? null
  const others = match.hooks.slice(1, 3)
  // Travel time, not distance — and labelled an estimate (see lib/matching.ts).
  const note =
    match.area && campusDistrict
      ? (areaFit(match.area, campusDistrict, limit)?.note ?? null)
      : null

  return (
    <article className="hook-card">
      <div className="hook-portrait">
        <img src={match.image} alt={`${match.name}, ${match.school}`} />
        <span className="verified-chip">
          <Icon name="check" size={12} /> Verified student
        </span>
        {viewing && (
          <span className="portrait-reminder" title="You agreed to see a place">
            <Icon name="home" size={14} /> {viewing.when}
          </span>
        )}
      </div>

      <div className="hook-body">
        <header className="hook-head">
          <div>
            <h2>{match.name}</h2>
            <p>{match.school}</p>
          </div>
          <div className="hook-score">
            <b>{fitPhrase(match.score)}</b>
            <span>how you'd get on</span>
            {viewing && (
              <i className="hook-reminder" title="You agreed to see a place">
                Viewing {viewing.when}
              </i>
            )}
          </div>
        </header>
        {match.tagline && <p className="hook-tagline">{match.tagline}</p>}

        <div className="hook-bubble">
          <span className="hook-flag">
            {hook ? HOOK_FLAGS[hook.kind] : "Nothing obvious yet"}
          </span>
          <p className="hook-line">
            {hook
              ? hook.text
              : `${first} hasn't answered enough of the same questions for us to find something you share. That's worth knowing before you message.`}
          </p>
          {others.length > 0 && (
            <ul className="hook-also">
              {others.map((other) => (
                <li key={other.id}>{other.text}</li>
              ))}
            </ul>
          )}

          {/* Reacting still opens the conversation — that part was right. What
              was wrong was the SIZE of it: four chips were the loudest thing on
              the card, above the actual actions. They live in the bubble now,
              next to the thing you are reacting to, and `pass` is gone because
              discarding has a real button of its own at the bottom. */}
          {!reacted && (
            <div className="hook-reactions">
              <span>React and the conversation opens</span>
              {REACTIONS.filter((reaction) => reaction.id !== "pass").map(
                (reaction) => (
                  <button
                    key={reaction.id}
                    className={`react-${reaction.id}`}
                    onClick={() => onReact(reaction.id)}
                    title={reaction.hint}
                  >
                    {reaction.label}
                  </button>
                ),
              )}
            </div>
          )}
        </div>

        {reacted && (
          <div className="hook-reply">
            <img src={match.image} alt="" />
            <div>
              <small>
                {first} replied to “{reactionLabel(reacted.reaction)}”
              </small>
              <p>{reacted.reply}</p>
            </div>
          </div>
        )}

        <dl className="hook-meta">
          <div>
            <dt>Target area</dt>
            <dd>{match.area}</dd>
          </div>
          <div>
            <dt>Budget</dt>
            <dd>{match.budget} / mo</dd>
          </div>
          {note && (
            <div>
              <dt>Commute</dt>
              <dd>{note}</dd>
            </div>
          )}
        </dl>

        {/* "See profile" takes the slot the reaction row used to hold. */}
        <button className="outline-button hook-see-profile" onClick={onOpen}>
          <Icon name="user" size={16} /> See {first}&apos;s profile
        </button>

        {/* The two things you can actually DO with a person. "Say hi" is the
            biggest button on the card because it is the one that starts
            something; discarding is quiet, and it no longer scrolls you to the
            top of the page on the way out. */}
        <div className="hook-actions">
          <button className="outline-button hook-pass" onClick={onPass}>
            Not for me
          </button>
          <button className="primary-button" onClick={onSayHi}>
            Say hi <Icon name="arrow" size={18} />
          </button>
        </div>
      </div>
    </article>
  )
}

/**
 * Moderation review — visible ONLY to the `admin@` local part.
 *
 * A report that nobody can read is not moderation; it is a write to a table.
 * This is the minimum surface that makes "report flags admin review" a true
 * statement: every report, plus every block so ended connections are visible
 * too. It is a read queue with no action buttons — there is no suspend, no
 * ban, no resolution state, and this panel does not pretend otherwise.
 */
function AdminQueue() {
  const [reports, setReports] = useState<ReportRow[]>([])
  const [blocks, setBlocks] = useState<BlockRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const [r, b] = await Promise.all([getReports(), getBlocks()])
      if (cancelled) return
      setReports(r)
      setBlocks(b)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="admin-queue">
      <h1>Review queue</h1>
      <p className="admin-lede">
        Reports and ended connections across every account. Newest first. Nothing
        here can be actioned from this screen — it is a record, not a moderation
        console.
      </p>

      {loading ? (
        <p className="admin-empty">Loading…</p>
      ) : (
        <>
          <h2>Reports ({reports.length})</h2>
          {reports.length === 0 ? (
            <p className="admin-empty">No reports yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Reported by</th>
                  <th>Reported account</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.created_at).toLocaleString()}</td>
                    <td>
                      <code>{r.reporter_email}</code>
                    </td>
                    <td>
                      <code>{r.reported_email}</code>
                    </td>
                    <td>{r.reason ?? <em>no reason given</em>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h2>Ended connections ({blocks.length})</h2>
          {blocks.length === 0 ? (
            <p className="admin-empty">No connections have been ended.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Blocked by</th>
                  <th>Blocked account</th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((b) => (
                  <tr key={b.id}>
                    <td>{new Date(b.created_at).toLocaleString()}</td>
                    <td>
                      <code>{b.blocker_email}</code>
                    </td>
                    <td>
                      <code>{b.blocked_email}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </section>
  )
}

function Matches({
  email,
  institution,
  profile,
  profileSync,
  restored,
  onDismissRestored,
  onEditAnswers,
  onLogout,
}: {
  email: string
  institution: Institution | null
  profile: Profile | null
  /** Where the last save landed — "server", "device", or null before one ran. */
  profileSync: ProfileSync | null
  /** True when this sign-in restored an existing account instead of starting one. */
  restored: boolean
  onDismissRestored: () => void
  /** Reopens the quiz with your current answers. */
  onEditAnswers: () => void
  /** Leaves the account on this device; your answers are untouched. */
  onLogout: () => void
}) {
  type WorkspaceTab = "matches" | "messages" | "homes" | "review"
  const isAdmin = isAdminEmail(email)
  const [feed, setFeed] = useState<MatchFeed>({
    matches: [],
    hidden: [],
    curated: false,
  })
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeMatch, setActiveMatch] = useState<MatchView | null>(null)
  const [reacted, setReacted] = useState<
    Record<string, { reaction: ReactionId; reply: string }>
  >({})
  const [threads, setThreads] = useState<Record<string, Message[]>>({})
  onSignOut,
}: {
  email: string
  onSignOut: () => void
}) {
  type WorkspaceTab = "matches" | "messages" | "flats" | "plan"
  const quizAnswers = useMemo(() => getQuizAnswers(), [])
  const [activeMatch, setActiveMatch] = useState<typeof matches[number] | null>(
    null,
  )
  const [tab, setTab] = useState<WorkspaceTab>("matches")
  const [chatId, setChatId] = useState("")
  const [draft, setDraft] = useState("")
  const [blockedEmails, setBlockedEmails] = useState<string[]>([])
  const [reportedIds, setReportedIds] = useState<Record<string, boolean>>({})

  // --- homes: the pool, and YOUR cart --------------------------------------
  // The listing pool. Starts as the built-in generator so the first paint is
  // never empty, then swaps to the database pool if there is one — 240 rows
  // against the 72 the browser can generate. See lib/homesApi.ts.
  const [flats, setFlats] = useState<Listing[]>(LISTINGS)

  // Saved listings used to be component state rendered as "shared with {person}".
  // They are personal now (see lib/personalStore.ts) and persist across reloads.
  const [personal, setPersonal] = useState<PersonalState>(() => {
    const stored = loadPersonal(email)
    // The curated demo account opens with a small saved list on purpose. The
    // owner asked for the agency side of a booking to be visible, and a
    // cancellation is only visible if a booking existed first — so the demo
    // account starts with one of each state. Real accounts start empty.
    if (isCuratedEmail(email) && stored.saved.length === 0) return DEMO_SEED
    return stored
  })
  // The mirror must not run until the server has been READ. Without this gate the
  // mount-time save fires with whatever localStorage held — which on a fresh
  // browser is an empty shortlist — and `saveRemotePersonal` reconciles by
  // deleting rows that are not in the payload. That would wipe the server copy
  // moments before the load read it. So: read first, then start writing.
  const [remoteReady, setRemoteReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const [pool, remote] = await Promise.all([
        loadListingPool(),
        loadRemotePersonal(email),
      ])
      if (cancelled) return
      if (pool.length > 0) setFlats(pool)
      // `remote` is null when the server has nothing to say. Merging in that case
      // would wipe a local shortlist, so we only adopt a non-empty answer.
      if (remote) {
        setPersonal((local) => ({
          saved: remote.saved ?? local.saved,
          notes: { ...local.notes, ...(remote.notes ?? {}) },
          status: { ...local.status, ...(remote.status ?? {}) },
          attached: { ...local.attached, ...(remote.attached ?? {}) },
          viewings: remote.viewings?.length ? remote.viewings : local.viewings,
          // Who you passed on is not on the server (there is no table for it —
          // it is a local judgement, not shared state), so it stays local.
          dismissedMatches: local.dismissedMatches,
        }))
      }
      setRemoteReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [email])

  // localStorage first, always: it is what the UI already rendered from, and it
  // works with no backend at all. Postgres is written after, best effort.
  useEffect(() => {
    savePersonal(email, personal)
    if (remoteReady) void saveRemotePersonal(email, personal)
  }, [personal, email, remoteReady])

  // Which homes sub-view: the shop window, or your saved list.
  const [homesView, setHomesView] = useState<"browse" | "saved">("browse")
  // District FIRST, then listings — the AI tips come while you scan, after the
  // areas are already narrowed by travel time.
  const [browseStep, setBrowseStep] = useState<"districts" | "listings">(
    "districts",
  )
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  // Real filter state. These used to be four dead buttons.
  const [bedroomFilter, setBedroomFilter] = useState<0 | 1 | 2 | 3>(0)
  const [withinBudget, setWithinBudget] = useState(true)
  const [nearMtrOnly, setNearMtrOnly] = useState(false)
  const [withinTravelLimit, setWithinTravelLimit] = useState(true)
  const [mustHavesOnly, setMustHavesOnly] = useState(false)
  const [selectedFlatId, setSelectedFlatId] = useState(flats[0].id)
  const [tourFlatId, setTourFlatId] = useState<number | null>(null)
  const [tourAngle, setTourAngle] = useState(180)
  const [tourRoom, setTourRoom] = useState(0)
  const [mobileMap, setMobileMap] = useState(false)
  // Conversations are found by the home they are about.
  const [threadFilter, setThreadFilter] = useState<number | "all">("all")
  // The common-sense check: ticked before you go, not read on the matches page.
  const [viewingDraft, setViewingDraft] = useState<{
    matchId: string
    listingId: number
    when: string
    checked: string[]
  } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState("")
  // Which home is waiting for you to choose a conversation. Non-null opens the
  // picker; the value is the listing id.
  const [sendPickerFor, setSendPickerFor] = useState<number | null>(null)
  // "Sent to Ka Ming" — feedback that does not require leaving the page.
  const [sentFlash, setSentFlash] = useState<{
    listingId: number
    name: string
  } | null>(null)
  const [messages, setMessages] = useState([
    {
      from: "them",
      text: "Hi! I saw we matched on quiet weekdays and keeping shared spaces tidy. That sounds ideal.",
      time: "10:24",
    },
    {
      from: "me",
      text: "Same here. I’m hoping to find somewhere near the East Rail line. Are you already looking?",
      time: "10:31",
    },
    {
      from: "them",
      text: "Yes, mostly Sha Tin and Tai Wai. Want to shortlist a few flats together?",
      time: "10:34",
    },
  ])
  const [shortlist, setShortlist] = useState<number[]>([1])
  const [selectedFlat] = useState(flats[0])
  const [tourFlat, setTourFlat] = useState<typeof flats[number] | null>(null)
  const [tourAngle, setTourAngle] = useState(180)
  const [tourRoom, setTourRoom] = useState(0)
  const [tourMode, setTourMode] = useState<"3d" | "ar">("3d")
  const [arActive, setArActive] = useState(false)
  const [arError, setArError] = useState("")
  const [placedItem, setPlacedItem] = useState<"bed" | "desk" | "sofa" | null>(
    null,
  )
  const arVideoRef = useRef<HTMLVideoElement>(null)
  const panoramaDrag = useRef<{ startX: number; startAngle: number } | null>(
    null,
  )
  const firstName = useMemo(
    () => email.split("@")[0].split(/[._-]/)[0] || "there",
    [email],
  )

  const matches = feed.matches
  const hidden = feed.hidden

  // --- the deck ------------------------------------------------------------
  // "Not for me" used to advance an index and forget, so everyone you rejected
  // was back on the next reload. The list of people you passed on lives in the
  // personal store now (lib/personalStore.ts) and the deck is derived from it.
  const dismissed = personal.dismissedMatches
  const eligible = matches.filter((match) => !dismissed.includes(match.id))
  const passedOn = matches.filter((match) => dismissed.includes(match.id))

  /**
   * Tier 1 is everyone eligible you have not passed on. When that empties, tier
   * 2 is the people you passed on followed by the people your non-negotiables
   * exclude — because the owner's rule is that there is ALWAYS somebody to look
   * at, paired with the honesty that you are past the recommendations. Tier 2
   * carries each person's gate reasons onto the card instead of hiding them in
   * a list at the bottom of the page.
   */
  const deck: DeckEntry[] =
    eligible.length > 0
      ? eligible.map((view) => ({ view, gate: null, passed: false }))
      : [
          ...passedOn.map((view) => ({ view, gate: null, passed: true })),
          ...hidden.map((person) => ({
            view: hiddenToView(person),
            gate: person.reasons,
            passed: false,
          })),
        ]

  const exhausted = eligible.length === 0 && deck.length > 0
  // Clamped: the deck shrinks under the index the moment you dismiss someone.
  const deckIndex = deck.length ? Math.min(activeIndex, deck.length - 1) : 0
  const currentEntry = deck[deckIndex] ?? null
  const current = currentEntry?.view ?? null

  // Conversations are connections. Someone you discarded is not one — that is
  // the point of discarding — so they leave the Messages tab too, and the open
  // thread falls to the next person rather than to a stranger.
  const connections = eligible
  const chatMatch =
    connections.find((match) => match.id === chatId) ??
    connections[0] ??
    EMPTY_MATCH
  const thread = threads[chatMatch.id] ?? []
  // The verified institution is the anchor for every travel estimate on screen.
  const campusDistrict = institution?.district ?? null
  const commuteLimit = profile?.looking_for?.max_commute_minutes ?? null
  const targetAreas = profile?.target_areas ?? []
  const mustHaves = profile?.must_haves ?? []

  // Household budget: your ceiling times everyone moving in. This is the cap
  // that was missing entirely — listings used to ignore your answers.
  const household = profile?.household_size ?? null
  const budgetCeiling = householdCeiling(profile?.budget_max, (household ?? 2) - 1)
  const people = household ?? 2

  const statusOf = (id: number): ListingStatus => personal.status[String(id)] ?? "available"
  const savedIds = personal.saved
  const attachedToChat = personal.attached[chatMatch.id] ?? []

  /** Homes in one district that clear the household budget. */
  const homesInArea = (area: string): Listing[] =>
    flats.filter(
      (flat) =>
        flat.area === area &&
        (budgetCeiling === null || flat.price <= budgetCeiling),
    )

  const visibleFlats = flats.filter((flat) => {
    if (selectedArea && flat.area !== selectedArea) return false
    if (budgetCeiling !== null && withinBudget && flat.price > budgetCeiling)
      return false
    if (bedroomFilter !== 0 && flat.bedrooms !== bedroomFilter) return false
    if (nearMtrOnly && !flat.nearMtr) return false
    if (withinTravelLimit && campusDistrict && commuteLimit !== null) {
      const minutes = commuteMinutes(flat.area, campusDistrict)
      if (minutes !== null && minutes > commuteLimit) return false
    }
    if (mustHavesOnly && mustHaves.length > 0) {
      const have = satisfiesMustHaves(flat)
      if (!mustHaves.some((want) => have.includes(want))) return false
    }
    if (search.trim()) {
      const haystack = `${flat.title} ${flat.area} ${flat.details}`.toLowerCase()
      if (!haystack.includes(search.trim().toLowerCase())) return false
    }
    return true
  })

  const selectedFlat = flats.find((flat) => flat.id === selectedFlatId) ?? flats[0]
  const tourFlat = tourFlatId === null ? null : (flats.find((f) => f.id === tourFlatId) ?? null)
  const tourRooms = tourFlat?.rooms ?? []
  const currentViewing = (matchId: string) =>
    personal.viewings.find((v) => v.matchId === matchId) ?? null

  function patchPersonal(patch: (state: PersonalState) => PersonalState) {
    setPersonal((state) => patch(state))
  }

  function toggleSaved(id: number) {
    patchPersonal((state) => ({
      ...state,
      saved: state.saved.includes(id)
        ? state.saved.filter((savedId) => savedId !== id)
        : [...state.saved, id],
    }))
  }

  function setStatus(id: number, status: ListingStatus) {
    patchPersonal((state) => ({
      ...state,
      status: { ...state.status, [String(id)]: status },
    }))
  }

  /**
   * Push a home into a NAMED conversation.
   *
   * This used to take only a listing and silently target `chatMatch` — whichever
   * thread happened to be open. From the Homes tab that meant posting a flat
   * into a conversation you were not looking at, with no way to tell. The
   * caller now has to say who (see `sendListingTo`, which asks).
   */
  function attachToChat(matchId: string, listingId: number) {
    if (!matchId) return
    patchPersonal((state) => {
      const current = state.attached[matchId] ?? []
      if (current.includes(listingId)) return state
      return {
        ...state,
        attached: {
          ...state.attached,
          [matchId]: [...current, listingId],
        },
      }
    })
  }

  /** Which conversation did you already send this home to? */
  function sentToListing(matchId: string, listingId: number): boolean {
    return (personal.attached[matchId] ?? []).includes(listingId)
  }

  // Compute the feed once the profile is known. Prefers the Edge Function for the
  // score; lib/api.ts falls back to local scoring, and the hooks are local always.
  useEffect(() => {
    let cancelled = false
    if (!profile) {
      setLoadingMatches(false)
      return
    }
    getMatches(profile, email)
      .then((result) => {
        if (cancelled) return
        setFeed(result)
        setActiveIndex(0)
        // Seed any conversation that already exists, so Messages is not empty.
        const seeded: Record<string, Message[]> = {}
        for (const match of result.matches) {
          if (match.thread?.length) seeded[match.id] = match.thread
        }
        setThreads(seeded)
        if (result.matches[0]) setChatId(result.matches[0].id)
        setLoadingMatches(false)
      })
      .catch(() => {
        if (!cancelled) setLoadingMatches(false)
      })
    return () => {
      cancelled = true
    }
  }, [profile, email])

  // Emails I cannot chat with (I blocked them, or they blocked me).
  useEffect(() => {
    void getBlockedEmails(email).then((list) => setBlockedEmails(list))
  }, [email])

  const isBlocked = (match: MatchView) =>
    Boolean(match.real && match.email && blockedEmails.includes(match.email))

  // Real conversations: load persisted history, then stream live inserts via
  // Realtime. Optimistic sends and the echo dedupe on the message id.
  useEffect(() => {
    const conv = chatMatch?.real ? chatMatch.conversationId : null
    if (!conv || !chatMatch) return
    let cancelled = false
    void getHistory(conv, email).then((hist) => {
      if (cancelled) return
      setThreads((prev) => ({ ...prev, [chatMatch.id]: hist }))
    })
    const unsubscribe = subscribeMessages(conv, email, (msg) => {
      if (cancelled) return
      setThreads((prev) => {
        const current = prev[chatMatch.id] ?? []
        if (msg.id && current.some((m) => m.id === msg.id)) return prev
        return { ...prev, [chatMatch.id]: [...current, msg] }
      })
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [chatId, chatMatch?.conversationId, email])

  // Price context vs the district average (see lib/listings.ts). Null when the
  // district has no figure on file — "not provided" beats a fake comparison.
  const flatContext = priceContext(selectedFlat.area, selectedFlat.price)

  /**
   * Reacting opens the conversation — it does NOT invent their reply.
   *
   * The old behaviour dropped a canned "them" message into the thread the moment
   * you reacted, which read like they had already answered. Now: you react, you
   * land in the conversation, and the app nudges you to suggest a home. Their
   * cached reply is kept as the opener you can send, not as a message sent for
   * them.
   */
  function react(match: MatchView, reaction: ReactionId) {
    // `pass` is no longer offered as a reaction chip — discarding has its own
    // button — but the guard stays so a stale caller cannot silently no-op.
    if (reaction === "pass") {
      passOn(match)
      return
    }
    setReacted((prev) => ({
      ...prev,
      [match.id]: {
        reaction,
        reply: replyFor(match, reaction, match.hooks[0] ?? null) ?? "",
      },
    }))
    setThreads((prev) => ({
      ...prev,
      [match.id]: [
        ...(prev[match.id] ?? []),
        { from: "me", text: reactionLabel(reaction), time: "Now" },
      ],
    }))
    startChat(match)
  }

  /**
   * Discard a profile.
   *
   * Records the decision (so they stay gone), then moves to the next card at
   * the SAME position rather than incrementing — the deck loses one entry, so
   * incrementing would skip whoever slid into that slot. And it does not
   * scroll: the old "Next" button called `advance(true)`, which threw you to the
   * top of the page every time you rejected someone.
   */
  function passOn(match: MatchView) {
    const position = deck.findIndex((entry) => entry.view.id === match.id)
    const remaining = deck.length - 1
    patchPersonal((state) =>
      state.dismissedMatches.includes(match.id)
        ? state
        : { ...state, dismissedMatches: [...state.dismissedMatches, match.id] },
    )
    // Keep the thread list honest: no connection, no conversation.
    if (chatId === match.id) setChatId("")
    setActiveIndex(Math.max(0, Math.min(position, remaining - 1)))
  }

  /**
   * There is no longer a neutral "next card" action.
   *
   * The old `advance(scroll = true)` was the biggest button on the card and it
   * both discarded the person and scrolled the page to the top — the two
   * complaints in the owner's review ("why is the biggest button, which says
   * 'next', used to discard a profile?", "the page kinda jumps to the top").
   * Moving between cards is the dot navigation under the card; the two things
   * you can DO are Say hi and Not for me.
   */
  function startChat(match: MatchView) {
    setChatId(match.id)
  function startChat(match: typeof matches[number]) {
    setChatMatch(match)
    setActiveMatch(null)
    setTab("messages")
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || !chatMatch.id) return
    if (chatMatch.real && chatMatch.conversationId && !isBlocked(chatMatch)) {
      const id = await sendChatMessage({
        conversationId: chatMatch.conversationId,
        senderEmail: email,
        text,
      })
      setThreads((prev) => ({
        ...prev,
        [chatMatch.id]: [...(prev[chatMatch.id] ?? []), { id, from: "me", text, time: "Now" }],
      }))
    } else {
      setThreads((prev) => ({
        ...prev,
        [chatMatch.id]: [...(prev[chatMatch.id] ?? []), { from: "me", text, time: "Now" }],
      }))
    }
    setDraft("")
  }

  function reportConnection() {
    if (!chatMatch.email || !chatMatch.conversationId) return
    void reportMessage({
      reporterEmail: email,
      reportedEmail: chatMatch.email,
      conversationId: chatMatch.conversationId,
      reason: "user report from chat",
    })
    setReportedIds((prev) => ({ ...prev, [chatMatch.id]: true }))
  }

  function endConnection() {
    if (!chatMatch.email) return
    void blockUser(email, chatMatch.email)
    setBlockedEmails((prev) =>
      prev.includes(chatMatch.email as string) ? prev : [...prev, chatMatch.email as string],
    )
  }

  /**
   * Times are agreed by talking, not by picking from four invented slots. So
   * "send this home" is: ask who, attach it to that conversation, and post the
   * suggestion as ordinary text.
   */
  function openSendPicker(listingId: number) {
    if (!connections.length) return
    setSendPickerFor(listingId)
  }

  function sendListingTo(matchId: string, listingId: number) {
    const flat = flats.find((f) => f.id === listingId)
    const person = connections.find((m) => m.id === matchId)
    if (!flat || !person) return
    attachToChat(matchId, listingId)
    const share = sharePerPerson(flat.price, people)
    pushMessageTo(
      matchId,
      `How about we go see “${flat.title}” in ${flat.area}? ${flat.priceLabel} for the whole flat — about $${share.toLocaleString("en-US")} each. When suits you?`,
    )
    setSendPickerFor(null)
    // A confirmation you can actually see, without yanking you out of the list
    // you were reading. Cleared by the next send.
    setSentFlash({ listingId, name: person.name.split(" ")[0] })
  }

  /**
   * Book a viewing with the listing agency.
   *
   * This replaces the status dropdown that used to sit on every listing. A
   * dropdown let you declare a flat "taken" for no reason at all; a booking is
   * an action with a counterparty, and the counterparty answers — see
   * lib/agentUpdates.ts, which is what fills the agent panel on the saved page.
   */
  function bookWithAgency(listingId: number, matchId?: string) {
    const flat = flats.find((f) => f.id === listingId)
    if (!flat) return
    setStatus(listingId, "viewing")
    const target = matchId ?? chatMatch.id
    if (target) {
      pushMessageTo(
        target,
        `I've asked ${agentFor(listingId)} to show us “${flat.title}”. They'll confirm a time here.`,
      )
    }
  }

  /** Push text into a NAMED conversation, persisted when that chat is real. */
  function pushMessageTo(matchId: string, text: string) {
    if (!matchId) return
    const target = matches.find((m) => m.id === matchId)
    const push = (id?: string) =>
      setThreads((prev) => ({
        ...prev,
        [matchId]: [
          ...(prev[matchId] ?? []),
          { id, from: "me", text, time: "Now" },
        ],
      }))
    if (target?.real && target.conversationId && !isBlocked(target)) {
      void sendChatMessage({
        conversationId: target.conversationId,
        senderEmail: email,
        text,
      }).then(push)
    } else {
      push()
    }
  }

  function pushMessage(text: string) {
    pushMessageTo(chatMatch.id, text)
  }

  /**
   * Locking in a viewing requires ticking the common-sense list first. That list
   * used to sit on the matches page where nobody read it; it belongs at the
   * moment you commit to going somewhere with a stranger.
   */
  function confirmViewing() {
    if (!viewingDraft || !chatMatch.id) return
    if (viewingDraft.checked.length < SAFETY_NOTES.length) return
    const viewing: Viewing = {
      id: `${viewingDraft.matchId}-${viewingDraft.listingId}-${Date.now()}`,
      matchId: viewingDraft.matchId,
      listingId: viewingDraft.listingId,
      when: viewingDraft.when.trim() || "time to be agreed",
      confirmed: true,
    }
    patchPersonal((state) => ({ ...state, viewings: [...state.viewings, viewing] }))
    setStatus(viewingDraft.listingId, "viewing")
    pushMessage(`Viewing locked in — ${viewing.when}. See you there.`)
    setViewingDraft(null)
  }

  function closeTour() {
    setTourFlatId(null)
    setTourRoom(0)
    setTourAngle(180)
  }

  function rotateTour(amount: number) {
    setTourAngle((current) => (current + amount + 360) % 360)
  }

  function moveRoom(direction: 1 | -1) {
    setTourRoom(
      (current) => (current + direction + tourRooms.length) % Math.max(1, tourRooms.length),
    )
    setTourAngle(180)
  }

  // Which of MY filters is holding back the most people — named in the empty
  // state so "loosen one" means something specific.
  const worstField = useMemo(() => {
    const counts: Record<string, number> = {}
    hidden.forEach((person) => {
      person.reasons
        .filter((reason) => reason.side === "you")
        .forEach((reason) => {
          counts[reason.field] = (counts[reason.field] ?? 0) + 1
        })
    })
    return (
      Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    )
  }, [hidden])

  /** Which home each conversation is about, for the filter chips. */
  const listingIdsInPlay = useMemo(() => {
    const ids = new Set<number>()
    Object.values(personal.attached).forEach((list) => list.forEach((id) => ids.add(id)))
    personal.viewings.forEach((v) => ids.add(v.listingId))
    return Array.from(ids).sort((a, b) => a - b)
  }, [personal])

  function visibleThreads() {
    if (threadFilter === "all") return connections.filter((m) => !isBlocked(m))
    return connections.filter(
      (m) => !isBlocked(m) && (personal.attached[m.id] ?? []).includes(threadFilter),
    )
  }

  function logOut() {
    setMenuOpen(false)
    onLogout()
  }

  async function resetAccount() {
    await deleteAccount(email)
    // Reset means reset: the profile row AND your saved homes / viewings. Log out
    // deliberately does neither — see logOut() below.
    await deleteRemotePersonal(email)
    clearPersonal(email)
    window.location.reload()
  }

  return (
    <main className="matches-screen">
      <header className="matches-header">
        <Logo />
        <nav>
          <button
            className={tab === "matches" ? "active" : ""}
            onClick={() => setTab("matches")}
          >
            <Icon name="spark" size={17} /> Matches
          </button>
          <button
            className={tab === "messages" ? "active" : ""}
            onClick={() => setTab("messages")}
          >
            <Icon name="chat" size={17} /> Messages
          </button>
          <button
            className={tab === "homes" ? "active" : ""}
            onClick={() => setTab("homes")}
          >
            <Icon name="home" size={17} /> Homes
            {savedIds.length > 0 && <i className="tab-count">{savedIds.length}</i>}
          </button>
          {isAdmin && (
            <button
              className={tab === "review" ? "active" : ""}
              onClick={() => setTab("review")}
            >
              <Icon name="lock" size={16} /> Review
            </button>
          )}
        </nav>

        {/* The profile chip is a MENU now, not a readout. "Start over" used to
            sit in the nav bar as a bare button, one stray click from wiping
            everything; it is behind this menu and behind a typed confirmation. */}
        <div className="profile-menu-wrap">
          <button
            className="profile-chip profile-chip-button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label="Account menu"
          >
            <span>{firstName.slice(0, 1).toUpperCase()}</span>
            <span>
              <b>{firstName}</b>
              <small>{identityLine(profile, institution, email)}</small>
            </span>
          </button>
          {menuOpen && (
            <div className="profile-menu">
              {/* Your own profile, as other people see it. Study year and major
                  are here because they are now real fields with real answers —
                  see the "About you" quiz page. */}
              <div className="menu-identity">
                <b>{institution?.name ?? "Institution not set"}</b>
                <span>
                  {[profile?.study_year, profile?.major]
                    .filter(Boolean)
                    .join(" · ") || "Year and major not answered yet"}
                </span>
                <small className={`sync-note ${profileSync ?? backendMode}`}>
                  {profileSync === "server"
                    ? "Your answers are saved to the server."
                    : profileSync === "device"
                      ? "Saved on this device only — the server did not accept the write."
                      : backendMode === "supabase"
                        ? "Connected to the server."
                        : "No server configured — this browser is the only copy."}
                </small>
              </div>
              <button onClick={onEditAnswers}>
                <Icon name="user" size={16} /> Edit my answers
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  setTab("homes")
                  setHomesView("saved")
                }}
              >
                <Icon name="heart" size={16} /> Saved homes ({savedIds.length})
              </button>
              <button onClick={logOut}>
                <Icon name="back" size={16} /> Log out
              </button>
              <div className="menu-danger">
                <p>Resetting deletes your answers on this device and the server.</p>
                <input
                  value={confirmReset}
                  onChange={(event) => setConfirmReset(event.target.value)}
                  placeholder="Type RESET to confirm"
                />
                <button
                  className="danger-button"
                  disabled={confirmReset.trim().toUpperCase() !== "RESET"}
                  onClick={() => void resetAccount()}
                >
                  Reset account
                </button>
              </div>
            </div>
          )}
        </div>
          <button
            className={tab === "plan" ? "active" : ""}
            onClick={() => setTab("plan")}
          >
            <Icon name="list" size={17} /> My plan
          </button>
        </nav>
        <button
          className="profile-chip"
          onClick={onSignOut}
          title="Sign out and use another email"
        >
          <span>{firstName.slice(0, 1).toUpperCase()}</span>
          <span>
            <b>{firstName}</b>
            <small>Signed in · tap to switch</small>
          </span>
        </button>
      </header>

      {/* Signing back in restores the account rather than restarting the quiz.
          Said once, and dismissable, because it explains why the app did not
          ask you twenty questions again. */}
      {restored && (
        <div className={`restored-banner ${profileSync ?? backendMode}`}>
          <Icon name="check" size={15} />
          <p>
            <b>Welcome back — we found your account.</b>
            <span>
              {profileSync === "server"
                ? "Loaded from the server, with your saved homes and viewings."
                : "Loaded from this device. Your answers are the same ones you left."}
            </span>
          </p>
          <button onClick={onDismissRestored} aria-label="Dismiss">
            <Icon name="back" size={15} />
          </button>
        </div>
      )}

      {tab === "matches" && (
        <>
          <section className="matches-hero">
            <div>
              <p className="section-kicker">
                {feed.curated ? "Curated demo cast" : "Your conversation starters"}
              </p>
              <h1>
                People who feel
                <br />
                like a <em>good fit.</em>
              </h1>
            </div>
            {/* The line that used to sit here — "No grid, no swiping. Each card
                opens with one real thing you two have in common…" — is deleted
                at the owner's request. The card demonstrates that by doing it. */}
            <dl className="hero-stats">
              <div>
                <dt>In your deck</dt>
                <dd>{deck.length}</dd>
              </div>
              <div>
                <dt>You passed on</dt>
                <dd>{dismissed.length}</dd>
              </div>
              <div>
                <dt>Outside your rules</dt>
                <dd>{hidden.length}</dd>
              </div>
            </dl>
          </section>
          <section className="match-section">
            <div className="match-toolbar">
              <p>
                <b>
                  {loadingMatches
                    ? "Finding students you'd get on with…"
                    : deck.length === 0
                      ? "No one in the pool yet"
                      : exhausted
                        ? "Past our recommendations — here's who's left"
                        : `${deck.length} ${
                            deck.length === 1 ? "person" : "people"
                          } you can message`}
                </b>
                <span>
                  {backendMode === "supabase"
                    ? "Supabase connected · chat + profiles persisted · compared in your browser"
                    : "Demo mode · everything in your browser"}
                  {campusDistrict ? ` · anchored to ${campusDistrict}` : ""}
                </span>
              </p>
              {deck.length > 0 && (
                <span className="hook-counter">
                  {deckIndex + 1} / {deck.length}
                </span>
              )}
            </div>

            {loadingMatches && (
              <p className="hook-empty">Working through your answers…</p>
            )}

            {/* TIER 2. The deck never runs dry — but it says when you are past
                the people it would actually have picked for you. */}
            {!loadingMatches && exhausted && (
              <div className="deck-exhausted">
                <Icon name="spark" size={16} />
                <div>
                  <b>That's everyone we'd have recommended.</b>
                  <p>
                    You've been through the people who fit your non-negotiables.
                    What's left is the ones you passed on, and the ones your own
                    rules exclude — shown with the rule that excluded them, so
                    you can decide whether it was worth it. Loosen one and they
                    move back into the main deck.
                  </p>
                </div>
              </div>
            )}

            {/* An empty pool needs an answer, not a pat on the head. */}
            {!loadingMatches && deck.length === 0 && (
              <div className="empty-state-card">
                <h2>No one fits yet. Here's the shortest way out.</h2>
                <p>
                  {hidden.length > 0
                    ? `${hidden.length} ${hidden.length === 1 ? "person is" : "people are"} in the pool — your non-negotiables are holding every one of them back.`
                    : "The pool is empty right now. You'll see people here as other students verify."}
                </p>
                {worstField && (
                  <p className="empty-advice">
                    <Icon name="spark" size={15} /> {FILTER_ADVICE[worstField]}
                  </p>
                )}
                <div className="empty-actions">
                  <button className="primary-button" onClick={onEditAnswers}>
                    Loosen a non-negotiable <Icon name="arrow" size={17} />
                  </button>
                </div>
                <p className="empty-footnote">
                  Flat size never blocks anyone — it only flags homes outside
                  your range. Everything else you set does.
                </p>
              </div>
            )}

            {current && (
              <>
                <HookCard
                  key={current.id}
                  match={current}
                  campusDistrict={campusDistrict}
                  limit={commuteLimit}
                  reacted={reacted[current.id]}
                  viewing={currentViewing(current.id) ?? undefined}
                  onReact={(id) => react(current, id)}
                  onOpen={() => setActiveMatch(current)}
                  onSayHi={() => startChat(current)}
                  onPass={() => passOn(current)}
                />

                {/* On a tier-2 card, the reason you are looking at them is on
                    the card, not buried in a list. */}
                {currentEntry?.gate && (
                  <div className="deck-gate">
                    <b>
                      <Icon name="lock" size={14} /> Why we didn't show them first
                    </b>
                    <ul>
                      {currentEntry.gate.map((reason) => (
                        <li key={`${reason.field}-${reason.side}`}>
                          {reason.side === "you" ? "You: " : "Them: "}
                          {reason.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {currentEntry?.passed && (
                  <p className="deck-gate deck-gate-passed">
                    You passed on {current.name.split(" ")[0]} earlier. They're
                    back because the deck is down to its last few.
                  </p>
                )}

                {deck.length > 1 && (
                  <nav className="hook-dots" aria-label="Match navigation">
                    {deck.map((entry, index) => (
                      <button
                        key={entry.view.id}
                        className={index === deckIndex ? "active" : ""}
                        onClick={() => setActiveIndex(index)}
                        aria-label={`Show ${entry.view.name}`}
                      />
                    ))}
                  </nav>
                )}
              </>
            )}

            {/* OTHERS — the people your non-negotiables are holding back. It used
                to be a collapsed <details> labelled "we hid N people"; the owner
                asked for it to be a place you can actually look. */}
            {hidden.length > 0 && (
              <section className="others-panel">
                <header>
                  <h3>
                    <Icon name="lock" size={15} /> Others ({hidden.length})
                  </h3>
                  <p>
                    These people are in the pool. Your non-negotiables are
                    holding each of them back — and we tell you which one, which
                    is the part most apps hide.
                  </p>
                </header>
                <ul>
                  {hidden.map((person) => (
                    <li key={person.id}>
                      <img src={person.image} alt="" />
                      <span>
                        <b>{person.name}</b>
                        <small className="others-school">{person.school}</small>
                        {person.reasons.map((reason) => (
                          <small key={`${reason.field}-${reason.side}`}>
                            {reason.side === "you" ? "You: " : "Them: "}
                            {reason.text}
                          </small>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
                <button className="outline-button" onClick={onEditAnswers}>
                  Change a non-negotiable <Icon name="arrow" size={16} />
                </button>
              </section>
            )}

            <div className="matches-note">
              <Icon name="spark" />
              <p>
                <b>
                  {feed.curated
                    ? "You're signed in as the demo account."
                    : "Your matches get better over time."}
                </b>
                <span>
                  {feed.curated
                    ? "The curated cast is synthetic — written for this demo. The districts and the kinds of places are real; the people are not."
                    : "Synthetic demo profiles · no real students in this pool."}
                </span>
              </p>
            </div>
            {/* The neighbourhood guide and the common-sense list both moved: the
                guide into the Homes district step (where you choose an area),
                the cautions into the viewing confirmation (where you commit). */}
          </section>
        </>
      )}

      {tab === "messages" && (
        <section className="chat-workspace">
          <aside className="chat-list">
            <div className="workspace-heading">
              <p className="section-kicker">Connections</p>
              <h1>Messages</h1>
            </div>

            {/* Find a conversation by the home it is about. */}
            {listingIdsInPlay.length > 0 && (
              <div className="thread-filters">
                <button
                  className={threadFilter === "all" ? "active" : ""}
                  onClick={() => setThreadFilter("all")}
                >
                  All
                </button>
                {listingIdsInPlay.map((id) => {
                  const flat = flats.find((f) => f.id === id)
                  if (!flat) return null
                  return (
                    <button
                      key={id}
                      className={threadFilter === id ? "active" : ""}
                      onClick={() => setThreadFilter(id)}
                      title={flat.title}
                    >
                      {flat.area} · {flat.mapPrice}
                      {statusOf(id) === "taken" && (
                        <i className="status-dot taken" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {visibleThreads().map((match) => {
              const last = threads[match.id]?.[threads[match.id].length - 1]
              const viewing = currentViewing(match.id)
              return (
                <button
                  key={match.id}
                  className={chatMatch.id === match.id ? "active" : ""}
                  onClick={() => setChatId(match.id)}
                >
                  <img src={match.image} alt="" />
                  <span>
                    <b>
                      {match.name}
                      {viewing && (
                        <i className="red-dot" title={`Viewing: ${viewing.when}`} />
                      )}
                    </b>
                    <small>
                      {viewing
                        ? `Viewing agreed — ${viewing.when}`
                        : last
                          ? `${last.text.slice(0, 42)}${
                              last.text.length > 42 ? "…" : ""
                            }`
                          : "You're connected — say hello"}
                    </small>
                  </span>
                  {threads[match.id]?.length ? <i /> : null}
                </button>
              )
            })}
            {!loadingMatches && visibleThreads().length === 0 && (
              <p className="empty-shortlist">
                {threadFilter === "all"
                  ? "No connections yet. React to a starter on the Matches tab."
                  : "No conversation about this home yet."}
              </p>
            )}
          </aside>
          <div className="chat-thread">
            <header>
              <img src={chatMatch.image} alt="" />
              <span>
                <b>{chatMatch.name}</b>
                <small>
                  <i /> Connected · {fitPhrase(chatMatch.score)}
                </small>
              </span>
              <span className="chat-actions">
                {chatMatch.real && (
                  <>
                    <button
                      className="outline-button"
                      onClick={reportConnection}
                      disabled={reportedIds[chatMatch.id]}
                    >
                      {reportedIds[chatMatch.id] ? "Reported" : "Report"}
                    </button>
                    <button className="outline-button" onClick={endConnection}>
                      End connection
                    </button>
                  </>
                )}
              </span>
              <button onClick={() => setTab("homes")}>
                <Icon name="search" size={16} /> Browse homes
              </button>
            </header>

            {/* The nudge: you've just connected, so suggest somewhere. Listing
                suggestions start the housing half of the conversation. */}
            {attachedToChat.length === 0 && chatMatch.id && (
              <div className="suggest-nudge">
                <Icon name="spark" size={15} />
                <p>
                  Suggest somewhere to look — send a home from your saved list
                  and you'll both be looking at the same thing.
                </p>
                <button
                  className="outline-button"
                  onClick={() => {
                    setTab("homes")
                    setHomesView("saved")
                  }}
                >
                  Pick a home <Icon name="arrow" size={15} />
                </button>
              </div>
            )}

            {/* Homes already in this conversation, with live status. */}
            {attachedToChat.length > 0 && (
              <div className="attached-homes">
                {attachedToChat.map((id) => {
                  const flat = flats.find((f) => f.id === id)
                  if (!flat) return null
                  const status = statusOf(id)
                  return (
                    <div key={id} className="attached-home">
                      <img src={flat.image} alt="" />
                      <span>
                        <b>{flat.title}</b>
                        <small>
                          {flat.area} · {flat.details} · {flat.priceLabel} whole
                          flat · about $
                          {sharePerPerson(flat.price, people).toLocaleString("en-US")}{" "}
                          each
                        </small>
                        <small className={`status-pill ${status}`}>
                          {STATUS_LABEL[status]}
                        </small>
                      </span>
                      <div className="attached-actions">
                        <button
                          className="outline-button"
                          onClick={() => bookWithAgency(id, chatMatch.id)}
                        >
                          {status === "viewing" ? "Booked — chase the agent" : "Book with the agent"}
                        </button>
                        <button
                          className="outline-button"
                          onClick={() =>
                            setViewingDraft({
                              matchId: chatMatch.id,
                              listingId: id,
                              when: "",
                              checked: [],
                            })
                          }
                        >
                          We're going — lock it in
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* The common-sense check, at the point you commit. */}
            {viewingDraft && (
              <div className="viewing-checklist">
                <p>
                  <b>Before you go</b> — tick every one.{" "}
                  <GenBadge label="listing check" />
                </p>
                <ul className="safety-list">
                  {SAFETY_NOTES.map((note) => (
                    <li key={note.title}>
                      <label>
                        <input
                          type="checkbox"
                          checked={viewingDraft.checked.includes(note.title)}
                          onChange={(event) =>
                            setViewingDraft((draft) =>
                              draft
                                ? {
                                    ...draft,
                                    checked: event.target.checked
                                      ? [...draft.checked, note.title]
                                      : draft.checked.filter(
                                          (t) => t !== note.title,
                                        ),
                                  }
                                : draft,
                            )
                          }
                        />
                        <span>
                          <b>{note.title}</b>
                          <span>{note.detail}</span>
                          {!note.ownerSource && (
                            <small className="safety-src">
                              Source: {note.source}
                            </small>
                          )}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="viewing-when">
                  <label htmlFor="viewing-when">When are you going?</label>
                  <input
                    id="viewing-when"
                    value={viewingDraft.when}
                    onChange={(event) =>
                      setViewingDraft((draft) =>
                        draft ? { ...draft, when: event.target.value } : draft,
                      )
                    }
                    placeholder="Sat 14:00 — agreed in the chat"
                  />
                </div>
                <div className="checklist-actions">
                  <button
                    className="primary-button"
                    disabled={
                      viewingDraft.checked.length < SAFETY_NOTES.length ||
                      !viewingDraft.when.trim()
                    }
                    onClick={confirmViewing}
                  >
                    Confirm we've both read this <Icon name="check" size={17} />
                  </button>
                  <button
                    className="outline-button"
                    onClick={() => setViewingDraft(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* A viewing you have already agreed: when, how to get there, and
                somewhere nearby to get a feel for the area first. */}
            {currentViewing(chatMatch.id) && (
              <div className="viewing-reminder">
                <span className="red-dot" />
                <div>
                  <b>
                    You're seeing a place with{" "}
                    {chatMatch.name.split(" ")[0]} —{" "}
                    {currentViewing(chatMatch.id)?.when}
                  </b>
                  {(() => {
                    const flat = flats.find(
                      (f) => f.id === currentViewing(chatMatch.id)?.listingId,
                    )
                    if (!flat) return null
                    const guide = areaGuideFor(flat.area)
                    return (
                      <>
                        <small>
                          <Icon name="home" size={13} /> {flat.title} ·{" "}
                          {flat.area} ·{" "}
                          {travelNote(flat.area, campusDistrict) ??
                            "travel time not estimated"}
                        </small>
                        {guide && (
                          <small className="muted">
                            Get there early and walk the block — {guide.vibe}
                          </small>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>
            )}
            <div className="message-stream">
              <div className="conversation-date">Today</div>
              {thread.length > 0 ? (
                thread.map((message, index) => (
                  <div
                    key={`${message.time}-${index}`}
                    className={`message ${message.from}`}
                  >
                    <p>{message.text}</p>
                    <span>{message.time}</span>
                  </div>
                ))
              ) : (
                <div className="empty-conversation">
                  <img src={chatMatch.image} alt="" />
                  <h2>Start with what you have in common.</h2>
                  <p>
                    {chatMatch.hooks[0]
                      ? chatMatch.hooks[0].text
                      : "You two don't overlap much on paper yet — ask about their week."}
                  </p>
                  {/* Sends YOUR line only. The old version posted their reply
                      for them too, which is why the thread looked like a
                      conversation that had already happened. */}
                  {chatMatch.hooks[0] && (
                    <button
                      className="outline-button"
                      onClick={() =>
                        pushMessage(`“wait, rlly?!” — ${chatMatch.hooks[0].text}`)
                      }
                    >
                      <Icon name="send" size={16} /> “wait, rlly?!”
                    </button>
                  )}
                  <small className="empty-hint">
                    {openerPrompt(chatMatch.hooks[0] ?? null, chatMatch)}
                  </small>
                </div>
              )}
            </div>
            {isBlocked(chatMatch) ? (
              <div className="connection-ended">
                You ended this connection — you'll no longer see each other or swap
                messages.
              </div>
            ) : (
              <form className="message-composer" onSubmit={sendMessage}>
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={`Message ${chatMatch.name.split(" ")[0]}...`}
                />
                <button disabled={!draft.trim()} aria-label="Send message">
                  <Icon name="send" size={18} />
                </button>
              </form>
            )}
            <div className="chat-quick-actions">
              <a
                href="https://meet.google.com/new"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="video" size={15} /> Start a Google Meet
              </a>
              <button
                type="button"
                onClick={() =>
                  setDraft(
                    `Want to view a flat together this weekend? I can start a Google Meet first so we can shortlist places and agree a time to visit.`,
                  )
                }
              >
                <Icon name="home" size={15} /> Propose a viewing meetup
              </button>
            </div>
            <form className="message-composer" onSubmit={sendMessage}>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={`Message ${chatMatch.name.split(" ")[0]}...`}
              />
              <button disabled={!draft.trim()} aria-label="Send message">
                <Icon name="send" size={18} />
              </button>
            </form>
          </div>
          {/* YOUR saved homes. Not "shared with {person}" — these are yours,
              they survive every conversation, and sending one into this chat is
              an explicit action. */}
          <aside className="shared-shortlist">
            <div>
              <p className="section-kicker">Yours, not the chat's</p>
              <h2>Saved homes ({savedIds.length})</h2>
              <p>Send one into this conversation when you want to talk about it.</p>
            </div>
            {flats
              .filter((flat) => savedIds.includes(flat.id))
              .map((flat) => (
                <div className="shortlist-item saved-home-row" key={flat.id}>
                  <img src={flat.image} alt="" />
                  <span>
                    <b>{flat.area}</b>
                    <small>
                      {flat.priceLabel} · about $
                      {sharePerPerson(flat.price, people).toLocaleString("en-US")}{" "}
                      each
                    </small>
                    <small className={`status-pill ${statusOf(flat.id)}`}>
                      {STATUS_LABEL[statusOf(flat.id)]}
                    </small>
                  </span>
                  <button
                    className="send-to-chat"
                    onClick={() => openSendPicker(flat.id)}
                    disabled={connections.length === 0}
                    title={
                      sentToListing(chatMatch.id, flat.id)
                        ? `Already sent to ${chatMatch.name.split(" ")[0]}`
                        : "Send this home into a conversation"
                    }
                  >
                    <Icon
                      name={sentToListing(chatMatch.id, flat.id) ? "check" : "send"}
                      size={15}
                    />
                  </button>
                </div>
              ))}
            {savedIds.length === 0 && (
              <p className="empty-shortlist">
                Nothing saved yet — save homes from the Homes tab.
              </p>
            )}
            <button className="outline-button" onClick={() => setTab("homes")}>
              <Icon name="search" size={16} /> Browse homes
            </button>
          </aside>
        </section>
      )}

      {tab === "homes" && (
        <section className="flats-browser">
          <div className="flats-search-header">
            <div>
              <p className="section-kicker">
                {homesView === "saved" ? "Your saved homes" : "Homes in Hong Kong"}
              </p>
              <h1>{homesView === "saved" ? "Your shortlist." : "Find your space."}</h1>
            </div>
            <div className="homes-view-switch">
              <button
                className={homesView === "browse" ? "active" : ""}
                onClick={() => {
                  setHomesView("browse")
                  setBrowseStep("districts")
                  setSelectedArea(null)
                }}
              >
                Browse
              </button>
              <button
                className={homesView === "saved" ? "active" : ""}
                onClick={() => setHomesView("saved")}
              >
                Saved ({savedIds.length})
              </button>
            </div>
            {budgetCeiling !== null && (
              <p className="household-note">
                Household budget <b>${budgetCeiling.toLocaleString("en-US")}</b> for
                the whole flat — ${(profile?.budget_max ?? 0).toLocaleString("en-US")}{" "}
                each × {people} people. Every home here is priced against that, not
                against the whole market.
              </p>
            )}
          </div>

          {homesView === "saved" && (
            <div className="saved-homes-grid">
              {flats
                .filter((flat) => savedIds.includes(flat.id))
                .map((flat) => {
                  const status = statusOf(flat.id)
                  // The agency's side of the booking. This is where a booking
                  // that no longer exists shows up — see lib/agentUpdates.ts.
                  const thread = agentThread(
                    flat.id,
                    status,
                    personal.viewings.find((v) => v.listingId === flat.id)?.when,
                  )
                  const cancelled = thread.some((update) => update.cancels)
                  return (
                    <article className="saved-home-card" key={flat.id}>
                      <img src={flat.image} alt="" />
                      <div>
                        <span className="detail-area">{flat.area}</span>
                        <h2>{flat.title}</h2>
                        <p>{flat.details}</p>
                        <p className="saved-price">
                          <b>{flat.priceLabel}</b> whole flat ·{" "}
                          <em>
                            about $
                            {sharePerPerson(flat.price, people).toLocaleString(
                              "en-US",
                            )}{" "}
                            each
                          </em>
                        </p>
                        <textarea
                          className="saved-note-input"
                          rows={2}
                          placeholder="Your own note — what you noticed, what to ask."
                          value={personal.notes[String(flat.id)] ?? ""}
                          onChange={(event) =>
                            patchPersonal((state) => ({
                              ...state,
                              notes: {
                                ...state.notes,
                                [String(flat.id)]: event.target.value,
                              },
                            }))
                          }
                        />

                        {/* THE AGENT PANEL. In production this is the agency's
                            real inbox; here it is pre-written and badged, like
                            every other piece of mock content. */}
                        <div className="agent-panel">
                          <p className="agent-head">
                            <GenBadge label="agent" />
                            <b>{agentFor(flat.id)}</b>
                            <span className={`status-pill ${status}`}>
                              {STATUS_LABEL[status]}
                            </span>
                          </p>
                          <ul>
                            {thread.map((update) => (
                              <li
                                key={update.text}
                                className={update.cancels ? "agent-cancel" : undefined}
                              >
                                <p>{update.text}</p>
                                <small>{update.time}</small>
                              </li>
                            ))}
                          </ul>
                          {cancelled && (
                            <p className="agent-cancel-note">
                              <Icon name="lock" size={13} /> That booking no longer
                              exists. Nothing else is affected — your notes and
                              the person you were going with are still here.
                            </p>
                          )}
                        </div>

                        {sentFlash?.listingId === flat.id && (
                          <p className="sent-flash">
                            <Icon name="check" size={13} /> Sent to{" "}
                            {sentFlash.name} — open Messages to carry on there.
                          </p>
                        )}

                        <div className="saved-home-actions">
                          <button
                            className="outline-button"
                            onClick={() => bookWithAgency(flat.id)}
                            disabled={status === "taken"}
                          >
                            <Icon name="home" size={15} />{" "}
                            {status === "viewing"
                              ? "Booked — chase the agent"
                              : status === "taken"
                                ? "No longer available"
                                : "Book a viewing with the agent"}
                          </button>
                          <button
                            className="outline-button"
                            onClick={() => openSendPicker(flat.id)}
                            disabled={connections.length === 0}
                          >
                            <Icon name="send" size={15} /> Send to chat
                          </button>
                          <button
                            className="outline-button"
                            onClick={() => toggleSaved(flat.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              {savedIds.length === 0 && (
                <p className="empty-shortlist">
                  Nothing saved yet. Save a home and it stays here — yours, not tied
                  to any conversation.
                </p>
              )}
            </div>
          )}

          {homesView === "browse" && browseStep === "districts" && (
            <div className="district-step">
              <p className="step-lede">
                Start with how long you're willing to travel. Pick an area and we'll
                show the homes in it, with what to look for.
              </p>
              <div className="district-grid">
                {(targetAreas.length ? targetAreas : LISTING_DISTRICTS).map((area) => {
                  const guide = areaGuideFor(area)
                  const count = homesInArea(area).length
                  const minutes = campusDistrict
                    ? commuteMinutes(area, campusDistrict)
                    : null
                  const overLimit =
                    minutes !== null && commuteLimit !== null && minutes > commuteLimit
                  return (
                    <button
                      key={area}
                      className={`district-card ${overLimit ? "over-limit" : ""}`}
                      onClick={() => {
                        setSelectedArea(area)
                        setBrowseStep("listings")
                      }}
                    >
                      <b>{area}</b>
                      <span className="district-travel">
                        {travelNote(area, campusDistrict) ?? "—"}
                        {overLimit ? ` · over your ${commuteLimit} min limit` : ""}
                      </span>
                      <span className="district-count">
                        {count} home{count === 1 ? "" : "s"} within your household
                        budget
                      </span>
                      {guide && (
                        <span className="district-guide">
                          <GenBadge label="neighbourhood guide" />
                          <em>{guide.vibe}</em>
                          <small className="muted">{guide.communityReputation}</small>
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {homesView === "browse" && browseStep === "listings" && (
            <>
              <div className="flats-filters">
                <button
                  className="back-button"
                  onClick={() => {
                    setBrowseStep("districts")
                    setSelectedArea(null)
                  }}
                >
                  <Icon name="back" size={15} /> All areas
                </button>
                <span className="filter-area-tag">{selectedArea ?? "All areas"}</span>
                <div className="map-filters">
                  <button
                    className={withinBudget ? "active" : ""}
                    onClick={() => setWithinBudget((v) => !v)}
                  >
                    Within my household budget
                  </button>
                  <button
                    className={withinTravelLimit ? "active" : ""}
                    onClick={() => setWithinTravelLimit((v) => !v)}
                  >
                    Within my travel limit
                  </button>
                  <button
                    className={nearMtrOnly ? "active" : ""}
                    onClick={() => setNearMtrOnly((v) => !v)}
                  >
                    Near MTR
                  </button>
                  <button
                    className={mustHavesOnly ? "active" : ""}
                    onClick={() => setMustHavesOnly((v) => !v)}
                  >
                    My must-haves
                  </button>
                  <select
                    value={bedroomFilter}
                    onChange={(event) =>
                      setBedroomFilter(Number(event.target.value) as 0 | 1 | 2 | 3)
                    }
                    aria-label="Bedrooms"
                  >
                    <option value={0}>Any bedrooms</option>
                    <option value={1}>1 bedroom</option>
                    <option value={2}>2 bedrooms</option>
                    <option value={3}>3 bedrooms</option>
                  </select>
                </div>
                <div className="search-box">
                  <Icon name="search" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search neighbourhood or flat"
                  />
                </div>
                <div className="mobile-map-switch">
                  <button
                    className={!mobileMap ? "active" : ""}
                    onClick={() => setMobileMap(false)}
                  >
                    List
                  </button>
                  <button
                    className={mobileMap ? "active" : ""}
                    onClick={() => setMobileMap(true)}
                  >
                    Map
                  </button>
                </div>
              </div>

              <div className={`map-explorer ${mobileMap ? "show-map" : ""}`}>
                <aside className="map-results">
                  <div className="result-count">
                    <b>{visibleFlats.length} places</b>
                    <span>Within your filters</span>
                  </div>
                  <div className="result-scroll">
                    {visibleFlats.map((flat) => {
                      const warning = flatSizeWarningForHome(profile ?? {}, flat.sqft)
                      const status = statusOf(flat.id)
                      const sent = connections.some((person) =>
                        sentToListing(person.id, flat.id),
                      )
                      return (
                        <div
                          className={`result-row ${
                            selectedFlat.id === flat.id ? "active" : ""
                          }`}
                          key={flat.id}
                        >
                          {/* The AI listing notes used to be printed under every
                              row here. They belong on the detail panel, where
                              you have actually stopped to read about one flat —
                              not on the list you are scanning. */}
                          <button
                            className="result-open"
                            onClick={() => setSelectedFlatId(flat.id)}
                          >
                            <img src={flat.image} alt="" />
                            <span className="result-copy">
                              <small className="result-area">{flat.area}</small>
                              <b>{flat.title}</b>
                              <i>{flat.details}</i>
                              <strong>
                                {flat.priceLabel} <em>/ mo whole flat</em>
                              </strong>
                              <em className="share-line">
                                about $
                                {sharePerPerson(flat.price, people).toLocaleString(
                                  "en-US",
                                )}{" "}
                                each for {people}
                              </em>
                            </span>
                          </button>
                          <div className="result-foot">
                            <span className={`status-pill ${status}`}>
                              {STATUS_LABEL[status]}
                            </span>
                            {flat.nearMtr && <span className="chip-mini">Near MTR</span>}
                            <span className="chip-mini">3D walkthrough</span>
                            {sent && (
                              <span className="chip-mini chip-sent">
                                <Icon name="check" size={11} /> Sent
                              </span>
                            )}
                            <div className="result-actions">
                              <button
                                className={`save-mini ${
                                  savedIds.includes(flat.id) ? "saved" : ""
                                }`}
                                onClick={() => toggleSaved(flat.id)}
                                aria-label="Save this home"
                              >
                                <Icon name="heart" size={15} />
                              </button>
                              <button
                                className="send-mini"
                                onClick={() => openSendPicker(flat.id)}
                                disabled={connections.length === 0}
                                title="Send this home into a conversation"
                              >
                                <Icon name="send" size={15} />
                              </button>
                            </div>
                          </div>
                          {warning && <small className="out-of-range">{warning}</small>}
                        </div>
                      )
                    })}
                    {visibleFlats.length === 0 && (
                      <p className="empty-shortlist">
                        Nothing matches those filters. Try widening the travel limit
                        or the household budget.
                      </p>
                    )}
                  </div>
                </aside>

                <article className="map-property-detail">
                  <div className="detail-image">
                    <img src={selectedFlat.image} alt={selectedFlat.title} />
                    <span>{selectedFlat.nearMtr ? "Near MTR" : "Synthetic listing"}</span>
                    <button
                      onClick={() => toggleSaved(selectedFlat.id)}
                      className={savedIds.includes(selectedFlat.id) ? "saved" : ""}
                      aria-label="Save this home"
                    >
                      <Icon name="heart" size={17} />
                    </button>
                  </div>
                  <div className="detail-copy">
                    <span className="detail-area">{selectedFlat.area}</span>
                    <h2>{selectedFlat.title}</h2>
                    <div className="detail-rating">
                      <b>{selectedFlat.rating} ★</b>
                      <span>{selectedFlat.details}</span>
                    </div>
                    <p>{travelNote(selectedFlat.area, campusDistrict) ?? "—"}</p>
                    <div className="detail-price">
                      <b>{selectedFlat.priceLabel}</b>
                      <span>/ month, whole flat</span>
                    </div>
                    <p className="detail-share">
                      About{" "}
                      <b>
                        $
                        {sharePerPerson(selectedFlat.price, people).toLocaleString(
                          "en-US",
                        )}
                      </b>{" "}
                      each for {people} people
                    </p>
                    <p className="detail-note">
                      {flatContext
                        ? `${flatContext.label} · no agency fee on RentMate`
                        : "District average: not provided."}
                    </p>
                    <div className="detail-tips">
                      <GenBadge label="listing notes" />
                      <ul>
                        {selectedFlat.tips.map((tip) => (
                          <li key={tip}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                    {/* Status is no longer something you declare from a
                        dropdown — it is what the agency told you. So it reads
                        as a status, and the only control is the booking. */}
                    <div className="status-row">
                      <span className={`status-pill ${statusOf(selectedFlat.id)}`}>
                        {STATUS_LABEL[statusOf(selectedFlat.id)]}
                      </span>
                      <small className="status-source">
                        set by {agentFor(selectedFlat.id)}
                      </small>
                    </div>
                    {flatSizeWarningForHome(profile ?? {}, selectedFlat.sqft) && (
                      <p className="out-of-range">
                        {flatSizeWarningForHome(profile ?? {}, selectedFlat.sqft)}
                      </p>
                    )}
                    <button
                      className="tour-button"
                      onClick={() => {
                        setTourFlatId(selectedFlat.id)
                        setTourAngle(180)
                        setTourRoom(0)
                      }}
                    >
                      <span className="cube-icon">3D</span>
                      <span>
                        <b>Walk through this home</b>
                        <small>
                          {selectedFlat.rooms.length} rooms · {selectedFlat.sqft} sq ft
                        </small>
                      </span>
                      <Icon name="arrow" size={18} />
                    </button>
                    <button
                      className="outline-button"
                      onClick={() => bookWithAgency(selectedFlat.id)}
                      disabled={statusOf(selectedFlat.id) === "taken"}
                    >
                      <Icon name="home" size={16} />{" "}
                      {statusOf(selectedFlat.id) === "viewing"
                        ? "Booked — chase the agent"
                        : statusOf(selectedFlat.id) === "taken"
                          ? "No longer available"
                          : "Book a viewing with the agent"}
                    </button>
                    <button
                      className={`share-flat-button ${
                        savedIds.includes(selectedFlat.id) ? "saved" : ""
                      }`}
                      onClick={() => toggleSaved(selectedFlat.id)}
                    >
                      {savedIds.includes(selectedFlat.id) ? (
                        <>
                          <Icon name="check" size={16} /> Saved to your list
                        </>
                      ) : (
                        <>
                          <Icon name="heart" size={16} /> Save to my list
                        </>
                      )}
                    </button>
                    <button
                      className="outline-button"
                      onClick={() => openSendPicker(selectedFlat.id)}
                      disabled={connections.length === 0}
                    >
                      <Icon name="send" size={16} /> Send to chat
                    </button>
                  </div>
                </article>

                <HkMap
                  listings={visibleFlats}
                  selectedId={selectedFlat.id}
                  statusOf={statusOf}
                  onSelect={setSelectedFlatId}
                  visible={mobileMap}
                />
              </div>
            </>
          )}
        </section>
      {tab === "flats" && (
        <>
          <FlatsMapExplorer
            onOpenLegacyTour={() => {
              setTourFlat(selectedFlat)
              setTourAngle(180)
              setTourRoom(0)
              setTourMode("3d")
            }}
          />
          <button className="floating-chat" onClick={() => setTab("messages")}>
            <img src={chatMatch.image} alt="" />
            <span>
              <b>Planning with {chatMatch.name.split(" ")[0]}</b>
              <small>{shortlist.length} flats shortlisted together</small>
            </span>
            <Icon name="chat" />
          </button>
        </>
      )}

      {tab === "review" && isAdmin && <AdminQueue />}

      <nav className="mobile-workspace-nav">
        <button
          className={tab === "matches" ? "active" : ""}
          onClick={() => setTab("matches")}
        >
          <Icon name="spark" size={19} />
          <span>Matches</span>
        </button>
        <button
          className={tab === "messages" ? "active" : ""}
          onClick={() => setTab("messages")}
        >
          <Icon name="chat" size={19} />
          <span>Messages</span>
        </button>
        <button
          className={tab === "homes" ? "active" : ""}
          onClick={() => setTab("homes")}
        >
          <Icon name="home" size={19} />
          <span>Homes</span>
        </button>
        <button
          className={tab === "plan" ? "active" : ""}
          onClick={() => setTab("plan")}
        >
          <Icon name="list" size={19} />
          <span>Plan</span>
        </button>
      </nav>

      {tab === "plan" && (
        <SettlingPlan
          answers={quizAnswers}
          onFindFlats={() => setTab("flats")}
          onOpenMessages={() => setTab("messages")}
        />
      )}

      <RentChatbot />

      {activeMatch && (
        <div className="modal-backdrop" onClick={() => setActiveMatch(null)}>
          <div
            className="match-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setActiveMatch(null)}
            >
              ×
            </button>
            <div className="modal-profile">
              <img src={activeMatch.image} alt={activeMatch.name} />
              <div>
                <span className="verified-chip">
                  <Icon name="check" size={12} /> Verified student
                </span>
                <h2>{activeMatch.name}</h2>
                <p>{activeMatch.school}</p>
              </div>
              <div className="modal-score">
                <b>{fitPhrase(activeMatch.score)}</b>
                <span>how your habits line up</span>
              </div>
            </div>
            <div className="compatibility-box">
              <p className="section-kicker">Why you match</p>
              <h3>
                {activeMatch.score === null
                  ? "Not enough shared answers to score yet."
                  : `A ${activeMatch.score}% lifestyle fit.`}
              </h3>
              {activeMatch.narrative && (
                <p className="compatibility-narrative">
                  {activeMatch.narrative}
                </p>
              )}
              {activeMatch.hooks.length > 0 && (
                <ul className="modal-hooks">
                  {activeMatch.hooks.map((hook) => (
                    <li key={hook.id}>{hook.text}</li>
                  ))}
                </ul>
              )}
              <div className="compatibility-bars">
                {Object.entries(activeMatch.factors)
                  .sort((a, b) => b[1] - a[1])
                  .map(([key, value]) => (
                    <div key={key}>
                      <span>
                        <b>{FACTOR_LABELS[key] ?? key}</b>
                        <small>{Math.round(value * 100)}%</small>
                      </span>
                      <i>
                        <i style={{ width: `${Math.round(value * 100)}%` }} />
                      </i>
                    </div>
                  ))}
              </div>
              <p className="modal-caveat">
                A similarity, not a measurement — and the hard filters already
                ran before this number existed.
              </p>
            </div>
            <MatchNarrative match={activeMatch} answers={quizAnswers} />
            <div className="modal-details">
              <span>
                <small>Target area</small>
                <b>{activeMatch.area}</b>
              </span>
              <span>
                <small>Monthly budget</small>
                <b>{activeMatch.budget}</b>
              </span>
              {commuteNote(activeMatch.area, campusDistrict, commuteLimit) && (
                <span>
                  <small>Estimated commute</small>
                  <b>
                    {commuteNote(activeMatch.area, campusDistrict, commuteLimit)}
                  </b>
                </span>
              )}
            </div>
            <button
              className="primary-button"
              onClick={() => startChat(activeMatch)}
            >
              Connect & start chatting <Icon name="chat" size={18} />
            </button>
            <p className="modal-footnote">
              <Icon name="lock" size={13} /> Contact details stay hidden until
              you both agree.
            </p>
          </div>
        </div>
      )}

      {tourFlat && (
        <div className="tour-backdrop" onClick={closeTour}>
          <div
            className="tour-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span className="cube-icon">3D</span>
                <span>
                  <b>{tourFlat.title}</b>
                  <small>
                    {tourFlat.area} · {tourFlat.details}
                  </small>
                </span>
              </div>
              <button onClick={closeTour} aria-label="Close walkthrough">
                ×
              </button>
            </header>
            {/*
              Demo honesty. The owner's review: "the 3d walk through is also the
              same for every listing — fix it, or make it clear its only a demo."
              Both halves are now done: `roomsFor()` in lib/listings.ts derives a
              room set from the flat's own square footage and bedroom count, so a
              400 sq ft studio and a 1000 sq ft three-bed do not share a walkthrough,
              and the mock badge below says out loud that none of it is a real scan.
            */}
            <p className="tour-demo-banner">
              <Icon name="spark" size={14} /> Illustrative walkthrough — a
              stand-in for a per-listing scan, generated from this flat's floor
              area. Not a photograph of the actual unit.
            </p>
            <div className="tour-content">
              <div className="spatial-view">
                {tourRooms.length === 0 ? (
                  <div className="tour-empty">
                    <h2>No walkthrough for this one yet.</h2>
                    <p>
                      This listing has not been scanned. Ask the agent for a
                      video viewing.
                    </p>
                  </div>
                ) : (
                  <>
                    <div
                      className="panorama"
                      role="application"
                      tabIndex={0}
                      aria-label={`360 degree view of ${tourRooms[tourRoom].name}. Drag or use arrow keys to look around.`}
                      style={{
                        backgroundImage: `linear-gradient(90deg, rgba(21,28,24,.18), transparent 40%, rgba(21,28,24,.18)), url(${tourRooms[tourRoom].image})`,
                        backgroundPosition: `${(tourAngle / 360) * 100}% center`,
                      }}
                      onPointerDown={(event) => {
                        if ((event.target as HTMLElement).closest("button"))
                          return
                        event.currentTarget.setPointerCapture(event.pointerId)
                        panoramaDrag.current = {
                          startX: event.clientX,
                          startAngle: tourAngle,
                        }
                      }}
                      onPointerMove={(event) => {
                        if (!panoramaDrag.current) return
                        const distance =
                          panoramaDrag.current.startX - event.clientX
                        setTourAngle(
                          (panoramaDrag.current.startAngle +
                            distance / 2 +
                            360) %
                            360,
                        )
                      }}
                      onPointerUp={() => {
                        panoramaDrag.current = null
                      }}
                      onPointerCancel={() => {
                        panoramaDrag.current = null
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "ArrowLeft") rotateTour(-15)
                        if (event.key === "ArrowRight") rotateTour(15)
                        if (event.key === "ArrowUp") moveRoom(1)
                        if (event.key === "ArrowDown") moveRoom(-1)
                      }}
                    >
                      <span className="room-label living-label">
                        <b>{tourRooms[tourRoom].name}</b>
                        <small>{tourRooms[tourRoom].dimensions}</small>
                        <small className="tour-mock-note">
                          Illustrative mock · not a real 3D scan
                        </small>
                      </span>
                      <span className="room-label window-label">
                        <b>Ceiling height</b>
                        <small>2.55 m</small>
                      </span>
                      <div className="street-navigation">
                        <button
                          className="street-forward"
                          onClick={() => moveRoom(1)}
                          aria-label={`Move forward to ${tourRooms[(tourRoom + 1) % tourRooms.length].name}`}
                        >
                          ↑
                        </button>
                        <button
                          className="street-left"
                          onClick={() => rotateTour(-30)}
                          aria-label="Turn left"
                        >
                          ←
                        </button>
                        <button
                          className="street-right"
                          onClick={() => rotateTour(30)}
                          aria-label="Turn right"
                        >
                          →
                        </button>
                        <button
                          className="street-back"
                          onClick={() => moveRoom(-1)}
                          aria-label={`Move back to ${tourRooms[(tourRoom - 1 + tourRooms.length) % tourRooms.length].name}`}
                        >
                          ↓
                        </button>
                        <span>
                          Move through
                          <b>
                            {tourRooms[(tourRoom + 1) % tourRooms.length].name}
                          </b>
                        </span>
                      </div>
                      <div className="view-reticle">
                        <span />
                        <span />
                      </div>
                      <button
                        className="rotate-left"
                        onClick={() => rotateTour(-20)}
                      >
                        ‹
                      </button>
                      <button
                        className="rotate-right"
                        onClick={() => rotateTour(20)}
                      >
                        ›
                      </button>
                      <div className="street-compass">
                        <span
                          style={{ transform: `rotate(${tourAngle}deg)` }}
                        />
                        <b>{Math.round(tourAngle)}°</b>
                      </div>
                      <div className="tour-compass">
                        Drag anywhere to look 360° · arrows move and turn
                      </div>
                    </div>
                    <input
                      className="tour-slider"
                      type="range"
                      min="0"
                      max="359"
                      value={tourAngle}
                      onChange={(event) =>
                        setTourAngle(Number(event.target.value))
                      }
                      aria-label="Rotate walkthrough"
                    />
                    <div className="room-navigation">
                      {tourRooms.map((room, index) => (
                        <button
                          key={room.name}
                          className={tourRoom === index ? "active" : ""}
                          onClick={() => {
                            setTourRoom(index)
                            setTourAngle(180)
                          }}
                        >
                          <span>{index + 1}</span>
                          <b>{room.name}</b>
                          <small>{room.dimensions}</small>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <aside className="floor-plan-panel">
                <p className="section-kicker">Measured floor plan</p>
                <h2>Move through every room.</h2>
                <p>
                  Rooms and dimensions are derived from this flat&apos;s own
                  floor area, so the walkthrough changes between listings.
                  Dimensions stay visible while you explore.
                </p>
                <div className="mini-floor-plan interactive-plan">
                  {tourRooms.map((room, index) => (
                    <button
                      key={`plan-${room.name}`}
                      className={tourRoom === index ? "active" : ""}
                      onClick={() => {
                        setTourRoom(index)
                        setTourAngle(180)
                      }}
                    >
                      <b>{room.name}</b>
                      <small>{room.areaSqm} m²</small>
                    </button>
                  ))}
                </div>
                <div className="space-summary">
                  <span>
                    <small>Whole flat</small>
                    <b>{tourFlat.sqft} sq ft</b>
                  </span>
                  <span>
                    <small>Your share</small>
                    <b>
                      ${sharePerPerson(tourFlat.price, people).toLocaleString(
                        "en-US",
                      )}
                      /mo
                    </b>
                  </span>
                </div>
                <button
                  className={`share-flat-button ${
                    savedIds.includes(tourFlat.id) ? "saved" : ""
                  }`}
                  onClick={() => toggleSaved(tourFlat.id)}
                >
                  {savedIds.includes(tourFlat.id) ? (
                    <>
                      <Icon name="check" size={16} /> Saved to your homes
                    </>
                  ) : (
                    <>
                      <Icon name="heart" size={16} /> Save this home for me
                    </>
                  )}
                </button>
              </aside>
            </div>
          </div>
        </div>
      )}

      {/* WHICH CONVERSATION? "Send to chat" used to silently target whichever
          thread happened to be open, so from the Homes tab it could post a flat
          into a conversation you were not even looking at. It asks now. */}
      {sendPickerFor !== null && (
        <div className="modal-backdrop" onClick={() => setSendPickerFor(null)}>
          <div
            className="send-picker"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-label="Choose a conversation"
          >
            <header>
              <p className="section-kicker">Send to a conversation</p>
              <h2>
                {flats.find((flat) => flat.id === sendPickerFor)?.title ??
                  "This home"}
              </h2>
              <p>
                It goes in as a normal message, so you can argue about the price
                in words.
              </p>
            </header>
            {connections.length === 0 ? (
              <p className="empty-shortlist">
                You have no conversations yet — say hi to someone on the Matches
                tab first.
              </p>
            ) : (
              <ul>
                {connections.map((person) => {
                  const already = sentToListing(person.id, sendPickerFor)
                  return (
                    <li key={person.id}>
                      <button
                        onClick={() => sendListingTo(person.id, sendPickerFor)}
                        disabled={already}
                      >
                        <img src={person.image} alt="" />
                        <span>
                          <b>{person.name}</b>
                          <small>
                            {person.school} · {fitPhrase(person.score)}
                          </small>
                        </span>
                        {already ? (
                          <i className="send-already">
                            <Icon name="check" size={13} /> Sent
                          </i>
                        ) : (
                          <Icon name="send" size={16} />
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            <button
              className="outline-button"
              onClick={() => setSendPickerFor(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen | null>(null)
  const [email, setEmail] = useState(DEMO_EMAIL)
  const [institution, setInstitution] = useState<Institution | null>(
    INSTITUTIONS.find((i) => i.domains.includes("cuhk.edu.hk")) ?? null,
  )
  const [profile, setProfile] = useState<Profile | null>(null)
  // Where the last profile save landed. Passed to the account menu so "is this
  // actually on the server?" is answerable from inside the app.
  const [profileSync, setProfileSync] = useState<ProfileSync | null>(null)
  // Kept so "Edit my answers" reopens the quiz with your current picks still
  // ticked instead of making you retype all twenty-odd of them. Rebuilt from
  // the saved profile when you come back on a new session (answersFromProfile).
  const [answers, setAnswers] = useState<Answer[]>(() =>
    Array(QUIZ.length).fill(undefined),
  )
  // Set when a sign-in restored an existing account rather than starting a new
  // one, so the workspace can say so once.
  const [restored, setRestored] = useState(false)

  // Mount reload: restore the account keyed on the last email this browser
  // used. NO SESSIONS — no token, no cookie, no Auth. If the row is there the
  // user lands straight in the workspace instead of re-taking the quiz; if it
  // is not (a first visit, OR a deliberate log-out — see logOut below) they
  // start at Home as before.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const stored = storedEmail()
      const loaded = stored ? await loadAccount(stored) : null
      if (cancelled) return
      if (loaded) {
        setEmail(loaded.email)
        setInstitution(
          loaded.institutionName
            ? (INSTITUTIONS.find((i) => i.name === loaded.institutionName) ?? null)
            : null,
        )
        setProfile(loaded.profile)
        setAnswers(answersFromProfile(loaded.profile))
        setProfileSync(loaded.source === "supabase" ? "server" : "device")
        setScreen("matches")
      } else {
        setScreen("home")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  /**
   * LOG OUT.
   *
   * This used to only move the screen back to Home, which left the remembered
   * email in place — so the next mount walked straight back into the account
   * and "log out" did nothing at all. `forgetAccount()` is what actually ends
   * the session on a build with no sessions. Your profile row and your saved
   * homes are untouched: typing the same email brings them all back.
   */
  function logOut() {
    forgetAccount()
    setProfile(null)
    setProfileSync(null)
    setRestored(false)
    setAnswers(Array(QUIZ.length).fill(undefined))
    setScreen("home")
  }

  if (screen === null)
    return (
      <Shell>
        <p className="boot-note">Loading your account…</p>
      </Shell>
    )
  if (screen === "home") return <Home onStart={() => setScreen("verify")} />
function resolveScreenAfterStart(): Screen {
  const stored = getStoredEmail()
  if (stored && isOnboarded()) return "matches"
  if (stored) return "quiz"
  return "verify"
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(() => {
    if (!isOnboarded() || !getStoredEmail()) return "home"
    if (getUserRole() === "landlord") return "landlord-dashboard"
    return "matches"
  })
  const [email, setEmail] = useState(() => getStoredEmail())

  function beginMatchingFlow() {
    setUserRole("tenant")
    const stored = getStoredEmail()
    setEmail(stored)
    setScreen(resolveScreenAfterStart())
  }

  function beginLandlordFlow() {
    if (getUserRole() === "landlord" && isOnboarded()) {
      setScreen("landlord-dashboard")
      return
    }
    setScreen("landlord-entry")
  }

  if (screen === "home")
    return (
      <Home
        onStartTenant={beginMatchingFlow}
        onStartLandlord={beginLandlordFlow}
      />
    )
  if (screen === "landlord-entry")
    return (
      <LandlordEntry
        onBack={() => setScreen("home")}
        onComplete={() => setScreen("landlord-dashboard")}
      />
    )
  if (screen === "landlord-dashboard")
    return (
      <LandlordDashboard
        onSignOut={() => {
          clearDemoSession()
          setEmail("")
          setScreen("home")
        }}
      />
    )
  if (screen === "verify")
    return (
      <Verify
        initialEmail={email}
        onBack={() => setScreen("home")}
        onVerified={(value, inst, existing) => {
        onClearStoredEmail={() => setEmail("")}
        onVerified={(value) => {
          setUserRole("tenant")
          setStoredEmail(value)
          setEmail(value)
          setInstitution(inst)
          if (existing) {
            // Welcome back — do not make them answer everything again.
            setProfile(existing.profile)
            setAnswers(answersFromProfile(existing.profile))
            setProfileSync(existing.source === "supabase" ? "server" : "device")
            setRestored(true)
            setScreen("matches")
          } else {
            setProfile(null)
            setAnswers(Array(QUIZ.length).fill(undefined))
            setProfileSync(null)
            setRestored(false)
            setScreen("quiz")
          }
        }}
      />
    )
  if (screen === "quiz")
    return (
      <Quiz
        onBack={() => setScreen(profile ? "matches" : "verify")}
        initialAnswers={answers}
        onComplete={(nextAnswers) => {
          const next = answersToProfile(nextAnswers, {
            campusDistrict: institution?.district ?? null,
          })
          setAnswers(nextAnswers)
          setProfile(next)
          setRestored(false)
          // The save is reported, not assumed — see ProfileSync in lib/api.ts.
          void saveProfile(next, email, institution?.name).then(setProfileSync)
        onBack={() => setScreen("verify")}
        onComplete={(answers) => {
          setQuizAnswers(answers)
          setOnboardedComplete()
          setScreen("matches")
        }}
      />
    )
  return (
    <Matches
      email={email}
      institution={institution}
      profile={profile}
      profileSync={profileSync}
      restored={restored}
      onDismissRestored={() => setRestored(false)}
      onEditAnswers={() => setScreen("quiz")}
      onLogout={logOut}
      email={email || getStoredEmail()}
      onSignOut={() => {
        clearDemoSession()
        setEmail("")
        setScreen("verify")
      }}
    />
  )
}
