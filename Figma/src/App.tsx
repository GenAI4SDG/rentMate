import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react"

import { QUIZ, SECTIONS, answersToProfile } from "./lib/quiz"
import { CURATED_CAST, DEMO_EMAIL, isCuratedEmail } from "./lib/demoData"
import { LISTINGS, priceContext } from "./lib/listings"
import {
  INSTITUTIONS,
  TOTAL_DOMAINS,
  validateInstitutionEmail,
  type Institution,
} from "./lib/institutions"
import { areaFit } from "./lib/matching"
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
  requestVerification,
  saveProfile,
  type MatchFeed,
  type MatchView,
} from "./lib/api"
import type { Profile } from "./lib/matching"

type Screen = "home" | "verify" | "quiz" | "matches"

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

type Message = { from: "them" | "me"; text: string; time: string }

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

const scoreLabel = (score: number | null) => (score === null ? "—" : `${score}%`)

const flats = LISTINGS

const roomViews = [
  {
    name: "Living room",
    dimensions: "4.2 × 3.6 m",
    image:
      "https://images.unsplash.com/photo-1631049035227-57752420e957?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=88&w=1800",
  },
  {
    name: "Main bedroom",
    dimensions: "3.1 × 2.8 m",
    image:
      "https://images.unsplash.com/photo-1779785689520-bf24ef13aa71?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=88&w=1500",
  },
  {
    name: "Second bedroom",
    dimensions: "2.9 × 2.7 m",
    image:
      "https://images.unsplash.com/photo-1791138961286-a9f5845171e4?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=88&w=1500",
  },
  {
    name: "Kitchen",
    dimensions: "2.8 × 1.9 m",
    image:
      "https://images.unsplash.com/photo-1762811003338-aef30274513b?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=88&w=1800",
  },
]

