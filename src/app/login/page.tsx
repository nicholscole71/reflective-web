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
    <main className="calm-shell mx-auto flex min-h-screen w-full max-w-md items-center px-5">
      <section className="calm-card w-full p-7 sm:p-8">
        <p className="text-xs tracking-[0.2em] text-stone-500 uppercase">Reflective</p>
        <h1 className="mt-3 text-2xl leading-8 font-medium text-stone-800">
          A quiet space for deeper thought
        </h1>
        <p className="calm-note mt-3">Sign in to continue your daily reflection.</p>

        {!hasSupabaseEnv && (
          <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
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
            className="calm-input"
          />
          <input
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="calm-input"
          />

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading || !hasSupabaseEnv}
              onClick={(e) => void onSubmit(e, "login")}
              className="calm-primary-btn flex-1 disabled:opacity-60"
            >
              {loading ? "working..." : "log in"}
            </button>
            <button
              type="submit"
              disabled={loading || !hasSupabaseEnv}
              onClick={(e) => void onSubmit(e, "signup")}
              className="calm-secondary-btn flex-1 disabled:opacity-60"
            >
              sign up
            </button>
          </div>
        </form>

        {message && <p className="calm-note mt-4">{message}</p>}
      </section>
    </main>
  );
}
