// Housing data — SYNTHETIC, with real district context.
//
// THE FINDING: there is no public per-listing rental API for Hong Kong. What the
// open data actually offers is AGGREGATE statistics, not individual flats:
//   - data.gov.hk  → datasets from the Rating & Valuation Department (R&VD) and
//     the Hong Kong Housing Society: property-market statistics, average rents by
//     district/class, estate/project lists (JSON). No per-listing feed.
//   - 28Hse / Centadata / Spacious → commercial portals; they *consume* the R&VD
//     statistics, and expose no public API.
// So listings must be synthesised. This file does that, and anchors the price
// context on a district-average table so the demo can honestly say "this flat is
// ~X% under the district average" instead of inventing a comparison.
//
// ⚠️ The district figures below are ILLUSTRATIVE placeholders in the shape of
// R&VD's published averages. They must be replaced with the current published
// numbers (R&VD Property Review / data.gov.hk) before any slide cites them.
//
// TRAVEL TIME, NOT DISTANCE. The pool used to carry a hard-coded "N min to
// campus" string per listing, which was wrong twice over: it ignored which
// campus you attend, and it read like a distance. Travel time is now derived
// per-campus from `commuteMinutes()` in lib/matching.ts. What Hong Kong actually
// publishes is stop-level ETA (MTR open data at opendata.mtr.com.hk; bus and
// minibus ETA via data.etabus.gov.hk / data.gov.hk) — none of it is door-to-door
// routing, so a true journey time still needs a routing API or the station
// graph. Until then every travel figure on screen stays labelled an estimate.

export type ListingStatus = "available" | "viewing" | "taken"

export type RoomView = {
  name: string
  dimensions: string
  areaSqm: number
  image: string
}

export type Listing = {
  id: number
  title: string
  area: string
  /** Whole-flat monthly rent, HKD. The number every filter works on. */
  price: number
  priceLabel: string
  mapPrice: string
  details: string
  bedrooms: number
  bathrooms: number
  /** Whole-flat size, sq ft. Room sizes are not modelled. */
  sqft: number
  image: string
  /** Map position, projected from the real district coordinates. */
  x: number
  y: number
  rating: string
  nearMtr: boolean
  /** The walkthrough rooms for THIS flat. Not shared between listings. */
  rooms: RoomView[]
  /** Pre-written "AI" comments shown while you scan. Badged AI · demo in the UI. */
  tips: string[]
  /** Always true here — every listing in this file is synthesised. */
  synthetic: true
}

/** Illustrative average monthly rent for a room share, by district (HKD). */
export const DISTRICT_AVERAGE_RENT: Record<string, number> = {
  "Sha Tin": 7500,
  "Kennedy Town": 9200,
  "Kowloon Tong": 8400,
  "Tai Wai": 7100,
  "Hung Hom": 7800,
  "Sai Ying Pun": 9500,
  "Tai Po": 6300,
  "Tseung Kwan O": 6900,
  "Mong Kok": 8200,
  "Tuen Mun": 5900,
  "Ma On Shan": 6700,
  "Fo Tan": 6800,
  "Ho Man Tin": 8100,
  "Yau Ma Tei": 7900,
  "Sham Shui Po": 7000,
  "Wan Chai": 9300,
  "North Point": 8800,
}

/** Districts this demo generates flats in. A subset of TARGET_AREA_OPTIONS. */
export const LISTING_DISTRICTS = [
  "Sha Tin",
  "Tai Wai",
  "Kowloon Tong",
  "Hung Hom",
  "Mong Kok",
  "Tai Po",
  "Tseung Kwan O",
  "Tuen Mun",
  "Kennedy Town",
  "Sai Ying Pun",
  "Sham Shui Po",
  "Ma On Shan",
] as const

