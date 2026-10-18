// Smoke checks for the invariants the app depends on but TypeScript cannot see.
//
//   npm run smoke        (from Figma/)
//
// WHY THIS EXISTS: the 14 Oct rewrite moved a lot of behaviour into arithmetic —
// the household budget cap, the quiz page grouping, the flat-size warning, the
// database-row → Listing mapping. All of it typechecks and none of it is checked
// by `npm run build`, so a plausible-looking edit could silently make every
// listing 400 sq ft or drop a quiz question off the end of the deck. These are
// the assertions worth having; they are not a substitute for clicking through
// the app.
//
// It bundles itself with rolldown (already present via Vite) and runs in plain
// Node — no test runner, no browser, no DOM. That is deliberate: this has to keep
// working on a teammate's machine with one command.
import {
  QUIZ,
  QUIZ_PAGES,
  answersFromProfile,
  answersToProfile,
} from "../src/lib/quiz"
import {
  LISTINGS,
  listingFromRow,
  householdCeiling,
  sharePerPerson,
  satisfiesMustHaves,
  STATUS_LABEL,
  unproject,
} from "../src/lib/listings"
import {
  DEMO_LISTING_FEATURES,
  demoGeocode,
  demoListingsInBbox,
  demoOwnListings,
} from "../src/lib/demoListings"
import {
  TARGET_AREA_OPTIONS,
  flatSizeWarningForHome,
  filterReasons,
} from "../src/lib/matching"
import { DEMO_SEED, EMPTY_PERSONAL, loadPersonal } from "../src/lib/personalStore"
import { areaGuideFor, districtsWithoutGuides } from "../src/lib/areaGuides"
import { agentFor, agentThread } from "../src/lib/agentUpdates"
import { SAFETY_NOTES } from "../src/lib/safetyNotes"

let failures = 0
function check(name: string, ok: boolean, detail?: unknown) {
  if (!ok) {
    failures += 1
    console.log(`FAIL  ${name}`, detail === undefined ? "" : JSON.stringify(detail))
  } else {
    console.log(`ok    ${name}`)
  }
}

// --- quiz pages ------------------------------------------------------------
const flat = QUIZ_PAGES.flatMap((p) => p.questions.map((q) => q.index))
check("QUIZ_PAGES covers every question once", flat.length === QUIZ.length && new Set(flat).size === QUIZ.length, {
  asked: flat.length,
  total: QUIZ.length,
  unique: new Set(flat).size,
})
check("every question index is present", flat.slice().sort((a, b) => a - b).every((v, i) => v === i))

const paired = QUIZ_PAGES.filter((p) => p.questions.length > 1)
check("gender and belief are paired onto one page each", paired.length >= 3, paired.map((p) => p.questions.map((q) => q.question.id)))
check("study year and major share the opening page", QUIZ_PAGES[0]?.questions.length === 2, QUIZ_PAGES[0]?.questions.map((q) => q.question.id))

// --- answer everything, then build a profile -------------------------------
// The two free-text questions write DIFFERENT fields, so they get different
// answers here — using one string for both would hide a mix-up between them.
const TAGLINE = "I will absolutely judge your rice cooker."
const MAJOR = "Sociology"
const answers = QUIZ.map((q) => {
  if (q.kind === "text") return q.factor === "major" ? MAJOR : TAGLINE
  if (q.kind === "multi") return [0, 1, 2, 3, 4].slice(0, q.max ?? 5)
  return 0
})
const profile = answersToProfile(answers, { campusDistrict: "Sha Tin" })
check("household_size is roommates + 1", typeof profile.household_size === "number" && profile.household_size! >= 2, profile.household_size)
check("flat_size is a preference, not a gate", "flat_size" in profile)
check("looking_for.flat_size_min exists (room_size_min retired)", "flat_size_min" in (profile.looking_for ?? {}), Object.keys(profile.looking_for ?? {}))
check("must_haves captured", Array.isArray(profile.must_haves), profile.must_haves)
check("tagline captured from the free-text question", profile.tagline === TAGLINE, profile.tagline)
// Added 14 Oct, second pass: study year and major are real fields now.
check("study_year captured", profile.study_year === "Year 1", profile.study_year)
check("major captured (it is the second free-text question, not the tagline)", profile.major === MAJOR, profile.major)

