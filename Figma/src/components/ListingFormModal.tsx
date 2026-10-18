import { FormEvent, useState } from "react"
import { mapApiUrl } from "../lib/api-base"
import { createListing } from "../lib/landlordApi"

const DISTRICTS = [
  "Central & Western",
  "Wan Chai",
  "Eastern",
  "Southern",
  "Yau Tsim Mong",
  "Sham Shui Po",
  "Kowloon City",
  "Wong Tai Sin",
  "Kwun Tong",
  "Kwai Tsing",
  "Tsuen Wan",
  "Tuen Mun",
  "Yuen Long",
  "North",
  "Tai Po",
  "Sha Tin",
  "Sai Kung",
  "Islands",
]

const PROPERTY_TYPES = [
  { value: "flat", label: "Flat / apartment" },
  { value: "room", label: "Room in shared flat" },
  { value: "studio", label: "Studio" },
]

export default function ListingFormModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [title, setTitle] = useState("")
  const [address, setAddress] = useState("")
  const [district, setDistrict] = useState("Sha Tin")
  const [propertyType, setPropertyType] = useState("flat")
  const [rent, setRent] = useState(12000)
  const [bedrooms, setBedrooms] = useState(2)
  const [bathrooms, setBathrooms] = useState(1)
  const [areaSqft, setAreaSqft] = useState(400)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  )
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function pinAddress() {
    setError(false)
    setMessage("Looking up address…")
    try {
      const res = await fetch(
        mapApiUrl(
          `/api/geocode?q=${encodeURIComponent(`${address}, ${district}, Hong Kong`)}`,
        ),
      )
      if (!res.ok) throw new Error("not found")
      const g = await res.json()
      setCoords({ lat: g.lat, lng: g.lng })
      setMessage(`Pinned: ${g.displayName}`)
    } catch {
      setError(true)
      setMessage("Could not find that address — try adding the building or street name.")
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(false)
    setMessage(null)
    try {
      await createListing({
        title_en: title.trim(),
        address: address.trim(),
        district,
        monthly_rent: rent,
        bedrooms,
        bathrooms,
        area_sqft: areaSqft,
        property_type: propertyType,
        latitude: coords?.lat,
        longitude: coords?.lng,
      })
      onCreated()
    } catch (err) {
      setError(true)
      setMessage(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="match-modal listing-form-modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <button type="button" className="modal-close" onClick={onClose}>
          ×
        </button>
        <p className="section-kicker">New listing</p>
        <h2>List a property</h2>

        <label>
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bright 2-bed near Tai Wai MTR"
            maxLength={160}
            required
          />
        </label>

        <div className="form-row">
          <label>
            District
            <select value={district} onChange={(e) => setDistrict(e.target.value)}>
              {DISTRICTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label>
            Type
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Address
          <input
            value={address}
            onChange={(e) => {
              setAddress(e.target.value)
              setCoords(null)
            }}
            placeholder="Street, building name"
            maxLength={240}
            required
          />
        </label>
        <button type="button" className="outline-button" onClick={pinAddress}>
          {coords ? "Re-pin address on map" : "Find address on map"}
        </button>

        <div className="form-row">
          <label>
            Rent (HK$/mo)
            <input
              type="number"
              min={1}
              value={rent}
              onChange={(e) => setRent(Number(e.target.value))}
              required
            />
          </label>
          <label>
            Area (sq ft)
            <input
              type="number"
              min={1}
              value={areaSqft}
              onChange={(e) => setAreaSqft(Number(e.target.value))}
              required
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Bedrooms
            <input
              type="number"
              min={0}
              max={20}
              value={bedrooms}
              onChange={(e) => setBedrooms(Number(e.target.value))}
            />
          </label>
          <label>
            Bathrooms
            <input
              type="number"
              min={0}
              max={20}
              value={bathrooms}
              onChange={(e) => setBathrooms(Number(e.target.value))}
            />
          </label>
        </div>

        {message && (
          <p className={`field-message ${error ? "error" : ""}`}>{message}</p>
        )}
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Saving…" : "Publish listing"}
        </button>
      </form>
    </div>
  )
}
