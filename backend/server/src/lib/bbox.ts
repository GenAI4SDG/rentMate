import { z } from "zod"

export const bboxSchema = z
  .tuple([
    z.coerce.number().min(-180).max(180),
    z.coerce.number().min(-90).max(90),
    z.coerce.number().min(-180).max(180),
    z.coerce.number().min(-90).max(90),
  ])
  .refine(([w, s, e, n]) => w < e && s < n, {
    message: "Invalid bbox: west<east and south<north required",
  })

export function parseBboxParam(raw: string | undefined): [number, number, number, number] | null {
  if (!raw) return null
  const parts = raw.split(",").map((p) => p.trim())
  if (parts.length !== 4) return null
  const parsed = bboxSchema.safeParse(parts)
  if (!parsed.success) return null
  return parsed.data
}

/** Map API status to DB property_status */
export function mapStatusToDb(status: string | undefined): string {
  switch (status) {
    case "rented":
      return "rented"
    case "hidden":
      return "archived"
    case "available":
    default:
      return "active"
  }
}

export function mapDbStatusToApi(dbStatus: string): string {
  switch (dbStatus) {
    case "active":
      return "available"
    case "rented":
      return "rented"
    default:
      return "hidden"
  }
}
