"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthScreen, AuthSpinner } from "@/components/auth-screen";
import { magicLinkRedirectTo } from "@/lib/supabase/auth-redirect";
import { supabase } from "@/lib/supabaseClient";

type Status = "checking" | "idle" | "loading" | "sent" | "error";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        window.location.replace("/dashboard");
        return;
      }

      const params = new URLSearchParams(window.location.search);
      if (params.get("error") === "auth") {
        setStatus("error");
        setMessage(
          "That login link expired or was already used. Send a fresh link below."
        );
        return;
      }

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
      if (!url || !key || key.length < 40) {
        setStatus("error");
        setMessage(
          "Login is not configured on this deployment. Add Supabase env vars on Vercel and redeploy."
        );
        return;
      }

      setStatus("idle");
    };

    check();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: magicLinkRedirectTo(window.location.origin),
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  function resetForm() {
    setStatus("idle");
    setMessage("");
  }

  if (status === "checking") {
    return (
      <AuthScreen title="Checking your session">
        <AuthSpinner label="Checking your session…" />
      </AuthScreen>
    );
  }

  if (status === "sent") {
    return (
      <AuthScreen
        title="Check your email"
        subtitle="Use the secure magic link to open your private spend workspace."
      >
        <p className="text-sm text-slate-600">
          We&apos;ve sent you a secure login link
          {email ? (
            <>
              {" "}
              to <span className="font-medium text-slate-800">{email}</span>
            </>
          ) : null}
          . It can stay valid for up to 24 hours if configured in Supabase.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-turquoise-600 py-2.5 text-sm font-medium text-white hover:bg-turquoise-700"
          >
            Open Gmail
          </a>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-md border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Use different email
          </button>
        </div>
        <Link
          href="/"
          className="mt-6 inline-block text-sm text-slate-500 hover:text-slate-700"
        >
          ← Back to home
        </Link>
      </AuthScreen>
    );
  }

  const buttonLabel = status === "loading" ? "Sending..." : "Send secure login link";

  return (
    <AuthScreen
      title="Welcome to SpendSense"
      subtitle="Sign in to upload CSVs, benchmark pubs, and track supplier cost risk."
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            disabled={status === "loading"}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise-500 disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-md bg-turquoise-600 py-2.5 text-sm font-medium text-white hover:bg-turquoise-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {buttonLabel}
        </button>
      </form>

      {message && status === "error" && (
        <p className="mt-4 text-left text-sm text-red-600">{message}</p>
      )}

      <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          First 5 minutes
        </p>
        <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
          <li>1. Sign in with your work email.</li>
          <li>2. Upload a spend CSV.</li>
          <li>3. Open Benchmark and Overview for the first signals.</li>
        </ul>
      </div>

      <Link
        href="/"
        className="mt-6 inline-block text-sm text-slate-500 hover:text-slate-700"
      >
        ← Back to home
      </Link>
    </AuthScreen>
  );
}
