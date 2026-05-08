"use client";

import { useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

const GREETING =
  "Hei, gutt! Lars Monsen her. Spør meg om turer i norsk natur — jeg kjenner DNT-hyttenettet ut og inn. Men mellom oss: ingenting slår en tur i kanadisk villmark. 🍁";

const BUBBLE_QUOTE = "Canada kaller — men norske hytter er også greit! Spør meg om turer. 🏔️";

export function LarsMonsenChat() {
  const [open, setOpen] = useState(false);
  const [bubbleVisible, setBubbleVisible] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setBubbleVisible(false), 6000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);

    try {
      const res = await fetch("/api/lars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: next.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.text }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Noe gikk galt, venn. Prøv igjen!" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Initial speech bubble */}
      {!open && bubbleVisible && (
        <div
          className="relative max-w-[220px] cursor-pointer rounded-2xl rounded-br-sm bg-flame px-4 py-3 text-sm leading-snug text-white shadow-lg transition-opacity"
          onClick={() => { setOpen(true); setBubbleVisible(false); }}
        >
          {BUBBLE_QUOTE}
          {/* Bubble tail */}
          <span className="absolute -bottom-2 right-4 h-0 w-0 border-l-[8px] border-r-[4px] border-t-[8px] border-l-transparent border-r-transparent border-t-flame" />
        </div>
      )}

      {/* Chat panel */}
      {open && (
        <div className="flex h-[460px] w-80 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 bg-flame px-4 py-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-flame shadow">
              LM
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">Lars Monsen</div>
              <div className="text-xs text-white/75">Villmarkspioner & turguide</div>
            </div>
            <button
              aria-label="Lukk chat"
              onClick={() => setOpen(false)}
              className="text-white/70 transition-colors hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex items-end gap-2 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {m.role === "assistant" && (
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-flame text-[10px] font-bold text-white">
                    LM
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "rounded-br-sm bg-flame text-white"
                      : "rounded-bl-sm bg-muted text-foreground"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-end gap-2">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-flame text-[10px] font-bold text-white">
                  LM
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce [animation-delay:0ms]">·</span>
                    <span className="animate-bounce [animation-delay:150ms]">·</span>
                    <span className="animate-bounce [animation-delay:300ms]">·</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 border-t border-border p-3">
            <input
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-flame disabled:opacity-50"
              placeholder="Spør Lars om turer…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={loading}
              autoFocus
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="rounded-lg bg-flame px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-flame-hover disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        aria-label={open ? "Lukk Lars Monsen chat" : "Åpne Lars Monsen chat"}
        onClick={() => { setOpen((o) => !o); setBubbleVisible(false); }}
        className="flex size-14 items-center justify-center rounded-full bg-flame text-2xl shadow-lg transition-colors hover:bg-flame-hover"
      >
        {open ? <span className="text-base font-bold text-white">✕</span> : "🏔️"}
      </button>
    </div>
  );
}
