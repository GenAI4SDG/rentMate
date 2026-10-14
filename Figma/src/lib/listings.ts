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

export type Listing = {
  id: number;
  title: string;
  area: string;
  price: string;
  mapPrice: string;
  details: string;
  commute: string;
  image: string;
  x: number;
  y: number;
  rating: string;
  /** Always true here — every listing in this file is synthesised. */
  synthetic: true;
};

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
};

const flatTitles = [
  "Sunlit two-bedroom near MTR",
  "Quiet flat with harbour light",
  "Warm, compact student home",
  "Renovated walk-up by the park",
  "Two-bedroom with study nook",
  "Bright corner flat near campus",
  "Calm home above the market",
  "Modern flat with open kitchen",
  "High-floor home with city view",
  "Cosy two-bedroom on a quiet lane",
  "Student-ready flat beside MTR",
  "Airy home with separate bedrooms",
  "Minimal flat near waterfront",
  "Freshly renovated shared home",
  "Practical flat with large windows",
  "Two-bedroom near university shuttle",
  "Compact home with clever storage",
  "Peaceful flat close to green space",
  "Sunny home in a student neighbourhood",
  "Furnished two-bedroom with workspace",
  "Value flat with fast campus commute",
  "Bright bedrooms and shared lounge",
  "Move-in ready home near local shops",
  "Comfortable flat on a quiet street",
  "Open-plan student home near rail",
];

const flatAreas = [
  "Sha Tin", "Kennedy Town", "Kowloon Tong", "Tai Wai", "Hung Hom",
  "Sai Ying Pun", "Tai Po", "Tseung Kwan O", "Mong Kok", "Tuen Mun",
];

const flatImages = [
  "photo-1738168246881-40f35f8aba0a",
  "photo-1668566398322-6bbc9be03736",
  "photo-1556593825-c11de986cb0b",
  "photo-1761123141836-3b3221dac3e5",
  "photo-1779785689520-bf24ef13aa71",
  "photo-1774311237295-a65a4c1ff38a",
  "photo-1759691555010-7f3f8674d2f2",
];

export const LISTINGS: Listing[] = flatTitles.map((title, index) => {
  const area = flatAreas[index % flatAreas.length];
  const squareFeet = 410 + ((index * 37) % 190);
  const price = 12800 + ((index * 850) % 7200);
  return {
    id: index + 1,
    title,
    area,
    price: `$${price.toLocaleString("en-US")}`,
    mapPrice: `$${(price / 1000).toFixed(1)}k`,
    details: `2 beds · 1 bath · ${squareFeet} sq ft`,
    commute: `${6 + ((index * 3) % 17)} min to campus`,
    image: `https://images.unsplash.com/${flatImages[index % flatImages.length]}?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900&h=620`,
    x: 10 + ((index * 29) % 78),
    y: 12 + ((index * 17) % 72),
    rating: (4.6 + (index % 4) / 10).toFixed(1),
    synthetic: true,
  } as Listing;
});

export function parsePrice(price: string): number {
  return Number(price.replace(/[^0-9]/g, ""));
}

/**
 * How a listing's rent compares to its district average. Returns a human string
 * plus a signed percentage, or null when the district has no figure on file —
 * "Not provided" beats a fabricated comparison.
 */
export function priceContext(
  area: string,
  price: string,
): { label: string; deltaPct: number } | null {
  const avg = DISTRICT_AVERAGE_RENT[area];
  if (!avg) return null;
  const value = parsePrice(price);
  if (!value) return null;
  const deltaPct = Math.round(((value - avg) / avg) * 100);
  const dir = deltaPct > 0 ? "above" : "below";
  return {
    label: `${Math.abs(deltaPct)}% ${dir} the ${area} average (~$${avg.toLocaleString("en-US")})`,
    deltaPct,
  };
}