// Real district centroids, so the map pins sit where the district actually is.
// Mirrors DISTRICT_COORDS in lib/matching.ts by hand — that file is deliberately
// dependency-free so the oracle check can import it directly.
// Exported so the offline geocode fallback (lib/demoListings.ts) can fly to a
// district without a second copy of these coordinates.
export const DISTRICT_CENTROIDS: Record<string, [number, number]> = {
  "Sha Tin": [22.382, 114.188],
  "Tai Wai": [22.373, 114.179],
  "Ma On Shan": [22.4247, 114.231],
  "Fo Tan": [22.395, 114.192],
  "Kowloon Tong": [22.337, 114.176],
  "Ho Man Tin": [22.3095, 114.1825],
  "Hung Hom": [22.305, 114.182],
  "Mong Kok": [22.319, 114.169],
  "Yau Ma Tei": [22.3126, 114.1703],
  "Sham Shui Po": [22.3302, 114.1622],
  "Sai Ying Pun": [22.286, 114.142],
  "Kennedy Town": [22.282, 114.128],
  "Wan Chai": [22.2775, 114.1731],
  "North Point": [22.291, 114.2003],
  "Tai Po": [22.45, 114.168],
  "Tseung Kwan O": [22.308, 114.26],
  "Tuen Mun": [22.391, 113.977],
}

// The map canvas these percentages are projected onto.
const MAP_BOUNDS = { latMin: 22.24, latMax: 22.52, lngMin: 113.94, lngMax: 114.3 }

function mapPosition(district: string): { x: number; y: number } {
  const coords = DISTRICT_CENTROIDS[district]
  if (!coords) return { x: 50, y: 50 }
  const [lat, lng] = coords
  return {
    x: ((lng - MAP_BOUNDS.lngMin) / (MAP_BOUNDS.lngMax - MAP_BOUNDS.lngMin)) * 100,
    y: ((MAP_BOUNDS.latMax - lat) / (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin)) * 100,
  }
}

/**
 * The inverse of `mapPosition`: the percentage canvas back to real coordinates.
 *
 * This exists so the real map (lib/HkMap.tsx) can plot a listing without a
 * second copy of its position. `x`/`y` remain the single source of truth for
 * where a flat is — they are what the database stores (`map_x`, `map_y`), so
 * the connected pool and the built-in pool stay in the same place on screen,
 * and there is no lat/lng column to drift away from them.
 *
 * ACCURACY, stated plainly: the result is the DISTRICT centroid plus whatever
 * jitter `x`/`y` carry — a synthetic listing has no street address, so the pin
 * is district-accurate and not building-accurate. The map says so.
 */
export function unproject(x: number, y: number): { lat: number; lng: number } {
  return {
    lng: MAP_BOUNDS.lngMin + (x / 100) * (MAP_BOUNDS.lngMax - MAP_BOUNDS.lngMin),
    lat: MAP_BOUNDS.latMax - (y / 100) * (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin),
  }
}

const SQFT_PER_SQM = 0.092903

const FLAT_ADJECTIVES = [
  "Sunlit", "Quiet", "Warm", "Renovated", "Bright", "Calm", "Modern",
  "High-floor", "Cosy", "Airy", "Minimal", "Freshly updated", "Practical",
  "Peaceful", "Sunny", "Furnished", "Value", "Move-in ready", "Comfortable",
  "Open-plan", "Corner", "Garden-facing",
]

const FLAT_TYPES = [
  "two-bedroom near MTR",
  "flat with harbour light",
  "compact student home",
  "walk-up by the park",
  "two-bedroom with study nook",
  "flat near campus",
  "home above the market",
  "flat with open kitchen",
  "home with city view",
  "two-bedroom on a quiet lane",
  "flat beside the station",
  "home with separate bedrooms",
]

const FLAT_IMAGES = [
  "photo-1738168246881-40f35f8aba0a",
  "photo-1668566398322-6bbc9be03736",
  "photo-1556593825-c11de986cb0b",
  "photo-1761123141836-3b3221dac3e5",
  "photo-1779785689520-bf24ef13aa71",
  "photo-1774311237295-a65a4c1ff38a",
  "photo-1759691555010-7f3f8674d2f2",
  "photo-1502672260266-1c1ef2d93688",
  "photo-1522708323590-d24dbb6b0267",
]

