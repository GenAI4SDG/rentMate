import './App.css'

/**
 * RentMate — app shell.
 *
 * Placeholder until P2 wires in the router. Deliberately minimal: it exists to
 * give `src/main.tsx` a default export and keep `npm run typecheck` green.
 *
 * Routes to add (see docs/build-plans.md):
 *   /             -> SignIn           (F1)
 *   /verify       -> VerifyStudent    (F1)
 *   /quiz         -> QuizOnboarding   (F2)
 *   /matches      -> Matches          (F3)
 *   /listings     -> Listings         (F4)
 *   /listings/:id -> ListingDetail    (F4)
 */
function App() {
  return (
    <main className="app-shell">
      <h1>RentMate</h1>
      <p>Verified trust infrastructure for student housing in Hong Kong.</p>
      <p className="app-shell__note">
        App shell only — routing is wired up in <code>src/pages/</code>.
      </p>
    </main>
  )
}

export default App
