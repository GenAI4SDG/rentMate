// HARDCODED "messages from the listing agency" demo content.
//
// WHY THIS EXISTS. Until 14 Oct (second pass) a listing's status was a
// <select>: you could declare a flat "available", "viewing" or "taken" by
// picking from a dropdown, which is not a thing that happens in the world. The
// owner's call: the status should be the RESULT of an action — you book with
// the agent, and the agent writes back. And the interesting half is the failure:
// "should receive messages from the retailer when a booking no longer exists."
//
// In production this is the agency side of the marketplace: a real counterparty
// with a real inbox, sending real cancellations. Real agents were turned OFF for
// the demo the same way real AI was, so this is pre-written content, chosen
// deterministically from the listing id — which means the same flat always has
// the same agent and the same story, and the demo can be re-run identically.
//
// NOTHING HERE IS A LIE ABOUT THE PRESENT: every line is clearly the agency
// speaking, the UI badges the panel "AI · demo" beside the rest of the mock
// content, and no message claims a booking that the app did not just make.

import type { ListingStatus } from "./listings"

export type AgentUpdate = {
  /** Which agency wrote it. Shown as the sender, like a chat. */
  agent: string
  text: string
  time: string
  /**
   * True when this update ENDS a booking — the viewing no longer exists. The
   * saved-home card marks these in red, because that is the message you would
   * actually miss.
   */
  cancels?: boolean
}

const AGENCIES = [
  "Chun Shing Property",
  "Kai Fong Estates",
  "Harmony Home Agency",
  "Sun Hing Property",
  "Wah Kee Estates",
  "Tai Wai Accommodation Co.",
]

/**
 * The agency handling a listing. Deterministic from the id so the same flat is
 * always the same agency — a demo that shuffles its own counterparties reads
 * like a bug.
 */
export function agentFor(listingId: number): string {
  return AGENCIES[Math.abs(listingId) % AGENCIES.length]
}

/**
 * The agency's thread about one listing, given what YOU have done with it.
 *
 * Three shapes, and they are the three states a booking can be in:
 *   - nothing booked   → an enquiry line, so the panel is never blank
 *   - booked           → a confirmation
 *   - booked, then let → a confirmation FOLLOWED BY a cancellation, which is the
 *                        case the owner asked to see
 */
export function agentThread(
  listingId: number,
  status: ListingStatus,
  when?: string | null,
): AgentUpdate[] {
  const agent = agentFor(listingId)
  const slot = when?.trim() || "the time you asked for"
  const out: AgentUpdate[] = [
    {
      agent,
      text: "Thanks for the enquiry. Send us two slots that suit you and we'll confirm with the landlord.",
      time: "2 days ago",
    },
  ]

  if (status === "available") return out

  out.push({
    agent,
    text: `Confirmed — the landlord will meet you for ${slot}. Bring the deposit question; he is easier on a 12-month term in person.`,
    time: "Yesterday",
  })

  if (status === "viewing") return out

  // status === "taken": the booking that no longer exists.
  out.push({
    agent,
    text: "Sorry — the landlord let the unit this morning, so that viewing no longer exists. Nothing you did; it went to someone who signed first. I'll message you first if anything similar opens in the same block.",
    time: "3 hours ago",
    cancels: true,
  })
  return out
}

/** What the agency writes the moment you press "Book a viewing". */
export function bookingRequestLine(listingId: number, when?: string | null): AgentUpdate {
  return {
    agent: agentFor(listingId),
    text: when?.trim()
      ? `Request received for ${when.trim()}. I'll confirm with the landlord and come back to you here.`
      : "Request received. Tell me when suits you and I'll confirm with the landlord.",
    time: "Now",
  }
}
