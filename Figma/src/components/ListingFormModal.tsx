import { FormEvent, useState } from "react"

export default function ListingFormModal({
  onClose,
  onCreated,
  landlordId = "",
}: {
  onClose: () => void
  onCreated: () => void
  landlordId?: string
}) {
  const [title, setTitle] = useState("")
  const [address, setAddress] = useState("")
  const [district, setDistrict] = useState("Sha Tin")
  const [rent, setRent] = useState(12000)
  const [lat, setLat] = useState<number | "">("")
  const [lng, setLng] = useState<number | "">("")
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function geocodeAddress() {
    const res = await fetch(
      `/api/geocode?q=${encodeURIComponent(`${address}, ${district}, Hong Kong`)}`,
    )
    if (!res.ok) {
      setMessage("Geocode failed")
      return
    }
    const g = await res.json()
    setLat(g.lat)
    setLng(g.lng)
    setMessage(`Pinned: ${g.displayName}`)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const ownerId =
      landlordId || import.meta.env.VITE_DEMO_LANDLORD_ID || ""
    if (!ownerId) {
      setMessage(
        "Landlord account not loaded. Run map API seed:listings or restart server.",
      )
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title_en: title,
          address,
          district,
          monthly_rent: rent,
          bedrooms: 2,
          bathrooms: 1,
          area_sqft: 400,
          property_type: "flat",
          landlord_id: ownerId,
          latitude: lat === "" ? undefined : lat,
          longitude: lng === "" ? undefined : lng,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      onCreated()
    } catch (err) {
      setMessage(String(err))
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
        <h2>List a property</h2>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          District
          <input
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            required
          />
        </label>
        <label>
          Address
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </label>
        <button type="button" onClick={geocodeAddress}>
          Geocode address
        </button>
        <label>
          Lat
          <input
            type="number"
            step="any"
            value={lat}
            onChange={(e) =>
              setLat(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </label>
        <label>
          Lng
          <input
            type="number"
            step="any"
            value={lng}
            onChange={(e) =>
              setLng(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </label>
        <label>
          Monthly rent (HKD)
          <input
            type="number"
            value={rent}
            onChange={(e) => setRent(Number(e.target.value))}
          />
        </label>
        {message && <p className="field-message">{message}</p>}
        <button className="primary-button" type="submit" disabled={loading}>
          Save listing
        </button>
        <button type="button" onClick={onClose}>
          Cancel
        </button>
      </form>
    </div>
  )
}