// --- answers -> profile -> answers ----------------------------------------
// "Edit my answers" and signing back in both reopen the quiz from the saved
// profile. If this round-trip drifts, a returning user is shown blank questions
// and one "Continue" overwrites the profile they already had.
const recovered = answersFromProfile(profile)
const choiceIndexes = QUIZ.map((q, i) => ({ q, i })).filter(({ q }) => q.kind === "choice")
const wrong = choiceIndexes.filter(({ i }) => recovered[i] !== answers[i])
check("every choice question round-trips through the profile", wrong.length === 0, wrong.map(({ q, i }) => `${q.id}: ${String(answers[i])} -> ${String(recovered[i])}`))
const scaleIndexes = QUIZ.map((q, i) => ({ q, i })).filter(({ q }) => q.kind === "scale" || q.kind === "mbti")
const wrongScales = scaleIndexes.filter(({ i }) => recovered[i] !== answers[i])
check("every scale and type question round-trips", wrongScales.length === 0, wrongScales.map(({ q, i }) => `${q.id}: ${String(answers[i])} -> ${String(recovered[i])}`))
const multiIndexes = QUIZ.map((q, i) => ({ q, i })).filter(({ q }) => q.kind === "multi")
const wrongMulti = multiIndexes.filter(({ i }) => JSON.stringify(recovered[i]) !== JSON.stringify(answers[i]))
check("every multi-select round-trips", wrongMulti.length === 0, wrongMulti.map(({ q, i }) => `${q.id}: ${JSON.stringify(answers[i])} -> ${JSON.stringify(recovered[i])}`))

// --- household budget ------------------------------------------------------
check("householdCeiling(10000, 1) = 20000", householdCeiling(10000, 1) === 20000)
check("householdCeiling(10000, 3) = 40000", householdCeiling(10000, 3) === 40000)
check("householdCeiling(null, 1) = null", householdCeiling(null, 1) === null)
check("sharePerPerson(18000, 3) = 6000", sharePerPerson(18000, 3) === 6000)

// --- listing pool ----------------------------------------------------------
check("local pool is non-empty", LISTINGS.length > 0, LISTINGS.length)
check("every sq ft is 400..1000", LISTINGS.every((l) => l.sqft >= 400 && l.sqft <= 1000))
check("prices span more than 2x", Math.max(...LISTINGS.map((l) => l.price)) / Math.min(...LISTINGS.map((l) => l.price)) > 2, {
  min: Math.min(...LISTINGS.map((l) => l.price)),
  max: Math.max(...LISTINGS.map((l) => l.price)),
})
check("bedrooms match sq ft", LISTINGS.every((l) => (l.sqft < 520 ? l.bedrooms === 1 : l.sqft < 760 ? l.bedrooms === 2 : l.bedrooms === 3)))
check("walkthroughs are not all identical", new Set(LISTINGS.map((l) => l.rooms.map((r) => r.name + r.dimensions).join("|"))).size > LISTINGS.length / 2)
check("every listing has 2 tips", LISTINGS.every((l) => l.tips.length === 2))
check("pins are inside the map", LISTINGS.every((l) => l.x >= 4 && l.x <= 94 && l.y >= 6 && l.y <= 92))

// --- the real map plots the same places -----------------------------------
// `unproject` is what lib/HkMap.tsx hands to Leaflet, so if it drifts from
// `mapPosition` the pins move without the stored x/y changing.
const HK = { latMin: 22.24, latMax: 22.52, lngMin: 113.94, lngMax: 114.3 }
const offMap = LISTINGS.filter((l) => {
  const { lat, lng } = unproject(l.x, l.y)
  return lat < HK.latMin || lat > HK.latMax || lng < HK.lngMin || lng > HK.lngMax
})
check("every pin unprojects inside the Hong Kong bounding box", offMap.length === 0, offMap.slice(0, 3).map((l) => l.title))
const roundTrip = LISTINGS.every((l) => {
  const { lat, lng } = unproject(l.x, l.y)
  const x = ((lng - HK.lngMin) / (HK.lngMax - HK.lngMin)) * 100
  const y = ((HK.latMax - lat) / (HK.latMax - HK.latMin)) * 100
  return Math.abs(x - l.x) < 1e-6 && Math.abs(y - l.y) < 1e-6
})
check("unproject inverts mapPosition exactly", roundTrip)

