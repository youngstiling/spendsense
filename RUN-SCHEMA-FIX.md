# Fix “Database schema is out of date” (one time)

I can’t run this from Cursor without your **Supabase database password**.

## Fastest: SQL Editor (2 minutes)

1. Open: https://supabase.com/dashboard/project/iptblxxntgabuqdnrzvk/sql/new  
2. Paste all of `supabase/fix-spend-transactions-schema.sql`  
3. Click **Run**  
4. Hard-refresh: https://spendsense-wine-five.vercel.app/dashboard  

## Or: PowerShell (password in terminal only)

```powershell
cd c:\Users\DermidYoung\projects\spendsense
$env:SUPABASE_DB_PASSWORD = "PASTE_DB_PASSWORD_HERE"
.\scripts\run-supabase-schema-fix.ps1
```

Password: Supabase → **Project Settings** → **Database** → database password.

Do **not** commit or paste the password in chat.
