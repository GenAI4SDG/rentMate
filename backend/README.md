# rentMate — Supabase backend

Hong Kong rental platform backend aligned with `HK_Rental_Platform_Master_Cursor_Spec.md` (Phase 1 foundation: schema, RLS, storage, auth hooks; Edge Function stubs for AI phases).

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase`)
- Docker (for `supabase start` local stack)
- A Supabase project (cloud) or local CLI stack

## Quick start (local)

```bash
cd backend
supabase start
supabase db reset   # applies migrations + seed
```

After start, the CLI prints `API URL`, `anon key`, and `service_role key`. Use them in your frontend or Next.js app:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase start>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
OPENAI_API_KEY=
MAPBOX_ACCESS_TOKEN=
```

## Cloud project

```bash
cd backend
supabase link --project-ref <your-project-ref>
supabase db push
supabase functions deploy analyze-agreement
supabase functions deploy rental-chatbot
```

Enable **Email** and **Google** providers in Authentication → Providers. Turn on **Confirm email** for the verify-email requirement in the spec.

## Layout

| Path | Purpose |
|------|---------|
| `supabase/migrations/` | PostgreSQL schema, RLS, storage, seeds |
| `supabase/functions/analyze-agreement/` | Agreement upload review pipeline (Phase 5 stub) |
| `supabase/functions/rental-chatbot/` | HK rental assistant (Phase 5 stub) |
| `src/types/database.ts` | Generated-style TypeScript shapes for clients |

## API surface

Clients should prefer **Supabase client + RLS** for CRUD. The master spec also lists REST-style routes (`/api/properties`, etc.); implement those in Next.js Route Handlers that call the same tables with the user's JWT, or use PostgREST filters directly from the browser where RLS allows.

### Property search (PostgREST)

Active listings: `properties` where `status = 'active'`, with filters on `district`, `monthly_rent`, `bedrooms`, `bathrooms`, `property_type`, and full-text on `title_en` / `title_zh`. Pagination: `range(0, 19)` for 20 rows. Sort via `order('created_at', { ascending: false })`.

### Realtime

Subscribe to `messages` and `notifications` for chat and alerts (`supabase.channel(...).on('postgres_changes', ...)`).

## Roommate matching (rentMate product)

The Figma demo uses a separate roommate flow (`docs/site-spec-suite/database-schema.md`). Those tables are **not** in this HK rental spec migration set. Add a follow-up migration (e.g. `student_verifications`, `quiz_answers`) when you wire the matching feature to this backend.

## Security checklist

- RLS enabled on every public table
- Service role key only on server / Edge Functions
- Storage policies scoped by bucket and `auth.uid()`
- Rate limiting for Edge Functions and Next.js API routes (configure at gateway / middleware in the app layer)
