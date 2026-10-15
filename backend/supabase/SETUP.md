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
> version of this migration, point at the **[`reset-and-apply.sql`](reset-and-apply.sql)**
> one-shot file and run it **once** in the SQL Editor — it drops the stale schema
> and rebuilds cleanly. (The CLI `supabase db reset` is local-only and cannot
> reach this project — see the EXISTING-project section.)
>
> **Later the same day**, a fourth migration (`20261014150000_rentmate_homes.sql`)
> added the Homes half: the listing pool moved into the database, and your saved
> homes / notes / viewing agreements moved out of browser storage and onto the
> server. It is **additive** — nothing above it changes.
>
> **Later still**, a fifth migration (`20261014173000_profile_display_fields.sql`)
> added `study_year` and `major` to `roommate_profiles` — display only, never
> scored and never a gate. Also additive and idempotent.

---

## ⚠️ Read this if you are pointing at an EXISTING project

The live project (check `Figma/.env.local` for the current ref) may be carrying
an **older, auth-based schema**, and the migrations in this folder will **not**
repair it by themselves. What was measured on the old `ghvonvhpcmozpsfzuexo`
project, with the anon key:

| Table | On the live project | What the app needs |
| --- | --- | --- |
| `roommate_profiles` | exists, **keyed on `user_id`**, columns `display_name`, `budget_min`, `budget_max`, `updated_at` | **keyed on `email`**, with `mbti_type`, `about_me`, `looking_for`, `target_areas`, … |
| `messages` | exists with `sender_id` | `sender_email` + `body` |
| `reports` | exists with `reporter_id` | `reporter_email` / `reported_email` |
| `blocks` | **missing** | required |
| `demo_listings`, `saved_listings`, `conversation_listings`, `viewings` | **missing** | required |

**Why re-running the migrations does not fix it.** Every `create table` in
`20261013233000_roommate_matching.sql` is `create table if not exists`. Against a
database that already has a table *of the same name but a different shape*, that
statement is a **silent no-op** — no error, no warning, and the old
`user_id`-keyed table survives. You then get the most confusing failure mode
available: the table exists, the app appears connected, and every write fails on
a column that isn't there.

**One concrete case that bit us:** `public.messages` and `public.reports` are
defined by *both* the init migration (old auth shape: `sender_id`, `message_body`
/ `reporter_id`, `property_id`) **and** the roommate migration (the shape the app
actually uses: `sender_email`, `body` / `reporter_email`, `reported_email`,
`conversation_id`). Because init runs first and the roommate versions used `if not
exists`, the **stale init shape won.** The roommate migration now DROPS and
recreates those two tables, and `reset-and-apply.sql` is regenerated from it — so a
clean apply produces the correct columns. (This is exactly the class of drift that
`npm run smoke` and `check-live-schema.mjs` exist to catch.)

**The fix — one of these, in order of preference:**

1. **One-shot reset file (best, and what your live project needs).** Run
   [`reset-and-apply.sql`](reset-and-apply.sql) **once** in the SQL Editor
   (New query → paste → Run). It drops only your `public` schema and the
   `supabase_migrations` tracking, then rebuilds the full schema from the five
   migrations in order and grants anon/authenticated access. **No project
   deletion, no dashboard reset, no CLI, no Docker.** This is the only path that
   reliably repairs an *existing* project carrying the old schema.

   > **You do NOT delete or reset the project to run this.** The cloud dashboard's
   > only destructive control is **Delete project** (Settings → General), which
   > destroys the project URL, anon key and all data and forces a rebuild of
   > `.env.local` and any deployment — never use it for a schema fix. There is no
   > "reset schema" button in the main UI; pasting this file into the SQL Editor
   > *is* the reset. It only touches `public` and `supabase_migrations`; the
   > protected system schemas (`storage`, `auth`, `realtime`, …) are never touched,
   > and the project URL / anon key / storage buckets are left untouched.
2. **Repair in place (explicit, if you'd rather not drop the whole `public`
   schema).** Drop only the colliding tables and re-run the migrations:
   ```sql
   drop table if exists public.messages cascade;
   drop table if exists public.reports  cascade;
   drop table if exists public.roommate_profiles cascade;
   ```
   This is **destructive** — it deletes those tables' contents — but it leaves the
   rest of `public` (and every system schema) alone. Use it when you want to be
   certain the shape matches rather than trusting a no-op.

