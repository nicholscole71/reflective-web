"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";

type Prompt = {
  id: string;
  prompt_date: string;
  title: string;
  body: string;
  source: string;
};

const CURATED_PROMPTS = [
  "What belief have you never seriously questioned, and what might challenge it?",
  "What emotion keeps showing up lately, and what is it trying to protect?",
  "If someone you disagree with explained their view kindly, what would they say?",
  "What invisible standard are you using to judge yourself this week?",
  "What are you avoiding right now, and what fear sits beneath that avoidance?",
  "What would your future self thank you for beginning today, even imperfectly?",
  "What small kindness would make today feel more human for you or someone else?",
];

function localDateString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function promptForDate(date: string) {
  let hash = 2166136261;
  for (let i = 0; i < date.length; i++) {
    hash ^= date.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return CURATED_PROMPTS[(hash >>> 0) % CURATED_PROMPTS.length];
}

export default function TodayPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const today = useMemo(() => localDateString(), []);

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

      const promptRow = await ensureDailyPrompt(client, today);
      if (!promptRow) {
        setStatus("Could not load today's prompt. Please run schema.sql in Supabase.");
        return;
      }
      setPrompt(promptRow);

      const { data: existing } = await client
        .from("entries")
        .select("id, content")
        .eq("user_id", uid)
        .eq("prompt_id", promptRow.id)
        .maybeSingle();

      if (existing) {
        setEntryId(existing.id);
        setContent(existing.content ?? "");
      }
    });
  }, [router, today]);

  const onSave = async () => {
    if (!supabase || !userId || !prompt) return;
    setSaving(true);
    setStatus(null);

    const payload = {
      user_id: userId,
      entry_date: today,
      prompt_id: prompt.id,
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
            {prompt?.title ?? "Daily reflection"}
          </h1>
          <p className="mt-3 text-base leading-7 text-stone-700">
            {prompt?.body ?? "Loading prompt..."}
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

async function ensureDailyPrompt(
  client: NonNullable<typeof supabase>,
  today: string
): Promise<Prompt | null> {
  const existing = await client
    .from("prompts")
    .select("id, prompt_date, title, body, source")
    .eq("prompt_date", today)
    .maybeSingle();

  if (existing.data) return existing.data as Prompt;
  if (existing.error && existing.error.code !== "PGRST116") {
    return null;
  }

  const body = promptForDate(today);
  const inserted = await client
    .from("prompts")
    .insert({
      prompt_date: today,
      title: "Daily reflection",
      body,
      source: "curated",
    })
    .select("id, prompt_date, title, body, source")
    .single();

  if (inserted.data) return inserted.data as Prompt;

  // Handle race: another user inserted first.
  const retry = await client
    .from("prompts")
    .select("id, prompt_date, title, body, source")
    .eq("prompt_date", today)
    .maybeSingle();

  return (retry.data as Prompt | null) ?? null;
}
