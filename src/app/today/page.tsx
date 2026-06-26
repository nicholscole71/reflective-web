"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";
import { getDailyPrompt } from "@/lib/dailyPrompts";

function localDateString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function TodayPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const today = useMemo(() => localDateString(), []);
  const prompt = useMemo(() => getDailyPrompt(today), [today]);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    client.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }

      const uid = data.session.user.id;
      setUserId(uid);

      const { data: existing } = await client
        .from("entries")
        .select("id, content")
        .eq("user_id", uid)
        .eq("entry_date", today)
        .maybeSingle();

      if (existing) {
        setEntryId(existing.id);
        setContent(existing.content ?? "");
      }
    });
  }, [router, today]);

  const onSave = async () => {
    if (!supabase || !userId) return;
    setSaving(true);
    setStatus(null);

    const payload = {
      user_id: userId,
      entry_date: today,
      content,
    };

    const result = entryId
      ? await supabase.from("entries").update({ content }).eq("id", entryId)
      : await supabase.from("entries").insert(payload).select("id").single();

    setSaving(false);

    if (result.error) {
      setStatus(result.error.message);
      return;
    }

    if (!entryId && "data" in result && result.data?.id) {
      setEntryId(result.data.id);
    }
    setStatus("Saved.");
  };

  return (
    <div className="journal-shell">
      <TopNav />
      <main className="journal-main page-enter">
        <section className="journal-glow journal-glow-strong">
          <div className="journal-card p-7 sm:p-10">
            <p className="text-xs tracking-[0.24em] uppercase text-[#C7BEB6]">Today</p>
            <h1 className="journal-title mt-4">
            {prompt.title}
            </h1>
            <p className="journal-subtitle mt-5">{prompt.description}</p>
            <p className="mt-4 text-xs tracking-[0.18em] uppercase text-[#B38A5A]">
              {prompt.category}
            </p>

            <div className="journal-divider" />
            <h2 className="journal-label">Reflection</h2>
            <p className="journal-body mt-3">{prompt.reflection_question}</p>

            {!hasSupabaseEnv && (
              <p className="mt-6 rounded-xl border border-[#7b5b3e] bg-[rgba(179,138,90,0.12)] px-4 py-3 text-sm text-[#f0d6b8]">
                Missing Supabase env vars. Add them in .env.local.
              </p>
            )}

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={"Begin writing...\n\nTake your time.\nNo one will read this except you."}
              className="journal-input mt-7"
            />

            <div className="journal-divider" />
            <h2 className="journal-label">Experiment for Today</h2>
            <p className="journal-body mt-3">{prompt.experiment}</p>

            <div className="mt-8 flex items-center gap-3">
              <button
                type="button"
                onClick={() => void onSave()}
                disabled={saving || !hasSupabaseEnv}
                className="journal-btn"
              >
                {saving ? "saving..." : "save entry"}
              </button>
              {status && <span className="journal-status">{status}</span>}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
