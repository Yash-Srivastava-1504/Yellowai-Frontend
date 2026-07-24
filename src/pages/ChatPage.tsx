import { useState, useRef, useEffect, useCallback, useReducer } from "react";
import { flushSync } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Mic, Phone, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { companions, getAIResponseForCompanion, getStoredCompanion } from "@/lib/companion";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanionType } from "@/hooks/useCompanionType";
import { getSupabase } from "@/lib/supabase";
import { type ChatHistoryItem, getApiBaseUrl, streamCompanionReply } from "@/lib/companionApi";
import {
  fetchConversationMessagesAsc,
  getLatestOrCreateConversation,
  insertConversationMessageRow,
  toQueryError,
} from "@/lib/userData";

interface Message {
  id: string;
  role: "ai" | "user";
  text: string;
  time: string;
}

const quickReplies = ["I'm stressed about exams 📚", "Feeling low today 😔", "Just need to talk 💬", "Give me an exercise 🧘"];

const crisisKeywords = ["suicide", "kill myself", "end my life", "self harm", "want to die", "no reason to live"];

function detectCrisis(text: string): boolean {
  return crisisKeywords.some((kw) => text.toLowerCase().includes(kw));
}

function formatMsgTime(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function normalizeLanguage(lang: string | null | undefined): string {
  if (lang === "en" || lang === "hi" || lang === "hinglish") return lang;
  return "hinglish";
}

function chatStorageErrorMessage(e: unknown, fallback: string): string {
  const err = toQueryError(e);
  const missing =
    err.message.includes("conversations") ||
    err.message.includes("public.messages") ||
    err.message.includes("chat_sessions") ||
    err.message.includes("chat_messages") ||
    (err.message.includes("PGRST205") && /chat|conversation|messages/i.test(err.message));
  if (missing) {
    return "Chat tables are missing. In Supabase SQL Editor run supabase/conversations-messages.sql, wait ~10s, refresh.";
  }
  return err.message || fallback;
}

function buildApiThread(msgs: Message[]): ChatHistoryItem[] {
  return msgs
    .filter((m) => m.id !== "greeting")
    .map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      content: m.text,
    }));
}

