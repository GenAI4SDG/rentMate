// HARDCODED "AI listing check" demo content.
//
// In production this is a GenAI listing/contract audit: the model reads a
// listing and a draft tenancy, flags red flags, and cites sources (IP node
// IP.rentmate.transparency + scope-lock "multimodal listing audit + cited RAG").
// Real AI was turned OFF for reliability, so this is a pre-written, sourced list
// — labelled "AI · demo" in the UI. Every line carries its source so the pitch
// can say "cited", not "opinion".

export type SafetyNote = {
  title: string
  detail: string
  source: string
  /** True when this row is a placeholder for the owner's official source. */
  ownerSource?: boolean
}

export const SAFETY_NOTES: SafetyNote[] = [
  {
    title: "Never pay a deposit before you view the flat",
    detail:
      "The most common HK rental scam is a 'landlord abroad' who cannot show the flat and asks for the deposit first. Police treat 'deposit before viewing or contract' as an active scam pattern.",
    source: "HK Police / Anti-Deception Coordination Centre rental-fraud leaflet, 2026",
  },
  {
    title: "Confirm the owner with a land search",
    detail:
      "A quick land search on the property tells you who actually owns it, so a forged owner-authorisation letter for a sublet is caught before money moves.",
    source: "Lands Department land-search guidance (via E-Vision rental guide, 2026)",
  },
  {
    title: "Get the tenancy agreement stamped",
    detail:
      "A written, stamped lease is what makes a deposit enforceable and a tenancy provable. Informal tenants lose deposits to owners denying a tenancy existed.",
    source: "Rating and Valuation Department (R&VD) tenancy guidance",
  },
  {
    title: "Budget for two months' deposit + one month's rent upfront",
    detail:
      "HK convention is 2 months' deposit plus 1 month's rent before you move in — on a HK$18,000/month flat that is HK$65,000–75,000 in cash up front, before fees or furniture.",
    source: "Market research briefing (finding rental partners in HK), Sep 2026",
  },
  {
    title: "Put the three disputes in writing: furnishing, deposit deductions, disposal",
    detail:
      "These are the three most-common residential-leasing disputes in HK. Local convention is 'handover without furniture'; newcomers assume furnishing is included. Spelling out deposit-deduction and clear-out terms avoids the bill at exit.",
    source: "Market research briefing, Sep 2026",
  },
  {
    title: "Prefer monthly payment over a year up front",
    detail:
      "Some landlords ask students to prepay a full year to 'win' a flat, which raises fraud exposure. Monthly payment caps your loss; legislators' advice is to insist on it.",
    source: "Legislative Council advice via market research briefing, 2026",
  },
  {
    title: "Know the commission and the viewing-paper trap",
    detail:
      "Standard agency commission is half a month's rent from each side (~1 month total, negotiable, rarely publicised). A signed 睇樓紙 (viewing paper) can bind you to the first agent for ~3 months even if you later rent directly.",
    source: "E-Vision rental commission guide, 2026",
  },
  {
    // Slot for the owner to paste an official HK government / Home Affairs source.
    title: "Official tenancy guidance",
    detail:
      "[Placeholder — paste the official HK government / Home Affairs Department tenancy guidance here. Kept distinct from the market-research lines above.]",
    source: "[owner to supply an official source]",
    ownerSource: true,
  },
]
