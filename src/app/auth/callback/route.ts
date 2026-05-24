import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authRedirectTarget } from "@/lib/supabase/auth-redirect";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/** Server-side code exchange — sets session cookies for middleware (reliable on Vercel). */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const completeUrl = authRedirectTarget(request, "/auth/complete");
  const errorUrl = authRedirectTarget(request, "/login?error=auth");

  if (!code && !(token_hash && type)) {
    return NextResponse.redirect(errorUrl);
  }

  const response = NextResponse.redirect(completeUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  let error: { message: string } | null = null;

  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (token_hash && type) {
    ({ error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as
        | "email"
        | "signup"
        | "invite"
        | "recovery"
        | "email_change"
        | "magiclink",
    }));
  }

  if (!error) return response;

  console.error("[auth/callback]", error.message);
  return NextResponse.redirect(errorUrl);
}
