import { useMemo, useRef, useState, type FormEvent } from "react"
import Logo from "../components/ui/Logo"
import Icon from "../components/ui/Icon"
import FlatsMapExplorer from "../components/FlatsMapExplorer"
import SettlingPlan from "../components/SettlingPlan"
import MatchNarrative from "../components/MatchNarrative"
import RentChatbot from "../components/RentChatbot"
import { getQuizAnswers } from "../lib/demo-session"
import { matches, flats, roomViews } from "../appData"

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

export default function Matches({
  email,
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
                <b>{activeMatch.score}%</b>
                <span>lifestyle match</span>
              </div>
            </div>
            <MatchNarrative match={activeMatch} answers={quizAnswers} />
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