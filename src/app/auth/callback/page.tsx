"use client";

import { useEffect, useRef } from "react";
import { AuthScreen, AuthSpinner } from "@/components/auth-screen";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function finish() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const token_hash = params.get("token_hash");
      const type = params.get("type");

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as
              | "email"
              | "signup"
              | "invite"
              | "recovery"
              | "email_change"
              | "magiclink",
          });
          if (error) throw error;
        }

        const { data } = await supabase.auth.getSession();
        if (data.session) {
          window.location.replace("/dashboard");
        } else {
          window.location.replace("/login?error=auth");
        }
      } catch {
        window.location.replace("/login?error=auth");
      }
    }

    finish();
  }, []);

  return (
    <AuthScreen title="Signing you in…">
      <AuthSpinner label="Almost there — opening your dashboard" />
    </AuthScreen>
  );
}
