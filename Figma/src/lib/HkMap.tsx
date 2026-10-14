// The Hong Kong map.
//
// WHAT THIS REPLACES. The previous map was a hand-drawn schematic: a rotated
// blue band for Victoria Harbour, four CSS gradient "roads", three absolutely
// positioned labels and a `<button>` per flat placed by percentage. It looked
// like a map without being one — the owner's note was "get a different map for
// hong kong + make it scrollable/zoomable", which is a fair reading of it.
//
// WHAT IT IS NOW. A real slippy map: OpenStreetMap raster tiles on Leaflet,
// pinned at the real district coordinates the matcher already uses
// (`DISTRICT_COORDS` in lib/matching.ts, mirrored by `DISTRICT_CENTROIDS` in
// lib/listings.ts). Drag to pan, wheel or pinch to zoom, +/- control, and the
// pins carry the same status styling they did before.
//
// WHY LEAFLET AND NOT A VECTOR BASEMAP. Leaflet + OSM is ~40 kB, needs no key,
// no account and no build step, and the app already loads remote images, so a
// network dependency at runtime is not new. It is also the only option that
// gives real pan/zoom without shipping a copy of the coastline.
//
// THE HONEST CAVEATS, stated in the UI as well as here:
//   1. Tiles come from OpenStreetMap's public servers. Offline, the map is a
//      blank canvas — the component detects that (`tileerror`) and says so
//      instead of showing an empty grey box.
//   2. The pins are placed from DISTRICT centroids with a small deterministic
//      jitter, because these listings are synthetic and have no real address.
//      They are district-accurate, not building-accurate. See `unproject`.

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { unproject, type Listing, type ListingStatus } from "./listings"

const OSM_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

/** Hong Kong, roughly. Only the opening view — pins drive the bounds. */
const HK_CENTRE: L.LatLngExpression = [22.3375, 114.16]
const HK_ZOOM = 11

export function HkMap({
  listings,
  selectedId,
  statusOf,
  onSelect,
  visible = true,
}: {
  listings: Listing[]
  selectedId: number
  statusOf: (id: number) => ListingStatus
  onSelect: (id: number) => void
  /** False while the map is behind the mobile "List" toggle — Leaflet needs a
   *  nudge to measure a container that was hidden when it mounted. */
  visible?: boolean
}) {
  const holder = useRef<HTMLDivElement | null>(null)
  const map = useRef<L.Map | null>(null)
  const group = useRef<L.LayerGroup | null>(null)
  const [tilesFailed, setTilesFailed] = useState(false)

  // Callbacks change identity every render, so they are read through a ref.
  // Without this the marker effect would rebuild on every keystroke elsewhere
  // on the page.
  const latest = useRef({ onSelect, statusOf })
  latest.current = { onSelect, statusOf }

  // A cheap string that changes only when a pin's identity or status does.
  const pinKey = listings.map((flat) => `${flat.id}:${statusOf(flat.id)}`).join(",")
  // Which set of pins the view was last fitted to. Selection changes must not
  // re-fit — you would lose the zoom you just chose.
  const fitted = useRef("")

  useEffect(() => {
    if (!holder.current || map.current) return
    const instance = L.map(holder.current, {
      center: HK_CENTRE,
      zoom: HK_ZOOM,
      // Wheel zoom on a map inside a scrolling page is a trap, so it is opt-in
      // per gesture: the map takes the wheel only once you have clicked it.
      scrollWheelZoom: false,
      minZoom: 10,
      maxZoom: 18,
      zoomControl: true,
      attributionControl: true,
    })
    const tiles = L.tileLayer(OSM_URL, {
      maxZoom: 19,
      attribution: OSM_ATTRIBUTION,
    })
    // Detected, not assumed. One failed tile is enough to tell the user why the
    // canvas is blank rather than leaving them looking at grey.
    tiles.on("tileerror", () => setTilesFailed(true))
    tiles.on("tileload", () => setTilesFailed(false))
    tiles.addTo(instance)
    instance.on("click", () => instance.scrollWheelZoom.enable())
    instance.on("mouseout", () => instance.scrollWheelZoom.disable())
    group.current = L.layerGroup().addTo(instance)
    map.current = instance
    return () => {
      instance.remove()
      map.current = null
      group.current = null
    }
  }, [])

  useEffect(() => {
    const instance = map.current
    const layer = group.current
    if (!instance || !layer) return

    layer.clearLayers()
    const points: L.LatLngExpression[] = []

    for (const flat of listings) {
      const { lat, lng } = unproject(flat.x, flat.y)
      const status = latest.current.statusOf(flat.id)
      const marker = L.marker([lat, lng], {
        title: `${flat.title} — ${flat.priceLabel}`,
        alt: `${flat.title}, ${flat.area}, ${flat.priceLabel}`,
        keyboard: true,
        icon: L.divIcon({
          className: "hk-pin-wrap",
          html: `<span class="hk-map-pin${flat.id === selectedId ? " active" : ""}${
            status === "available" ? "" : ` ${status}`
          }">${flat.mapPrice}</span>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
      })
      marker.on("click", () => latest.current.onSelect(flat.id))
      marker.addTo(layer)
      points.push([lat, lng])
    }

    const key = `${listings.length}|${pinKey}`
    if (points.length && fitted.current !== key) {
      instance.fitBounds(L.latLngBounds(points).pad(0.18), { animate: false })
      fitted.current = key
    }
  }, [listings, pinKey, selectedId])

  // The mobile List/Map toggle hides the container; Leaflet measured it at zero
  // height when it mounted, so it has to be told the size changed.
  useEffect(() => {
    if (!visible) return
    const instance = map.current
    if (!instance) return
    const id = window.setTimeout(() => instance.invalidateSize(), 60)
    return () => window.clearTimeout(id)
  }, [visible])

  return (
    <div className="rental-map">
      <div className="hk-map-canvas" ref={holder} />
      {tilesFailed && (
        <p className="map-offline">
          The map tiles could not load — this device looks offline. The pins and
          the list still work.
        </p>
      )}
    </div>
  )
}
