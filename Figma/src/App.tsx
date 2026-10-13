import { FormEvent, ReactNode, useMemo, useRef, useState } from "react"

type Screen = "home" | "verify" | "quiz" | "matches"

type Question = {
  eyebrow: string
  title: string
  hint: string
  options: { title: string detail?: string tone?: string }[]
}

const heroImage =
  "https://images.unsplash.com/photo-1562755484-8225ee5215ae?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=88&w=1600"

const questions: Question[] = [
  {
    eyebrow: "Home rhythms",
    title: "Your week has been full-on. What does home look like tonight?",
    hint: "Choose the evening that feels most restorative to you.",
    options: [
      {
        title: "A quiet night in",
        detail: "Tea, headphones, and an early reset.",
      },
      {
        title: "Cooking together",
        detail: "A shared meal and a good catch-up.",
      },
      {
        title: "Friends are welcome",
        detail: "A relaxed, social flat with some energy.",
      },
      {
        title: "It changes every week",
        detail: "I like to keep things spontaneous.",
      },
    ],
  },
  {
    eyebrow: "Social energy",
    title:
      "You’re on a three-hour train ride. Which seat do you instinctively take?",
    hint: "There is no right answer — go with your first instinct.",
    options: [
      {
        title: "Next to a quiet reader",
        detail: "Company without the pressure to chat.",
      },
      {
        title: "A fully empty row",
        detail: "Space to spread out and recharge.",
      },
      {
        title: "Near a lively group",
        detail: "The journey is better with conversation.",
      },
      {
        title: "Whichever has the view",
        detail: "My environment matters most.",
      },
    ],
  },
  {
    eyebrow: "Conflict style",
    title:
      "Your flatmate accidentally breaks something sentimental. What comes first?",
    hint: "Pick the response closest to your genuine first thought.",
    options: [
      {
        title: "Let’s find a practical fix",
        detail: "Work out what can be repaired or replaced.",
      },
      {
        title: "Make sure they’re okay",
        detail: "The relationship matters more than the object.",
      },
      {
        title: "Take some time first",
        detail: "I prefer to process before talking it through.",
      },
      {
        title: "Set a clear boundary",
        detail: "Name what happened so it does not repeat.",
      },
    ],
  },
  {
    eyebrow: "Daily routine",
    title: "Which household rhythm feels most like yours?",
    hint: "Think about an ordinary weekday rather than your ideal one.",
    options: [
      { title: "Early bird", detail: "Up early, winding down by 11." },
      { title: "Night owl", detail: "Most productive after sunset." },
      {
        title: "A flexible middle",
        detail: "My routine shifts with my schedule.",
      },
      {
        title: "Quiet hours matter most",
        detail: "Any routine works if we respect each other.",
      },
    ],
  },
  {
    eyebrow: "Personality",
    title:
      "Scientists named a new colour after your personality. Which swatch is yours?",
    hint: "Choose the one that feels instinctively like you.",
    options: [
      { title: "Warm glowing terracotta", tone: "#c96b48" },
      { title: "Crisp, cool sky blue", tone: "#8eafc2" },
      { title: "Bright, sunny chartreuse", tone: "#b4db13" },
      { title: "Deep, muted midnight navy", tone: "#202944" },
    ],
  },
  {
    eyebrow: "Shared space",
    title: "How do you prefer to handle kitchen supplies?",
    hint: "This helps prevent the tiny frictions that add up over time.",
    options: [
      { title: "Everything shared", detail: "No labels needed." },
      {
        title: "Shared basics only",
        detail: "Oil, spices, and household staples.",
      },
      { title: "Mostly personal", detail: "Label what is yours." },
      { title: "Fully separate", detail: "I prefer not to share food items." },
    ],
  },
  {
    eyebrow: "Match preferences",
    title: "Who would you feel comfortable sharing a home with?",
    hint: "You can update this privately in your profile at any time.",
    options: [
      { title: "Anyone", detail: "Compatibility matters most to me." },
      { title: "Women only" },
      { title: "Men only" },
      { title: "Same gender as me" },
    ],
  },
]

