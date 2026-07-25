export type ProfileRow = {
  id: string;
  email: string | null;
  created_at: string;
  updated_at: string | null;
  display_name: string | null;
  anonymous: boolean | null;
  theme: string | null;
};

/** A user's AI agent project. */
export type ProjectRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string | null;
};

/** A system prompt associated with a project. */
export type PromptRow = {
  id: string;
  project_id: string;
  content: string;
  is_active: boolean;
  created_at: string;
};

/** A conversation thread scoped to a project. */
export type ConversationRow = {
  id: string;
  user_id: string;
  project_id: string | null;
  created_at: string;
};

export type ConversationMessageRow = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};
