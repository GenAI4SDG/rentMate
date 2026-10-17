import { useEffect, useState } from "react"
import FlatsMapExplorer from "./FlatsMapExplorer"
import ListingFormModal from "./ListingFormModal"
import {
  getDisplayName,
  getStoredEmail,
  resolveDemoLandlordId,
} from "../lib/demo-session"

export default function LandlordDashboard({
  onSignOut,
}: {
  onSignOut: () => void
}) {
  const [landlordId, setLandlordId] = useState<string>("")
  const [showForm, setShowForm] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const name = getDisplayName() || "testing"
  const email = getStoredEmail()

  useEffect(() => {
    resolveDemoLandlordId().then((id) => {
      if (id) setLandlordId(id)
      else
        setLoadError(
          "Could not load landlord account. Start map API and run npm run seed:listings.",
        )
    })
  }, [])

  return (
    <main className="landlord-dashboard">
      <header className="landlord-header">
        <div>
          <p className="section-kicker">Landlord / flat owner</p>
          <h1>
            Welcome, <em>{name}</em>
          </h1>
          <p className="landlord-sub">
            List homes on the map, manage availability, and reach student tenants
            on Rent Mate.
          </p>
          {email ? (
            <small className="landlord-email">Signed in as {email}</small>
          ) : null}
        </div>
        <div className="landlord-header-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => setShowForm(true)}
          >
            Add a listing
          </button>
          <button type="button" className="outline-button" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </header>

      {loadError ? (
        <p className="backend-check-error" role="alert">
          {loadError}
        </p>
      ) : null}

      <FlatsMapExplorer allowListProperty landlordId={landlordId} />

      {showForm ? (
        <ListingFormModal
          landlordId={landlordId}
          onClose={() => setShowForm(false)}
          onCreated={() => setShowForm(false)}
        />
      ) : null}
    </main>
  )
}
