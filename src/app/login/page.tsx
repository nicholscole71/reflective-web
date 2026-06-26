"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/today");
    });
  }, [router]);

  const onSubmit = async (e: FormEvent, mode: "login" | "signup") => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setMessage(null);

    const action =
      mode === "login"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });

    const { error } = await action;
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (mode === "signup") {
      setMessage("Account created. If email confirmation is on, confirm then log in.");
      return;
    }

    router.replace("/today");
  };

  return (
    <main className="journal-shell mx-auto flex min-h-screen w-full max-w-md items-center px-5 page-enter">
      <section className="journal-glow journal-glow-soft w-full">
        <div className="journal-card w-full p-7 sm:p-8">
        <p className="text-xs tracking-[0.24em] uppercase text-[#C7BEB6]">Reflective</p>
        <h1 className="journal-title mt-4 text-[clamp(1.9rem,4vw,2.5rem)]">
          A quiet space for deeper thought
        </h1>
        <p className="journal-subtitle mt-3">Sign in to continue your daily reflection.</p>

        {!hasSupabaseEnv && (
          <p className="mt-5 rounded-xl border border-[#7b5b3e] bg-[rgba(179,138,90,0.12)] px-4 py-3 text-sm text-[#f0d6b8]">
            Missing env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
          </p>
        )}

        <form className="mt-6 space-y-3">
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="journal-field"
          />
          <input
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="journal-field"
          />

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading || !hasSupabaseEnv}
              onClick={(e) => void onSubmit(e, "login")}
              className="journal-btn flex-1 disabled:opacity-60"
            >
              {loading ? "Working..." : "Log In"}
            </button>
            <button
              type="submit"
              disabled={loading || !hasSupabaseEnv}
              onClick={(e) => void onSubmit(e, "signup")}
              className="flex-1 rounded-[14px] border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-2.5 text-sm font-semibold text-[#F6F1EB] transition hover:scale-[1.02] hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-60"
            >
              Sign Up
            </button>
          </div>
        </form>

        {message && <p className="journal-status mt-4">{message}</p>}
        </div>
      </section>
    </main>
  );
}