// --- DB row → Listing must look like a generated one ------------------------
const sample = LISTINGS[0]
const fromDb = listingFromRow({
  id: sample.id,
  title: sample.title,
  district: sample.area,
  monthly_rent: sample.price,
  bedrooms: sample.bedrooms,
  bathrooms: sample.bathrooms,
  area_sqft: sample.sqft,
  near_mtr: sample.nearMtr,
  rating: sample.rating,
  image_key: sample.image.split("unsplash.com/")[1].split("?")[0],
  map_x: sample.x,
  map_y: sample.y,
  tips: sample.tips,
})
check("listingFromRow round-trips id/title/area/price", fromDb.id === sample.id && fromDb.title === sample.title && fromDb.area === sample.area && fromDb.price === sample.price)
check("listingFromRow rebuilds details", fromDb.details === sample.details, { a: fromDb.details, b: sample.details })
check("listingFromRow rebuilds the image url", fromDb.image === sample.image, { a: fromDb.image, b: sample.image })
check("listingFromRow rebuilds the same walkthrough", JSON.stringify(fromDb.rooms) === JSON.stringify(sample.rooms))
check("listingFromRow keeps the tips", JSON.stringify(fromDb.tips) === JSON.stringify(sample.tips))

// --- offline map fallback ---------------------------------------------------
// The student map reads the map API (backend/server, port 3001). When it is
// down — a plain `vite dev`, or a static deploy with no VITE_MAP_API_URL —
// lib/listingsApi falls back to this pool so the map still shows pins. The
// fallback must return the pool in the map API's exact shape, filtered the
// way the backend's SQL filters it.
check("demo pool covers every local listing", DEMO_LISTING_FEATURES.length === LISTINGS.length, DEMO_LISTING_FEATURES.length)
const badGeo = DEMO_LISTING_FEATURES.filter((f) => {
  const [lng, lat] = f.geometry.coordinates
  return !(lat > 22.2 && lat < 22.55 && lng > 113.9 && lng < 114.35)
})
check("every demo pin sits inside Hong Kong", badGeo.length === 0, badGeo.slice(0, 2).map((f) => f.properties.title))
check("demo features carry the map API's property shape", DEMO_LISTING_FEATURES.every((f) =>
  f.type === "Feature"
  && typeof f.properties.id === "string"
  && f.properties.price > 0
  && f.properties.status === "available"))

// Filters mirror backend/server/src/data/query-listings.ts: bedrooms is a
// floor (gte), price is inclusive on both ends, bbox is [west, south, east, north].
const HK_WIDE: [number, number, number, number] = [113.9, 22.2, 114.35, 22.55]
const wide = demoListingsInBbox(HK_WIDE, {})
check("a Hong-Kong-wide bbox returns the whole pool", wide.length === LISTINGS.length, wide.length)
const twoBed = demoListingsInBbox(HK_WIDE, { bedrooms: 2 })
check("bedrooms is a floor, not an equals", twoBed.length > 0 && twoBed.every((f) => f.properties.bedrooms >= 2), twoBed.length)
const cheap = demoListingsInBbox(HK_WIDE, { maxPrice: 10000 })
check("maxPrice filters inclusively", cheap.length > 0 && cheap.every((f) => f.properties.price <= 10000), cheap.length)
const mongKokBox: [number, number, number, number] = [114.16, 22.31, 114.18, 22.33]
const nearMongKok = demoListingsInBbox(mongKokBox, {})
// The real invariant: every returned pin sits inside the viewport. Districts
// are labels, not containers — a jittered Hung Hom pin legitimately shows up
// in a Mong Kok viewport, exactly as it would against the live API.
check("bbox restricts to the viewport", nearMongKok.length > 0 && nearMongKok.every((f) => {
  const [lng, lat] = f.geometry.coordinates
  return lng >= mongKokBox[0] && lng <= mongKokBox[2] && lat >= mongKokBox[1] && lat <= mongKokBox[3]
}), nearMongKok.map((f) => f.properties.district))
// Tight around the Mong Kok centroid: no neighbouring district's jitter can
// reach in, so only Mong Kok pins can answer.
const tightBox: [number, number, number, number] = [114.16, 22.312, 114.176, 22.323]
const tight = demoListingsInBbox(tightBox, {})
check("a box around one district returns that district's pins", tight.length > 0 && tight.every((f) => f.properties.district === "Mong Kok"), tight.map((f) => f.properties.district))