const matches = [
  {
    name: "Michelle Ho",
    school: "CUHK · Year 2",
    score: 94,
    image:
      "https://images.unsplash.com/photo-1688354807300-449aba9c78cb?crop=faces&fit=crop&fm=jpg&q=85&w=400&h=400",
    tags: ["Same sleep schedule", "Tidy shared spaces"],
    area: "Sha Tin",
    budget: "$6.5–8K",
  },
  {
    name: "Ryan Liu",
    school: "HKBU · Year 3",
    score: 91,
    image:
      "https://images.unsplash.com/photo-1660412625493-0c8266edddb8?crop=faces&fit=crop&fm=jpg&q=85&w=400&h=400",
    tags: ["Calm communicator", "Shared basics"],
    area: "Kowloon Tong",
    budget: "$7–9K",
  },
  {
    name: "Natalie Chow",
    school: "HKU · Year 2",
    score: 88,
    image:
      "https://images.unsplash.com/photo-1688354805578-af85ea68127d?crop=faces&fit=crop&fm=jpg&q=85&w=400&h=400",
    tags: ["Same social energy", "Quiet weekdays"],
    area: "Kennedy Town",
    budget: "$8–10K",
  },
  {
    name: "Avery Lam",
    school: "PolyU · Year 3",
    score: 87,
    image:
      "https://images.unsplash.com/photo-1621274790572-7c32596bc67f?crop=faces&fit=crop&fm=jpg&q=85&w=400&h=400",
    tags: ["Early riser", "Calm shared home"],
    area: "Hung Hom",
    budget: "$6–8K",
  },
  {
    name: "Jason Tang",
    school: "CityU · Year 2",
    score: 86,
    image:
      "https://images.unsplash.com/photo-1544168190-79c17527004f?crop=faces&fit=crop&fm=jpg&q=85&w=400&h=400",
    tags: ["Shared cooking", "Direct communicator"],
    area: "Kowloon Tong",
    budget: "$7–9K",
  },
  {
    name: "Sophie Leung",
    school: "HKUST · Year 2",
    score: 84,
    image:
      "https://images.unsplash.com/photo-1607529379169-5804750c1f9a?crop=faces&fit=crop&fm=jpg&q=85&w=400&h=400",
    tags: ["Quiet evenings", "Flexible routine"],
    area: "Tseung Kwan O",
    budget: "$6.5–8.5K",
  },
  {
    name: "Marcus Yip",
    school: "EdUHK · Year 4",
    score: 82,
    image:
      "https://images.unsplash.com/photo-1565016941625-2bee25d37f72?crop=faces&fit=crop&fm=jpg&q=85&w=400&h=400",
    tags: ["Tidy shared spaces", "Social weekends"],
    area: "Tai Po",
    budget: "$5.5–7K",
  },
  {
    name: "Chloe Wong",
    school: "LingU · Year 3",
    score: 81,
    image:
      "https://images.unsplash.com/photo-1619431667975-e93b820cde63?crop=faces&fit=crop&fm=jpg&q=85&w=400&h=400",
    tags: ["Shared basics", "Quiet weekdays"],
    area: "Tuen Mun",
    budget: "$5–7K",
  },
  {
    name: "Ethan Chan",
    school: "HKU · Year 1",
    score: 79,
    image:
      "https://images.unsplash.com/photo-1657830638749-aa27415f9a43?crop=faces&fit=crop&fm=jpg&q=85&w=400&h=400",
    tags: ["Night owl", "Calm communicator"],
    area: "Sai Ying Pun",
    budget: "$8–10K",
  },
  {
    name: "Yuki Lau",
    school: "CUHK · Year 4",
    score: 78,
    image:
      "https://images.unsplash.com/photo-1657155275125-4ce23e9cec63?crop=faces&fit=crop&fm=jpg&q=85&w=400&h=400",
    tags: ["Same social energy", "Shared cooking"],
    area: "Tai Wai",
    budget: "$6–8K",
  },
]

const flatTitles = [
  "Sunlit two-bedroom near MTR",
  "Quiet flat with harbour light",
  "Warm, compact student home",
  "Renovated walk-up by the park",
  "Two-bedroom with study nook",
  "Bright corner flat near campus",
  "Calm home above the market",
  "Modern flat with open kitchen",
  "High-floor home with city view",
  "Cosy two-bedroom on a quiet lane",
  "Student-ready flat beside MTR",
  "Airy home with separate bedrooms",
  "Minimal flat near waterfront",
  "Freshly renovated shared home",
  "Practical flat with large windows",
  "Two-bedroom near university shuttle",
  "Compact home with clever storage",
  "Peaceful flat close to green space",
  "Sunny home in a student neighbourhood",
  "Furnished two-bedroom with workspace",
  "Value flat with fast campus commute",
  "Bright bedrooms and shared lounge",
  "Move-in ready home near local shops",
  "Comfortable flat on a quiet street",
  "Open-plan student home near rail",
]

const flatAreas = [
  "Sha Tin",
  "Kennedy Town",
  "Kowloon Tong",
  "Tai Wai",
  "Hung Hom",
  "Sai Ying Pun",
  "Tai Po",
  "Tseung Kwan O",
  "Mong Kok",
  "Tuen Mun",
]

