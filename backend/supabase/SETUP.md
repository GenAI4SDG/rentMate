# RentMate — Supabase setup (plain language)

You do **not** need Supabase to demo the product. `npm run dev` runs the whole
thing in **local mode**: the quiz, the hard-filter gate, the score, the
icebreaker hooks and the chat all work in your browser, and the curated demo
cast (`demo@cuhk.edu.hk`) needs no backend and sends no email.

Connect Supabase when you want **real persisted state**: profiles saved to
Postgres, and a real two-way chat that works between two browsers. This guide
walks through that.

> **Read this first — what changed on 2026-10-14.** The schema was rewritten to
> an **auth-free** model. There is no Supabase Auth, no password, no OTP, and
> **row level security is disabled**. The old `student_verifications`,
> `quiz_answers` and `match_results` tables are gone. If you applied the previous
> version of this migration, run `supabase db reset` (dev) to re-apply cleanly.

---

## 0. Prerequisites

- A free Supabase account — <https://supabase.com> (free tier is plenty: 500 MB
  DB, 50k MAU, 5 GB egress/month).
- The Supabase CLI, if you want to push the migration from the terminal
  (optional — you can paste it into the SQL editor instead):

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

The schema is three SQL files and they **must** run in order — the roommate
migration reuses a helper (`public.set_updated_at()`) that the init migration
creates.

**Easiest path — SQL editor (no CLI needed):**
1. Dashboard → **SQL Editor** → **New query**.
2. Open `backend/supabase/migrations/20260313120000_init_hk_rental_platform.sql`,
   paste it, **Run**.
3. New query → `backend/supabase/migrations/20260313120001_seed_amenities.sql`,
   paste, **Run**.
4. New query → `backend/supabase/migrations/20261013233000_roommate_matching.sql`,
   paste, **Run**.

