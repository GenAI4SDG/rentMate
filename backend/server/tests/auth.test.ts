import { describe, expect, it, vi } from "vitest"
import type { Request, Response } from "express"

vi.mock("../src/config.js", () => ({
  config: { supabaseServiceRoleKey: "test-service-role" },
}))

const getUser = vi.fn()
vi.mock("../src/supabase-client.js", () => ({
  getSupabaseAdmin: () => ({ auth: { getUser } }),
}))

import { requireUser } from "../src/auth.js"

function run(headers: Record<string, string>) {
  const req = { headers } as unknown as Request
  const json = vi.fn()
  const res = {
    status: vi.fn().mockReturnValue({ json }),
  } as unknown as Response
  const next = vi.fn()
  return { req, res, next, json }
}

describe("requireUser", () => {
  it("rejects requests without a bearer token", async () => {
    const { req, res, next } = run({})
    await requireUser(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it("rejects an invalid token", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null }, error: new Error("bad") })
    const { req, res, next } = run({ authorization: "Bearer nope" })
    await requireUser(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it("accepts a valid token and exposes the verified user id", async () => {
    getUser.mockResolvedValueOnce({
      data: { user: { id: "user-123", email: "a@b.com" } },
      error: null,
    })
    const { req, res, next } = run({ authorization: "Bearer good" })
    await requireUser(req, res, next)
    expect(next).toHaveBeenCalled()
    expect((req as unknown as { userId: string }).userId).toBe("user-123")
  })
})
