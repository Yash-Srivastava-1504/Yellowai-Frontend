import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { toast } from "sonner";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  getDay,
} from "date-fns";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase } from "@/lib/supabase";
import { fetchMoodEntriesSince, insertMoodEntry } from "@/lib/userData";
import type { MoodEntryRow } from "@/lib/database.types";

const moodEmojis = ["😢", "😟", "😐", "🙂", "😊"];
const moodLabels = ["Very Bad", "Bad", "Okay", "Good", "Great"];
const moodColors = ["hsl(0 72% 55%)", "hsl(24 80% 55%)", "hsl(38 92% 50%)", "hsl(120 40% 55%)", "hsl(152 60% 42%)"];
const tags = ["Stress", "Family", "Work", "Friends", "Health", "Sleep", "Exams", "Loneliness"];

type ViewType = "log" | "history";

function aggregateTagCounts(entries: MoodEntryRow[]): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const e of entries) {
    for (const t of e.tags ?? []) {
      acc[t] = (acc[t] ?? 0) + 1;
    }
  }
  return acc;
}

export default function MoodPage() {
  const { user } = useAuth();
  const [view, setView] = useState<ViewType>("log");
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [entries, setEntries] = useState<MoodEntryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    const client = getSupabase();
    if (!client || !user) return;
    setLoading(true);
    try {
      const since = subDays(new Date(), 120).toISOString();
      const data = await fetchMoodEntriesSince(client, user.id, since);
      setEntries(data);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Could not load moods");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const weeklyData = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });
    const byDay: Record<string, MoodEntryRow | undefined> = {};
    for (const e of entries) {
      const key = format(new Date(e.created_at), "yyyy-MM-dd");
      const cur = byDay[key];
      if (!cur || new Date(e.created_at) > new Date(cur.created_at)) byDay[key] = e;
    }
    return days.map((d) => {
      const key = format(d, "yyyy-MM-dd");
      const row = byDay[key];
      return {
        day: format(d, "EEE"),
        mood: row ? row.mood_level + 1 : 0,
        hasData: Boolean(row),
      };
    });
  }, [entries]);

  const monthCells = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    const days = eachDayOfInterval({ start, end });
    const byDay: Record<string, MoodEntryRow | undefined> = {};
    for (const e of entries) {
      const key = format(new Date(e.created_at), "yyyy-MM-dd");
      const cur = byDay[key];
      if (!cur || new Date(e.created_at) > new Date(cur.created_at)) byDay[key] = e;
    }
    const pad = (getDay(start) + 6) % 7;
    return { pad, days: days.map((d) => ({ d, key: format(d, "yyyy-MM-dd"), row: byDay[format(d, "yyyy-MM-dd")] })) };
  }, [entries]);

  const insights = useMemo(() => {
    if (entries.length === 0) {
      return { avg: null as number | null, bestDay: "—", count: 0, topTag: "—" };
    }
    const avg = entries.reduce((s, e) => s + e.mood_level, 0) / entries.length;
    const byWeekday: Record<number, number[]> = {};
    for (const e of entries) {
      const wd = new Date(e.created_at).getDay();
      if (!byWeekday[wd]) byWeekday[wd] = [];
      byWeekday[wd].push(e.mood_level);
    }
    let bestWd = 0;
    let bestScore = -1;
    for (const [wd, arr] of Object.entries(byWeekday)) {
      const m = arr.reduce((a, b) => a + b, 0) / arr.length;
      if (m > bestScore) {
        bestScore = m;
        bestWd = Number(wd);
      }
    }
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const tagCounts = aggregateTagCounts(entries);
    const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    return {
      avg,
      bestDay: dayNames[bestWd],
      count: entries.length,
      topTag,
    };
  }, [entries]);

  const handleSave = async () => {
    if (selectedMood === null || !user) return;
    const client = getSupabase();
    if (!client) return;
    try {
      await insertMoodEntry(client, user.id, selectedMood, selectedTags, note);
      await loadEntries();
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setSelectedMood(null);
        setSelectedTags([]);
        setNote("");
        setView("history");
      }, 1500);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save mood");
    }
  };

  const toggleTag = (tag: string) => setSelectedTags((p) => (p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag]));

  const chartData = weeklyData.map((d) => ({ ...d, mood: d.hasData ? d.mood : 3 }));

  return (
    <div className="max-w-xl mx-auto pb-20 lg:pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Mood Tracker</h1>
        <div className="flex gap-1 p-1 rounded-xl bg-secondary/50">
          {(["log", "history"] as ViewType[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all capitalize ${
                view === v ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "log" ? "Log" : "History"}
            </button>
          ))}
        </div>
      </div>

      {view === "log" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {saved ? (
            <div className="rounded-2xl border border-success/20 bg-success/5 p-16 text-center">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-success" />
              </div>
              <p className="text-base font-semibold text-foreground">Mood logged!</p>
              <p className="text-sm text-muted-foreground mt-1">Great job keeping track 🌟</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-2xl border border-border/60 bg-card p-6 text-center">
                <h2 className="text-base font-semibold text-foreground mb-8">How are you feeling?</h2>
                <div className="flex justify-center gap-6 mb-3">
                  {moodEmojis.map((emoji, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedMood(i)}
                      className={`text-4xl transition-all duration-200 hover:scale-110 ${selectedMood === i ? "scale-125" : "opacity-25 hover:opacity-50"}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                {selectedMood !== null && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-medium"
                    style={{ color: moodColors[selectedMood] }}
                  >
                    {moodLabels[selectedMood]}
                  </motion.p>
                )}
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-6">
                <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">What's contributing?</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full px-3.5 py-2 text-xs font-medium transition-all border ${
                        selectedTags.includes(tag)
                          ? "border-primary/30 bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/15"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-6">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Note (optional)</p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 200))}
                  placeholder="What's on your mind..."
                  rows={3}
                  className="w-full rounded-xl border border-border bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-primary/30 transition-colors"
                />
                <p className="text-[10px] text-muted-foreground text-right font-mono mt-1">{note.length}/200</p>
              </div>

              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={selectedMood === null}
                className="w-full rounded-full bg-primary text-primary-foreground py-3.5 text-sm font-medium disabled:opacity-20 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                Save Entry
              </button>
            </div>
          )}
        </motion.div>
      )}

      {view === "history" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-12">Loading your moods…</p>
          ) : (
            <>
              <div className="rounded-2xl border border-border/60 bg-card p-6">
                <h2 className="text-sm font-semibold text-foreground mb-5">This Week</h2>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="mg2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      />
                      <YAxis hide domain={[1, 5]} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 12,
                          color: "hsl(var(--foreground))",
                          fontSize: 12,
                        }}
                        formatter={(val: number) => {
                          const v = Number(val);
                          if (!v || v < 1) return ["No entry", "Mood"];
                          return [moodEmojis[v - 1] + " " + moodLabels[v - 1], "Mood"];
                        }}
                      />
                      <Area type="monotone" dataKey="mood" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#mg2)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-6">
                <h2 className="text-sm font-semibold text-foreground mb-4">This Month</h2>
                <div className="grid grid-cols-7 gap-1.5">
                  {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                    <div key={i} className="text-[10px] text-muted-foreground text-center font-medium py-1">
                      {d}
                    </div>
                  ))}
                  {Array.from({ length: monthCells.pad }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {monthCells.days.map(({ d, row }) => (
                    <div
                      key={d.toISOString()}
                      className="aspect-square rounded-lg flex flex-col items-center justify-center cursor-default gap-0.5"
                      style={{
                        backgroundColor: row ? `${moodColors[row.mood_level]}15` : "hsl(var(--secondary) / 0.35)",
                      }}
                      title={row ? `${format(d, "d")}: ${moodLabels[row.mood_level]}` : format(d, "d")}
                    >
                      {row ? <span className="text-sm leading-none">{moodEmojis[row.mood_level]}</span> : null}
                      <span className={`text-[9px] leading-none ${row ? "text-muted-foreground" : "text-muted-foreground/80"}`}>
                        {format(d, "d")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-6">
                <h2 className="text-sm font-semibold text-foreground mb-4">Insights</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Average mood",
                      value: insights.avg !== null ? moodLabels[Math.round(insights.avg)] : "—",
                      emoji: insights.avg !== null ? moodEmojis[Math.min(4, Math.round(insights.avg))] : "😐",
                    },
                    { label: "Best day", value: insights.bestDay, emoji: "🎉" },
                    { label: "Entries", value: String(insights.count), emoji: "📝" },
                    { label: "Top trigger", value: insights.topTag, emoji: "📚" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-surface p-4">
                      <p className="text-lg mb-1">{item.emoji}</p>
                      <p className="text-sm font-semibold text-foreground">{item.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-primary/5 border border-primary/10 p-5">
                <p className="text-xs font-medium text-primary uppercase tracking-wider mb-2">💡 Insight</p>
                <p className="text-sm text-foreground leading-relaxed">
                  {entries.length < 3
                    ? "Log a few more moods to unlock richer insights — consistency helps you spot patterns."
                    : `You’ve logged ${entries.length} moods. Keep going — small check-ins add up to clearer self-awareness.`}
                </p>
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
