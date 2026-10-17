import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import HouseMap from "./HouseMap"
import ListingFormModal from "./ListingFormModal"
import {
  fetchListingsBbox,
  fetchNearby,
  geocodeQuery,
  type ListingFeature,
} from "../lib/listingsApi"

type Props = {
  onOpenLegacyTour?: (listing: ListingFeature) => void
  /** Landlord dashboard only — tenants browse without listing. */
  allowListProperty?: boolean
  landlordId?: string
}

export default function FlatsMapExplorer({
  onOpenLegacyTour,
  allowListProperty = false,
  landlordId = "",
}: Props) {
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
  const [nearby, setNearby] = useState<
    Array<{ type: string; name: string; distanceMeters: number }>
  >([])
  const [showForm, setShowForm] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const loadBbox = useCallback(
    async (bbox: [number, number, number, number]) => {
      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac
      setLoading(true)
      setError(null)
      try {
        const data = await fetchListingsBbox(
          bbox,
          { maxPrice, bedrooms },
          ac.signal,
        )
        setFeatures(data.features)
        if (data.truncated) {
          setError("Showing first 500 results — zoom in to narrow.")
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return
        setError(
          "Could not load listings. Is the map API running on port 3001?",
        )
        setFeatures([])
      } finally {
        setLoading(false)
      }
    },
    [maxPrice, bedrooms],
  )

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
        </div>
        <form className="search-box" onSubmit={handleSearchSubmit}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search address or area (via backend geocode)"
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
          {allowListProperty ? (
            <button type="button" onClick={() => setShowForm(true)}>
              List a property
            </button>
          ) : null}
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

      {showForm && (
        <ListingFormModal
          landlordId={landlordId}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false)
            setError(null)
          }}
        />
      )}
    </section>
  )
}
