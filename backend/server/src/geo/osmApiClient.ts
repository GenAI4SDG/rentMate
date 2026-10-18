import { config } from "../config.js"

function bboxAreaSquareDegrees(
  west: number,
  south: number,
  east: number,
  north: number,
): number {
  return Math.abs(east - west) * Math.abs(north - south)
}

export const osmApiClient = {
  async getCapabilities(): Promise<unknown | null> {
    try {
      const url = `${config.osmApiBaseUrl.replace(/\/$/, "")}/api/0.6/capabilities`
      const res = await fetch(url, {
        headers: { "User-Agent": config.osmUserAgent },
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) return null
      return res.text()
    } catch {
      return null
    }
  },

  async getMap(
    bbox: [number, number, number, number],
  ): Promise<unknown | null> {
    const [left, bottom, right, top] = bbox
    if (bboxAreaSquareDegrees(left, bottom, right, top) > 0.25) {
      throw new Error("bbox exceeds 0.25 square degrees OSM limit")
    }
    try {
      const q = `${left},${bottom},${right},${top}`
      const url = `${config.osmApiBaseUrl.replace(/\/$/, "")}/api/0.6/map.json?bbox=${q}`
      const res = await fetch(url, {
        headers: { "User-Agent": config.osmUserAgent },
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) return null
      return res.json()
    } catch {
      return null
    }
  },
}
