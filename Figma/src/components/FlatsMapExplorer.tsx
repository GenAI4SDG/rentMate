import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import HouseMap from "./HouseMap"
import {
  fetchListingsBbox,
  fetchNearby,
  geocodeQuery,
  resetMapApiStatus,
  type ListingFeature,
} from "../lib/listingsApi"
import { priceContext } from "../lib/priceContext"

type Props = {
  onOpenLegacyTour?: (listing: ListingFeature) => void
}

export default function FlatsMapExplorer({ onOpenLegacyTour }: Props) {
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
  const [nearby, setNearby] = useState<
    Array<{ type: string; name: string; distanceMeters: number }>
  >([])
  const abortRef = useRef<AbortController | null>(null)
  const lastBboxRef = useRef<[number, number, number, number] | null>(null)

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
            {sorted.map((f) => {
              const p = f.properties
              return (
                <button
                  type="button"
                  key={p.id}
                  className={selected?.properties.id === p.id ? "active" : ""}
                  onMouseEnter={() => setHoveredId(p.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => setSelected(f)}
                >
                  <span>
                    <small>{p.district}</small>
                    <b>{p.title}</b>
                    <strong>
                      HK${p.price.toLocaleString()} <em>/ mo</em>
                    </strong>
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        <article className="map-property-detail">
          {selected ? (
            <>
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