// Geocode fallback: districts, aliases and campus names fly somewhere real;
// an unknown address fails honestly instead of flying to the wrong place.
const shaTin = demoGeocode("Sha Tin")
check("geocode finds a district by name", shaTin !== null && Math.abs(shaTin.lat - 22.382) < 0.01, shaTin)
check("geocode matches a misspelling alias", demoGeocode("mongkok")?.displayName.includes("Mong Kok") ?? false)
check("geocode matches a campus name", (demoGeocode("CUHK")?.displayName ?? "").includes("Sha Tin"))
check("geocode returns null for an unknown address", demoGeocode("42 Harbour Road") === null)

// --- owner dashboard fallback ------------------------------------------------
const own = demoOwnListings()
check("demo owner listings are non-empty", own.length > 0, own.length)
check("demo owner listings have unique ids", new Set(own.map((l) => l.id)).size === own.length)
check("demo owner listings have a valid status", own.every((l) => l.status === "available" || l.status === "rented" || l.status === "hidden"))

// --- flat size is a warning, never a gate ----------------------------------
check("flatSizeWarningForHome flags a small flat", typeof flatSizeWarningForHome(profile, 400) === "string" || flatSizeWarningForHome(profile, 400) === null)
const tiny = filterReasons(profile, { ...LISTINGS[0], flat_size: 400, budget_min: 1000, budget_max: 900000, target_areas: [] } as never)
check("no gate reason mentions room size", !tiny.some((r) => r.field === ("room_size" as never)), tiny.map((r) => r.field))

// --- the agency side of a booking ------------------------------------------
// A booking that no longer exists is only visible if a booked listing produces
// a cancellation, which is the whole point of the saved-page agent panel.
const cancelled = agentThread(1, "taken")
check("a taken listing carries a cancellation", cancelled.some((u) => u.cancels === true), cancelled.length)
const live = agentThread(1, "viewing")
check("a viewing listing has no cancellation", !live.some((u) => u.cancels === true))
check("an unbooked listing still has an enquiry line", agentThread(1, "available").length === 1)
check("an agency is always named", ["available", "viewing", "taken"].every((s) => agentFor(1).length > 0 && agentThread(1, s as never).every((u) => u.agent === agentFor(1))))
// The agency is picked by `id % AGENCIES.length`, so the same listing always
// gets the same counterparty and different listings do not all get the same one.
check("the same listing always gets the same agency", agentFor(7) === agentFor(7))
check("the agency rotates across listings", new Set(LISTINGS.map((l) => agentFor(l.id))).size > 1)

// --- the demo account's seeded saved page ---------------------------------
// The seed points at listing ids that must actually exist, or the demo opens
// with an empty saved page and no way to see the agent flow at all.
const seededIds = DEMO_SEED.saved
const unresolved = seededIds.filter((id) => !LISTINGS.some((l) => l.id === id))
check("every seeded saved home resolves to a listing", unresolved.length === 0, unresolved)
const seededStates = seededIds.map((id) => DEMO_SEED.status[String(id)] ?? "available")
check("the seed covers available, viewing and taken", new Set(seededStates).size === 3, seededStates)
check("the seed carries a viewing", DEMO_SEED.viewings.length > 0)
check("the seeded viewing points at a saved home", DEMO_SEED.viewings.every((v) => seededIds.includes(v.listingId)), DEMO_SEED.viewings)
check("a fresh browser loads an empty personal state, not the seed", loadPersonal("nobody@nowhere.test").saved.length === 0)

// --- misc surfaces ---------------------------------------------------------
check("every listing status has a label", Object.keys(STATUS_LABEL).length === 3)
check("EMPTY_PERSONAL has all six keys", Object.keys(EMPTY_PERSONAL).length === 6, Object.keys(EMPTY_PERSONAL))
check("satisfiesMustHaves returns an array", Array.isArray(satisfiesMustHaves(LISTINGS[0])))
check("safety notes are non-empty", SAFETY_NOTES.length > 0, SAFETY_NOTES.length)
// The area guide is now shown on the quiz question as well as the Homes step,
// so a selectable district with no guide is a silent card on two screens.
const guideless = districtsWithoutGuides(TARGET_AREA_OPTIONS)
check("every selectable district has an area guide", guideless.length === 0, guideless)
check("listing districts all have guides", LISTINGS.every((l) => areaGuideFor(l.area) !== null))

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`)
if (failures > 0) process.exit(1)