const ROOM_IMAGES = [
  "photo-1631049035227-57752420e957",
  "photo-1779785689520-bf24ef13aa71",
  "photo-1791138961286-a9f5845171e4",
  "photo-1762811003338-aef30274513b",
  "photo-1560448204-e02f11c3d0e2",
  "photo-1584622650111-993a426fbf0a",
]

// Pre-written "AI" commentary. In production these come from a model reading the
// listing and the area; here they are fixed strings, and the UI badges every one
// of them. Two per listing, chosen deterministically.
const AI_TIPS = [
  "The photos show a window in every bedroom — rare at this size in this district.",
  "Two minutes further from the station than the listing suggests; check the walk at night.",
  "Priced just under the district average for this size. Worth a viewing this week.",
  "Listed three weeks ago. In this district that usually means the price is negotiable.",
  "Ground-floor unit — ask about damp, and about the window locks specifically.",
  "Split across two bedrooms this lands near your budget. Across three, it does not.",
  "The building has a lift. Many walk-ups here do not, and that matters with luggage.",
  "Kitchen looks recently redone; the bathroom looks original.",
  "Short journey on paper, but the last stretch is uphill. Consider it in August.",
  "No agency fee listed — which is the whole point. Get that in writing before you view.",
  "Bedroom sizes are unequal. Agree who takes which before anyone signs anything.",
  "Ask whether the quoted rent covers management fees and rates. Often it does not.",
  "Close to a wet market: lively mornings, cheap afternoons.",
  "Older than the photos imply. Check the water pressure and how the windows close.",
  "Several units in this block listed last month — high turnover, ask why.",
  "The study nook is a converted balcony. Fine for a desk, not for a bed.",
  "Furnished — but check what 'furnished' means here before you plan the move.",
  "Good afternoon light. Worth seeing at the hour you'd actually be home.",
  "Air-conditioning units look new; the plumbing is untested in these photos.",
  "Two bathrooms for three bedrooms — the morning queue is real.",
  "Near a major road. Visit at rush hour before you commit.",
  "Two months' deposit requested. Standard here, but budget for it.",
]

function pick<T>(pool: T[], seed: number, count: number): T[] {
  const out: T[] = []
  for (let i = 0; i < count; i += 1) {
    out.push(pool[(seed * (i + 3) + i * 7) % pool.length])
  }
  return out
}

/**
 * The rooms for one flat — derived from its own size and layout, so no two
 * listings share a walkthrough. Areas are a fixed split of the flat's real
 * square footage; the images are stock photos, which is why every view keeps
 * the "illustrative mock" caption.
 */
function roomsFor(sqft: number, bedrooms: number, seed: number): RoomView[] {
  const totalSqm = Math.round(sqft * SQFT_PER_SQM * 10) / 10
  const shares: Array<[string, number]> =
    bedrooms >= 3
      ? [
          ["Living room", 0.34],
          ["Main bedroom", 0.2],
          ["Second bedroom", 0.16],
          ["Third bedroom", 0.13],
          ["Kitchen", 0.11],
          ["Bathroom", 0.06],
        ]
      : bedrooms === 2
        ? [
            ["Living room", 0.4],
            ["Main bedroom", 0.24],
            ["Second bedroom", 0.19],
            ["Kitchen", 0.12],
            ["Bathroom", 0.05],
          ]
        : [
            ["Living room", 0.46],
            ["Bedroom", 0.34],
            ["Kitchen", 0.15],
            ["Bathroom", 0.05],
          ]
  return shares.map(([name, share], index) => {
    const areaSqm = Math.round(totalSqm * share * 10) / 10
    // Back out plausible wall dimensions from the area, ~1.25 aspect ratio.
    const short = Math.sqrt(areaSqm / 1.25)
    const long = areaSqm / short
    return {
      name,
      dimensions: `${long.toFixed(1)} × ${short.toFixed(1)} m`,
      areaSqm,
      image: `https://images.unsplash.com/${
        ROOM_IMAGES[(seed + index * 3) % ROOM_IMAGES.length]
      }?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=88&w=1500`,
    }
  })
}

