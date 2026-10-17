import { describe, expect, it } from "vitest"
import { mapStatusToDb, parseBboxParam } from "../src/lib/bbox.js"

describe("parseBboxParam", () => {
  it("accepts valid bbox", () => {
    expect(parseBboxParam("113.9,22.2,114.3,22.5")).toEqual([
      113.9, 22.2, 114.3, 22.5,
    ])
  })

  it("rejects invalid order", () => {
    expect(parseBboxParam("114,22,113,23")).toBeNull()
  })
})

describe("mapStatusToDb", () => {
  it("maps available to active", () => {
    expect(mapStatusToDb("available")).toBe("active")
  })
})
