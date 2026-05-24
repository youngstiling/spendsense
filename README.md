# SpendSense MVP

CSV → parse → normalise suppliers → dashboard.

## Setup

**Full Supabase guide:** see [SUPABASE-SETUP.md](./SUPABASE-SETUP.md)

1. Create Supabase project → run `supabase/schema.sql`
2. `copy .env.local.example .env.local` — add URL + anon key
3. `.\run-dev.ps1` (portable Node) or `npm run dev`

## Flow

1. `/login` — magic link
2. `/upload` — CSV (file or paste) → csv-parse + date-fns + currency.js + fuse.js → save
3. `/dashboard` — totals, charts, table, 2 insights

## Code

- `src/lib/csv.ts` — parsing + supplier normalisation
- `src/app/upload/page.tsx` — upload + save
- `src/app/dashboard/page.tsx` — display