export default function ChatPage() {
  const companionType = useCompanionType();
  const info = companions[companionType];
  const { user, profile } = useAuth();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatReady, setChatReady] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const conversationRef = useRef<string | null>(null);
  const messagesRef = useRef<Message[]>([]);
  conversationRef.current = conversationId;

  /** Streaming UI: refs hold text (no batching loss); pump forces sync paint each chunk. */
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

  // Only re-load when user changes. Do NOT depend on companion/greeting — when profile loads,
  // `info.greeting` changes and was re-running this effect, replacing `messages` mid-stream so the reply vanished until refresh.
  useEffect(() => {
    let cancelled = false;
    const greetingText = companions[getStoredCompanion()].greeting;
    (async () => {
      const client = getSupabase();
      if (!client || !user) return;
      try {
        const conv = await getLatestOrCreateConversation(client, user.id);
        if (cancelled) return;
        setConversationId(conv.id);
        const rows = await fetchConversationMessagesAsc(client, conv.id);
        if (cancelled) return;
        if (rows.length === 0) {
          setMessages([{ id: "greeting", role: "ai", text: greetingText, time: "Now" }]);
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
        toast.error(chatStorageErrorMessage(e, "Could not load chat"));
        setMessages([{ id: "greeting", role: "ai", text: greetingText, time: "Now" }]);
      } finally {
        if (!cancelled) setChatReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !chatReady) return;
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

      // If conversation wasn't initialised on mount (e.g. tables created after load), retry now.
      let activeConvId = convId;
      if (!activeConvId) {
        try {
          const conv = await getLatestOrCreateConversation(client, user!.id);
          setConversationId(conv.id);
          activeConvId = conv.id;
        } catch (e) {
          toast.error(chatStorageErrorMessage(e, "Could not create conversation — reload and try again."));
          return;
        }
      }

      if (detectCrisis(trimmed)) setShowCrisis(true);

      // Cap history at last 10 messages to avoid eating the context window.
      // The backend also enforces MAX_THREAD_MESSAGES=10, but trimming here
      // prevents sending a huge payload over the wire.
      const historyForApi = buildApiThread(
        messagesRef.current
          .filter((m) => m.id !== "greeting")
          .slice(-10),
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

      let userRow;
      try {
        userRow = await insertConversationMessageRow(client, activeConvId, "user", trimmed);
      } catch (e) {
        setMessages((p) => p.filter((m) => m.id !== tempUserId));
        messagesRef.current = messagesRef.current.filter((m) => m.id !== tempUserId);
        setIsTyping(false);
        toast.error(chatStorageErrorMessage(e, "Could not send message"));
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
      const lang = normalizeLanguage(profile?.language ?? undefined);

      const saveAssistant = async (body: string) => {
        try {
          const row = await insertConversationMessageRow(client, activeConvId, "assistant", body);
          setMessages((msgs) => {
            const next = msgs.map((m) => (m.id === aiMsgId ? { ...m, id: row.id, time: formatMsgTime(row.created_at) } : m));
            messagesRef.current = next;
            return next;
          });
        } catch (e) {
          console.error(e);
          toast.error(chatStorageErrorMessage(e, "Reply could not be saved to the cloud"));
        }
      };

      streamBufRef.current = "";
      streamTimeRef.current = "";
      streamShowRef.current = false;

      try {
        const { fullText, crisis: serverCrisis } = await streamCompanionReply({
          apiUrl,
          accessToken,
          messages: apiMessages,
          companion: companionType,
          language: lang,
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
        if (serverCrisis) setShowCrisis(true);

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
        toast.error(e instanceof Error ? e.message : "AI unavailable — using offline reply");

        const fallback = detectCrisis(trimmed)
          ? "I hear you, and I'm really glad you told me. You're not alone in this. Please reach out to iCall (9152987821) or KIRAN (1800-599-0019) — they're free, confidential, and available 24/7. I'm here for you too. 💙"
          : getAIResponseForCompanion(trimmed, companionType);

        setMessages((msgs) => {
          const merged = [...msgs, { id: aiMsgId, role: "ai" as const, text: fallback, time }];
          messagesRef.current = merged;
          return merged;
        });
        await saveAssistant(fallback);
      }
    },
    [chatReady, companionType, profile?.language],
  );

  const hasUserMessage = messages.some((m) => m.role === "user");

  return (
    <div className="fixed inset-0 bg-background flex flex-col z-50">
      <AnimatePresence>
        {showCrisis && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-destructive/10 border-b border-destructive/20"
            role="alert"
          >
            <div className="px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">You're not alone in this</p>
                <p className="text-xs text-muted-foreground mt-1">Free, confidential help is available 24/7:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <a
                    href="tel:9152987821"
                    className="inline-flex items-center gap-1.5 rounded-full bg-destructive text-destructive-foreground px-3 py-1.5 text-xs font-medium"
                  >
                    <Phone className="w-3 h-3" /> iCall: 9152987821
                  </a>
                  <a
                    href="tel:18005990019"
                    className="inline-flex items-center gap-1.5 rounded-full bg-destructive text-destructive-foreground px-3 py-1.5 text-xs font-medium"
                  >
                    <Phone className="w-3 h-3" /> KIRAN: 1800-599-0019
                  </a>
                </div>
              </div>
              <button type="button" onClick={() => setShowCrisis(false)} className="text-xs text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="bg-background/90 backdrop-blur-lg border-b border-border/40 px-4 py-3 flex items-center gap-3">
        <Link to="/dashboard" className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-lg">{info.emoji}</div>
          <div>
            <p className="text-sm font-semibold text-foreground">{info.name}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" /> {info.status}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "ai" && (
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1">
                {info.emoji}
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary text-foreground rounded-bl-md"
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
              <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-primary-foreground/50" : "text-muted-foreground"}`}>{msg.time}</p>
            </div>
          </div>
        ))}
        {streamShowRef.current && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1">{info.emoji}</div>
            <div className="max-w-[75%] rounded-2xl rounded-bl-md px-4 py-2.5 bg-secondary text-foreground border border-border/30">
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{streamBufRef.current}</p>
              <p className="text-[10px] mt-1 text-muted-foreground">{streamTimeRef.current}</p>
            </div>
          </div>
        )}
        {/* streamPaintGen forces re-renders while streaming; keep referenced so React subscribes */}
        <span className="sr-only" aria-hidden>
          {streamPaintGen}
        </span>
        {isTyping && (
          <div className="flex justify-start items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm flex-shrink-0">{info.emoji}</div>
            <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3 min-w-[8rem] shadow-sm border border-border/40">
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                {info.name} is typing<span className="inline-block w-6 text-left">…</span>
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

      <div className="bg-background/90 backdrop-blur-lg border-t border-border/40 px-4 py-3">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <button
            type="button"
            className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            aria-label="Voice input"
          >
            <Mic className="w-4 h-4" />
          </button>
          <div className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 focus-within:border-primary/30 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage(input);
                }
              }}
              placeholder="Share what's on your mind…"
              rows={1}
              disabled={!chatReady}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none max-h-32"
            />
          </div>
          <button
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
