import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabaseApiSettingsUrl, getSupabaseProjectRef, getSupabaseSqlEditorUrl } from "@/lib/supabaseDashboard";

export default function AuthRoutes() {
  const { configured, session, profile, profileError, loading } = useAuth();
  const loc = useLocation(); // kept for the /login redirect state

  if (!configured) {
    return <Navigate to="/" replace state={{ reason: "no_supabase" }} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading your space…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  if (profileError) {
    const sqlUrl = getSupabaseSqlEditorUrl();
    const apiSettingsUrl = getSupabaseApiSettingsUrl();
    const projectRef = getSupabaseProjectRef();
    const isMissingProfiles = profileError.includes("PGRST205") || profileError.toLowerCase().includes("public.profiles");
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-4">
          <p className="text-sm font-medium text-foreground">Couldn&apos;t load your data</p>
          <p className="text-xs text-muted-foreground text-left break-words">{profileError}</p>
          {projectRef && (
            <p className="text-xs text-muted-foreground text-left">
              This build points at Supabase project <code className="bg-muted px-1 rounded">{projectRef}</code> — run SQL in that project only (Dashboard → Settings → General → Reference ID should match).
            </p>
          )}
          {isMissingProfiles && (
            <div className="rounded-lg bg-background/80 border border-border/60 p-4 text-left text-xs text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">Fix: create the table in the same Supabase project as this app</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Open the SQL Editor for this project (button below).</li>
                <li>Paste <code className="bg-muted px-1 rounded">supabase/minimal-profiles-core.sql</code> (or full <code className="bg-muted px-1 rounded">minimal-profiles.sql</code>), then Run.</li>
                <li>In Settings → API, ensure the list of exposed schemas includes <code className="bg-muted px-1 rounded">public</code>.</li>
                <li>Wait ~30 seconds, then refresh this page.</li>
              </ol>
              {apiSettingsUrl && (
                <a
                  href={apiSettingsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-primary underline underline-offset-2 hover:opacity-90"
                >
                  Open API settings (exposed schemas)
                </a>
              )}
            </div>
          )}
          {!isMissingProfiles && (
            <p className="text-xs text-muted-foreground">
              If tables or policies are missing, run <code className="bg-muted px-1 rounded">supabase/setup.sql</code> in the SQL Editor.
            </p>
          )}
          {sqlUrl && (
            <a
              href={sqlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90"
            >
              Open Supabase SQL Editor (this project)
            </a>
          )}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Setting up your profile…</p>
      </div>
    );
  }


  return <Outlet />;
}
