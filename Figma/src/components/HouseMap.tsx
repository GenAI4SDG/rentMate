import { useEffect, useMemo, useRef } from "react"
import L from "leaflet"
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet"
import type { ListingFeature } from "../lib/listingsApi"
import "leaflet/dist/leaflet.css"

const tileUrl =
  import.meta.env.VITE_OSM_TILE_URL ??
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png"

const defaultCenter: [number, number] = [
  Number(import.meta.env.VITE_MAP_DEFAULT_LAT ?? 22.3193),
  Number(import.meta.env.VITE_MAP_DEFAULT_LNG ?? 114.1694),
]

// Bundler-safe default marker icons
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const highlightIcon = L.icon({
  ...defaultIcon.options,
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
})

function MapEvents({
  onBboxChange,
}: {
  onBboxChange: (bbox: [number, number, number, number]) => void
}) {
  const timer = useRef<number | null>(null)
  const map = useMap()

  useMapEvents({
    moveend: () => {
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => {
        const b = map.getBounds()
        onBboxChange([
          b.getWest(),
          b.getSouth(),
          b.getEast(),
          b.getNorth(),
        ])
      }, 400)
    },
    zoomend: () => {
      map.fire("moveend")
    },
  })

  useEffect(() => {
    const b = map.getBounds()
    onBboxChange([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()])
  }, [map, onBboxChange])

  return null
}

function FlyTo({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, zoom ?? map.getZoom(), { duration: 0.8 })
  }, [center, zoom, map])
  return null
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export default function HouseMap({
  listings,
  selectedId,
  hoveredId,
  flyTo,
  onSelect,
  onBboxChange,
  onMarkerHover,
  loading,
  error,
}: {
  listings: ListingFeature[]
  selectedId?: string | null
  hoveredId?: string | null
  flyTo?: [number, number] | null
  onSelect: (id: string) => void
  onBboxChange: (bbox: [number, number, number, number]) => void
  onMarkerHover?: (id: string | null) => void
  loading?: boolean
  error?: string | null
}) {
  const markers = useMemo(() => listings, [listings])

  return (
    <div className="house-map-wrap" aria-busy={loading}>
      <div className="house-map-status">
        {loading && <span>Loading listings…</span>}
        {error && <span role="alert">{error}</span>}
        {!loading && !error && markers.length === 0 && (
          <span>No available houses in this area</span>
        )}
        <span className="house-map-attribution">
          © OpenStreetMap contributors
        </span>
      </div>
      <MapContainer
        center={defaultCenter}
        zoom={12}
        className="house-map-leaflet"
        scrollWheelZoom
      >
        <TileLayer url={tileUrl} attribution="© OpenStreetMap contributors" />
        {flyTo && <FlyTo center={flyTo} />}
        <MapEvents onBboxChange={onBboxChange} />
        {markers.map((f) => {
          const [lng, lat] = f.geometry.coordinates
          const p = f.properties
          const isSel = p.id === selectedId || p.id === hoveredId
          return (
            <Marker
              key={p.id}
              position={[lat, lng]}
              icon={isSel ? highlightIcon : defaultIcon}
              eventHandlers={{
                click: () => onSelect(p.id),
                mouseover: () => onMarkerHover?.(p.id),
                mouseout: () => onMarkerHover?.(null),
              }}
            >
              <Popup>
                <strong>{escapeHtml(p.title)}</strong>
                <br />
                HK${p.price.toLocaleString()} / mo · {p.bedrooms} bed
                <br />
                <button type="button" onClick={() => onSelect(p.id)}>
                  View details
                </button>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
