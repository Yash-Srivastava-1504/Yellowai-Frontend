import { useState, useRef, useEffect, useCallback, useReducer } from "react";
import { flushSync } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Bot, Loader2, AlertCircle } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase } from "@/lib/supabase";
import { getApiBaseUrl, streamProjectReply, type ChatHistoryItem } from "@/lib/chatApi";
import {
  fetchConversationMessagesAsc,
  fetchProject,
  getOrCreateProjectConversation,
  insertConversationMessageRow,
  toQueryError,
} from "@/lib/userData";
import type { ProjectRow } from "@/lib/database.types";

interface Message {
  id: string;
  role: "ai" | "user";
  text: string;
  time: string;
}

const quickReplies = [
  "Help me brainstorm ideas 💡",
  "Summarize this topic 📝",
  "Explain step by step 🔍",
  "Give me feedback 📊",
];

function formatMsgTime(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function buildApiThread(msgs: Message[]): ChatHistoryItem[] {
  return msgs
    .filter((m) => m.id !== "welcome")
    .map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      content: m.text,
    }));
}

function chatErrorMessage(e: unknown): string {
  const err = toQueryError(e);
  if (
    err.message.includes("conversations") ||
    err.message.includes("messages") ||
    err.message.includes("PGRST205")
  ) {
    return "Chat tables are missing. Run supabase/projects-prompts-migration.sql in Supabase SQL Editor.";
  }
  return err.message || "An error occurred";
}

