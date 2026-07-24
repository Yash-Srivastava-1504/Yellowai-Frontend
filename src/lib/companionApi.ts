export type ChatHistoryItem = { role: "user" | "assistant"; content: string };

export type StreamCompanionParams = {
  apiUrl: string;
  accessToken: string;
  /** Full OpenAI-style thread, last item must be role "user" (matches Supabase order). */
  messages: ChatHistoryItem[];
  companion: string;
  language: string;
  onDelta: (chunk: string) => void;
  signal?: AbortSignal;
};

export type StreamCompanionResult = { fullText: string; crisis: boolean };

/**
 * POST /api/companion/chat — SSE stream (server-side LLM). Keys never touch the browser.
 */
export async function streamCompanionReply({
  apiUrl,
  accessToken,
  messages,
  companion,
  language,
  onDelta,
  signal,
}: StreamCompanionParams): Promise<StreamCompanionResult> {
  const base = apiUrl.replace(/\/$/, "");
  const url = `${base}/api/companion/chat`;

  const res = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ messages, companion, language }),
    signal,
  });

  if (!res.ok) {
    let detail = res.statusText;
    let code: string | undefined;
    try {
      const j = (await res.json()) as { error?: string; code?: string };
      if (j.error) detail = j.error;
      if (j.code) code = j.code;
    } catch {
      /* ignore */
    }
    if (res.status === 401) {
      const hint =
        code === "TOKEN_EXPIRED"
          ? "Sign out and sign in again."
          : "Backend could not verify your session. Check Supabase JWT / JWKS and restart the API server.";
      throw new Error(`${detail}${detail ? " — " : ""}${hint}`);
    }
    throw new Error(detail || `Request failed (${res.status})`);
  }

  if (!res.body) {
    throw new Error("No response body");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let crisis = false;
  let finished = false;

  const handleEventData = (jsonStr: string) => {
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(jsonStr) as Record<string, unknown>;
    } catch {
      return;
    }
    if (data.crisis === true && typeof data.reply === "string") {
      crisis = true;
      fullText = data.reply;
      onDelta(data.reply);
      finished = true;
      return;
    }
    if (typeof data.error === "string") {
      finished = true;
      throw new Error(data.error);
    }
    if (data.done === true) {
      finished = true;
      return;
    }
    if (typeof data.delta === "string" && data.delta.length > 0) {
      fullText += data.delta;
      onDelta(data.delta);
    }
  };

  const processEventBlock = (rawEvent: string) => {
    for (const line of rawEvent.split("\n")) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const jsonStr = t.slice(5).trim();
      if (jsonStr) handleEventData(jsonStr);
      if (finished) break;
    }
  };

  try {
    while (!finished) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
      buffer = buffer.replace(/\r\n/g, "\n");

      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) >= 0) {
        const rawEvent = buffer.slice(0, sep).trim();
        buffer = buffer.slice(sep + 2);
        processEventBlock(rawEvent);
        if (finished) break;
      }

      if (done && !finished) {
        const tail = buffer.trim();
        if (tail) processEventBlock(tail);
        finished = true;
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
  }

  return { fullText, crisis };
}

export function getApiBaseUrl(): string | null {
  const url = import.meta.env.VITE_API_URL;
  if (typeof url === "string" && url.trim()) return url.trim().replace(/\/$/, "");
  return null;
}
