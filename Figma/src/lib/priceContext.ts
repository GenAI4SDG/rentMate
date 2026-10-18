import type { ListingFeature } from "./listingsApi"

export type PriceContext = {
  district: string
  sampleSize: number
  median: number
  /** Positive = above the district median, negative = below. */
  diffPercent: number
  verdict: "below" | "typical" | "above"
}

/**
 * Compares one listing with other listings in the same district that are loaded
 * on the map. This is Rent Mate platform data — not official R&VD statistics.
 */
export function priceContext(
  selected: ListingFeature,
  all: ListingFeature[],
): PriceContext | null {
  const district = selected.properties.district
  const prices = all
    .filter((f) => f.properties.district === district)
    .map((f) => f.properties.price)
    .sort((a, b) => a - b)
  if (prices.length < 3) return null

  const mid = Math.floor(prices.length / 2)
  const median =
    prices.length % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2
  const diffPercent = Math.round(
    ((selected.properties.price - median) / median) * 100,
  )
  const verdict =
    diffPercent <= -8 ? "below" : diffPercent >= 8 ? "above" : "typical"

  return { district, sampleSize: prices.length, median, diffPercent, verdict }
}
