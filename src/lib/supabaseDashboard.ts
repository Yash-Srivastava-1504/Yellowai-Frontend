function parseSupabaseProjectRef(): string | null {
  const raw = import.meta.env.VITE_SUPABASE_URL;
  if (typeof raw !== "string" || !raw.trim()) return null;
  const m = raw.trim().match(/^https:\/\/([a-z0-9-]+)\.supabase\.co(?:\/|$)/i);
  return m ? m[1] : null;
}

/** Project reference ID from VITE_SUPABASE_URL (for matching Dashboard ↔ app). */
export function getSupabaseProjectRef(): string | null {
  return parseSupabaseProjectRef();
}

/** Opens the SQL Editor for the project in VITE_SUPABASE_URL (same project the app uses). */
export function getSupabaseSqlEditorUrl(): string | null {
  const ref = parseSupabaseProjectRef();
  if (!ref) return null;
  return `https://supabase.com/dashboard/project/${ref}/sql/new`;
}

/** API settings (exposed schemas, etc.) for this project. */
export function getSupabaseApiSettingsUrl(): string | null {
  const ref = parseSupabaseProjectRef();
  if (!ref) return null;
  return `https://supabase.com/dashboard/project/${ref}/settings/api`;
}
