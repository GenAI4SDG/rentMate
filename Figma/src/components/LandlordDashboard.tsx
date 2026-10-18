import { useCallback, useEffect, useState } from "react"
import FlatsMapExplorer from "./FlatsMapExplorer"
import ListingFormModal from "./ListingFormModal"
import OwnerGuide from "./OwnerGuide"
import OwnerVerification from "./OwnerVerification"
import Icon from "./ui/Icon"
import { getDisplayName, getStoredEmail } from "../lib/demo-session"
import {
  fetchOwnListingsResult,
  removeListing,
  setListingStatus,
  type OwnListing,
} from "../lib/landlordApi"
import { getSupabase } from "../lib/supabase"

const STATUS_LABEL: Record<OwnListing["status"], string> = {
  available: "Available",
  rented: "Rented",
  hidden: "Hidden",
}

export default function LandlordDashboard({
  onSignOut,
}: {
  onSignOut: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [listings, setListings] = useState<OwnListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [mapVersion, setMapVersion] = useState(0)
  /** True when the listings on screen are the synthetic pool, not live data. */
  const [demoMode, setDemoMode] = useState(false)
  /**
   * Mockup verification flags — in memory on purpose: reload and you are
   * unverified again, which is the honest shape for a demo affordance.
   * OwnerVerification sets them; the listing table reads them for its pill.
   */
  const [idVerified, setIdVerified] = useState(false)
  const [roomScanned, setRoomScanned] = useState(false)

  const name = getDisplayName() || "owner"
  const email = getStoredEmail()

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchOwnListingsResult()
      setListings(result.listings)
      setDemoMode(result.source === "demo")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load your listings"
      setError(msg)
      if (/sign in/i.test(msg) || /session/i.test(msg)) {
        void getSupabase()?.auth.signOut()
        onSignOut()
      }
    } finally {
      setLoading(false)
    }
  }, [onSignOut])

  useEffect(() => {
    void reload()
  }, [reload])

  async function act(id: string, run: () => Promise<unknown>) {
    setBusyId(id)
    setError(null)
    try {
      await run()
      await reload()
      setMapVersion((v) => v + 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed")
    } finally {
      setBusyId(null)
    }
  }

  async function signOut() {
    await getSupabase()?.auth.signOut()
    onSignOut()
  }

  const counts = {
    available: listings.filter((l) => l.status === "available").length,
    rented: listings.filter((l) => l.status === "rented").length,
  }

  return (
    <main className="landlord-dashboard">
      <header className="landlord-header">
        <div>
          <p className="section-kicker">Landlord / flat owner</p>
          <h1>
            Welcome, <em>{name}</em>
          </h1>
          <p className="landlord-sub">
            Publish homes on the map, mark them rented, or take them down.
            Students see your available listings instantly.
          </p>
          {email ? (
            <small className="landlord-email">Signed in as {email}</small>
          ) : null}
        </div>
        <div className="landlord-header-actions">
          <button
            type="button"
            className="primary-button"
            disabled={demoMode}
            title={
              demoMode
                ? "Demo mode — start the map API to publish real listings"
                : undefined
            }
            onClick={() => setShowForm(true)}
          >
            Add a listing
          </button>
          <button type="button" className="outline-button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      {demoMode ? (
        <p className="demo-mode-note">
          <b>Demo mode.</b> You are signed in as the local demo owner and the
          map API is not running, so these listings are the synthetic sample
          pool. Start the backend (and sign in with a real owner account) to
          publish and edit listings for real.
        </p>
      ) : null}

      <div className="owner-panels">
        <OwnerGuide />
        <OwnerVerification
          idVerified={idVerified}
          onIdChange={setIdVerified}
          roomScanned={roomScanned}
          onScanChange={setRoomScanned}
        />
      </div>

      <section className="my-listings">
        <div className="my-listings-head">
          <h2>My listings</h2>
          <span>
            {counts.available} available · {counts.rented} rented ·{" "}
            {listings.length} total
          </span>
        </div>

        {error ? (
          <p className="backend-check-error" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="field-message">Loading your listings…</p>
        ) : listings.length === 0 ? (
          <p className="empty-shortlist">
            You have no listings yet. Click <b>Add a listing</b> to publish your
            first one.
          </p>
        ) : (
          <div className="my-listings-table">
            {listings.map((l) => (
              <article key={l.id} className={`my-listing ${l.status}`}>
                <div>
                  <b>{l.title}</b>
                  <small>
                    {l.district} · {l.bedrooms} bed · {l.bathrooms} bath
                  </small>
                </div>
                <strong>HK${l.price.toLocaleString()}</strong>
                <div className="listing-pills">
                  <span className={`status-pill ${l.status}`}>
                    {STATUS_LABEL[l.status]}
                  </span>
                  <span
                    className={`verify-pill ${idVerified ? "verified" : "unverified"}`}
                    title="Mockup — no document is ever checked; see Get verified"
                  >
                    {idVerified ? (
                      <Icon name="check" size={11} />
                    ) : (
                      <Icon name="lock" size={11} />
                    )}
                    {idVerified ? "Verified owner" : "Unverified"}
                  </span>
                </div>
                <div className="my-listing-actions">
                  {l.status !== "available" && (
                    <button
                      type="button"
                      disabled={busyId === l.id || demoMode}
                      title={
                        demoMode ? "Demo mode — listings are read-only" : undefined
                      }
                      onClick={() =>
                        act(l.id, () => setListingStatus(l.id, "available"))
                      }
                    >
                      Relist
                    </button>
                  )}
                  {l.status === "available" && (
                    <button
                      type="button"
                      disabled={busyId === l.id || demoMode}
                      title={
                        demoMode ? "Demo mode — listings are read-only" : undefined
                      }
                      onClick={() =>
                        act(l.id, () => setListingStatus(l.id, "rented"))
                      }
                    >
                      Mark rented
                    </button>
                  )}
                  {l.status !== "hidden" && (
                    <button
                      type="button"
                      className="danger"
                      disabled={busyId === l.id || demoMode}
                      title={
                        demoMode ? "Demo mode — listings are read-only" : undefined
                      }
                      onClick={() => {
                        if (window.confirm(`Remove “${l.title}” from the map?`))
                          void act(l.id, () => removeListing(l.id))
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <FlatsMapExplorer key={mapVersion} />

      {showForm ? (
        <ListingFormModal
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false)
            void reload()
            setMapVersion((v) => v + 1)
          }}
        />
      ) : null}
    </main>
  )
}
