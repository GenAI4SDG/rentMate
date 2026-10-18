import Icon from "./ui/Icon"
import MockupBadge from "./ui/MockupBadge"

/**
 * How to publish + where else owners list.
 *
 * The walkthrough describes what the live dashboard actually does: sign in,
 * add a listing, mark it rented, take it down. The agency links are real HK
 * platforms (genuinely useful to an owner comparing routes) but Rent Mate
 * neither reads from nor writes to them — the copy says so, and the block is
 * badged so nobody mistakes cross-posting for a shipped integration.
 */

const STEPS = [
  {
    title: "Sign in as an owner",
    body: "Create an owner account, or use the one-click demo owner — no backend needed.",
  },
  {
    title: "Add your listing",
    body: "Address, rent, size, bed/bath. Pin the address so students find it on the map.",
  },
  {
    title: "Add photos, amenities and a scan",
    body: "Amenity ticks and the phone room-scan are mockups today — see the panels beside this one.",
  },
  {
    title: "Students find you",
    body: "Available listings appear on the student map instantly. Mark rented or remove when life moves on.",
  },
]

/** Real HK rental platforms — reference links only, no sync. */
const AGENCIES = [
  {
    name: "28Hse",
    url: "https://www.28hse.com/",
    note: "Large HK listing portal; owner and agency listings side by side.",
  },
  {
    name: "Centaline 中原地產",
    url: "https://hk.centaline.com/",
    note: "One of the two largest agency chains; strong on estate knowledge.",
  },
  {
    name: "Midland 美聯物業",
    url: "https://www.midland.com.hk/",
    note: "Full-service agency chain with a big tenant-facing footprint.",
  },
  {
    name: "Squarefoot",
    url: "https://squarefoot.com.hk/",
    note: "Portal with floorplan and district data; good for price comparisons.",
  },
]

export default function OwnerGuide() {
  return (
    <section className="owner-panel owner-guide">
      <header className="owner-panel-head">
        <div>
          <p className="section-kicker">Getting started</p>
          <h2>How to publish</h2>
        </div>
      </header>

      <ol className="walkthrough">
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <span className="walkthrough-num">{index + 1}</span>
            <div>
              <b>{step.title}</b>
              <small>{step.body}</small>
            </div>
          </li>
        ))}
      </ol>

      <div className="agency-block">
        <header className="owner-panel-head">
          <h3>Already listed elsewhere?</h3>
          <MockupBadge label="Reference links" />
        </header>
        <p className="owner-panel-note">
          These open the agency's own site in a new tab. Rent Mate does not
          read, import or sync your listings with them — cross-posting is not
          built.
        </p>
        <ul className="agency-links">
          {AGENCIES.map((agency) => (
            <li key={agency.name}>
              <a href={agency.url} target="_blank" rel="noopener noreferrer">
                <b>{agency.name}</b>
                <small>{agency.note}</small>
              </a>
              <Icon name="arrow" size={15} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
