import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { User, Bell, Shield, ChevronRight, Check, MessageCircle, Trash2, Globe, LogOut } from "lucide-react";
import { type CompanionType, companions, setStoredCompanion } from "@/lib/companion";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase } from "@/lib/supabase";
import type { ProfileRow } from "@/lib/database.types";
import { updateProfile, deleteAllUserChats } from "@/lib/userData";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [name, setName] = useState("Friend");
  const [anonymous, setAnonymous] = useState(false);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [reminderTime, setReminderTime] = useState("evening");
  const [language, setLanguage] = useState("hinglish");
  const [selectedCompanion, setSelectedCompanion] = useState<CompanionType>("friend");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const initRef = useRef<string | null>(null);

  useEffect(() => {
    initRef.current = null;
  }, [user?.id]);

  useEffect(() => {
    if (!profile || !user) return;
    if (initRef.current === user.id) return;
    initRef.current = user.id;
    setName(profile.display_name || "Friend");
    setAnonymous(Boolean(profile.anonymous));
    setDailyReminder(profile.notifications_enabled !== false);
    setWeeklyReport(profile.weekly_report !== false);
    setReminderTime(profile.notif_time || "evening");
    setLanguage(profile.language || "hinglish");
    const c = profile.companion as CompanionType | null;
    setSelectedCompanion(c === "didi" || c === "bhaiya" || c === "friend" ? c : "friend");
  }, [profile, user]);

  const persist = useCallback(
    async (patch: Partial<ProfileRow>) => {
      const client = getSupabase();
      if (!client || !user) return;
      try {
        await updateProfile(client, user.id, patch);
        await refreshProfile();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not save settings");
      }
    },
    [user, refreshProfile],
  );

  useEffect(() => {
    if (!user || initRef.current !== user.id || !profile) return;
    const t = window.setTimeout(() => {
      if ((profile.display_name || "Friend") === name) return;
      void persist({ display_name: name });
    }, 500);
    return () => window.clearTimeout(t);
  }, [name, user, profile, persist]);

  const handleCompanionChange = (type: CompanionType) => {
    setSelectedCompanion(type);
    setStoredCompanion(type);
    void persist({ companion: type });
  };

  const Toggle = ({ on, onChange }: { on: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={onChange}
      className={`w-10 h-5.5 rounded-full relative transition-colors duration-200 ${on ? "bg-primary" : "bg-border"}`}
    >
      <div
        className={`w-4 h-4 rounded-full absolute top-[3px] transition-transform duration-200 ${
          on ? "translate-x-[22px] bg-primary-foreground" : "translate-x-[3px] bg-muted-foreground"
        }`}
      />
    </button>
  );

  const handleClearChats = async () => {
    const client = getSupabase();
    if (!client || !user) return;
    try {
      await deleteAllUserChats(client, user.id);
      setShowClearConfirm(false);
      toast.success("Chat history cleared");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not clear chats");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    initRef.current = null;
    navigate("/");
  };

  return (
    <div className="max-w-xl mx-auto pb-20 lg:pb-6 space-y-4">
      <h1 className="text-xl font-bold tracking-tight text-foreground mb-6">Settings</h1>

      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold text-foreground">Profile</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-base font-bold">
            {(anonymous ? "?" : name).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Your name"
              className="w-full rounded-xl border border-border bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-primary/30 transition-colors"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold text-foreground">Language</h2>
        </div>
        <div className="flex gap-2">
          {[
            { value: "en", label: "English" },
            { value: "hi", label: "हिंदी" },
            { value: "hinglish", label: "Hinglish" },
          ].map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => {
                setLanguage(l.value);
                void persist({ language: l.value });
              }}
              className={`flex-1 rounded-xl py-2.5 text-xs font-medium transition-all border ${
                language === l.value ? "border-primary/30 bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold text-foreground">Companion</h2>
        </div>
        <div className="space-y-2">
          {(["didi", "bhaiya", "friend"] as CompanionType[]).map((type) => {
            const c = companions[type];
            const isSelected = selectedCompanion === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleCompanionChange(type)}
                className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all border ${
                  isSelected ? "border-primary/30 bg-primary/5" : "border-transparent hover:bg-secondary/30"
                }`}
              >
                <span className="text-xl">{c.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {c.name} · {c.subtitle}
                  </p>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                </div>
                {isSelected && <Check className="w-4 h-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold text-foreground">Privacy</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">Anonymous Mode</p>
              <p className="text-xs text-muted-foreground">Hide your name in conversations</p>
            </div>
            <Toggle
              on={anonymous}
              onChange={() => {
                const next = !anonymous;
                setAnonymous(next);
                void persist({ anonymous: next });
              }}
            />
          </div>
          <div className="border-t border-border/40 pt-4">
            {showClearConfirm ? (
              <div className="flex items-center gap-2">
                <p className="text-xs text-destructive flex-1">Are you sure? This cannot be undone.</p>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleClearChats()}
                  className="text-xs text-destructive-foreground bg-destructive hover:opacity-90 px-3 py-1.5 rounded-lg"
                >
                  Delete
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-2 text-sm text-destructive hover:text-destructive/80 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Clear all chat history
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground">Daily Check-in</p>
            <Toggle
              on={dailyReminder}
              onChange={() => {
                const next = !dailyReminder;
                setDailyReminder(next);
                void persist({ notifications_enabled: next });
              }}
            />
          </div>
          {dailyReminder && (
            <div className="flex gap-1.5 p-1 rounded-xl bg-secondary/50">
              {[
                { key: "morning", emoji: "🌅" },
                { key: "afternoon", emoji: "☀️" },
                { key: "evening", emoji: "🌙" },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setReminderTime(t.key);
                    void persist({ notif_time: t.key });
                  }}
                  className={`flex-1 rounded-lg py-2 text-xs font-medium capitalize transition-all flex items-center justify-center gap-1 ${
                    reminderTime === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {t.emoji} {t.key}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground">Weekly Reports</p>
            <Toggle
              on={weeklyReport}
              onChange={() => {
                const next = !weeklyReport;
                setWeeklyReport(next);
                void persist({ weekly_report: next });
              }}
            />
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={() => void handleSignOut()}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Log out
      </button>

      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">✨ Premium</h2>
        <ul className="space-y-1.5 text-sm text-muted-foreground mb-4">
          <li className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-primary" /> Unlimited AI chats
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-primary" /> Voice conversations
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-primary" /> Advanced analytics
          </li>
        </ul>
        <p className="text-sm font-semibold text-foreground mb-4">₹149/mo · ₹999/yr</p>
        <button
          type="button"
          className="w-full rounded-full bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/20"
        >
          Upgrade
        </button>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card divide-y divide-border/40">
        {["Privacy Policy", "Terms of Service", "Contact Support"].map((item) => (
          <button
            key={item}
            type="button"
            className="w-full flex items-center justify-between px-5 py-3.5 text-sm text-foreground hover:bg-secondary/30 transition-colors"
          >
            {item} <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        ))}
      </section>

      <p className="text-center text-[10px] text-muted-foreground font-mono pt-1">Manah v1.0.0 · Made with 💙 in India</p>
    </div>
  );
}
