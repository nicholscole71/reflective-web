"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";
import { getDailyPrompt } from "@/lib/dailyPrompts";

type Entry = {
  id: string;
  entry_date: string;
  content: string;
  created_at: string;
};

type DayRow = {
  date: string;
  promptTitle: string;
  category: string;
  status: "completed" | "in_progress" | "not_started";
  content: string;
  entryId: string | null;
  createdAt: string | null;
};

function dateStringFromNow(daysBack: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateLabel(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function computeStatus(content: string): DayRow["status"] {
  const len = content.trim().length;
  if (len === 0) return "not_started";
  if (len < 180) return "in_progress";
  return "completed";
}

export default function EntriesPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(hasSupabaseEnv);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(dateStringFromNow(0));
  const [draftByDate, setDraftByDate] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      const { data: rows, error: listError } = await client
        .from("entries")
        .select("id, entry_date, content, created_at")
        .eq("user_id", uid)
        .order("entry_date", { ascending: false });

      if (listError) {
        setError(listError.message);
      } else {
        setEntries((rows as Entry[] | null) ?? []);
      }
      setLoading(false);
    });
  }, [router]);

  const archiveRows = useMemo<DayRow[]>(() => {
    const byDate = new Map(entries.map((e) => [e.entry_date, e]));
    return Array.from({ length: 35 }, (_, i) => {
      const date = dateStringFromNow(i);
      const prompt = getDailyPrompt(date);
      const entry = byDate.get(date);
      const content = entry?.content ?? "";
      return {
        date,
        promptTitle: prompt.title,
        category: prompt.category,
        status: computeStatus(content),
        content,
        entryId: entry?.id ?? null,
        createdAt: entry?.created_at ?? null,
      };
    });
  }, [entries]);

  const selectedPrompt = useMemo(() => getDailyPrompt(selectedDate), [selectedDate]);
  const selectedRow = useMemo(
    () => archiveRows.find((r) => r.date === selectedDate) ?? null,
    [archiveRows, selectedDate]
  );
  const draft = draftByDate[selectedDate] ?? selectedRow?.content ?? "";

  const onSave = async () => {
    if (!supabase || !userId) return;
    setSaving(true);
    setSaveStatus(null);

    const payload = {
      user_id: userId,
      entry_date: selectedDate,
      content: draft,
    };

    const result = selectedRow?.entryId
      ? await supabase.from("entries").update({ content: draft }).eq("id", selectedRow.entryId)
      : await supabase.from("entries").insert(payload).select("id, created_at").single();

    setSaving(false);
    if (result.error) {
      setSaveStatus(result.error.message);
      return;
    }

    if (!selectedRow?.entryId && "data" in result && result.data?.id) {
      const createdAt = result.data.created_at ?? new Date().toISOString();
      const next = {
        id: result.data.id as string,
        entry_date: selectedDate,
        content: draft,
        created_at: createdAt,
      };
      setEntries((prev) => [next, ...prev.filter((p) => p.entry_date !== selectedDate)]);
    } else {
      setEntries((prev) =>
        prev.map((p) => (p.entry_date === selectedDate ? { ...p, content: draft } : p))
      );
    }
    setSaveStatus("Saved.");
  };

  const statusSymbol = (status: DayRow["status"]) => {
    if (status === "completed") return "✓ Completed";
    if (status === "in_progress") return "○ In Progress";
    return "— Not Started";
  };

  return (
    <div className="journal-shell">
      <TopNav />
      <main className="journal-main page-enter">
        <div className="mb-10">
          <p className="text-xs tracking-[0.24em] uppercase text-[#C7BEB6]">Archive</p>
          <h1 className="journal-title mt-4">Your journal history</h1>
          <p className="journal-subtitle mt-3">
            Reopen any day, continue writing, or complete reflections you skipped.
          </p>
        </div>

        {!hasSupabaseEnv && (
          <p className="rounded-xl border border-[#7b5b3e] bg-[rgba(179,138,90,0.12)] px-4 py-3 text-sm text-[#f0d6b8]">
            Missing Supabase env vars. Add them in .env.local.
          </p>
        )}

        {loading && <p className="journal-subtitle mt-6">Loading...</p>}
        {error && <p className="mt-6 text-[#f0b4ae]">{error}</p>}

        {!loading && (
          <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <section className="journal-card archive-scroll max-h-[72vh] overflow-auto p-4">
              <ul className="space-y-1.5">
                {archiveRows.map((row) => (
                  <li key={row.date}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate(row.date);
                        setSaveStatus(null);
                      }}
                      className={`w-full rounded-2xl px-4 py-3 text-left transition duration-200 ${
                        selectedDate === row.date
                          ? "bg-[rgba(179,138,90,0.16)] ring-1 ring-[rgba(179,138,90,0.42)]"
                          : "hover:bg-[rgba(255,255,255,0.03)]"
                      }`}
                    >
                      <p className="text-xs tracking-wide text-[#c7beb6]">{formatDateLabel(row.date)}</p>
                      <p className="mt-1 text-sm font-semibold text-[#f6f1eb]">{row.promptTitle}</p>
                      <p className="mt-1 text-[11px] tracking-[0.15em] uppercase text-[#b38a5a]">
                        {row.category}
                      </p>
                      <p className="mt-1.5 text-xs text-[#c7beb6]">{statusSymbol(row.status)}</p>
                      {row.createdAt && (
                        <p className="mt-1 text-[11px] text-[#a79f98]">
                          Last edited {new Date(row.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="journal-glow journal-glow-soft">
              <div className="journal-card p-6 sm:p-8">
                <p className="text-xs tracking-[0.24em] uppercase text-[#C7BEB6]">
                  {formatDateLabel(selectedDate)}
                </p>
                <h2 className="journal-title mt-4 text-[clamp(1.7rem,3.2vw,2.4rem)]">
                  {selectedPrompt.title}
                </h2>
                <p className="mt-3 text-xs tracking-[0.18em] uppercase text-[#B38A5A]">
                  {selectedPrompt.category}
                </p>
                <p className="journal-subtitle mt-4">{selectedPrompt.description}</p>

                <div className="journal-divider" />
                <h3 className="journal-label">Reflection</h3>
                <p className="journal-body mt-3">{selectedPrompt.reflection_question}</p>

                <textarea
                  value={draft}
                  onChange={(e) =>
                    setDraftByDate((prev) => ({
                      ...prev,
                      [selectedDate]: e.target.value,
                    }))
                  }
                  placeholder={"Begin writing...\n\nTake your time.\nNo one will read this except you."}
                  className="journal-input mt-7 min-h-[330px]"
                />

                <div className="journal-divider" />
                <h3 className="journal-label">Experiment</h3>
                <p className="journal-body mt-3">{selectedPrompt.experiment}</p>

                <div className="mt-8 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void onSave()}
                    disabled={saving || !hasSupabaseEnv}
                    className="journal-btn"
                  >
                    {saving ? "saving..." : "save entry"}
                  </button>
                  {saveStatus && <span className="journal-status">{saveStatus}</span>}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
