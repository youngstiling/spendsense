"use client";

import { useEffect, useRef } from "react";
import { AuthScreen, AuthSpinner } from "@/components/auth-screen";
import { supabase } from "@/lib/supabaseClient";

/** Shown after server callback sets cookies — smooth handoff to dashboard. */
export default function AuthCompletePage() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function finish() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        window.location.replace("/dashboard");
      } else {
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