export default function ChatPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectRow | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatReady, setChatReady] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const conversationRef = useRef<string | null>(null);
  const messagesRef = useRef<Message[]>([]);
  conversationRef.current = conversationId;

  /** Streaming UI state */
  const streamBufRef = useRef("");
  const streamTimeRef = useRef("");
  const streamShowRef = useRef(false);
  const [streamPaintGen, pumpStreamPaint] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, streamPaintGen]);

  // Load project metadata
  useEffect(() => {
    if (!projectId) return;
    const client = getSupabase();
    if (!client) return;
    fetchProject(client, projectId)
      .then((p) => {
        if (!p) {
          toast.error("Project not found.");
          navigate("/projects");
          return;
        }
        setProject(p);
      })
      .catch((e) => {
        toast.error(toQueryError(e).message);
        navigate("/projects");
      })
      .finally(() => setProjectLoading(false));
  }, [projectId, navigate]);

  // Load conversation history
  useEffect(() => {
    if (!user || !projectId || projectLoading) return;
    let cancelled = false;
    const client = getSupabase();
    if (!client) return;

    (async () => {
      try {
        const conv = await getOrCreateProjectConversation(client, user.id, projectId);
        if (cancelled) return;
        setConversationId(conv.id);
        const rows = await fetchConversationMessagesAsc(client, conv.id);
        if (cancelled) return;
        if (rows.length === 0) {
          setMessages([
            {
              id: "welcome",
              role: "ai",
              text: "Hello! I'm ready to help. What would you like to discuss?",
              time: "Now",
            },
          ]);
        } else {
          setMessages(
            rows.map((m) => ({
              id: m.id,
              role: m.role === "user" ? "user" : "ai",
              text: m.content,
              time: formatMsgTime(m.created_at),
            })),
          );
        }
      } catch (e) {
        console.error(e);
        toast.error(chatErrorMessage(e));
        setMessages([
          {
            id: "welcome",
            role: "ai",
            text: "Hello! I'm ready to help. What would you like to discuss?",
            time: "Now",
          },
        ]);
      } finally {
        if (!cancelled) setChatReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, projectId, projectLoading]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !chatReady || !projectId) return;
      const trimmed = text.trim();
      const convId = conversationRef.current;
      const client = getSupabase();
      if (!client) {
        toast.error("Chat is not ready yet — please reload.");
        return;
      }

      const apiUrl = getApiBaseUrl();
      const sessionRes = await client.auth.getSession();
      const accessToken = sessionRes.data.session?.access_token;

      if (!apiUrl) {
        toast.error("Add VITE_API_URL (e.g. http://localhost:3001) to .env and restart the dev server.");
        return;
      }
      if (!accessToken) {
        toast.error("Session expired — please log in again.");
        return;
      }

      let activeConvId = convId;
      if (!activeConvId) {
        try {
          const conv = await getOrCreateProjectConversation(client, user!.id, projectId);
          setConversationId(conv.id);
          activeConvId = conv.id;
        } catch (e) {
          toast.error(chatErrorMessage(e));
          return;
        }
      }

      // Build API thread (cap at last 20 messages)
      const historyForApi = buildApiThread(
        messagesRef.current.filter((m) => m.id !== "welcome").slice(-20),
      );
      const apiMessages: ChatHistoryItem[] = [...historyForApi, { role: "user", content: trimmed }];

      const tempUserId = `temp-user-${crypto.randomUUID()}`;
      const newUserMsg: Message = { id: tempUserId, role: "user", text: trimmed, time: formatMsgTime() };

      setMessages((p) => {
        const next = [...p, newUserMsg];
        messagesRef.current = next;
        return next;
      });
      setInput("");
      setIsTyping(true);

      // Persist user message to Supabase
      let userRow;
      try {
        userRow = await insertConversationMessageRow(client, activeConvId, "user", trimmed);
      } catch (e) {
        setMessages((p) => p.filter((m) => m.id !== tempUserId));
        messagesRef.current = messagesRef.current.filter((m) => m.id !== tempUserId);
        setIsTyping(false);
        toast.error(chatErrorMessage(e));
        return;
      }

      setMessages((p) => {
        const hasTemp = p.some((m) => m.id === tempUserId);
        const next = hasTemp
          ? p.map((m) =>
              m.id === tempUserId
                ? { id: userRow.id, role: "user" as const, text: userRow.content, time: formatMsgTime(userRow.created_at) }
                : m,
            )
          : [...p, { id: userRow.id, role: "user" as const, text: userRow.content, time: formatMsgTime(userRow.created_at) }];
        messagesRef.current = next;
        return next;
      });

      const aiMsgId = crypto.randomUUID();
      const time = formatMsgTime();

      const saveAssistant = async (body: string) => {
        try {
          const row = await insertConversationMessageRow(client, activeConvId!, "assistant", body);
          setMessages((msgs) => {
            const next = msgs.map((m) => (m.id === aiMsgId ? { ...m, id: row.id, time: formatMsgTime(row.created_at) } : m));
            messagesRef.current = next;
            return next;
          });
        } catch (e) {
          console.error(e);
          toast.error("Reply could not be saved — check your connection.");
        }
      };

      streamBufRef.current = "";
      streamTimeRef.current = "";
      streamShowRef.current = false;

      try {
        const { fullText } = await streamProjectReply({
          apiUrl,
          accessToken,
          projectId,
          messages: apiMessages,
          onDelta: (delta) => {
            setIsTyping(false);
            if (!streamShowRef.current) {
              streamShowRef.current = true;
              streamTimeRef.current = formatMsgTime();
            }
            streamBufRef.current += delta;
            flushSync(() => {
              pumpStreamPaint();
            });
          },
        });

        setIsTyping(false);
        streamShowRef.current = false;
        streamBufRef.current = "";
        flushSync(() => {
          pumpStreamPaint();
        });

        setMessages((msgs) => {
          const merged = [...msgs, { id: aiMsgId, role: "ai" as const, text: fullText, time }];
          messagesRef.current = merged;
          return merged;
        });

        if (fullText.trim()) await saveAssistant(fullText);
      } catch (e) {
        console.error(e);
        setIsTyping(false);
        streamShowRef.current = false;
        streamBufRef.current = "";
        flushSync(() => {
          pumpStreamPaint();
        });
        const errMsg = e instanceof Error ? e.message : "AI unavailable — please try again.";
        toast.error(errMsg);
      }
    },
    [chatReady, projectId, user],
  );

  const hasUserMessage = messages.some((m) => m.role === "user");
  const projectName = project?.name ?? "Agent";

  return (
    <div className="fixed inset-0 bg-background flex flex-col z-50">
      {/* Header */}
      <header className="bg-background/90 backdrop-blur-lg border-b border-border/40 px-4 py-3 flex items-center gap-3">
        <Link to="/projects" className="p-2 rounded-xl hover:bg-secondary transition-colors" id="chat-back-btn">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{projectName}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {chatReady ? "Online" : "Connecting…"}
            </p>
          </div>
        </div>
        <Link
          to={`/projects/${projectId}/edit`}
          id="chat-edit-btn"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-secondary"
        >
          Edit
        </Link>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "ai" && (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-foreground rounded-bl-md"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
                  {msg.time}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Streaming bubble */}
        {streamShowRef.current && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="max-w-[75%] rounded-2xl rounded-bl-md px-4 py-2.5 bg-secondary text-foreground border border-border/30">
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{streamBufRef.current}</p>
              <p className="text-[10px] mt-1 text-muted-foreground">{streamTimeRef.current}</p>
            </div>
          </div>
        )}
        <span className="sr-only" aria-hidden>{streamPaintGen}</span>

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3 min-w-[8rem] shadow-sm border border-border/40">
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                {projectName} is thinking<span className="inline-block w-6 text-left">…</span>
              </p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-typing-dot-1" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-typing-dot-2" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-typing-dot-3" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      {!hasUserMessage && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
          {quickReplies.map((qr) => (
            <button
              key={qr}
              type="button"
              onClick={() => void sendMessage(qr)}
              disabled={!chatReady}
              className="whitespace-nowrap rounded-full border border-border bg-card px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary/20 hover:bg-primary/5 transition-all disabled:opacity-40"
            >
              {qr}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="bg-background/90 backdrop-blur-lg border-t border-border/40 px-4 py-3">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <div className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 focus-within:border-primary/30 transition-colors">
            <textarea
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage(input);
                }
              }}
              placeholder="Type a message…"
              rows={1}
              disabled={!chatReady}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none max-h-32"
            />
          </div>
          <button
            id="chat-send-btn"
            type="button"
            onClick={() => void sendMessage(input)}
            disabled={!input.trim() || !chatReady}
            className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-20 transition-all hover:opacity-90"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
