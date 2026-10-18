import { useRef, useState } from "react"
import Icon from "./ui/Icon"
import MockupBadge from "./ui/MockupBadge"

/**
 * "Get verified" — ID check + phone-camera room scan + listing validity.
 *
 * ⚠️ THE WHOLE PANEL IS A MOCKUP. No document is uploaded (the file input is
 * read locally and forgotten), no camera is ever opened (there is no
 * getUserMedia call anywhere — a real permission prompt in a demo is worse
 * than none), and nothing here persists: reload and you are back to
 * unverified. The dashboard passes the two flags down so the listing table
 * can show the same mock state.
 *
 * What is real on this page: sign-in (Supabase Auth or the local demo owner),
 * publishing, and status changes. Everything behind this panel's dashed
 * borders is a prop for the judging demo.
 */

type Props = {
  idVerified: boolean
  /** Report the mock ID outcome with an explicit value — never a toggle. */
  onIdChange: (verified: boolean) => void
  roomScanned: boolean
  onScanChange: (scanned: boolean) => void
}

const MOCK_ID_RESULTS = [
  "Document type detected: HKID (mock)",
  "Legibility and glare check: pass (mock)",
  "Name match against your account: pending manual review (mock)",
]

const SCAN_ROOMS = ["Living room", "Kitchen", "Bedroom"]

export default function OwnerVerification({
  idVerified,
  onIdChange,
  roomScanned,
  onScanChange,
}: Props) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [captured, setCaptured] = useState(0)
  const [lastConfirmed, setLastConfirmed] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function pickFile(file: File | undefined) {
    if (!file) return
    setFileName(file.name)
    setFileSize(`${Math.max(1, Math.round(file.size / 1024))} KB`)
  }

  function runIdCheck() {
    setChecking(true)
    // A short delay so the mock check reads as work happening. Nothing is
    // sent anywhere; the timer only flips local state.
    window.setTimeout(() => {
      setChecking(false)
      onIdChange(true)
    }, 700)
  }

  function startScan() {
    setScanning(true)
    setCaptured(0)
  }

  function captureFrame() {
    const next = captured + 1
    setCaptured(next)
    if (next >= SCAN_ROOMS.length) {
      setScanning(false)
      onScanChange(true)
    }
  }

  return (
    <section className="owner-panel owner-verify">
      <header className="owner-panel-head">
        <div>
          <p className="section-kicker">Trust</p>
          <h2>Get verified</h2>
        </div>
        <MockupBadge />
      </header>
      <p className="owner-panel-note">
        Verified owners get a badge students can see. This panel is a
        <b> mockup</b>: no document is uploaded, no camera is opened, and
        nothing is stored — reload and it resets.
      </p>

      <ol className="verify-steps">
        <li className={idVerified ? "done" : ""}>
          <span className="verify-step-dot">
            {idVerified ? <Icon name="check" size={12} /> : "1"}
          </span>
          <div>
            <b>Identity document</b>
            <small>
              {idVerified ? "Checked (mock)" : "HKID or passport + proof you own the flat"}
            </small>
          </div>
        </li>
        <li className={roomScanned ? "done" : ""}>
          <span className="verify-step-dot">
            {roomScanned ? <Icon name="check" size={12} /> : "2"}
          </span>
          <div>
            <b>Room scan</b>
            <small>
              {roomScanned ? "3 rooms captured (mock)" : "Walk the flat with your phone camera"}
            </small>
          </div>
        </li>
        <li className={idVerified && roomScanned ? "done" : ""}>
          <span className="verify-step-dot">
            {idVerified && roomScanned ? (
              <Icon name="check" size={12} />
            ) : (
              "3"
            )}
          </span>
          <div>
            <b>Badge on your listings</b>
            <small>
              {idVerified && roomScanned
                ? "Verified badge shown to students (mock)"
                : "Shown once both steps are done"}
            </small>
          </div>
        </li>
      </ol>

      <div className="verify-block">
        <h3>
          <Icon name="lock" size={14} /> ID verification
        </h3>
        {idVerified ? (
          <div className="mock-result">
            <p className="mock-result-head">
              <b>Document checked</b> <MockupBadge label="Simulated" />
            </p>
            <ul>
              {MOCK_ID_RESULTS.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <button
              type="button"
              className="outline-button"
              onClick={() => {
                setFileName(null)
                setFileSize(null)
                if (fileRef.current) fileRef.current.value = ""
                onIdChange(false)
              }}
            >
              Reset mock check
            </button>
          </div>
        ) : (
          <>
            <label className="id-dropzone">
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
              <Icon name="user" size={22} />
              <b>{fileName ?? "Add your HKID or passport"}</b>
              <small>
                {fileName
                  ? `${fileSize} · stays in your browser — nothing is uploaded`
                  : "Photo or PDF · JPG, PNG, PDF"}
              </small>
            </label>
            <button
              type="button"
              className="primary-button"
              disabled={!fileName || checking}
              onClick={runIdCheck}
            >
              {checking ? "Checking…" : "Run mock check"}
            </button>
          </>
        )}
      </div>

      <div className="verify-block">
        <h3>
          <Icon name="video" size={14} /> Scan the room with your phone
        </h3>
        {roomScanned ? (
          <div className="mock-result">
            <p className="mock-result-head">
              <b>Scan complete</b> <MockupBadge label="Simulated" />
            </p>
            <ul>
              <li>3 rooms captured: {SCAN_ROOMS.join(", ")}</li>
              <li>Estimated area from the scan: 214 sq ft (mock)</li>
              <li>Lighting and blind spots: good (mock)</li>
            </ul>
            <button
              type="button"
              className="outline-button"
              onClick={() => {
                setCaptured(0)
                onScanChange(false)
              }}
            >
              Reset mock scan
            </button>
          </div>
        ) : scanning ? (
          <div className="scan-stage">
            <div className="scan-viewfinder" aria-hidden="true">
              <span className="scan-corner tl" />
              <span className="scan-corner tr" />
              <span className="scan-corner bl" />
              <span className="scan-corner br" />
              <span className="scan-line" />
              <span className="scan-room-label">
                {SCAN_ROOMS[Math.min(captured, SCAN_ROOMS.length - 1)]}
              </span>
            </div>
            <p className="scan-hint">
              Frame {captured + 1} of {SCAN_ROOMS.length} — stand in the doorway
              and sweep slowly. (Mock camera: nothing is recorded.)
            </p>
            <button type="button" className="primary-button" onClick={captureFrame}>
              <Icon name="video" size={16} /> Capture this frame
            </button>
          </div>
        ) : (
          <button type="button" className="outline-button" onClick={startScan}>
            <Icon name="video" size={16} /> Start camera scan
          </button>
        )}
      </div>

      <div className="verify-block">
        <h3>
          <Icon name="check" size={14} /> Listing validity
        </h3>
        <p className="verify-note">
          Today a listing stays on the map until you mark it rented or remove
          it — nothing expires. Periodic re-confirmation is a planned feature;
          the button below is what it would feel like.
        </p>
        <div className="validity-row">
          <span>
            {lastConfirmed
              ? `Last confirmed ${lastConfirmed}`
              : "Never confirmed"}
          </span>
          <button
            type="button"
            className="outline-button"
            onClick={() => setLastConfirmed("just now (mock)")}
          >
            Confirm my listings are still accurate
          </button>
        </div>
      </div>
    </section>
  )
}
