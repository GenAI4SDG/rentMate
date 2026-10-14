# Hosting RentMate

**Why this document exists.** The organisers accept a localhost build, but the
submission deck must carry a **clickable link** — and a judge cannot open
`http://localhost:8443`. So the app has to be on a public URL for the
submission, even though it does not have to be *production-grade*.

**What you are deploying:** the `Figma/` app, as a folder of static files. There
is no server, no API process and no database to deploy — Supabase is a managed
service that the browser talks to directly.

**Time:** ~3 minutes for the recommended path.

---

## What actually gets deployed

```bash
cd Figma
npm install
npm run build
```

That produces `Figma/dist/`:

| File | Notes |
| --- | --- |
| `index.html` | The shell. References assets by **absolute** path (`/assets/…`) |
| `assets/index-<hash>.js` | The whole app, minified |
| `assets/index-<hash>.css` | Tailwind output |
| `robots.txt` | `Disallow: /` — see the noindex note below |

`dist/` is **gitignored** (`Figma/.gitignore`). That is correct and stays that
way: hosts build it themselves, or you upload it by hand.

**There is no router.** The app switches screens with component state, so the URL
never changes path. That means you do **not** need SPA rewrite rules
(`_redirects`, `vercel.json` rewrites, a 404→index.html fallback) — a plain
static host is genuinely enough. Don't add them; they hide real 404s.

---

## The three things that break a deploy

Read these before choosing a host. Each one has bitten a Vite demo before.

### 1. Environment variables are baked in at BUILD time — and `.env.local` is gitignored

This is the one that matters most.

Vite inlines `import.meta.env.*` **during the build**. It is not read at runtime.
Confirm it yourself — after a build with your env set, your Supabase project ref
is literally inside the bundle:

```bash
grep -o "<your-project-ref>" Figma/dist/assets/*.js | wc -l   # expect: 1 or more
```

A count of **0** means the build never saw the variables, and the deployed app
will run in local mode no matter what the host dashboard says.

Now the trap: `Figma/.env.local` is gitignored, so **a host that builds from Git
cannot see it**. A git-connected deploy with no env vars configured produces a
bundle with `isSupabaseConfigured === false` — the app silently runs in **local
mode**, where every user's data lives only in their own browser. The demo still
*looks* fine, which is exactly why this is dangerous.

Two ways out, and either is acceptable:

- **Set the two variables in the host's dashboard** (build environment). Preferred
  for anything you will redeploy.
- **Build locally, then upload the finished `dist/`.** The env vars are already
  baked in, so the host never needs them. This is what makes Netlify Drop below
  so quick — and correct.

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | the **publishable / anon** key |

> The prefix is not decoration. `NEXT_PUBLIC_*` names are **silently ignored** by
> Vite — that exact mistake is what made the app run in local mode for a whole
> afternoon. `VITE_` or nothing.

### 2. The app expects to live at the domain root

`Figma/vite.config.ts` sets `base` from `FIGMA_PUBLIC_URL`:

```ts
base: process.env.FIGMA_PUBLIC_URL ? `${process.env.FIGMA_PUBLIC_URL}/` : '/',
```

At a **domain root** (`https://rentmate.vercel.app/`) the default `/` is correct
and you do nothing.

At a **subpath** (`https://<user>.github.io/rentMate/`) you **must** build with
the prefix set, or every asset 404s and you get a blank page:

```bash
cd Figma
FIGMA_PUBLIC_URL=/rentMate npm run build
```

### 3. The build is deliberately `noindex`

`.figma/make/site.json` sets `robots.index: false`, so the build emits
`robots.txt` → `Disallow: /` **and** `<meta name="robots" content="noindex, nofollow">`.

This is the right default for a demo link in a slide — you do not want a
half-built student project turning up in search results. It does **not** stop
anyone who has the URL from opening it, so it is not a privacy control. Leave it
alone unless you actively want the site indexed.

---

## Recommended path: Netlify Drop

**Best when:** you want a link in the next ten minutes and no account ceremony.

Because you build locally, your `.env.local` is picked up and the Supabase
config is baked in — problem 1 never arises.

```bash
cd Figma
npm run build
```

1. Open <https://app.netlify.com/drop>.
2. Drag the **`Figma/dist` folder** onto the page.
3. It uploads, deploys, and hands you a URL like
   `https://spontaneous-otter-a1b2c3.netlify.app`.

**Claim the site** (sign in when prompted) or the link is temporary. A claimed
site keeps its URL and can be redeployed by dragging a new `dist/` over it.

Downside: the URL has a random slug, and every update is a manual re-drag. Fine
for a submission; annoying if you iterate a lot on demo day.

---

## Vercel CLI

**Best when:** you want a clean URL and one-command redeploys.

```bash
cd Figma
npx vercel login
npx vercel --prod
```

Vercel detects Vite, runs `npm run build`, and serves `dist/`. You get a URL like
`https://figma-xxxx.vercel.app`.

**Then set the env vars, or the deploy is local-mode:**

```bash
npx vercel env add VITE_SUPABASE_URL production
npx vercel env add VITE_SUPABASE_ANON_KEY production
npx vercel --prod          # rebuild so the values are baked in
```

Setting an env var does **not** retroactively change an existing build — you must
redeploy for it to take effect. This is the single most common "I set the variable
and nothing happened" report.

---

## Git-connected Vercel / Netlify

**Best when:** you want the link to update itself on every push.

Both hosts default to the **repository root**, but the app lives in `Figma/`.
Set this or the build fails:

| Setting | Value |
| --- | --- |
| Root / base directory | `Figma` |
| Build command | `npm run build` |
| Output / publish directory | `dist` |
| Node version | **22** (matches `.mise.toml`) |
| Environment variables | the two `VITE_*` variables above |

Add both variables **before** the first deploy, otherwise the first build ships
in local mode and you will debug the wrong thing.

---

## GitHub Pages

**Best when:** you specifically want it under the GitHub org.

This is the only path where problem 2 applies — Pages serves from
`https://<org>.github.io/<repo>/`, a subpath.

```bash
cd Figma
FIGMA_PUBLIC_URL=/rentMate npm run build
```

Then publish `Figma/dist` to a `gh-pages` branch (the `gh-pages` npm package, or
a small Actions workflow), and in **Settings → Pages** point it at that branch.

Add an empty `.nojekyll` file at the published root so GitHub does not run the
output through Jekyll. Vite's `assets/` folder survives either way, but
`.nojekyll` removes the whole class of problem.

> `FIGMA_PUBLIC_URL` is read at **build** time. If you set it in the Pages
> dashboard it does nothing — it is not a runtime variable.

---

## Figma Make's own hosting

The repo already carries Figma Make's deploy scripts, which use `pnpm`:

```bash
cd Figma
.figma/make/deploy            # pnpm run build && figma make deploy --build-dir dist
.figma/make/deploy-preview    # same, but --mode development (inline sourcemaps)
```

This requires the `figma` CLI to be installed and authenticated against the
workspace that produced the export. Use it if you already have that setup;
otherwise the paths above are simpler and have no workspace dependency.

---

## Before you paste the link into the deck

Do these against the **deployed URL**, not localhost. Each one catches a
different silent failure.

1. **The page loads at all** — no blank screen, no 404 on `/assets/…`. A blank
   page means problem 2 (base path).
2. **The header says `supabase`, not `local`.** This is the check that proves
   problem 1 did not happen. If it says `local`, your env vars were missing at
   build time.
3. **Sign in as `demo@cuhk.edu.hk`** and confirm the curated cast and the seeded
   saved homes appear.
4. **Open the link on a phone**, or in a different browser. Layout and the map
   tiles are the two things most likely to surprise you.
5. **Two-browser chat** — open the link in two browsers, sign in as two
   allowlisted addresses, send a message, watch it arrive live. This is the only
   check that exercises Supabase Realtime, and it is worth doing once.
6. **Re-run the schema check against the project you actually deployed to:**
   ```bash
   node backend/scripts/check-live-schema.mjs
   ```
   If that reports drift, the deployed app will fall back to local mode no matter
   how correct your build was. See [`../backend/supabase/SETUP.md`](../backend/supabase/SETUP.md).

---

## ⚠️ A public link to an open database

State this plainly before the deck goes out.

- **The link is public.** Anyone with it can open the app. `noindex` keeps it out
  of search engines; it does not restrict access.
- **Row Level Security is disabled** on all eight tables — deliberately, because
  there is no Supabase Auth and therefore no `auth.uid()` to key a policy on.
  The consequence: **anyone holding the anon key can read and write every row**,
  including other users' saved homes and messages. The anon key is inside the
  JavaScript bundle, so anyone who opens the link has it.
- This is acceptable **only** because everything in the database is synthetic
  demo data. The curated cast, the 240 listings and the saved homes are all made
  up.

**Therefore: do not put real people's data in this database while the link is
public.** If the demo needs a real user's flat, seed it as demo data instead.
Before this schema ever points at real students it needs real auth — see the
closing section of [`../backend/supabase/SETUP.md`](../backend/supabase/SETUP.md).

---

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Blank page, `/assets/…` 404s | Built for the domain root, deployed to a subpath | Rebuild with `FIGMA_PUBLIC_URL=/<subpath>` |
| Header says `local` on the deployed site | Env vars absent at build time | Set `VITE_SUPABASE_*` in the host dashboard, then **redeploy** |
| Env var set, still `local` | Build was not re-run | Env vars only apply to new builds |
| Data vanishes when you switch browsers | App is in local mode | Same as above — localStorage is per-browser |
| Build fails: "no package.json" | Host is building the repo root, not `Figma/` | Set the root/base directory to `Figma` |
| Build fails on Node version | Host default Node is older | Pin Node **22** |
| `robots.txt` says `Disallow: /` | `site.json` sets `index: false` | Expected. Edit `.figma/make/site.json` only if you want indexing |
| Netlify link died after a while | Site was never claimed | Sign in and claim it, then redeploy |
| `npm run typecheck` → "Missing script" | Run from the wrong folder | `typecheck`/`lint` live at the **repo root**; `Figma/` has only `dev`/`build`/`preview`/`format`/`smoke` |

---

## Which path should you pick?

| Situation | Use |
| --- | --- |
| Link needed today, minimal fuss | **Netlify Drop** (build locally, drag `dist/`) |
| Want a tidy URL + easy redeploys | **Vercel CLI** |
| Want the link to track `main` automatically | **Git-connected Vercel/Netlify** |
| Must live under the GitHub org | **GitHub Pages** (remember `FIGMA_PUBLIC_URL`) |
| Already using the Figma CLI | **Figma Make deploy** |

---

## Related documents

| Document | Purpose |
| --- | --- |
| [`../README.md`](../README.md) | Project overview and how to run it locally |
| [`demo-user-guide.md`](demo-user-guide.md) | The 3-minute demo walkthrough for judges |
| [`../backend/supabase/SETUP.md`](../backend/supabase/SETUP.md) | Database setup, schema drift, RLS position |
| [`../backend/README.md`](../backend/README.md) | Backend folder layout and what is a stub |
