"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

/** Keeps auth redirects smooth after magic link / sign-in. */
export function AuthListener() {
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" || !session) return;
      const path = window.location.pathname;
      if (
        path === "/login" ||
        path === "/" ||
        path.startsWith("/auth/callback")
      ) {
        window.location.replace("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
