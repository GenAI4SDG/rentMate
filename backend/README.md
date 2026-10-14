# rentMate — backend

Supabase project for RentMate: the database the app talks to, plus reference
Edge Functions that are **not** called by the running product.

> **Setting up a database?** Read [`supabase/SETUP.md`](supabase/SETUP.md) — it is
> the single source of truth for schema, migrations, the RLS position and the
> troubleshooting table. This file only describes the folder layout.

---

## What this backend is

The app uses **Postgres and Realtime only**, reached directly from the browser
with the anon key. There is **no server process** to run and **no API layer** to
deploy.

| | |
| --- | --- |
| **Account key** | The user's **email**. No Supabase Auth, no password, no OTP, no session |
| **Identity check** | A client-side domain allowlist (`Figma/src/lib/institutions.ts`). A UX affordance, not a security control |
| **Row Level Security** | **Disabled** on every table — with no `auth.users` there is no `auth.uid()` to key a policy on |
| **Realtime** | `messages` (and the Homes tables) are in the `supabase_realtime` publication |
| **GenAI** | No model is called anywhere in the shipped app |

**The RLS consequence, stated plainly:** anyone holding the anon key — which ships
inside the JavaScript bundle — can read and write **every** row, including other
users' saved homes and messages. Acceptable only because all data is synthetic.
Not acceptable the moment a real student's details are in there. See the closing
section of [`supabase/SETUP.md`](supabase/SETUP.md) before this ever points at
real people.

---

## Layout

| Path | Purpose |
| --- | --- |
| `supabase/migrations/` | The schema. **Five files, run in order** — see `SETUP.md` |
| `supabase/functions/compatibility/` | Reference implementation of the match narrative. **Not called at runtime** — scoring happens client-side |
| `supabase/functions/analyze-agreement/` | Agreement-review pipeline. Stub, unused |
| `supabase/functions/rental-chatbot/` | HK rental assistant. Stub, unused |
| `supabase/functions/_shared/` | CORS helper for the above |
| `scripts/check-live-schema.mjs` | Read-only probe: does the live project match these migrations? |
| `src/types/database.ts` | Hand-maintained types |
| `.env.local` | For `supabase functions serve` only — **the web app does not read this file** |

### `src/types/database.ts` is stale

It mirrors the **original auth-based schema** (`Profile` with `id`, `full_name`,
`phone`, `avatar_url`), which is not what the app uses. The app's real types live
in `Figma/src/lib/` (`Profile`, `Listing`, `PersonalState`). Regenerate or delete
this file rather than trusting it.

---

## Running the database locally

Requires the Supabase CLI and Docker:

```bash
cd backend
supabase start
supabase db reset     # applies all migrations + seed
```

`supabase start` prints the API URL and keys. To point the app at it, put those
in **`Figma/.env.local`** — not here:

```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<anon key from supabase start>
```

> **The `VITE_` prefix is required.** Vite silently ignores `NEXT_PUBLIC_*` names,
> so the app falls back to local mode with no error at all. This file used to
> instruct `NEXT_PUBLIC_*`, which is exactly how that bug reached the app once.

---

## Cloud project

```bash
cd backend/supabase
supabase link --project-ref <your-project-ref>
supabase db push
```

Then verify it actually landed — a migration runner reporting no error is not
proof, because `create table if not exists` silently skips a same-named table of
a different shape:

```bash
node backend/scripts/check-live-schema.mjs
```

**Do not enable an auth provider.** There is no auth model here; turning on
Email or Google sign-in does nothing except add confusion. If you want real
accounts later, add Supabase Auth *and* write RLS policies keyed on the email
claim — do not retrofit `auth.uid()` onto this schema.

---

## Related documents

| Document | Purpose |
| --- | --- |
| [`supabase/SETUP.md`](supabase/SETUP.md) | Setup, schema drift, RLS position, troubleshooting |
| [`../docs/HOSTING.md`](../docs/HOSTING.md) | Deploying the app and what breaks |
| [`../README.md`](../README.md) | Project overview |
