export type ProfileRow = {
  id: string;
  email: string | null;
  created_at: string;
  updated_at: string | null;
  display_name: string | null;
  gender: string | null;
  companion: string | null;
  language: string | null;
  concerns: string[] | null;
  initial_mood: number | null;
  notifications_enabled: boolean | null;
  notif_time: string | null;
  anonymous: boolean | null;
  weekly_report: boolean | null;
  theme: string | null;
  onboarding_completed: boolean | null;
};

export type MoodEntryRow = {
  id: string;
  user_id: string;
  mood_level: number;
  tags: string[] | null;
  note: string | null;
  created_at: string;
};

/** AI chat (MVP): one row per user thread. */
export type ConversationRow = {
  id: string;
  user_id: string;
  created_at: string;
};

export type ConversationMessageRow = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};
