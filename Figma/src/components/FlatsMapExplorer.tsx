import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import HouseMap from "./HouseMap"
import Icon from "./ui/Icon"
import {
  fetchListingsBbox,
  fetchNearby,
  geocodeQuery,
  resetMapApiStatus,
  type ListingFeature,
} from "../lib/listingsApi"
import { priceContext } from "../lib/priceContext"
import { STATUS_LABEL, sharePerPerson, type ListingStatus } from "../lib/listings"

type Props = {
  onOpenLegacyTour?: (listing: ListingFeature) => void
  /**
   * Household size the "about $X each" line divides by.
   *
   * The pre-merge app derived this from the quiz profile
   * (`profile?.household_size ?? 2`, lib/quiz.ts). The quiz that is wired
   * today does not capture household size, so this defaults to 2 — the same
   * demo default. It is arithmetic on the flat ("what this flat works out to
   * per person if two people share it"), not a claim about the user.
   */
  people?: number
}

/**
 * Saved pins for the OSM pool. Separate from lib/personalStore on purpose:
 * that store is keyed by the numeric ids of the curated demo pool
 * (saved/status/attached/viewings for listings 1..N and curated match ids),
 * while pins here carry the map API's string ids. Mixing the two would let a
 * save on one surface silently fail on the other. This is a local, per-device
 * save — no Supabase mirror, no conversation attachment — and says so by not
 * pretending to be the full personal store.
 */
const SAVED_KEY = "rentmate.osm-saved.v1"

function loadSaved(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : []
  } catch {
    return []
  }
}

/** The map API returns the listing's own status; anything unexpected is not "available". */
function statusOf(status: string): ListingStatus {
  return status === "viewing" || status === "taken" ? status : "available"
}

