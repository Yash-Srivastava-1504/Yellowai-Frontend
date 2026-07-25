import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConversationMessageRow, ConversationRow, ProfileRow, ProjectRow, PromptRow } from "./database.types";

/** PostgREST errors — normalize so the UI shows the real reason (RLS, missing table, etc.). */
export function toQueryError(e: unknown): Error {
  if (e instanceof Error) return e;
  if (e && typeof e === "object" && "message" in e) {
    const o = e as { message?: string; code?: string; details?: string; hint?: string };
    const parts = [o.message, o.code ? `[${o.code}]` : "", o.details, o.hint].filter(Boolean);
    return new Error(parts.join(" — ") || "Unknown database error");
  }
  return new Error(String(e));
}

// ── Profile ────────────────────────────────────────────────────────────────────

export async function fetchOrCreateProfile(
  client: SupabaseClient,
  userId: string,
  email: string | undefined,
): Promise<ProfileRow> {
  const { data: existing, error: e1 } = await client.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (e1) throw toQueryError(e1);
  if (existing) return existing as ProfileRow;
  const { data: inserted, error: e2 } = await client
    .from("profiles")
    .insert({ id: userId, email: email ?? null })
    .select("*")
    .single();
  if (e2) throw toQueryError(e2);
  return inserted as ProfileRow;
}

export async function updateProfile(client: SupabaseClient, userId: string, patch: Partial<ProfileRow>) {
  const { error } = await client.from("profiles").update(patch).eq("id", userId);
  if (error) throw error;
}

// ── Projects ───────────────────────────────────────────────────────────────────

export async function fetchProjects(client: SupabaseClient, userId: string): Promise<ProjectRow[]> {
  const { data, error } = await client
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw toQueryError(error);
  return (data ?? []) as ProjectRow[];
}

export async function fetchProject(client: SupabaseClient, projectId: string): Promise<ProjectRow | null> {
  const { data, error } = await client.from("projects").select("*").eq("id", projectId).maybeSingle();
  if (error) throw toQueryError(error);
  return data as ProjectRow | null;
}

export async function createProject(
  client: SupabaseClient,
  userId: string,
  name: string,
  description: string,
): Promise<ProjectRow> {
  const { data, error } = await client
    .from("projects")
    .insert({ user_id: userId, name: name.trim(), description: description.trim() })
    .select("*")
    .single();
  if (error) throw toQueryError(error);
  return data as ProjectRow;
}

export async function updateProject(
  client: SupabaseClient,
  projectId: string,
  patch: { name?: string; description?: string },
): Promise<ProjectRow> {
  const { data, error } = await client
    .from("projects")
    .update(patch)
    .eq("id", projectId)
    .select("*")
    .single();
  if (error) throw toQueryError(error);
  return data as ProjectRow;
}

export async function deleteProject(client: SupabaseClient, projectId: string): Promise<void> {
  const { error } = await client.from("projects").delete().eq("id", projectId);
  if (error) throw toQueryError(error);
}

// ── Prompts ────────────────────────────────────────────────────────────────────

export async function fetchActivePrompt(client: SupabaseClient, projectId: string): Promise<PromptRow | null> {
  const { data, error } = await client
    .from("prompts")
    .select("*")
    .eq("project_id", projectId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw toQueryError(error);
  return data as PromptRow | null;
}

export async function setProjectPrompt(
  client: SupabaseClient,
  projectId: string,
  content: string,
): Promise<PromptRow> {
  // Deactivate existing active prompts
  await client.from("prompts").update({ is_active: false }).eq("project_id", projectId).eq("is_active", true);
  // Insert new active prompt
  const { data, error } = await client
    .from("prompts")
    .insert({ project_id: projectId, content: content.trim(), is_active: true })
    .select("*")
    .single();
  if (error) throw toQueryError(error);
  return data as PromptRow;
}

// ── Conversations ──────────────────────────────────────────────────────────────

/** Get the latest conversation for a project, or create one if none exists. */
export async function getOrCreateProjectConversation(
  client: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<ConversationRow> {
  const { data: latest, error: e1 } = await client
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (e1) throw toQueryError(e1);
  if (latest) return latest as ConversationRow;
  const { data: created, error: e2 } = await client
    .from("conversations")
    .insert({ user_id: userId, project_id: projectId })
    .select("*")
    .single();
  if (e2) throw toQueryError(e2);
  return created as ConversationRow;
}

/** Messages oldest → newest (for UI + API history). */
export async function fetchConversationMessagesAsc(
  client: SupabaseClient,
  conversationId: string,
): Promise<ConversationMessageRow[]> {
  const { data, error } = await client
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw toQueryError(error);
  return (data ?? []) as ConversationMessageRow[];
}

export async function insertConversationMessageRow(
  client: SupabaseClient,
  conversationId: string,
  role: "user" | "assistant",
  content: string,
): Promise<ConversationMessageRow> {
  const { data, error } = await client
    .from("messages")
    .insert({ conversation_id: conversationId, role, content })
    .select("*")
    .single();
  if (error) throw toQueryError(error);
  return data as ConversationMessageRow;
}

/** Delete all conversations (and messages via FK cascade) for a project. */
export async function deleteProjectConversations(client: SupabaseClient, projectId: string) {
  const { error } = await client.from("conversations").delete().eq("project_id", projectId);
  if (error) throw toQueryError(error);
}

/** Delete all conversations across all projects for a user (privacy/settings). */
export async function deleteAllUserConversations(client: SupabaseClient, userId: string) {
  const { error } = await client.from("conversations").delete().eq("user_id", userId);
  if (error) throw toQueryError(error);
}
