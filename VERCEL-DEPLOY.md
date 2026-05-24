# Deploy SpendSense to Vercel (Option B)

Share SpendSense with a remote colleague: hosted app + Supabase login. Each user sees their own data (no shared team dashboard yet).

**Time:** ~15 minutes first time.

---

## Checklist

- [ ] Supabase database schema applied
- [ ] Vercel project created with env vars (demo mode **off**)
- [ ] Supabase auth URLs updated to your Vercel domain
- [ ] Test login + CSV import on the live URL
- [ ] Share URL + sample CSV with colleague

---

## 1. Supabase database

1. Open [Supabase dashboard](https://supabase.com/dashboard) ? your project (`iptblxxntgabuqdnrzvk`).
2. **SQL Editor** ? **New query**.
3. Paste all of `supabase/full-setup.sql` ? **Run**.
4. Confirm no errors (safe to re-run; uses `if not exists` / `drop policy if exists`).

---

## 2. Deploy to Vercel

### Option A � One-command script (recommended)

```powershell
cd C:\Users\DermidYoung\projects\spendsense
.\deploy-vercel.ps1
```

Follow the prompts. First run opens a browser to log in to Vercel.

### Option B � Vercel website (no CLI)

1. Zip the project folder **excluding** `node_modules` and `.next`.
2. Go to [vercel.com/new](https://vercel.com/new) ? sign in.
3. **Import** ? upload zip or connect GitHub if you add Git later.
4. Framework: **Next.js** (auto-detected).
5. Add environment variables (step 3 below) **before** clicking Deploy.

---

## 3. Environment variables (Vercel)

In Vercel: **Project ? Settings ? Environment Variables**

| Name | Value | Environments |
|------|-------|--------------|
| `NEXT_PUBLIC_DEMO_MODE` | `false` | Production, Preview |
| `DEMO_MODE` | `false` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase ? Settings ? API ? Project URL | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase ? Settings ? API ? anon public | Production, Preview |

Copy values from your local `.env.local` (same Supabase project you use locally).

**Important:** Do **not** set demo mode to `true` on Vercel. Demo mode skips login and stores data in the browser only.

After adding or changing env vars, **redeploy** (Deployments ? ? ? Redeploy).

---

## 4. Supabase auth URLs (after first deploy)

Once you have your Vercel URL (production: `https://spendsense-wine-five.vercel.app`):

1. Supabase ? **Authentication** ? **URL Configuration**.
2. **Site URL:** `https://spendsense-wine-five.vercel.app`
3. **Redirect URLs** � add:
   ```
   https://spendsense-wine-five.vercel.app/auth/callback
   https://*-youngstiling.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```
4. **Save**. Optional Vercel env: `NEXT_PUBLIC_SITE_URL=https://spendsense-wine-five.vercel.app`

Email provider should stay enabled (**Authentication ? Providers ? Email**).

---

## 5. Test the live app

1. Open `https://YOUR-APP.vercel.app/login`
2. Enter your email ? open magic link (check spam; personal email often works best on work PCs).
3. Go to **Import** ? upload a CSV or use **Load sample**.
4. Open **Dashboard** � KPIs and charts should populate.

Sample files on the deployed site:

- `/pub_demo_portfolio.csv`
- `/pub_sample_50.csv`
- `/sample.csv`

---

## 6. Share with your colleague

Send them:

1. **App URL:** `https://YOUR-APP.vercel.app`
2. **Instructions:** Open link ? Login ? enter email ? click magic link ? Import ? Dashboard.
3. **Sample CSV:** attach `demo_perfect_pub_spend_3000.csv` or point them to `/pub_demo_portfolio.csv` on the site.

**What to expect:** Each person logs in with their own email and sees **only their imports**. To compare the same numbers, both import the same CSV file, or share a screen.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Redirect error after magic link | Add exact `/auth/callback` URL in Supabase; Site URL must match Vercel domain |
| "Authentication required" on import | Confirm `NEXT_PUBLIC_DEMO_MODE=false` and redeploy |
| "Failed to save" on import | Run `supabase/full-setup.sql`; check Supabase env vars on Vercel |
| Magic link never  arrives | Spam folder; try personal email; confirm Email provider enabled |
| Old demo behaviour (no login) | Env vars not applied � redeploy after setting them |
| Build fails on Vercel | Run `npm run build` locally first; fix TypeScript errors |

---

## Local vs production

| | Local (`.env.local`) | Vercel (production) |
|--|---------------------|---------------------|
| Demo mode | Can be `true` for quick testing | Must be `false` |
| Data storage | Browser (`localStorage`) if demo | Supabase Postgres |
| Login | Skipped in demo | Email magic link required |

Keep demo mode on locally if you prefer; production must use Supabase auth.
