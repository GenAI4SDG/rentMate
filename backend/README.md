# rentMate — Supabase backend

Hong Kong rental platform: schema, RLS, storage, auth hooks; map API in **`server/`**; Edge Function stubs for AI phases. Aligned with `HK_Rental_Platform_Master_Cursor_Spec.md`.

**Run the demo:** [`docs/demo-user-guide.md`](../docs/demo-user-guide.md) (env files, Figma, map API, seed).

---

## Layout

| Path | Purpose |
|------|---------|
| `supabase/migrations/` | PostgreSQL schema, RLS, storage, seeds |
| `server/` | Express map API (port **3001**), geocode, listings GeoJSON, seed scripts |
| `supabase/functions/` | `analyze-agreement`, `rental-chatbot` (Phase 5 stubs) |
| `src/types/database.ts` | TypeScript shapes for clients |

---

## Cloud project (typical)

```bash
cd backend
supabase link --project-ref <your-project-ref>
supabase db push
```

Enable **Email** / **Google** in Authentication → Providers if you wire real auth.

---

## Map API (`server/`)

```bash
cd backend/server    # from repo root; from backend/ use: cd server
cp .env.example .env.local
npm install
npm run dev
```

| Script | Action |
|--------|--------|
| `npm run dev` | Map API :3001 |
| `npm run seed:listings` | Landlord **testing** + 50 HK listings |
| `npm run backfill:geocode` | Throttled geocode for missing coordinates |
| `npm test` | Vitest (bbox helpers) |

From **`backend/`**: `npm run map-api:dev`, `npm run seed:listings`, `npm run map-api:test`.

Figma dev server proxies `/api` → `3001`. Secrets: **`server/.env.local`** only (see demo guide).

---

## Edge Functions

| Function | Deployed route | Body |
|----------|----------------|------|
| `analyze-agreement` | `POST /functions/v1/analyze-agreement` | `{ "agreement_id": "uuid" }` |
| `rental-chatbot` | `POST /functions/v1/rental-chatbot` | `{ "message": "...", "context?": "..." }` |

Deploy: `supabase functions deploy analyze-agreement` (and `rental-chatbot`). Set `OPENAI_API_KEY` in dashboard secrets. Local serve uses `server/.env.local`:

```bash
cd backend && npm run functions:serve
```

Both expect `Authorization: Bearer <user JWT>` unless chatbot runs without OpenAI configured.

---

## Clients & data

Prefer **Supabase client + RLS** for CRUD. Active listings: `properties` where `status = 'active'`. Realtime: `messages`, `notifications`.

**Roommate matching** in the Figma demo is separate from this HK rental migration set (`docs/site-spec-suite/database-schema.md` for proposed roommate tables).

---

## Security

- RLS on every public table  
- **service_role** only in `server/.env.local` / Edge Functions — never in the browser  
- Storage policies scoped by bucket and `auth.uid()`
