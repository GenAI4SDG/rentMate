import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

// RentMate compatibility Edge Function.
//
// Two jobs, deliberately separated:
//   1. the SCORE — deterministic, computed by the SQL function
//      `public.calculate_match_score` (mirrors CP.calculate_match.v2). The model
//      never touches it.
//   2. the NARRATIVE — a deterministic, hardcoded sentence explaining the score.
//      Real-time AI (GPT-4o-mini) was deliberately turned OFF for the demo: it is
//      too easy to bug or hit rate limits on a free API key. The frontend shows
//      its own cached narrative regardless, so this function's narrative is only a
//      server-side fallback.
//
// The hard-constraint gate (CP.filter_eligible_matches.v2) runs BEFORE scoring:
// gender and smoking exclude candidates and never contribute a number.

type Profile = {
  gender_identity?: string | null;
  mbti_type?: string | null;
  about_me?: Record<string, number>;
  looking_for?: {
    any_gender?: boolean;
    roommate_gender_categories?: string[] | null;
    smoking_rule?: string | null;
  } | null;
};

type Candidate = {
  id: string;
  name?: string;
  school?: string;
  area?: string;
  budget?: string;
  profile: Profile;
};

const NARRATIVE_FALLBACK = (candidate: Candidate, score: number, factors: Record<string, number>): string => {
  const names = Object.keys(factors);
  if (!names.length) {
    return `${candidate.name ?? "This student"} hasn't answered enough of the same questions to score a lifestyle fit yet.`;
  }
  const strongest = names.reduce((a, b) => (factors[a] >= factors[b] ? a : b));
  const pct = Math.round((factors[strongest] ?? 0) * 100);
  return `You and ${candidate.name ?? "this student"} line up most on ${strongest.replace(/_/g, " ")} (${pct}%). The deterministic score is ${score}/100 — a weighted similarity, not a measurement.`;
};

function genderAllows(seeker: Profile, other: Profile): boolean {
  const lf = seeker.looking_for ?? {};
  if (lf.any_gender === true) return true;
  const cats = lf.roommate_gender_categories;
  if (!cats || cats.length === 0) return true; // not stated -> no constraint
  const ident = other.gender_identity;
  if (!ident || ident === "prefer_not_to_say") return false; // undisclosed never passes a stated category
  return cats.includes(ident);
}

function smokingAllows(seeker: Profile, other: Profile): boolean {
  if ((seeker.looking_for ?? {}).smoking_rule !== "required_non_smoking") return true;
  return (other.about_me ?? {})["smoking_status"] === 1;
}

function isEligible(a: Profile, b: Profile): boolean {
  return (
    genderAllows(a, b) && genderAllows(b, a) &&
    smokingAllows(a, b) && smokingAllows(b, a)
  );
}

// Deterministic, hardcoded narrative. No model, no network — real-time AI is off
// for the demo. (The frontend shows its own cached narrative anyway.)
function narrate(
  candidate: Candidate,
  score: number,
  factors: Record<string, number>,
): string {
  return NARRATIVE_FALLBACK(candidate, score, factors);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { profile, candidates } = await req.json() as {
      profile: Profile;
      candidates: Candidate[];
    };
    if (!profile || !Array.isArray(candidates)) {
      return jsonResponse({ error: "profile and candidates[] are required" }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const matches = [];

    for (const candidate of candidates) {
      // 1. hard gate — excluded candidates never reach the score
      if (!isEligible(profile, candidate.profile)) continue;

      // 2. deterministic score, computed in the database
      const { data, error } = await supabase.rpc("calculate_match_score", {
        a: profile,
        b: candidate.profile,
      });
      if (error) throw new Error(error.message);

      const score: number | null = data?.score ?? null;
      const status: string = data?.status ?? "insufficient_data";

      // 3. narrative — deterministic, hardcoded (real-time AI is off)
      const narrative = status === "scored"
        ? narrate(candidate, score as number, (data?.factors ?? {}) as Record<string, number>)
        : null;

      matches.push({
        id: candidate.id,
        name: candidate.name ?? null,
        school: candidate.school ?? null,
        area: candidate.area ?? null,
        budget: candidate.budget ?? null,
        score,
        status,
        narrative,
        scored_with_model: false,
      });
    }

    matches.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    return jsonResponse({ matches });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
