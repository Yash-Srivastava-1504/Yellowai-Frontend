import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConversationMessageRow, ConversationRow, MoodEntryRow, ProfileRow } from "./database.types";

/** PostgREST errors are plain objects — normalize so the UI shows the real reason (RLS, missing table, etc.). */
export function toQueryError(e: unknown): Error {
  if (e instanceof Error) return e;
  if (e && typeof e === "object" && "message" in e) {
    const o = e as { message?: string; code?: string; details?: string; hint?: string };
    const parts = [o.message, o.code ? `[${o.code}]` : "", o.details, o.hint].filter(Boolean);
    return new Error(parts.join(" — ") || "Unknown database error");
  }
  return new Error(String(e));
}

export async function fetchOrCreateProfile(
  client: SupabaseClient,
  userId: string,
  email: string | undefined,
): Promise<ProfileRow> {
  const { data: existing, error: e1 } = await client.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (e1) throw toQueryError(e1);
  if (existing) return existing as ProfileRow;
  const { data: inserted, error: e2 } = await client.from("profiles").insert({ id: userId, email: email ?? null }).select("*").single();
  if (e2) throw toQueryError(e2);
  return inserted as ProfileRow;
}

export async function updateProfile(client: SupabaseClient, userId: string, patch: Partial<ProfileRow>) {
  const { error } = await client.from("profiles").update(patch).eq("id", userId);
  if (error) throw error;
}

export async function insertMoodEntry(
  client: SupabaseClient,
  userId: string,
  moodLevel: number,
  tags: string[],
  note: string,
): Promise<MoodEntryRow> {
  const { data, error } = await client
    .from("mood_entries")
    .insert({ user_id: userId, mood_level: moodLevel, tags, note: note || "" })
    .select("*")
    .single();
  if (error) throw error;
  return data as MoodEntryRow;
}

export async function fetchMoodEntriesSince(client: SupabaseClient, userId: string, sinceIso: string): Promise<MoodEntryRow[]> {
  const { data, error } = await client
    .from("mood_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MoodEntryRow[];
}

/** Latest conversation for user, or a new row (MVP: one active thread). */
export async function getLatestOrCreateConversation(client: SupabaseClient, userId: string): Promise<ConversationRow> {
  const { data: latest, error: e1 } = await client
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (e1) throw toQueryError(e1);
  if (latest) return latest as ConversationRow;
  const { data: created, error: e2 } = await client.from("conversations").insert({ user_id: userId }).select("*").single();
  if (e2) throw toQueryError(e2);
  return created as ConversationRow;
}

/** Messages oldest → newest (for UI + API history). */
export async function fetchConversationMessagesAsc(client: SupabaseClient, conversationId: string): Promise<ConversationMessageRow[]> {
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

/** Clears all conversations (and messages via FK) for Settings / privacy. */
export async function deleteAllUserConversations(client: SupabaseClient, userId: string) {
  const { error } = await client.from("conversations").delete().eq("user_id", userId);
  if (error) throw toQueryError(error);
}

/** @deprecated Use deleteAllUserConversations — alias for settings UI. */
export async function deleteAllUserChats(client: SupabaseClient, userId: string) {
  return deleteAllUserConversations(client, userId);
}
