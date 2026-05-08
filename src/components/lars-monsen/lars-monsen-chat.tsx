"use client";

import Image from "next/image";
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
      {!open && bubbleVisible && (
        <div
          className="relative max-w-[240px] cursor-pointer rounded-lg rounded-br-sm bg-bg border-2 border-flame-pressed px-md py-sm text-base leading-snug text-text-primary shadow-[3px_3px_0_var(--brand-flame-pressed)] transition-opacity"
          style={{ fontFamily: "var(--font-handwriting)", fontWeight: 600 }}
          onClick={() => { setOpen(true); setBubbleVisible(false); }}
        >
          {BUBBLE_QUOTE}
          <span className="absolute -bottom-[10px] right-4 h-0 w-0 border-l-[8px] border-r-[4px] border-t-[10px] border-l-transparent border-r-transparent border-t-flame-pressed" />
        </div>
      )}

      {open && (
        <div className="flex h-[480px] w-80 flex-col overflow-hidden rounded-lg border-4 border-flame-pressed bg-bg shadow-[6px_6px_0_var(--brand-flame-pressed)]">
          <div className="flex items-center gap-sm bg-flame-pressed px-md py-sm">
            <div className="relative size-9 shrink-0 overflow-hidden rounded-full border-2 border-bg shadow">
              <Image
                src="/lars-monsen.jpg"
                alt="Lars Monsen"
                fill
                className="object-cover object-[center_20%]"
                sizes="36px"
              />
            </div>
            <div className="flex-1">
              <div
                className="text-lg font-bold text-white leading-none"
                style={{ fontFamily: "var(--font-handwriting)" }}
              >
                Lars Monsen
              </div>
              <div
                className="text-[10px] uppercase tracking-label text-white/80 mt-1"
                style={{ fontFamily: "var(--font-stamp)" }}
              >
                VILLMARKSPIONER
              </div>
            </div>
            <button
              aria-label="Lukk chat"
              onClick={() => setOpen(false)}
              className="text-white/80 transition-colors hover:text-white"
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
                  <div className="relative size-6 shrink-0 overflow-hidden rounded-full border border-flame/30">
                    <Image
                      src="/lars-monsen.jpg"
                      alt="Lars Monsen"
                      fill
                      className="object-cover object-[center_20%]"
                      sizes="24px"
                    />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-lg px-md py-sm text-sm leading-relaxed border-2 ${
                    m.role === "user"
                      ? "rounded-br-sm bg-flame-primary text-white border-flame-pressed"
                      : "rounded-bl-sm bg-flame-tint text-text-primary border-flame-pressed"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-end gap-2">
                <div className="relative size-6 shrink-0 overflow-hidden rounded-full border border-flame/30">
                  <Image src="/lars-monsen.jpg" alt="" fill className="object-cover object-[center_20%]" sizes="24px" />
                </div>
                <div className="rounded-lg rounded-bl-sm bg-flame-tint border-2 border-flame-pressed px-md py-sm text-sm text-text-primary">
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

          <div className="flex gap-sm border-t-2 border-flame-pressed bg-bg p-sm">
            <input
              className="flex-1 rounded-md border-2 border-flame-pressed bg-bg px-sm py-2 text-sm font-semibold text-text-primary outline-none transition-colors focus:ring-2 focus:ring-flame-primary disabled:opacity-50 placeholder:text-flame-primary/50"
              placeholder="Spør Lars om turer..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={loading}
              autoFocus
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="rounded-md bg-flame-primary px-md py-2 text-sm font-bold text-white shadow-[2px_2px_0_var(--brand-flame-pressed)] hover:bg-flame-hover hover:translate-y-[1px] hover:shadow-[1px_1px_0_var(--brand-flame-pressed)] transition-all disabled:opacity-40"
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
        className="relative flex size-14 items-center justify-center overflow-hidden rounded-full border-4 border-flame-pressed bg-flame-primary shadow-[4px_4px_0_var(--brand-flame-pressed)] hover:translate-y-[1px] hover:shadow-[3px_3px_0_var(--brand-flame-pressed)] transition-all"
      >
        {open ? (
          <span className="text-base font-bold text-white">✕</span>
        ) : (
          <Image
            src="/lars-monsen.jpg"
            alt="Lars Monsen"
            fill
            className="object-cover object-[center_20%]"
            sizes="56px"
          />
        )}
      </button>
    </div>
  );
}