const CHEAPEST_DISTRICT = Math.min(...Object.values(DISTRICT_AVERAGE_RENT))
const DEAREST_DISTRICT = Math.max(...Object.values(DISTRICT_AVERAGE_RENT))

/** How many flats this demo generates. */
export const LISTING_COUNT = 72

export const LISTINGS: Listing[] = Array.from(
  { length: LISTING_COUNT },
  (_, index) => {
    const area = LISTING_DISTRICTS[index % LISTING_DISTRICTS.length]
    const adjective = FLAT_ADJECTIVES[index % FLAT_ADJECTIVES.length]
    const type = FLAT_TYPES[(index * 5) % FLAT_TYPES.length]

    // 400–1000 sq ft — the whole flat, not the room. Owner's call, 14 Oct:
    // "yes, 400-1000 for the whole flat; it's also easiest to grab from a
    // listing if we had data."
    const sqft = 400 + ((index * 137) % 601)

    // Rent per sq ft, nudged by how expensive the district is. 22–36 HKD/sq ft
    // puts the pool around $8.8k–$36k — wide enough that a household budget
    // ceiling actually filters something instead of returning everything.
    const districtPremium =
      ((DISTRICT_AVERAGE_RENT[area] ?? CHEAPEST_DISTRICT) - CHEAPEST_DISTRICT) /
      (DEAREST_DISTRICT - CHEAPEST_DISTRICT || 1)
    const perSqft = 22 + districtPremium * 10 + (index % 5) * 0.8
    const price = Math.round((sqft * perSqft) / 100) * 100

    const bedrooms = sqft < 520 ? 1 : sqft < 760 ? 2 : 3
    const bathrooms = bedrooms >= 3 ? 2 : 1
    const position = mapPosition(area)
    const jitter = ((index * 11) % 5) - 2

    return {
      id: index + 1,
      title: `${adjective} ${type}`,
      area,
      price,
      priceLabel: `$${price.toLocaleString("en-US")}`,
      mapPrice: `${(price / 1000).toFixed(1)}k`,
      details: `${bedrooms} bed${bedrooms > 1 ? "s" : ""} · ${bathrooms} bath · ${sqft} sq ft`,
      bedrooms,
      bathrooms,
      sqft,
      image: `https://images.unsplash.com/${
        FLAT_IMAGES[index % FLAT_IMAGES.length]
      }?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900&h=620`,
      x: Math.max(4, Math.min(94, position.x + jitter)),
      y: Math.max(6, Math.min(92, position.y + jitter)),
      rating: (4.4 + ((index * 3) % 6) / 10).toFixed(1),
      nearMtr: (index * 7) % 10 < 7,
      rooms: roomsFor(sqft, bedrooms, index),
      tips: pick(AI_TIPS, index + 1, 2),
      synthetic: true,
    } satisfies Listing
  },
)

/**
 * The most a household can pay: your ceiling multiplied by everyone moving in.
 * Owner's call, 14 Oct — "budget x(n+1)". `roommates` counts the OTHER people,
 * so one roommate means two incomes and the household is `roommates + 1`.
 */
export function householdCeiling(
  budgetMax: number | null | undefined,
  roommates: number | null | undefined,
): number | null {
  if (budgetMax === null || budgetMax === undefined) return null
  const people = Math.max(1, (roommates ?? 1) + 1)
  return budgetMax * people
}

/** What one person pays when the whole-flat rent is split `people` ways. */
export function sharePerPerson(price: number, people: number): number {
  return Math.round(price / Math.max(1, people))
}

/**
 * A row from `public.demo_listings` (backend/supabase/migrations/
 * 20261014150000_rentmate_homes.sql), in the shape Postgres returns it.
 *
 * The database is the POOL; this file is the SHAPE. Keeping `rooms` out of the
 * table and deriving it here is deliberate — the room split is arithmetic over
 * `area_sqft` and `bedrooms`, and a second copy of that arithmetic in SQL is how
 * the offline fallback and the connected pool start disagreeing.
 */
