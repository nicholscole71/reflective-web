"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";

type Entry = {
  id: string;
  entry_date: string;
  content: string;
  created_at: string;
  prompt: {
    title: string;
    body: string;
  } | null;
};

type RawEntry = {
  id: string;
  entry_date: string;
  content: string;
  created_at: string;
  prompt: { title: string; body: string }[] | null;
};

export default function EntriesPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(hasSupabaseEnv);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    client.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }

      const uid = data.session.user.id;
      const { data: rows, error: listError } = await client
        .from("entries")
        .select("id, entry_date, content, created_at, prompt:prompts(title, body)")
        .eq("user_id", uid)
        .order("entry_date", { ascending: false });

      if (listError) {
        setError(listError.message);
      } else {
        const mapped: Entry[] = ((rows as RawEntry[] | null) ?? []).map((row) => ({
          id: row.id,
          entry_date: row.entry_date,
          content: row.content,
          created_at: row.created_at,
          prompt: row.prompt?.[0] ?? null,
        }));
        setEntries(mapped);
      }
      setLoading(false);
    });
  }, [router]);

  return (
    <div className="calm-shell">
      <TopNav />
      <main className="mx-auto w-full max-w-2xl px-5 py-10">
        <div className="mb-6">
          <p className="text-xs tracking-[0.2em] text-stone-500 uppercase">Archive</p>
          <h1 className="mt-3 text-2xl leading-8 font-medium text-stone-800">Your entries</h1>
          <p className="calm-note mt-2">A gentle record of what you&apos;ve been noticing.</p>
        </div>

        {!hasSupabaseEnv && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Missing Supabase env vars. Add them in .env.local.
          </p>
        )}

        {loading && <p className="calm-note mt-6">Loading...</p>}
        {error && <p className="mt-6 text-red-600">{error}</p>}

        <ul className="mt-6 space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="calm-card p-5">
              <p className="text-xs tracking-wide text-stone-500">{entry.entry_date}</p>
              {entry.prompt?.title && (
                <p className="mt-2 text-sm font-medium text-stone-800">{entry.prompt.title}</p>
              )}
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-stone-800">
                {entry.content}
              </p>
            </li>
          ))}
        </ul>

        {!loading && entries.length === 0 && !error && (
          <p className="calm-note mt-6">No entries yet. Write one on Today.</p>
        )}
      </main>
    </div>
  );
}
