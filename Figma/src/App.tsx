import { useState } from "react"
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom"
import {
  clearDemoSession,
  getStoredEmail,
  getUserRole,
  isOnboarded,
  setOnboardedComplete,
  setQuizAnswers,
  setStoredEmail,
  setUserRole,
} from "./lib/demo-session"
import Home from "./pages/Home"
import Verify from "./pages/Verify"
import Quiz from "./pages/Quiz"
import Matches from "./pages/Matches"
import LandlordEntry from "./components/LandlordEntry"
import LandlordDashboard from "./components/LandlordDashboard"
import type { Screen } from "./appData"

function resolveScreenAfterStart(): Screen {
  const stored = getStoredEmail()
  if (stored && isOnboarded()) return "matches"
  if (stored) return "quiz"
  return "verify"
}

// Landing route. Preserves the original boot behaviour: a returning user with a
// stored session skips the landing page and lands on their last screen.
function HomeRoute({
  onStartTenant,
  onStartLandlord,
}: {
  onStartTenant: () => void
  onStartLandlord: () => void
}) {
  if (getStoredEmail() && isOnboarded() && getUserRole() === "landlord") {
    return <Navigate to="/landlord-dashboard" replace />
  }
  if (getStoredEmail() && isOnboarded()) {
    return <Navigate to="/matches" replace />
  }
  return <Home onStartTenant={onStartTenant} onStartLandlord={onStartLandlord} />
}

function AppRoutes() {
  const navigate = useNavigate()
  const [email, setEmail] = useState(() => getStoredEmail())

  function beginMatchingFlow() {
    setUserRole("tenant")
    const stored = getStoredEmail()
    setEmail(stored)
    navigate(`/${resolveScreenAfterStart()}`)
  }

  function beginLandlordFlow() {
    if (getUserRole() === "landlord" && isOnboarded()) {
      navigate("/landlord-dashboard")
      return
    }
    navigate("/landlord-entry")
  }

  function onLandlordComplete() {
    navigate("/landlord-dashboard")
  }

  function onVerified(value: string) {
    setUserRole("tenant")
    setStoredEmail(value)
    setEmail(value)
    navigate("/quiz")
  }

  function onQuizComplete(answers: number[]) {
    setQuizAnswers(answers)
    setOnboardedComplete()
    navigate("/matches")
  }

  function onSignOut() {
    clearDemoSession()
    setEmail("")
    navigate("/verify")
  }

  function onLandlordSignOut() {
    clearDemoSession()
    setEmail("")
    navigate("/")
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomeRoute
            onStartTenant={beginMatchingFlow}
            onStartLandlord={beginLandlordFlow}
          />
        }
      />
      <Route
        path="/verify"
        element={
          <Verify
            initialEmail={email}
            onBack={() => navigate("/")}
            onClearStoredEmail={() => setEmail("")}
            onVerified={onVerified}
          />
        }
      />
      <Route
        path="/quiz"
        element={
          <Quiz onBack={() => navigate("/verify")} onComplete={onQuizComplete} />
        }
      />
      <Route
        path="/matches"
        element={
          <Matches email={email || getStoredEmail()} onSignOut={onSignOut} />
        }
      />
      <Route
        path="/landlord-entry"
        element={
          <LandlordEntry
            onBack={() => navigate("/")}
            onComplete={onLandlordComplete}
          />
        }
      />
      <Route
        path="/landlord-dashboard"
        element={<LandlordDashboard onSignOut={onLandlordSignOut} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