function Icon({
  name,
  size = 20,
  strokeWidth = 1.8,
}: {
  name: "arrow" | "back" | "check" | "home" | "lock" | "mail" | "spark" | "user" | "heart" | "chat" | "search" | "send"
  size?: number
  strokeWidth?: number
}) {
  const paths: Record<string, ReactNode> = {
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

function Home({ onStart }: { onStart: () => void }) {
  return (
    <main className="home-screen">
      <nav className="home-nav">
        <Logo light />
        <div className="nav-links">
          <a href="#how">How it works</a>
          <a href="#trust">Trust & safety</a>
        </div>
        <button className="nav-cta" onClick={onStart}>
          Find my matches <Icon name="arrow" size={17} />
        </button>
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
            Find trusted flatmates who fit your rhythm, not just your rent.
            Thoughtful matching for student life in Hong Kong.
          </p>
          <button className="hero-cta" onClick={onStart}>
            <span>
              <b>Start matching</b>
              <small>
                Free · {questions.length} questions · about 4 minutes
              </small>
            </span>
            <span className="cta-icon">
              <Icon name="arrow" />
            </span>
          </button>
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
}: {
  onBack: () => void
  onVerified: (email: string, institution: Institution | null) => void
}) {
  const [email, setEmail] = useState(DEMO_EMAIL)
  const [touched, setTouched] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  // Exact allowlist match — see lib/institutions.ts (CP.validate_institution_email.v1).
  const check = validateInstitutionEmail(email)
  const valid = check.eligible
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
      onVerified(email, check.institution)
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
          <div className="required-note">
            <Icon name="lock" size={14} /> Required to keep our community
            trusted
          </div>
        </form>
      </section>
    </Shell>
  )
}

function Quiz({
  onBack,
  onComplete,
}: {
  onBack: () => void
  onComplete: (answers: (number | number[] | undefined)[]) => void
}) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | number[] | undefined)[]>([])
  const question = questions[index]
  const selection = answers[index]
  const percent = ((index + 1) / questions.length) * 100
  const section = SECTIONS[question.section]
  const multi = question.kind === "multi"
  const selectedIndices = multi
    ? Array.isArray(selection)
      ? selection
      : []
    : selection === undefined
      ? []
      : [selection as number]
  const maxed = multi && question.max !== undefined && selectedIndices.length >= question.max
  // Optional questions may be skipped; everything else needs an answer.
  const canContinue = question.optional || selectedIndices.length > 0

  function choose(optionIndex: number) {
    const next = [...answers]
    if (!multi) {
      next[index] = optionIndex
    } else {
      const current = Array.isArray(next[index]) ? (next[index] as number[]) : []
      if (current.includes(optionIndex)) {
        next[index] = current.filter((i) => i !== optionIndex)
      } else if (question.max === undefined || current.length < question.max) {
        next[index] = [...current, optionIndex]
      } else {
        return
      }
    }
    setAnswers(next)
  }

  function previous() {
    if (index === 0) onBack()
    else setIndex(index - 1)
  }

  function next() {
    if (!canContinue) return
    if (index === questions.length - 1) onComplete(answers)
    else {
      setIndex(index + 1)
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
            We turn your everyday preferences into meaningful, explainable
            matches.
          </p>
          <div className="quiz-metrics">
            <span>
              <b>{String(index + 1).padStart(2, "0")}</b> current
            </span>
            <span>
              <b>{String(questions.length).padStart(2, "0")}</b> total
            </span>
          </div>
          <div className={`quiz-section-note ${question.section}`}>
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
              {index + 1} of {questions.length}
            </span>
          </div>
          <p className="question-eyebrow">{question.eyebrow}</p>
          <h1>{question.title}</h1>
          <p className="question-hint">{question.hint}</p>
          <div
            className={`option-grid ${multi ? "multi-options" : ""} ${
              question.options.some((option) => option.tone)
                ? "colour-options"
                : ""
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
          <div className="quiz-footer">
            <span>
              {multi
                ? `${selectedIndices.length} selected${
                    question.max !== undefined ? ` · up to ${question.max}` : ""
                  }`
                : question.optional && selectedIndices.length === 0
                  ? "Optional — skip if you'd rather not say"
                  : selectedIndices.length === 0
                    ? "Choose one to continue"
                    : "Looking good — ready when you are"}
            </span>
            <button
              className="primary-button"
              disabled={!canContinue}
              onClick={next}
            >
              {index === questions.length - 1 ? "See my starters" : "Continue"}{" "}
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

function HookCard({
  match,
  index,
  total,
  campusDistrict,
  limit,
  reacted,
  onReact,
  onOpen,
  onNext,
}: {
  match: MatchView
  index: number
  total: number
  campusDistrict: string | null
  limit: number | null
  reacted: { reaction: ReactionId; reply: string } | undefined
  onReact: (id: ReactionId) => void
  onOpen: () => void
  onNext: () => void
}) {
  const [saved, setSaved] = useState(false)
  const first = match.name.split(" ")[0]
  const hook = match.hooks[0] ?? null
  const others = match.hooks.slice(1, 3)
  const note = commuteNote(match.area, campusDistrict, limit)

  return (
    <article className="hook-card">
      <div className="hook-portrait">
        <img src={match.image} alt={`${match.name}, ${match.school}`} />
        <span className="verified-chip">
          <Icon name="check" size={12} /> Verified student
        </span>
        <button
          className={`save-button ${saved ? "saved" : ""}`}
          onClick={() => setSaved(!saved)}
          aria-label={saved ? "Remove from saved" : "Save this match"}
        >
          <Icon name="heart" size={18} />
        </button>
      </div>

      <div className="hook-body">
        <header className="hook-head">
          <div>
            <h2>{match.name}</h2>
            <p>{match.school}</p>
          </div>
          <div className="hook-score">
            <b>{scoreLabel(match.score)}</b>
            <span>lifestyle fit</span>
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
        </div>

        {reacted ? (
          <div className="hook-reply">
            <img src={match.image} alt="" />
            <div>
              <small>
                {first} replied to “{reactionLabel(reacted.reaction)}”
              </small>
              <p>{reacted.reply}</p>
            </div>
          </div>
        ) : (
          <div className="hook-reactions">
            <span>React to open the conversation</span>
            {REACTIONS.map((reaction) => (
              <button
                key={reaction.id}
                className={`react-${reaction.id}`}
                onClick={() => onReact(reaction.id)}
                title={reaction.hint}
              >
                {reaction.label}
              </button>
            ))}
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

        <div className="hook-actions">
          <button className="outline-button" onClick={onOpen}>
            Full profile &amp; factors
          </button>
          <button className="primary-button" onClick={onNext}>
            {index === total - 1 ? "Back to the start" : "Next starter"}{" "}
            <Icon name="arrow" size={18} />
          </button>
        </div>
      </div>
    </article>
  )
}

function Matches({
  email,
  institution,
  profile,
  onRestart,
}: {
  email: string
  institution: Institution | null
  profile: Profile | null
  onRestart: () => void
}) {
  type WorkspaceTab = "matches" | "messages" | "flats"
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
  const [tab, setTab] = useState<WorkspaceTab>("matches")
  const [chatId, setChatId] = useState("")
  const [draft, setDraft] = useState("")
  const [search, setSearch] = useState("")
  const [shortlist, setShortlist] = useState<number[]>([1])
  const [selectedFlat, setSelectedFlat] = useState(flats[0])
  const [tourFlat, setTourFlat] = useState<typeof flats[number] | null>(null)
  const [tourAngle, setTourAngle] = useState(180)
  const [tourRoom, setTourRoom] = useState(0)
  const [tourMode, setTourMode] = useState<"3d" | "ar">("3d")
  const [arActive, setArActive] = useState(false)
  const [arError, setArError] = useState("")
  const [placedItem, setPlacedItem] = useState<"bed" | "desk" | "sofa" | null>(
    null,
  )
  const [mobileMap, setMobileMap] = useState(false)
  const arVideoRef = useRef<HTMLVideoElement>(null)
  const panoramaDrag = useRef<{ startX: number; startAngle: number } | null>(
    null,
  )
  const firstName = useMemo(
    () => email.split("@")[0].split(/[._-]/)[0] || "there",
    [email],
  )
  const visibleFlats = flats.filter((flat) =>
    `${flat.title} ${flat.area}`.toLowerCase().includes(search.toLowerCase()),
  )

  const matches = feed.matches
  const hidden = feed.hidden
  const current = matches[activeIndex] ?? null
  const chatMatch = matches.find((m) => m.id === chatId) ?? matches[0] ?? EMPTY_MATCH
  const thread = threads[chatMatch.id] ?? []
  // The verified institution is the commute anchor for every estimate on screen.
  const campusDistrict = institution?.district ?? null
  const commuteLimit = profile?.looking_for?.max_commute_minutes ?? null

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

  // Price context vs the district average (see lib/listings.ts). Null when the
  // district has no figure on file — "not provided" beats a fake comparison.
  const flatContext = priceContext(selectedFlat.area, selectedFlat.price)

  /** Reacting is the opener: it sends the reaction and appends their cached reply. */
  function react(match: MatchView, reaction: ReactionId) {
    const reply = replyFor(match, reaction, match.hooks[0] ?? null)
    if (reaction === "pass" || !reply) {
      advance()
      return
    }
    setReacted((prev) => ({ ...prev, [match.id]: { reaction, reply } }))
    setThreads((prev) => ({
      ...prev,
      [match.id]: [
        ...(prev[match.id] ?? []),
        { from: "me", text: reactionLabel(reaction), time: "Now" },
        { from: "them", text: reply, time: "Now" },
      ],
    }))
  }

  function advance() {
    if (!matches.length) return
    setActiveIndex((index) => (index + 1) % matches.length)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function startChat(match: MatchView) {
    setChatId(match.id)
    setActiveMatch(null)
    setTab("messages")
  }

  function sendMessage(event: FormEvent) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || !chatMatch.id) return
    setThreads((prev) => ({
      ...prev,
      [chatMatch.id]: [
        ...(prev[chatMatch.id] ?? []),
        { from: "me", text, time: "Now" },
      ],
    }))
    setDraft("")
  }

  function toggleShortlist(id: number) {
    setShortlist((current) =>
      current.includes(id)
        ? current.filter((flatId) => flatId !== id)
        : [...current, id],
    )
  }

  function stopAr() {
    const stream = arVideoRef.current?.srcObject as MediaStream | null
    stream?.getTracks().forEach((track) => track.stop())
    if (arVideoRef.current) arVideoRef.current.srcObject = null
    setArActive(false)
  }

  function closeTour() {
    stopAr()
    setTourFlat(null)
    setTourMode("3d")
    setPlacedItem(null)
    setArError("")
  }

  async function startAr() {
    setArError("")
    if (!navigator.mediaDevices?.getUserMedia) {
      setArError("Camera AR is not supported in this browser.")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      })
      if (arVideoRef.current) {
        arVideoRef.current.srcObject = stream
        await arVideoRef.current.play()
        setArActive(true)
      }
    } catch {
      setArError(
        "Camera access was not available. Allow camera permission to use AR preview.",
      )
    }
  }

  function rotateTour(amount: number) {
    setTourAngle((current) => (current + amount + 360) % 360)
  }

  function moveRoom(direction: 1 | -1) {
    setTourRoom(
      (current) => (current + direction + roomViews.length) % roomViews.length,
    )
    setTourAngle(180)
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
            className={tab === "flats" ? "active" : ""}
            onClick={() => setTab("flats")}
          >
            <Icon name="home" size={17} /> Find a flat
          </button>
        </nav>
        <button className="profile-chip" onClick={onRestart}>
          <span>{firstName.slice(0, 1).toUpperCase()}</span>
          <span>
            <b>{firstName}</b>
            <small>Verified student</small>
          </span>
        </button>
      </header>

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
            <p>
              No grid, no swiping. Each card opens with one real thing you two
              have in common — react to it and the conversation has already
              started.
            </p>
          </section>
          <section className="match-section">
            <div className="match-toolbar">
              <p>
                <b>
                  {loadingMatches
                    ? "Finding compatible students…"
                    : `${matches.length} ${
                        matches.length === 1 ? "person" : "people"
                      } cleared your non-negotiables`}
                </b>
                <span>
                  {backendMode === "supabase"
                    ? "Scored by the Supabase backend"
                    : "Demo mode · scored in your browser"}
                  {campusDistrict ? ` · anchored to ${campusDistrict}` : ""}
                </span>
              </p>
              {matches.length > 0 && (
                <span className="hook-counter">
                  {activeIndex + 1} / {matches.length}
                </span>
              )}
            </div>

            {loadingMatches && <p className="hook-empty">Scoring your answers…</p>}

            {!loadingMatches && matches.length === 0 && (
              <p className="hook-empty">
                Nobody cleared your non-negotiables. That's the filters working,
                not a bug — loosen one to see more people.
              </p>
            )}

            {current && (
              <>
                <HookCard
                  key={current.id}
                  match={current}
                  index={activeIndex}
                  total={matches.length}
                  campusDistrict={campusDistrict}
                  limit={commuteLimit}
                  reacted={reacted[current.id]}
                  onReact={(id) => react(current, id)}
                  onOpen={() => setActiveMatch(current)}
                  onNext={advance}
                />
                {matches.length > 1 && (
                  <nav className="hook-dots" aria-label="Match navigation">
                    {matches.map((match, index) => (
                      <button
                        key={match.id}
                        className={index === activeIndex ? "active" : ""}
                        onClick={() => setActiveIndex(index)}
                        aria-label={`Show ${match.name}`}
                      />
                    ))}
                  </nav>
                )}
              </>
            )}

            {hidden.length > 0 && (
              <details className="hidden-panel">
                <summary>
                  <Icon name="lock" size={15} /> We hid {hidden.length}{" "}
                  {hidden.length === 1 ? "person" : "people"} because of your
                  non-negotiables
                </summary>
                <ul>
                  {hidden.map((person) => (
                    <li key={person.id}>
                      <img src={person.image} alt="" />
                      <span>
                        <b>{person.name}</b>
                        {person.reasons.map((reason) => (
                          <small key={`${reason.field}-${reason.side}`}>
                            {reason.text}
                          </small>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="hidden-note">
                  This is the part most apps hide. The hard filters decide who you
                  see; the score never overrides them.
                </p>
              </details>
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
            {matches.map((match) => {
              const last = threads[match.id]?.[threads[match.id].length - 1]
              return (
                <button
                  key={match.id}
                  className={chatMatch.id === match.id ? "active" : ""}
                  onClick={() => setChatId(match.id)}
                >
                  <img src={match.image} alt="" />
                  <span>
                    <b>{match.name}</b>
                    <small>
                      {last
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
            {!loadingMatches && matches.length === 0 && (
              <p className="empty-shortlist">
                No connections yet. React to a starter on the Matches tab.
              </p>
            )}
          </aside>
          <div className="chat-thread">
            <header>
              <img src={chatMatch.image} alt="" />
              <span>
                <b>{chatMatch.name}</b>
                <small>
                  <i /> Connected · {scoreLabel(chatMatch.score)} match
                </small>
              </span>
              <button onClick={() => setTab("flats")}>
                <Icon name="search" size={16} /> Search flats together
              </button>
            </header>
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
                  {chatMatch.hooks[0] && (
                    <button
                      className="outline-button"
                      onClick={() => {
                        const hook = chatMatch.hooks[0]
                        setThreads((prev) => ({
                          ...prev,
                          [chatMatch.id]: [
                            { from: "me", text: reactionLabel("wait"), time: "Now" },
                            { from: "them", text: hook.reply, time: "Now" },
                          ],
                        }))
                      }}
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
          <aside className="shared-shortlist">
            <div>
              <p className="section-kicker">Shared with {chatMatch.name}</p>
              <h2>Flat shortlist</h2>
              <p>Save places here so you can compare them together.</p>
            </div>
            {flats
              .filter((flat) => shortlist.includes(flat.id))
              .map((flat) => (
                <button
                  className="shortlist-item"
                  key={flat.id}
                  onClick={() => setTab("flats")}
                >
                  <img src={flat.image} alt="" />
                  <span>
                    <b>{flat.area}</b>
                    <small>{flat.price} / mo</small>
                  </span>
                </button>
              ))}
            {shortlist.length === 0 && (
              <p className="empty-shortlist">No flats saved together yet.</p>
            )}
            <button className="outline-button" onClick={() => setTab("flats")}>
              <Icon name="search" size={16} /> Browse flats
            </button>
          </aside>
        </section>
      )}

      {tab === "flats" && (
        <section className="flats-browser">
          <div className="flats-search-header">
            <div>
              <p className="section-kicker">25 verified student homes</p>
              <h1>Find your space in Hong Kong.</h1>
            </div>
            <div className="search-box">
              <Icon name="search" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search neighbourhood or flat"
              />
            </div>
            <div className="map-filters">
              <button>2 bedrooms</button>
              <button>Under $20K</button>
              <button>Near MTR</button>
              <button>3D tour</button>
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
                <span>Best match ↓</span>
              </div>
              <div className="result-scroll">
                {visibleFlats.map((flat) => (
                  <button
                    key={flat.id}
                    className={selectedFlat.id === flat.id ? "active" : ""}
                    onClick={() => setSelectedFlat(flat)}
                  >
                    <img src={flat.image} alt="" />
                    <span>
                      <small>{flat.area}</small>
                      <b>{flat.title}</b>
                      <i>{flat.details}</i>
                      <strong>
                        {flat.price} <em>/ mo</em>
                      </strong>
                    </span>
                    <span className="tour-badge">3D</span>
                  </button>
                ))}
              </div>
            </aside>

            <article className="map-property-detail">
              <div className="detail-image">
                <img src={selectedFlat.image} alt={selectedFlat.title} />
                <span>Verified listing</span>
                <button
                  onClick={() => toggleShortlist(selectedFlat.id)}
                  className={shortlist.includes(selectedFlat.id) ? "saved" : ""}
                >
                  <Icon name="heart" size={17} />
                </button>
              </div>
              <div className="detail-copy">
                <span className="detail-area">{selectedFlat.area}</span>
                <h2>{selectedFlat.title}</h2>
                <div className="detail-rating">
                  <b>{selectedFlat.rating} ★</b>
                  <span>Verified for students</span>
                </div>
                <p>{selectedFlat.details}</p>
                <p>{selectedFlat.commute} · MTR and daily shops nearby</p>
                <div className="detail-price">
                  <b>{selectedFlat.price}</b>
                  <span>/ month</span>
                </div>
                <p className="detail-note">
                  {flatContext
                    ? `${flatContext.label} · no agency fee on RentMate`
                    : "District average: not provided."}
                </p>
                <button
                  className="tour-button"
                  onClick={() => {
                    setTourFlat(selectedFlat)
                    setTourAngle(180)
                    setTourRoom(0)
                    setTourMode("3d")
                  }}
                >
                  <span className="cube-icon">3D</span>
                  <span>
                    <b>Explore the actual space</b>
                    <small>Interactive room view + dimensions</small>
                  </span>
                  <Icon name="arrow" size={18} />
                </button>
                <button
                  className={`share-flat-button ${
                    shortlist.includes(selectedFlat.id) ? "saved" : ""
                  }`}
                  onClick={() => toggleShortlist(selectedFlat.id)}
                >
                  {shortlist.includes(selectedFlat.id) ? (
                    <>
                      <Icon name="check" size={16} /> Shared with{" "}
                      {chatMatch.name.split(" ")[0]}
                    </>
                  ) : (
                    <>
                      <Icon name="heart" size={16} /> Save with{" "}
                      {chatMatch.name.split(" ")[0]}
                    </>
                  )}
                </button>
              </div>
            </article>

            <div className="rental-map">
              <div className="map-water">
                <span>Victoria Harbour</span>
              </div>
              <div className="map-road road-one" />
              <div className="map-road road-two" />
              <div className="map-road road-three" />
              <div className="map-road road-four" />
              <span className="map-label label-one">Kowloon</span>
              <span className="map-label label-two">Hong Kong Island</span>
              <span className="map-label label-three">New Territories</span>
              {visibleFlats.map((flat) => (
                <button
                  key={flat.id}
                  style={{ left: `${flat.x}%`, top: `${flat.y}%` }}
                  className={`map-pin ${
                    selectedFlat.id === flat.id ? "active" : ""
                  }`}
                  onClick={() => setSelectedFlat(flat)}
                  aria-label={`View ${flat.title} at ${flat.price}`}
                >
                  {flat.mapPrice}
                </button>
              ))}
              <button className="search-map-area">
                <Icon name="search" size={14} /> Search this area
              </button>
              <div className="map-zoom">
                <button>+</button>
                <button>−</button>
              </div>
            </div>
          </div>

          <button className="floating-chat" onClick={() => setTab("messages")}>
            <img src={chatMatch.image} alt="" />
            <span>
              <b>Planning with {chatMatch.name.split(" ")[0]}</b>
              <small>{shortlist.length} flats shortlisted together</small>
            </span>
            <Icon name="chat" />
          </button>
        </section>
      )}

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
          className={tab === "flats" ? "active" : ""}
          onClick={() => setTab("flats")}
        >
          <Icon name="home" size={19} />
          <span>Flats</span>
        </button>
      </nav>

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
                <b>{scoreLabel(activeMatch.score)}</b>
                <span>lifestyle match</span>
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
              <div className="tour-mode-tabs">
                <button
                  className={tourMode === "3d" ? "active" : ""}
                  onClick={() => {
                    stopAr()
                    setTourMode("3d")
                  }}
                >
                  3D walkthrough
                </button>
                <button
                  className={tourMode === "ar" ? "active" : ""}
                  onClick={() => setTourMode("ar")}
                >
                  AR room check
                </button>
              </div>
              <button onClick={closeTour} aria-label="Close spatial view">
                ×
              </button>
            </header>
            <div className="tour-content">
              <div className="spatial-view">
                {tourMode === "3d" ? (
                  <>
                    <div
                      className="panorama"
                      role="application"
                      tabIndex={0}
                      aria-label={`360 degree view of ${roomViews[tourRoom].name}. Drag or use arrow keys to look around.`}
                      style={{
                        backgroundImage: `linear-gradient(90deg, rgba(21,28,24,.18), transparent 40%, rgba(21,28,24,.18)), url(${roomViews[tourRoom].image})`,
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
                        <b>{roomViews[tourRoom].name}</b>
                        <small>{roomViews[tourRoom].dimensions}</small>
                      </span>
                      <span className="room-label window-label">
                        <b>Ceiling height</b>
                        <small>2.55 m</small>
                      </span>
                      <div className="street-navigation">
                        <button
                          className="street-forward"
                          onClick={() => moveRoom(1)}
                          aria-label={`Move forward to ${roomViews[(tourRoom + 1) % roomViews.length].name}`}
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
                          aria-label={`Move back to ${roomViews[(tourRoom - 1 + roomViews.length) % roomViews.length].name}`}
                        >
                          ↓
                        </button>
                        <span>
                          Move through
                          <b>
                            {roomViews[(tourRoom + 1) % roomViews.length].name}
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
                      aria-label="Rotate spatial view"
                    />
                    <div className="room-navigation">
                      {roomViews.map((room, index) => (
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
                ) : (
                  <div className="ar-experience">
                    <div className="ar-stage">
                      <video ref={arVideoRef} autoPlay muted playsInline />
                      {!arActive && (
                        <div className="ar-start-panel">
                          <span className="ar-mark">AR</span>
                          <h2>Check furniture fit in your room.</h2>
                          <p>
                            Use your camera to place a true-scale outline before
                            you commit to the flat.
                          </p>
                          <button onClick={startAr}>Start camera AR</button>
                          {arError && <small>{arError}</small>}
                        </div>
                      )}
                      {arActive && (
                        <>
                          <div className="ar-grid" />
                          <div className={`ar-object ${placedItem || "empty"}`}>
                            {placedItem ? (
                              <>
                                <b>{placedItem}</b>
                                <span>
                                  {placedItem === "bed"
                                    ? "1.9 × 1.35 m"
                                    : placedItem === "desk"
                                      ? "1.2 × 0.6 m"
                                      : "1.8 × 0.85 m"}
                                </span>
                              </>
                            ) : (
                              <span>Choose furniture to place</span>
                            )}
                          </div>
                          <div className="ar-instruction">
                            Move your phone slowly to check walking clearance
                          </div>
                        </>
                      )}
                    </div>
                    <div className="ar-toolbar">
                      <span>Place at scale</span>
                      {(["bed", "desk", "sofa"] as const).map((item) => (
                        <button
                          key={item}
                          className={placedItem === item ? "active" : ""}
                          onClick={() => setPlacedItem(item)}
                          disabled={!arActive}
                        >
                          {item}
                        </button>
                      ))}
                      <button
                        onClick={() => setPlacedItem(null)}
                        disabled={!arActive}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <aside className="floor-plan-panel">
                <p className="section-kicker">
                  {tourMode === "3d" ? "Measured floor plan" : "AR scale guide"}
                </p>
                <h2>
                  {tourMode === "3d"
                    ? "Move through every room."
                    : "Confirm what really fits."}
                </h2>
                <p>
                  {tourMode === "3d"
                    ? "Select a room or follow the floor marker. Dimensions stay visible while you explore."
                    : "Camera AR overlays common furniture footprints so you can check scale and walking space."}
                </p>
                <div className="mini-floor-plan interactive-plan">
                  <button
                    className={`plan-living ${tourRoom === 0 ? "active" : ""}`}
                    onClick={() => {
                      setTourMode("3d")
                      setTourRoom(0)
                    }}
                  >
                    <b>Living</b>
                    <small>15.1 m²</small>
                  </button>
                  <button
                    className={`plan-bed-one ${tourRoom === 1 ? "active" : ""}`}
                    onClick={() => {
                      setTourMode("3d")
                      setTourRoom(1)
                    }}
                  >
                    <b>Bed 1</b>
                    <small>8.6 m²</small>
                  </button>
                  <button
                    className={`plan-bed-two ${tourRoom === 2 ? "active" : ""}`}
                    onClick={() => {
                      setTourMode("3d")
                      setTourRoom(2)
                    }}
                  >
                    <b>Bed 2</b>
                    <small>7.9 m²</small>
                  </button>
                  <button
                    className={`plan-kitchen ${tourRoom === 3 ? "active" : ""}`}
                    onClick={() => {
                      setTourMode("3d")
                      setTourRoom(3)
                    }}
                  >
                    <b>Kitchen</b>
                    <small>5.2 m²</small>
                  </button>
                  <div className="plan-bath">
                    <b>Bath</b>
                    <small>3.4 m²</small>
                  </div>
                </div>
                <div className="space-summary">
                  <span>
                    <small>Usable area</small>
                    <b>{tourFlat.details.split("·")[2]?.trim()}</b>
                  </span>
                  <span>
                    <small>Ceiling height</small>
                    <b>2.55 m</b>
                  </span>
                </div>
                <button
                  className={`share-flat-button ${
                    shortlist.includes(tourFlat.id) ? "saved" : ""
                  }`}
                  onClick={() => toggleShortlist(tourFlat.id)}
                >
                  {shortlist.includes(tourFlat.id) ? (
                    <>
                      <Icon name="check" size={16} /> In shared shortlist
                    </>
                  ) : (
                    <>
                      <Icon name="heart" size={16} /> Save this flat together
                    </>
                  )}
                </button>
              </aside>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home")
  const [email, setEmail] = useState(DEMO_EMAIL)
  const [institution, setInstitution] = useState<Institution | null>(
    INSTITUTIONS.find((i) => i.domains.includes("cuhk.edu.hk")) ?? null,
  )
  const [profile, setProfile] = useState<Profile | null>(null)

  if (screen === "home") return <Home onStart={() => setScreen("verify")} />
  if (screen === "verify")
    return (
      <Verify
        onBack={() => setScreen("home")}
        onVerified={(value, inst) => {
          setEmail(value)
          setInstitution(inst)
          setScreen("quiz")
        }}
      />
    )
  if (screen === "quiz")
    return (
      <Quiz
        onBack={() => setScreen("verify")}
        onComplete={(answers) => {
          const next = answersToProfile(answers, {
            campusDistrict: institution?.district ?? null,
          })
          setProfile(next)
          void saveProfile(next)
          setScreen("matches")
        }}
      />
    )
  return (
    <Matches
      email={email}
      institution={institution}
      profile={profile}
      onRestart={() => setScreen("home")}
    />
  )
}
