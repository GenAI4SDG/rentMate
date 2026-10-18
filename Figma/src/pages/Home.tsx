import Icon from "../components/ui/Icon"
import Logo from "../components/ui/Logo"
import BackendHealthCheck from "../components/BackendHealthCheck"
import { heroImage, matches } from "../appData"

export default function Home({
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