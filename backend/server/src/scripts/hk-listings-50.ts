/** 50 demo listings across Hong Kong for landlord "testing". */

export type SeedListing = {
  title: string
  district: string
  address: string
  rent: number
  beds: number
  baths: number
  sqft: number
  lat: number
  lng: number
}

const DISTRICTS: Array<{
  district: string
  baseLat: number
  baseLng: number
  street: string
}> = [
  { district: "Sha Tin", baseLat: 22.381, baseLng: 114.188, street: "Sha Tin Centre Street" },
  { district: "Kowloon Tong", baseLat: 22.337, baseLng: 114.174, street: "Kent Road" },
  { district: "Kennedy Town", baseLat: 22.281, baseLng: 114.128, street: "Catchick Street" },
  { district: "Mong Kok", baseLat: 22.319, baseLng: 114.169, street: "Nathan Road" },
  { district: "Tai Po", baseLat: 22.451, baseLng: 114.164, street: "On Chee Road" },
  { district: "Hung Hom", baseLat: 22.303, baseLng: 114.182, street: "Chatham Road South" },
  { district: "Sai Ying Pun", baseLat: 22.287, baseLng: 114.144, street: "High Street" },
  { district: "Tseung Kwan O", baseLat: 22.308, baseLng: 114.259, street: "Po Yap Road" },
  { district: "Tuen Mun", baseLat: 22.391, baseLng: 113.977, street: "Tuen Hi Road" },
  { district: "Causeway Bay", baseLat: 22.279, baseLng: 114.182, street: "Hennessy Road" },
  { district: "Central", baseLat: 22.281, baseLng: 114.158, street: "Hollywood Road" },
  { district: "Wan Chai", baseLat: 22.276, baseLng: 114.173, street: "Hennessy Road" },
  { district: "North Point", baseLat: 22.291, baseLng: 114.2, street: "King's Road" },
  { district: "Quarry Bay", baseLat: 22.288, baseLng: 114.212, street: "King's Road" },
  { district: "Tsim Sha Tsui", baseLat: 22.298, baseLng: 114.172, street: "Cameron Road" },
  { district: "Jordan", baseLat: 22.304, baseLng: 114.17, street: "Parkes Street" },
  { district: "Prince Edward", baseLat: 22.324, baseLng: 114.168, street: "Playing Field Road" },
  { district: "Lai Chi Kok", baseLat: 22.337, baseLng: 114.144, street: "Cheung Sha Wan Road" },
  { district: "Tsing Yi", baseLat: 22.354, baseLng: 114.107, street: "Tsing Yi Road" },
  { district: "Ma On Shan", baseLat: 22.425, baseLng: 114.231, street: "On Chun Street" },
  { district: "Fanling", baseLat: 22.492, baseLng: 114.138, street: "Luen Wo Road" },
  { district: "Yuen Long", baseLat: 22.445, baseLng: 114.022, street: "Yuen Long On Ning Road" },
  { district: "Tung Chung", baseLat: 22.289, baseLng: 113.941, street: "Tung Chung Waterfront Road" },
  { district: "Discovery Bay", baseLat: 22.308, baseLng: 114.015, street: "Discovery Bay Road" },
  { district: "Stanley", baseLat: 22.219, baseLng: 114.211, street: "Stanley Main Street" },
  { district: "Aberdeen", baseLat: 22.248, baseLng: 114.153, street: "Aberdeen Main Road" },
]

const TITLE_PREFIX = [
  "Bright",
  "Quiet",
  "Renovated",
  "Sunlit",
  "Modern",
  "Cosy",
  "Spacious",
  "Harbour-view",
  "MTR-near",
  "Student-friendly",
]

export function buildFiftyHongKongListings(): SeedListing[] {
  const out: SeedListing[] = []
  for (let i = 0; i < 50; i++) {
    const d = DISTRICTS[i % DISTRICTS.length]
    const beds = 1 + (i % 3)
    const baths = 1 + (i % 2)
    out.push({
      title: `${TITLE_PREFIX[i % TITLE_PREFIX.length]} ${beds}-bed flat · ${d.district} #${i + 1}`,
      district: d.district,
      address: `${d.street}, ${d.district}, Hong Kong`,
      rent: 8500 + ((i * 419) % 16000),
      beds,
      baths,
      sqft: 280 + ((i * 37) % 280),
      lat: d.baseLat + ((i % 5) - 2) * 0.004,
      lng: d.baseLng + ((i % 7) - 3) * 0.004,
    })
  }
  return out
}