export default function FlatsMapExplorer({ onOpenLegacyTour, people = 2 }: Props) {
  const [features, setFeatures] = useState<ListingFeature[]>([])
  const [selected, setSelected] = useState<ListingFeature | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null)
  const [mobileMap, setMobileMap] = useState(false)
  const [maxPrice, setMaxPrice] = useState<number | undefined>(20000)
  const [bedrooms, setBedrooms] = useState<number | undefined>(undefined)
  const [demoMode, setDemoMode] = useState(false)
  const [savedIds, setSavedIds] = useState<string[]>(loadSaved)
  const [nearby, setNearby] = useState<
    Array<{ type: string; name: string; distanceMeters: number }>
  >([])
  const abortRef = useRef<AbortController | null>(null)
  const lastBboxRef = useRef<[number, number, number, number] | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(savedIds))
    } catch {
      /* A blocked or full storage quota must never break the map. */
    }
  }, [savedIds])

  function toggleSaved(id: string) {
    setSavedIds((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id],
    )
  }

  const loadBbox = useCallback(
    async (bbox: [number, number, number, number]) => {
      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac
      lastBboxRef.current = bbox
      setLoading(true)
      setError(null)
      try {
        const data = await fetchListingsBbox(
          bbox,
          { maxPrice, bedrooms },
          ac.signal,
        )
        setFeatures(data.features)
        setDemoMode(data.source === "demo")
        if (data.truncated) {
          setError("Showing first 500 results — zoom in to narrow.")
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return
        setError(
          "Could not load listings. Is the map API running on port 3001?",
        )
        setFeatures([])
        setDemoMode(false)
      } finally {
        setLoading(false)
      }
    },
    [maxPrice, bedrooms],
  )

  /** Re-probe the live map API (e.g. after starting the backend), then reload. */
  function retryLiveMap() {
    resetMapApiStatus()
    const bbox = lastBboxRef.current
    if (bbox) void loadBbox(bbox)
    else setDemoMode(false)
  }

  useEffect(() => {
    if (!selected) {
      setNearby([])
      return
    }
    fetchNearby(selected.properties.id).then((r) => setNearby(r.places))
  }, [selected])

  const sorted = useMemo(
    () =>
      [...features].sort(
        (a, b) => a.properties.price - b.properties.price,
      ),
    [features],
  )

  const ctx = useMemo(
    () => (selected ? priceContext(selected, features) : null),
    [selected, features],
  )

  async function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = search.trim()
    if (!q) return
    try {
      const g = await geocodeQuery(q)
      setFlyTo([g.lat, g.lng])
    } catch {
      setError("Address search failed")
    }
  }

  return (
    <section className="flats-browser flats-osm">
      <div className="flats-search-header">
        <div>
          <p className="section-kicker">Live map · OpenStreetMap</p>
          <h1>Find available homes in Hong Kong.</h1>
          {demoMode ? (
            <button
              type="button"
              className="demo-source-badge"
              onClick={retryLiveMap}
              title="The map API (port 3001) is not reachable, so these pins are the synthetic demo pool. Click to try the live API again."
            >
              <span className="demo-dot" aria-hidden="true" />
              Demo listings · map API offline — retry
            </button>
          ) : null}
        </div>
        <form className="search-box" onSubmit={handleSearchSubmit}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search district or address"
            aria-label="Search address"
          />
          <button type="submit">Go</button>
        </form>
        <div className="map-filters">
          <button
            type="button"
            className={bedrooms === 2 ? "active" : ""}
            onClick={() => setBedrooms(bedrooms === 2 ? undefined : 2)}
          >
            2+ bedrooms
          </button>
          <button
            type="button"
            className={maxPrice === 20000 ? "active" : ""}
            onClick={() =>
              setMaxPrice(maxPrice === 20000 ? undefined : 20000)
            }
          >
            Under $20K
          </button>
        </div>
        <div className="mobile-map-switch">
          <button
            type="button"
            className={!mobileMap ? "active" : ""}
            onClick={() => setMobileMap(false)}
          >
            List
          </button>
          <button
            type="button"
            className={mobileMap ? "active" : ""}
            onClick={() => setMobileMap(true)}
          >
            Map
          </button>
        </div>
      </div>

      <div className={`map-explorer osm-explorer ${mobileMap ? "show-map" : ""}`}>
        <aside className="map-results">
          <div className="result-count">
            <b>{sorted.length} places</b>
            <span>Price ↑</span>
          </div>
          <div className="result-scroll">
            {/* Cards, not text rows. The pre-merge card markup (result-row /
                result-open / result-copy / result-foot) is what index.css is
                written for — the 14 Oct note above `.result-scroll` records
                that the old bare-button rules were deliberately deleted. */}
            {sorted.map((f) => {
              const p = f.properties
              const status = statusOf(p.status)
              const saved = savedIds.includes(p.id)
              return (
                <div
                  key={p.id}
                  className={`result-row ${
                    selected?.properties.id === p.id ? "active" : ""
                  }`}
                  onMouseEnter={() => setHoveredId(p.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <button
                    type="button"
                    className="result-open"
                    onClick={() => setSelected(f)}
                  >
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt="" />
                    ) : (
                      <span className="result-thumb-empty" aria-hidden="true">
                        <Icon name="home" size={18} />
                      </span>
                    )}
                    <span className="result-copy">
                      <small className="result-area">{p.district}</small>
                      <b>{p.title}</b>
                      <i>
                        {p.bedrooms} bed · {p.bathrooms} bath
                      </i>
                      <strong>
                        HK${p.price.toLocaleString()}{" "}
                        <em>/ mo whole flat</em>
                      </strong>
                      <em className="share-line">
                        about $
                        {sharePerPerson(p.price, people).toLocaleString(
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
                    {onOpenLegacyTour && (
                      <span className="chip-mini">3D walkthrough</span>
                    )}
                    <div className="result-actions">
                      <button
                        type="button"
                        className={`save-mini ${saved ? "saved" : ""}`}
                        onClick={() => toggleSaved(p.id)}
                        aria-label={saved ? "Remove from saved" : "Save this home"}
                        title={saved ? "Remove from saved" : "Save this home"}
                      >
                        <Icon name="heart" size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            {sorted.length === 0 && !loading && (
              <p className="empty-shortlist">
                Nothing in view — pan the map or widen the filters.
              </p>
            )}
          </div>
        </aside>

        <article className="map-property-detail">
          {selected ? (
            <>
              <div className="detail-image">
                {selected.properties.thumbnail ? (
                  <img
                    src={selected.properties.thumbnail}
                    alt={selected.properties.title}
                  />
                ) : (
                  <span className="detail-image-empty" aria-hidden="true">
                    <Icon name="home" size={26} />
                  </span>
                )}
                <span>
                  {demoMode ? "Demo listing" : selected.properties.district}
                </span>
                <button
                  type="button"
                  className={
                    savedIds.includes(selected.properties.id) ? "saved" : ""
                  }
                  onClick={() => toggleSaved(selected.properties.id)}
                  aria-label={
                    savedIds.includes(selected.properties.id)
                      ? "Remove from saved"
                      : "Save this home"
                  }
                >
                  <Icon name="heart" size={16} />
                </button>
              </div>
              <div className="detail-copy">
                <span className="detail-area">{selected.properties.district}</span>
                <h2>{selected.properties.title}</h2>
                <p>
                  {selected.properties.bedrooms} bed ·{" "}
                  {selected.properties.bathrooms} bath
                </p>
                <div className="detail-price">
                  <b>HK${selected.properties.price.toLocaleString()}</b>
                  <span>/ month</span>
                </div>
                {ctx ? (
                  <p className={`price-context ${ctx.verdict}`}>
                    <b>
                      {ctx.verdict === "typical"
                        ? "In line with the area"
                        : ctx.verdict === "below"
                          ? `${Math.abs(ctx.diffPercent)}% below the area median`
                          : `${ctx.diffPercent}% above the area median`}
                    </b>
                    <small>
                      Median HK${Math.round(ctx.median).toLocaleString()} across{" "}
                      {ctx.sampleSize} Rent Mate listings in {ctx.district}. Not
                      official R&amp;VD data.
                    </small>
                  </p>
                ) : null}
                {onOpenLegacyTour && (
                  <button
                    type="button"
                    className="tour-button"
                    onClick={() => onOpenLegacyTour(selected)}
                  >
                    Open 3D demo tour
                  </button>
                )}
              </div>
              <div className="detail-mini-map">
                <HouseMap
                  listings={[selected]}
                  selectedId={selected.properties.id}
                  onSelect={() => {}}
                  onBboxChange={() => {}}
                />
              </div>
              <div className="nearby-section">
                <h3>Nearby</h3>
                {nearby.length === 0 ? (
                  <p className="field-message">No nearby data (Overpass optional)</p>
                ) : (
                  <ul>
                    {nearby.slice(0, 8).map((n) => (
                      <li key={`${n.type}-${n.name}-${n.distanceMeters}`}>
                        {n.name} · {n.type} · {n.distanceMeters}m
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <p>Select a listing from the map or list.</p>
          )}
        </article>

        <div className="rental-map house-map-panel">
          <HouseMap
            listings={features}
            selectedId={selected?.properties.id}
            hoveredId={hoveredId}
            flyTo={flyTo}
            loading={loading}
            error={error}
            onSelect={(id) => {
              const f = features.find((x) => x.properties.id === id)
              if (f) setSelected(f)
            }}
            onBboxChange={loadBbox}
            onMarkerHover={setHoveredId}
          />
        </div>
      </div>

    </section>
  )
}
