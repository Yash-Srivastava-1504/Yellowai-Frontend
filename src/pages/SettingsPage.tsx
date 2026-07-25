import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { User, Shield, Trash2, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase } from "@/lib/supabase";
import type { ProfileRow } from "@/lib/database.types";
import { updateProfile, deleteAllUserConversations, toQueryError } from "@/lib/userData";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [displayName, setDisplayName] = useState("User");
  const [anonymous, setAnonymous] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const initRef = useRef<string | null>(null);

  useEffect(() => {
    initRef.current = null;
  }, [user?.id]);

  useEffect(() => {
    if (!profile || !user) return;
    if (initRef.current === user.id) return;
    initRef.current = user.id;
    setDisplayName(profile.display_name || "User");
    setAnonymous(Boolean(profile.anonymous));
  }, [profile, user]);

  const persist = useCallback(
    async (patch: Partial<ProfileRow>) => {
      const client = getSupabase();
      if (!client || !user) return;
      setSaving(true);
      try {
        await updateProfile(client, user.id, patch);
        await refreshProfile();
        toast.success("Settings saved.");
      } catch (e) {
        toast.error(toQueryError(e).message || "Could not save settings");
      } finally {
        setSaving(false);
      }
    },
    [user, refreshProfile],
  );

  // Debounce display name saves
  useEffect(() => {
    if (!user || initRef.current !== user.id || !profile) return;
    const t = window.setTimeout(() => {
      if ((profile.display_name || "User") === displayName) return;
      void persist({ display_name: displayName });
    }, 800);
    return () => window.clearTimeout(t);
  }, [displayName]);

  const handleAnonymousToggle = (val: boolean) => {
    setAnonymous(val);
    void persist({ anonymous: val });
  };

  const handleClearHistory = async () => {
    const client = getSupabase();
    if (!client || !user) return;
    try {
      await deleteAllUserConversations(client, user.id);
      toast.success("All conversation history cleared.");
      setShowDeleteConfirm(false);
    } catch (e) {
      toast.error(toQueryError(e).message);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-20 lg:pb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Profile</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="display-name" className="block text-xs font-medium text-muted-foreground mb-1.5">Display Name</label>
            <input
              id="display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
            <p className="text-sm text-foreground bg-secondary/50 rounded-xl px-4 py-2.5 border border-border/40">
              {user?.email ?? "—"}
            </p>
          </div>

          {/* Anonymous mode */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-foreground">Anonymous mode</p>
              <p className="text-xs text-muted-foreground mt-0.5">Hide your display name in the UI</p>
            </div>
            <button
              id="anonymous-toggle"
              type="button"
              onClick={() => handleAnonymousToggle(!anonymous)}
              className={`relative w-11 h-6 rounded-full transition-colors ${anonymous ? "bg-primary" : "bg-secondary border border-border"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${anonymous ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          {saving && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving…
            </div>
          )}
        </div>
      </div>

      {/* Privacy */}
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Privacy & Data</h2>
        </div>

        <div className="space-y-3">
          {!showDeleteConfirm ? (
            <button
              id="clear-history-btn"
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-between rounded-xl border border-border/60 px-4 py-3 text-sm text-muted-foreground hover:text-destructive hover:border-destructive/20 hover:bg-destructive/5 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-4 h-4" />
                Clear all conversation history
              </div>
            </button>
          ) : (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm text-foreground mb-3">
                This will permanently delete <span className="font-semibold">all chat messages</span> across all your agents. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  id="confirm-clear-btn"
                  type="button"
                  onClick={() => void handleClearHistory()}
                  className="rounded-xl bg-destructive text-destructive-foreground px-4 py-2 text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  Yes, delete everything
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sign out */}
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <button
          id="sign-out-btn"
          type="button"
          onClick={() => void handleSignOut()}
          className="w-full flex items-center gap-3 rounded-xl border border-border/60 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
