# RentMate — Supabase setup (plain language)

You do **not** need Supabase to demo the product. `npm run dev` runs the whole
thing in **local mode**: the quiz, the hard-filter gate, the score, and the
icebreaker hooks all run in your browser, and the curated demo cast
(`demo@cuhk.edu.hk`) needs no backend and sends no email.

Connect Supabase when you want **real** sign-ups: real email verification, real
student profiles saved to Postgres, and the score computed server-side. This
guide walks through that.

---

## 0. Prerequisites

- A free Supabase account — <https://supabase.com> (free tier is plenty: 500 MB
  DB, 50k MAU, 5 GB egress/month).
- The Supabase CLI, if you want to deploy the Edge Function from the terminal
  (optional — you can paste it into the dashboard instead):

  ```bash
  npm install -g supabase
  supabase login
  ```

- From the repo root: `cd Figma` for the app, `cd backend/supabase` for these files.

---

## 1. Create a project

1. Supabase dashboard → **New project**.
2. Pick a name (e.g. `rentmate`), a strong database password (save it), and a
   region near Hong Kong.
3. Wait for it to finish provisioning (~1 min).

---

## 2. Run the database migrations

The schema is two SQL files. They **must** run in order — the roommate
migration reuses a helper (`public.set_updated_at()`) the init migration creates.

**Easiest path — SQL editor (no CLI needed):**
1. Dashboard → **SQL Editor** → **New query**.
2. Open `backend/supabase/migrations/20260313120000_init_hk_rental_platform.sql`,
   paste it, **Run**.
3. New query → open `backend/supabase/migrations/20260313120001_seed_amenities.sql`,
   paste, **Run**.
4. New query → open `backend/supabase/migrations/20261013233000_roommate_matching.sql`,
   paste, **Run**.

**CLI path** (run from `backend/supabase`):
```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

What these create (the roommate bits you care about):
- `student_verifications` — the access gate. Stores only a boolean attestation
  and the email domain; never the email body or any document.
- `roommate_profiles` — the quiz output the matcher runs on.
- `quiz_answers` — one row per answered question.
- `match_results` — the computed score + narrative per candidate pair.
- `public.calculate_match_score(a, b)` — the deterministic score from
  `CP.calculate_match.v2`, computed **in the database** so the client is never
  trusted for it.
- Row Level Security is on for every table: students read the profile pool, but
  can only write their own rows.

---

## 3. Deploy the `compatibility` Edge Function

This function does two jobs, kept separate on purpose:
1. **The score** — calls `calculate_match_score` in SQL. The model never touches it.
2. **The narrative** — asks OpenAI (GPT-4o-mini) to explain the score in plain
   English. If no OpenAI key is set, it falls back to a deterministic sentence,
   so the app works without one.

**CLI path:**
```bash
cd backend/supabase
supabase functions deploy compatibility --no-verify-jwt
```
(The `--no-verify-jwt` is fine here: the function only reads the profile pool
and writes nothing; the SQL layer and RLS still protect data.)

**Dashboard path:**
1. Dashboard → **Edge Functions** → **New function**, name it `compatibility`.
2. Copy the contents of `backend/supabase/functions/compatibility/index.ts` into
   the editor (and keep `functions/_shared/cors.ts` as a sibling — or inline the
   CORS headers). Deploy.

> Note: the function imports the Supabase client from `esm.sh` and Deno's
> `Deno.serve`. The CLI handles that runtime automatically; the dashboard editor
> also runs Deno, so the same file works.

---

## 4. Set the environment variables (frontend)

The app reads two public variables. They are **safe to expose in the frontend**
— Row Level Security is what protects the data, not secrecy of the anon key.

1. Dashboard → **Project Settings** → **API**:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
2. In `Figma/`, copy the example and fill it in:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `Figma/.env.local`:
   ```
   VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```
3. Restart `npm run dev`. The header now reads **"Scored by the Supabase
   backend"** instead of "Demo mode".

> `.env.local` is gitignored — it never gets committed.

---

## 5. Verification is domain-only — no email is sent

RentMate does **not** send a verification email. "Verification" means the
address's domain matches the 12-institution allowlist
(`validateInstitutionEmail`); that's the whole gate. There is no OTP, no magic
link, no Supabase Auth sign-in in this flow.

Consequences:
- **No email-sender limit.** Supabase's built-in cap (2 emails/hour/project)
  never applies, because nothing is sent — so walk-up users on throwaway
  `@<hk-institution>.edu.hk` accounts work freely.
- **Supabase is still used** for the *score* (the `compatibility` Edge Function),
  not for auth. Profiles are kept in `localStorage` unless you wire real auth.
- If you later want genuine sign-in (sessions, persisted profiles), you'd add
  Supabase Auth + custom SMTP then — but that is out of scope for the demo.

---

## 6. Real-time AI — deliberately OFF

For this hackathon the **match narrative is hardcoded/cached**, and the
`compatibility` function no longer calls any model. Reasons:

- Real-time GenAI is too easy to bug or hit rate limits on a free API key,
  which would crash the demo at the worst moment.
- The icebreaker hooks were always local and hardcoded anyway — they never
  called a model, so the conversation starters work with zero network.

There is **no OpenAI key to set**. If you later want model-written narratives,
re-add the call in `functions/compatibility/index.ts` and gate it behind a
secret — but it is off by default and the frontend shows its own cached
narrative regardless.

---

## 7. Run it

```bash
cd Figma
npm install      # already done if you've run the app before
npm run dev      # local mode if env vars are blank; Supabase mode if set
```

Open the printed URL. Sign in with `demo@cuhk.edu.hk` to see the curated cast
with place stories, or any `@<hk-institution>.edu.hk` address for the generic
pool (real sign-in only when Supabase is configured).

---

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| App says "Demo mode" but you set env vars | `.env.local` not picked up / wrong names | Confirm `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY` exactly; restart dev |
| Verify button spins then errors | Supabase not configured, or Auth disabled | Check `Project Settings → Auth → Providers → Email` is enabled |
| "2 emails/hour" error | N/A — no email is sent (domain-only verification) | Nothing to fix; see step 5 |
| Function returns 500 | RPC missing, or Deploy failed | Confirm `calculate_match_score` exists (step 2); re-deploy the function |
| Curated account won't send email | Expected — no account sends email | Works in both local and Supabase modes; domain-only gate |