> **`supabase db reset` (the CLI command) is NOT the tool here.** It spins up a
> *local* Postgres inside Docker and only touches your machine — it cannot reach
> the linked remote project, and fails outright with no Docker daemon running. Use
> the file above instead.

Either way, **verify** rather than assume. `backend/scripts/check-live-schema.mjs`
reads the live project with the anon key and prints exactly the table above for
your project:

```bash
node backend/scripts/check-live-schema.mjs
```

Until it prints all-green, the app runs in local mode by design: `saveProfile`
returns `"device"`, and the account menu shows *"Saved on this device — the
server copy failed"* instead of silently pretending the write worked.

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

The schema is **five** SQL files and they **must** run in order — every later
migration reuses a helper (`public.set_updated_at()`) that the init migration
creates.

**Fresh project?** Paste the five files in order below. **Existing project that
already has data (e.g. the linked `rentMate` project)?** Do **not** paste them
here — the `if not exists` migrations will silently no-op against the stale
tables. Use [`reset-and-apply.sql`](reset-and-apply.sql) from the EXISTING-project
section instead: one paste, full reset + rebuild.

**Easiest path — SQL editor (no CLI needed):**
1. Dashboard → **SQL Editor** → **New query**.
2. Open [`backend/supabase/migrations/20260313120000_init_hk_rental_platform.sql`](migrations/20260313120000_init_hk_rental_platform.sql),
   paste it, **Run**.
3. New query → [`backend/supabase/migrations/20260313120001_seed_amenities.sql`](migrations/20260313120001_seed_amenities.sql),
   paste, **Run**.
4. New query → [`backend/supabase/migrations/20261013233000_roommate_matching.sql`](migrations/20261013233000_roommate_matching.sql),
   paste, **Run**. *(If this project already has an old `roommate_profiles`,
   read the "EXISTING project" section above first — this file will no-op.)*
5. New query → [`backend/supabase/migrations/20261014150000_rentmate_homes.sql`](migrations/20261014150000_rentmate_homes.sql),
   paste, **Run**. This one seeds 240 listings, so it takes a moment.
6. New query → [`backend/supabase/migrations/20261014173000_profile_display_fields.sql`](migrations/20261014173000_profile_display_fields.sql),
   paste, **Run**. Additive, idempotent, no data touched.

**CLI path** (run from `backend/supabase`):
```bash
supabase link --project-ref <your-project-ref>
supabase db push
```
> ⚠️ `supabase db push` **alone will not repair an existing project** that already
> holds the old `roommate_profiles` / `messages`. The `if not exists` migrations
> no-op against the stale tables, so the columns stay missing and only the writes
> fail. Run [`reset-and-apply.sql`](reset-and-apply.sql) first (or take the
> dashboard reset above), so `db push` has a clean slate to apply to.

Then confirm it actually landed — the migration runner's silence is not proof:

```bash
node ../scripts/check-live-schema.mjs
```

What these create (the roommate bits you care about):

| Object | What it is |
| --- | --- |
| `roommate_profiles` | The quiz output the matcher runs on. **`email` is the primary key** — the account key, with no foreign key to `auth.users`. |
| `messages` | Real in-app chat. `conversation_id` is `[a,b].sort().join("::")`; `id` is **client-generated** so an optimistic append and the Realtime echo dedupe on the same id. |
| `reports` | Moderation: a user reports another from a conversation. |
| `blocks` | "End a connection". When A blocks B, **both** see the conversation gone. |
| `calculate_match_score(a, b)` | The deterministic score from `CP.calculate_match.v2`, in SQL — a **reference mirror**, *not* invoked at runtime. The app scores locally in [`Figma/src/lib/matching.ts`](../../Figma/src/lib/matching.ts). |

What the fourth migration (`20261014150000_rentmate_homes.sql`) creates — the
Homes half:

| Object | What it is |
| --- | --- |
| `demo_listings` | The listing pool, **240 rows, synthetic**. Before this the pool was generated in the browser ([`Figma/src/lib/listings.ts`](../../Figma/src/lib/listings.ts), 72 rows) and could not be edited without a redeploy. `id` is a plain integer so a generated row and a served row are interchangeable. |
| `saved_listings` | Your shortlist, keyed `(email, listing_id)`, carrying **your** note and **your** status. Not per-conversation. |
| `conversation_listings` | A home you sent into a conversation. This is what the Messages tab filters on, and what makes "did we ever look at that place?" answerable. |
| `viewings` | The viewing you agreed to. `when_text` is free text on purpose — the two of you agree a time in the chat; RentMate only remembers and reminds. `checklist` stores *which* safety notes were ticked, not a boolean "read it". |