**CLI path** (run from `backend/supabase`):
```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

What these create (the roommate bits you care about):

| Object | What it is |
| --- | --- |
| `roommate_profiles` | The quiz output the matcher runs on. **`email` is the primary key** — the account key, with no foreign key to `auth.users`. |
| `messages` | Real in-app chat. `conversation_id` is `[a,b].sort().join("::")`; `id` is **client-generated** so an optimistic append and the Realtime echo dedupe on the same id. |
| `reports` | Moderation: a user reports another from a conversation. |
| `blocks` | "End a connection". When A blocks B, **both** see the conversation gone. |
| `calculate_match_score(a, b)` | The deterministic score from `CP.calculate_match.v2`, in SQL — a **reference mirror**, *not* invoked at runtime. The app scores locally in `Figma/src/lib/matching.ts`. |

### Realtime must be on for chat

The migration adds `public.messages` to the `supabase_realtime` publication. If
you applied the tables by hand rather than through the migration, enable it
yourself or the chat will only ever show history:

```sql
alter publication supabase_realtime add table public.messages;
```

### Row Level Security is OFF — and that is deliberate

```sql
alter table public.roommate_profiles disable row level security;
alter table public.messages        disable row level security;
alter table public.reports         disable row level security;
alter table public.blocks          disable row level security;
```

With no Supabase Auth there is no `auth.users` and therefore no `auth.uid()` to
key a policy on — an *enabled* policy would block **every** row and the app
would look broken. **The consequence is that anyone holding the anon key can read
and write every row in these four tables.**

That is acceptable for a demo over synthetic data and **not** acceptable for real
students. Before this schema is pointed at real people you need a real auth
model (Supabase Auth with an email claim, or a server-side session), and the
policies must be keyed on **that** claim — not retrofitted onto `auth.uid()`.

---

## 3. No Edge Function is needed

The app does **not** call `backend/supabase/functions/compatibility`. Scoring and
the narrative are computed client-side (`lib/matching.ts`, `lib/hooks.ts`), so
the function is a standalone reference artifact, not part of the running product.
You can skip this step entirely.

---

## 4. Set the environment variables (frontend)

The app reads two public variables.

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
3. Restart `npm run dev`. The header reads the backend mode; with the variables
   set it is `supabase`, otherwise `local`.

> `.env.local` is gitignored — it never gets committed.

---

## 5. Verification is domain-only — no email is sent

RentMate does **not** send a verification email, and **nothing about
verification is stored anywhere** — the table that used to hold a boolean
attestation was dropped. "Verification" means the address's domain matches the
12-institution / 41-domain allowlist (`validateInstitutionEmail` in
`lib/institutions.ts`), checked **client-side**. That is the whole gate.

Consequences, stated plainly:

- **It is a UX affordance, not a security control.** Any allowlisted address
  passes, including one that is not the answerer's, and there is nothing
  server-side to catch it. A judge may well probe this.
- **No email-sender limit.** Supabase's built-in cap (2 emails/hour/project)
  never applies, because nothing is sent — so walk-up users on throwaway
  `@<hk-institution>.edu.hk` addresses work freely.
- There is **no sign-up, no session and no password**. The email *is* the
  account key: clear your browser storage and you are a different user.

---

## 6. Real-time AI — deliberately OFF

For this hackathon **no model is called anywhere in the shipped app**. The
match narrative, the hook deck, the neighbourhood guide, the safety notes and
the viewing scheduler are all pre-written content, and the UI badges each one
"AI · demo" (see `GenBadge` in `App.tsx`).

Reasons:

- Real-time GenAI is too easy to bug or hit rate limits on a free API key, which
  would crash the demo at the worst moment.
- The icebreaker hooks were always local and model-free anyway — they never
  called a model, so the conversation starters work with zero network.

There is **no OpenAI key to set**. If you later want model-written narratives,
the natural home is a server-side function gated behind a secret — not the
anon-key-reachable client.

---

## 7. Run it

```bash
cd Figma
npm install      # already done if you've run the app before
npm run dev      # local mode if env vars are blank; Supabase mode if set
```

Open the printed URL. Sign in with `demo@cuhk.edu.hk` to see the curated cast
with place stories, or any `@<hk-institution>.edu.hk` address for the generic
pool.

To see **real two-browser chat**: open the app in two browsers (or two
profiles), sign in as two different allowlisted addresses, save a profile in
each, then match and message. Messages persist to `messages` and arrive over
Realtime.

### Your account reloads — but there are no sessions

On load the app restores the profile for the **email this browser last used**:
the persisted `roommate_profiles` row when Supabase is configured, otherwise the
local mirror. No token, no cookie, no Supabase Auth — "the account" is the row
keyed on the email, nothing more.

Consequences worth knowing:

- **Same email, any browser = same account.** That is the whole model. It also
  means anyone typing that email sees that profile, which is why nothing
  sensitive belongs in it.
- **First visit, or cleared storage, starts at Home** and takes the quiz again.
  The row is still in Postgres — it just is not loaded into that browser.
- **Clearing site data forgets which email you were**, so a returning user has
  to type the address again.

### The moderation review queue

Sign in as `admin@<any-allowlisted-domain>` — the `admin` **local part** is what
matters, not the domain — and a **Review** tab appears. It lists every report
and every ended connection, newest first.

That tab exists because a report nobody can read is not moderation. It is a
**read-only record**: there is no suspend, no ban and no resolution state, and
the UI says so rather than implying an action it cannot take. `demo@` does
**not** get this tab — it is a walkthrough account, not a moderator.

---

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| App says `local` mode but you set env vars | `.env.local` not picked up / wrong names | Confirm `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY` exactly; restart dev |
| Chat shows history but never live updates | `messages` is not in the `supabase_realtime` publication | Run the `alter publication` statement in step 2 |
| "new row violates row-level security policy" | RLS is **enabled** on a table | The migration disables it on all four tables; enable nothing by hand with the auth-free model |
| My own messages appear twice | A stale optimistic append | By design the client generates the id, so the echo dedupes — update to the current `api.ts` |
| Curated account won't send email | Expected — no account sends email | Works in both local and Supabase modes; domain-only gate |
| Profile won't save | Table missing or wrong key | The migration keys `roommate_profiles` on `email`, not `user_id` |
