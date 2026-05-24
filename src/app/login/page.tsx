"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
    setMessage(
      "Check your email for the magic link. You have up to 24 hours if configured in Supabase (default is 1 hour)."
    );
  }

  async function resendLink() {
    if (!email) return;
    const supabase = createClient();
    setStatus("loading");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setStatus(error ? "error" : "sent");
    setMessage(
      error
        ? error.message
        : "New link sent. Use the latest email — older links stop working."
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-slate-200 rounded-lg p-8 shadow-sm">
        <h1 className="text-2xl font-semibold mb-1">SpendSense</h1>
        <p className="text-slate-500 text-sm mb-6">
          Upload CSV → see spend insights in seconds.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-teal-600 text-white rounded-md py-2 text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
          >
            {status === "loading" ? "Sending…" : "Send magic link"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-sm ${status === "error" ? "text-red-600" : "text-teal-700"}`}
          >
            {message}
          </p>
        )}

        {status === "sent" && (
          <button
            type="button"
            onClick={resendLink}
            className="mt-3 w-full text-sm text-teal-700 underline"
          >
            Resend magic link
          </button>
        )}
      </div>
    </main>
  );
}
