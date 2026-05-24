# Supabase setup for SpendSense

## 1. Create project

1. Go to [https://supabase.com](https://supabase.com) and sign in (personal account is fine on a work PC).
2. **New project** → pick a name (e.g. `spendsense`) and a database password → **Create**.

## 2. Run the database schema

1. In Supabase: **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` from this repo, copy all of it, paste into the editor.
3. Click **Run**. You should see success (table `spend_transactions` + RLS policies).

## 3. Auth (magic link)

1. **Authentication** → **Providers** → ensure **Email** is enabled.
2. **Authentication** → **URL Configuration**:
   - **Site URL (local):** `http://localhost:3000`
   - **Redirect URLs** — add:
     ```
     http://localhost:3000/auth/callback
     https://spendsense-wine-five.vercel.app/auth/callback
     https://*-youngstiling.vercel.app/auth/callback
     ```
3. Save.

4. **Magic link valid for 24 hours (recommended):**
   - Open [Authentication → Providers → Email](https://supabase.com/dashboard/project/iptblxxntgabuqdnrzvk/auth/providers?provider=Email)
   - Find **Email OTP expiration** (or **OTP expiry**)
   - Set to **`86400`** (seconds = 24 hours). Default is often `3600` (1 hour).
   - Click **Save**

On a work PC, use a **personal email** for the magic link if your work inbox blocks external links.

## 4. API keys → `.env.local`

1. **Project Settings** → **API**.
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. In the project folder:

```powershell
cd C:\Users\DermidYoung\projects\spendsense
copy .env.local.example .env.local
```

4. Edit `.env.local` and paste your real values (no quotes needed):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 5. Run the app

```powershell
.\run-dev.ps1
```

Open http://localhost:3000 → login with email → click magic link → **Upload** → use `public\sample.csv` → **Dashboard**.

## 6. Production deploy (Vercel)

For sharing with a remote colleague, deploy to Vercel with demo mode **off**.

**Full guide:** `VERCEL-DEPLOY.md`

Quick summary:

1. Run `supabase/full-setup.sql` in SQL Editor (includes import tables).
2. Deploy via `.\deploy-vercel.ps1` or [vercel.com](https://vercel.com).
3. Vercel env vars: `NEXT_PUBLIC_DEMO_MODE=false`, `DEMO_MODE=false`, plus Supabase URL and anon key.
4. After deploy, set Supabase **Site URL** and **Redirect URL** to your `https://your-app.vercel.app` domain.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Magic link never arrives | Check spam; try personal email; confirm Email provider enabled |
| Redirect error after click | Add exact callback URL in Supabase URL config |
| "Failed to save" on upload | Run `full-setup.sql` again; check env vars |
| Network / blocked | Work firewall may block Supabase — try phone hotspot briefly |
