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
    <div className="calm-shell">
      <TopNav />
      <main className="mx-auto w-full max-w-2xl px-5 py-10">
        <section className="calm-card p-6 sm:p-7">
          <p className="text-xs tracking-[0.2em] text-stone-500 uppercase">Today</p>
          <h1 className="mt-3 text-2xl leading-8 font-medium text-stone-800">
            {prompt.title}
          </h1>
          <p className="mt-3 text-base leading-7 text-stone-700">
            {prompt.description}
          </p>
          <p className="mt-3 text-sm tracking-wide uppercase text-stone-500">
            Category: {prompt.category}
          </p>
          <p className="mt-4 rounded-xl border border-[#dfe3da] bg-[#ffffffc9] px-4 py-3 text-sm leading-7 text-stone-700">
            <span className="font-medium text-stone-800">Reflection question:</span>{" "}
            {prompt.reflection_question}
          </p>
          <p className="mt-3 rounded-xl border border-[#dfe3da] bg-[#ffffffc9] px-4 py-3 text-sm leading-7 text-stone-700">
            <span className="font-medium text-stone-800">Experiment for today:</span>{" "}
            {prompt.experiment}
          </p>
          <p className="calm-note mt-3">
            Let yourself answer slowly. Clarity matters more than completeness.
          </p>

          {!hasSupabaseEnv && (
            <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Missing Supabase env vars. Add them in .env.local.
            </p>
          )}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your reflection..."
            className="calm-input mt-6 h-64 resize-y leading-7"
          />

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => void onSave()}
              disabled={saving || !hasSupabaseEnv}
              className="calm-primary-btn disabled:opacity-60"
            >
              {saving ? "saving..." : "save entry"}
            </button>
            {status && <span className="calm-note">{status}</span>}
          </div>
        </section>
      </main>
    </div>
  );
}