> **The seed is a mirror, not a copy.** The formulas that generate `demo_listings`
> are the same ones in `Figma/src/lib/listings.ts`, so row #1 in Postgres and row
> #1 in the browser describe the same flat — the only intended difference is
> quantity (240 vs 72). **If you change one, change the other**, or the offline
> fallback and the connected pool will quietly disagree about the same flat.

### Realtime must be on for chat

The migration adds `public.messages` to the `supabase_realtime` publication. If
you applied the tables by hand rather than through the migration, enable it
yourself or the chat will only ever show history:

```sql
alter publication supabase_realtime add table public.messages;
```

`conversation_listings` and `viewings` are in the publication too, so a home one
person sends, and a viewing one person confirms, show up for the other without a
refresh.

### Row Level Security is OFF — and that is deliberate

```sql
alter table public.roommate_profiles    disable row level security;
alter table public.messages             disable row level security;
alter table public.reports              disable row level security;
alter table public.blocks               disable row level security;
alter table public.demo_listings        disable row level security;
alter table public.saved_listings       disable row level security;
alter table public.conversation_listings disable row level security;
alter table public.viewings             disable row level security;
```

With no Supabase Auth there is no `auth.users` and therefore no `auth.uid()` to
key a policy on — an *enabled* policy would block **every** row and the app
would look broken. **The consequence is that anyone holding the anon key can read
and write every row in these eight tables.**

With `saved_listings` in the list, the consequence is worth saying in full:
**anyone holding the anon key can read and write anyone's shortlist, notes and
viewing agreements** — not just the synthetic listings. Still fine for a demo,
because everything in it is demo data. Not fine the moment a real student saves
a real flat.

That is acceptable for a demo over synthetic data and **not** acceptable for real
students. Before this schema is pointed at real people you need a real auth
model (Supabase Auth with an email claim, or a server-side session), and the
policies must be keyed on **that** claim — not retrofitted onto `auth.uid()`.

---

## 3. No Edge Function is needed

The app does **not** call `backend/supabase/functions/compatibility`. Scoring and
the narrative are computed client-side ([`lib/matching.ts`](../../Figma/src/lib/matching.ts), [`lib/hooks.ts`](../../Figma/src/lib/hooks.ts)), so
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
   Then edit [`Figma/.env.local`](../../Figma/.env.local):
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
[`lib/institutions.ts`](../../Figma/src/lib/institutions.ts)), checked **client-side**. That is the whole gate.

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
"AI · demo" (see `GenBadge` in [`App.tsx`](../../Figma/src/App.tsx)).

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
| App says `local` mode but you set env vars | `.env.local` not picked up / wrong names | Confirm `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY` exactly; restart dev. **`NEXT_PUBLIC_*` is silently ignored by Vite** — this was the actual cause once already |
| Sign out / sign in loses everything | The write never reached Postgres | Check the account menu's sync note. `device` = the server write failed. Then run `node backend/scripts/check-live-schema.mjs` |
| Table exists but writes fail with "column … does not exist" | An **older table of the same name** survived `create table if not exists` | The migrations no-op'd. See the "EXISTING project" section — reset or drop-and-recreate |
| `demo_listings` / `saved_listings` 404 (`PGRST205`) | Migration 4 never ran on this project | Run migration 4 in step 2 |
| Chat shows history but never live updates | `messages` is not in the `supabase_realtime` publication | Run the `alter publication` statement in step 2 |
| "new row violates row-level security policy" | RLS is **enabled** on a table | The migrations disable it on all eight tables; enable nothing by hand with the auth-free model |
| Homes tab still shows 72 listings after connecting | `demo_listings` missing or empty | Run migration 5 in step 2. The app silently falls back to the built-in pool rather than showing an empty tab |
| Saved homes don't follow me to another browser | `saved_listings` write failed | localStorage is written first and always; the Postgres mirror is best-effort. Check the table exists and the browser console for the failed request |
| My own messages appear twice | A stale optimistic append | By design the client generates the id, so the echo dedupes — update to the current [`api.ts`](../../Figma/src/lib/api.ts) |
| Curated account won't send email | Expected — no account sends email | Works in both local and Supabase modes; domain-only gate |
| Profile won't save | Table missing or wrong key | The migration keys `roommate_profiles` on `email`, not `user_id` |
