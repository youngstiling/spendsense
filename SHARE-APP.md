# Share SpendSense (Vercel)

**Link to send:** https://spendsense-wine-five.vercel.app

**Instructions for your colleague:**

1. Open the link → **Login**
2. Enter email → **Send Magic Link**
3. Open the email link (check spam; Gmail often works best)
4. **Import** CSV → **Dashboard**

---

# Login not working? — 2-minute test

Do this once on https://spendsense-wine-five.vercel.app/login

**Step 1 — Send link**  
Enter your email (try **personal Gmail** if work email fails) → **Send Magic Link**

**Which happens?**

| Letter | What you see | Meaning |
|--------|----------------|---------|
| **A** | Red error on the page right away | Vercel/Supabase config — check env vars + redeploy |
| **B** | Green “check your email” but **no email** (wait 2 min, check spam) | Email blocked or Supabase email off |
| **C** | Email arrives, you click link, then **back at login** or red error | Supabase redirect URL wrong |
| **D** | Email works, you reach **Dashboard** | Login is fine — share the link |

Reply with **A, B, C, or D** and we can fix the exact step.

---

# Supabase checklist (for C or A)

[URL Configuration](https://supabase.com/dashboard/project/iptblxxntgabuqdnrzvk/auth/url-configuration)

- **Site URL:** `https://spendsense-wine-five.vercel.app`
- **Redirect URLs:** `https://spendsense-wine-five.vercel.app/auth/callback`
- **Save**

Vercel → Settings → Environment Variables → redeploy after changes.

---

# Magic link lasts 24 hours

Supabase → [Authentication → Providers → Email](https://supabase.com/dashboard/project/iptblxxntgabuqdnrzvk/auth/providers?provider=Email)

Set **Email OTP expiration** to **`86400`** (24 hours) → **Save**.

New links only — resend if an old link expired.