const flatImages = [
  "photo-1738168246881-40f35f8aba0a",
  "photo-1668566398322-6bbc9be03736",
  "photo-1556593825-c11de986cb0b",
  "photo-1761123141836-3b3221dac3e5",
  "photo-1779785689520-bf24ef13aa71",
  "photo-1774311237295-a65a4c1ff38a",
  "photo-1759691555010-7f3f8674d2f2",
]

const flats = flatTitles.map((title, index) => {
  const area = flatAreas[index % flatAreas.length]
  const squareFeet = 410 + ((index * 37) % 190)
  const price = 12800 + ((index * 850) % 7200)
  return {
    id: index + 1,
    title,
    area,
    price: `$${price.toLocaleString("en-US")}`,
    mapPrice: `$${(price / 1000).toFixed(1)}k`,
    details: `2 beds · 1 bath · ${squareFeet} sq ft`,
    commute: `${6 + ((index * 3) % 17)} min to campus`,
    image: `https://images.unsplash.com/${flatImages[index % flatImages.length]}?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900&h=620`,
    x: 10 + ((index * 29) % 78),
    y: 12 + ((index * 17) % 72),
    rating: (4.6 + (index % 4) / 10).toFixed(1),
  }
})

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
              {matches.map((match) => (
                <img key={match.name} src={match.image} alt="" />
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
              <small>Free · Takes about 3 minutes</small>
            </span>
            <span className="cta-icon">
              <Icon name="arrow" />
            </span>
          </button>
        </div>
        <div className="hero-stats">
          <span>
            <b>Verified</b> student community
          </span>
          <span>
            <b>7</b> thoughtful questions
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
              "Meet your best matches",
              "See compatibility clearly, then choose who to connect with.",
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
  onVerified: (email: string) => void
}) {
  const [email, setEmail] = useState("")
  const [touched, setTouched] = useState(false)
  const valid = /^[^\s@]+@[^\s@]+\.(edu\.hk|hk)$/i.test(email)

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
  onComplete: () => void
}) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const question = questions[index]
  const selected = answers[index]
  const percent = ((index + 1) / questions.length) * 100

  function choose(optionIndex: number) {
    const next = [...answers]
    next[index] = optionIndex
    setAnswers(next)
  }

  function previous() {
    if (index === 0) onBack()
    else setIndex(index - 1)
  }

  function next() {
    if (selected === undefined) return
    if (index === questions.length - 1) onComplete()
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
            className={`option-grid ${
              question.options.some((option) => option.tone)
                ? "colour-options"
                : ""
            }`}
          >
            {question.options.map((option, optionIndex) => (
              <button
                key={option.title}
                className={`option-card ${
                  selected === optionIndex ? "selected" : ""
                }`}
                onClick={() => choose(optionIndex)}
              >
                {option.tone ? (
                  <span
                    className="colour-swatch"
                    style={{ background: option.tone }}
                  />
                ) : (
                  <span className="option-letter">
                    {String.fromCharCode(65 + optionIndex)}
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
            ))}
          </div>
          <div className="quiz-footer">
            <span>
              {selected === undefined
                ? "Choose one to continue"
                : "Looking good — ready when you are"}
            </span>
            <button
              className="primary-button"
              disabled={selected === undefined}
              onClick={next}
            >
              {index === questions.length - 1 ? "See my matches" : "Continue"}{" "}
              <Icon name="arrow" />
            </button>
          </div>
        </div>
      </section>
    </Shell>
  )
}

function MatchCard({
  match,
  onOpen,
}: {
  match: typeof matches[number]
  onOpen: () => void
}) {
  const [saved, setSaved] = useState(false)
  return (
    <article className="match-card" onClick={onOpen}>
      <div className="match-photo">
        <img src={match.image} alt={`${match.name}, ${match.school}`} />
        <button
          className={`save-button ${saved ? "saved" : ""}`}
          onClick={(event) => {
            event.stopPropagation()
            setSaved(!saved)
          }}
          aria-label={saved ? "Remove from saved" : "Save match"}
        >
          <Icon name="heart" size={18} />
        </button>
        <span className="verified-chip">
          <Icon name="check" size={12} /> Verified
        </span>
      </div>
      <div className="match-body">
        <div className="match-title">
          <div>
            <h3>{match.name}</h3>
            <p>{match.school}</p>
          </div>
          <div className="match-score">
            <b>{match.score}%</b>
            <span>match</span>
          </div>
        </div>
        <div className="match-tags">
          {match.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="match-meta">
          <span>
            <Icon name="home" size={14} /> {match.area}
          </span>
          <span>{match.budget} / mo</span>
        </div>
        <button className="view-profile">
          View compatibility <Icon name="arrow" size={17} />
        </button>
      </div>
    </article>
  )
}

function Matches({
  email,
  onRestart,
}: {
  email: string
  onRestart: () => void
}) {
  type WorkspaceTab = "matches" | "messages" | "flats"
  const [activeMatch, setActiveMatch] = useState<typeof matches[number] | null>(
    null,
  )
  const [tab, setTab] = useState<WorkspaceTab>("matches")
  const [chatMatch, setChatMatch] = useState(matches[0])
  const [draft, setDraft] = useState("")
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
  const panoramaDrag = useRef<{ startX: number startAngle: number } | null>(
    null,
  )
  const firstName = useMemo(
    () => email.split("@")[0].split(/[._-]/)[0] || "there",
    [email],
  )
  const visibleFlats = flats.filter((flat) =>
    `${flat.title} ${flat.area}`.toLowerCase().includes(search.toLowerCase()),
  )

  function startChat(match: typeof matches[number]) {
    setChatMatch(match)
    setActiveMatch(null)
    setTab("messages")
  }

  function sendMessage(event: FormEvent) {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    setMessages([...messages, { from: "me", text, time: "Now" }])
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
              <p className="section-kicker">Your shortlist is ready</p>
              <h1>
                People who feel
                <br />
                like a <em>good fit.</em>
              </h1>
            </div>
            <p>
              We found these matches based on the routines, boundaries, and
              little details that make sharing a home work.
            </p>
          </section>
          <section className="match-section">
            <div className="match-toolbar">
              <p>
                <b>10 compatible students</b>
                <span>Updated from your lifestyle profile</span>
              </p>
              <button>
                Best match <span>↓</span>
              </button>
            </div>
            <div className="match-grid">
              {matches.map((match) => (
                <MatchCard
                  key={match.name}
                  match={match}
                  onOpen={() => setActiveMatch(match)}
                />
              ))}
            </div>
            <div className="matches-note">
              <Icon name="spark" />
              <p>
                <b>Your matches get better over time.</b>
                <span>Update your preferences whenever your plans change.</span>
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
            {matches.map((match, index) => (
              <button
                key={match.name}
                className={chatMatch.name === match.name ? "active" : ""}
                onClick={() => setChatMatch(match)}
              >
                <img src={match.image} alt="" />
                <span>
                  <b>{match.name}</b>
                  <small>
                    {index === 0
                      ? "Want to shortlist a few flats..."
                      : "You’re connected — say hello"}
                  </small>
                </span>
                {index === 0 && <i />}
              </button>
            ))}
          </aside>
          <div className="chat-thread">
            <header>
              <img src={chatMatch.image} alt="" />
              <span>
                <b>{chatMatch.name}</b>
                <small>
                  <i /> Connected · {chatMatch.score}% match
                </small>
              </span>
              <button onClick={() => setTab("flats")}>
                <Icon name="search" size={16} /> Search flats together
              </button>
            </header>
            <div className="message-stream">
              <div className="conversation-date">Today</div>
              {chatMatch.name === matches[0].name ? (
                messages.map((message, index) => (
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
                    You both value {chatMatch.tags[0].toLowerCase()}. Say hello
                    and see if your housing plans align.
                  </p>
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
                <b>{activeMatch.score}%</b>
                <span>lifestyle match</span>
              </div>
            </div>
            <div className="compatibility-box">
              <p className="section-kicker">Why you match</p>
              <h3>Your home rhythms naturally align.</h3>
              <div className="compatibility-bars">
                {[
                  ["Daily routine", 96],
                  ["Communication", 93],
                  ["Shared spaces", 88],
                ].map(([label, score]) => (
                  <div key={label as string}>
                    <span>
                      <b>{label}</b>
                      <small>{score}%</small>
                    </span>
                    <i>
                      <i style={{ width: `${score}%` }} />
                    </i>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-details">
              <span>
                <small>Preferred area</small>
                <b>{activeMatch.area}</b>
              </span>
              <span>
                <small>Monthly budget</small>
                <b>{activeMatch.budget}</b>
              </span>
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
  const [email, setEmail] = useState("student@cuhk.edu.hk")

  if (screen === "home") return <Home onStart={() => setScreen("verify")} />
  if (screen === "verify")
    return (
      <Verify
        onBack={() => setScreen("home")}
        onVerified={(value) => {
          setEmail(value)
          setScreen("quiz")
        }}
      />
    )
  if (screen === "quiz")
    return (
      <Quiz
        onBack={() => setScreen("verify")}
        onComplete={() => setScreen("matches")}
      />
    )
  return <Matches email={email} onRestart={() => setScreen("home")} />
}