export type ListingRow = {
  id: number
  title: string
  district: string
  monthly_rent: number
  bedrooms: number
  bathrooms: number
  area_sqft: number
  near_mtr: boolean
  rating: number | string
  image_key: string
  map_x: number | string
  map_y: number | string
  tips: string[] | null
}

const FLAT_IMAGE_URL = (key: string) =>
  `https://images.unsplash.com/${key}?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900&h=620`

/**
 * Turn a database row into the same `Listing` the local generator produces.
 *
 * The two are interchangeable on purpose: `demo_listings` is seeded from the
 * same formulas, so row #1 in Postgres and row #1 in `LISTINGS` describe the
 * same flat. Nothing downstream needs to know which one it got.
 */
export function listingFromRow(row: ListingRow): Listing {
  const sqft = row.area_sqft
  const bedrooms = row.bedrooms
  const bathrooms = row.bathrooms
  const price = row.monthly_rent
  // Seeded on the id, exactly as the local generator seeds on the index, so the
  // room photos for a given flat do not change when it arrives from the server.
  const seed = row.id - 1
  return {
    id: row.id,
    title: row.title,
    area: row.district,
    price,
    priceLabel: `$${price.toLocaleString("en-US")}`,
    mapPrice: `${(price / 1000).toFixed(1)}k`,
    details: `${bedrooms} bed${bedrooms > 1 ? "s" : ""} · ${bathrooms} bath · ${sqft} sq ft`,
    bedrooms,
    bathrooms,
    sqft,
    image: FLAT_IMAGE_URL(row.image_key),
    x: Number(row.map_x),
    y: Number(row.map_y),
    rating: Number(row.rating).toFixed(1),
    nearMtr: row.near_mtr,
    rooms: roomsFor(sqft, bedrooms, seed),
    tips: row.tips ?? [],
    synthetic: true,
  }
}

/**
 * How a listing's rent compares to its district average. Returns a human string
 * plus a signed percentage, or null when the district has no figure on file —
 * "Not provided" beats a fabricated comparison.
 */
export function priceContext(
  area: string,
  price: number,
): { label: string; deltaPct: number } | null {
  const avg = DISTRICT_AVERAGE_RENT[area]
  if (!avg) return null
  if (!price) return null
  const deltaPct = Math.round(((price - avg) / avg) * 100)
  const dir = deltaPct > 0 ? "above" : "below"
  return {
    label: `${Math.abs(deltaPct)}% ${dir} the ${area} average (~$${avg.toLocaleString("en-US")})`,
    deltaPct,
  }
}

export const STATUS_LABEL: Record<ListingStatus, string> = {
  available: "Available",
  viewing: "Viewing booked",
  taken: "Taken",
}

/** Things a student can say a home must have. Drives the Saved-homes filter. */
export const MUST_HAVE_OPTIONS = [
  "Own bathroom",
  "A window in my room",
  "Lift in the building",
  "Washing machine",
  "Within 10 min of MTR",
  "Air-conditioning",
  "Furnished",
  "Room for a desk",
  "Pet-friendly",
  "Quiet street",
  "Open kitchen",
  "Balcony",
]

/** Which must-haves a flat can actually satisfy, from the fields we generate. */
export function satisfiesMustHaves(listing: Listing): string[] {
  const out = ["A window in my room"]
  if (listing.bathrooms >= listing.bedrooms) out.push("Own bathroom")
  if (listing.sqft >= 700) out.push("Lift in the building")
  if (listing.sqft >= 500) out.push("Washing machine")
  if (listing.nearMtr) out.push("Within 10 min of MTR")
  if (listing.sqft >= 800) out.push("Air-conditioning")
  if (listing.sqft >= 600) out.push("Furnished")
  if (listing.bedrooms >= 2) out.push("Room for a desk")
  if (listing.sqft >= 750) out.push("Open kitchen")
  if (listing.sqft >= 650) out.push("Balcony")
  return out
}
