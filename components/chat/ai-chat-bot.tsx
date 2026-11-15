"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  MessageSquare,
  RotateCcw,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";

import { cn } from "@/lib/format";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  "Voyager 1 hozir qayerda?",
  "Oyda nechta inson qurilmasi bor?",
  "Marsdagi mashhur roverlar qaysilar?",
  "XKS (ISS) qanday balandlikda uchadi?",
];

const INITIAL_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Salom! Men **SPACE ARCHIVE** sun'iy intellekt kosmik yordamchisiman 🚀.\n\nSizga koinot apparatlari, sun'iy yo'ldoshlar, Oy va Marsdagi missiyalar hamda chuqur fazo zondlari bo'yicha ma'lumot bera olaman. Qanday savolingiz bor?",
  timestamp: "Hozir",
};

export function AiChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/v1/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages
            .filter((m) => m.id !== "welcome")
            .map((m) => ({
              role: m.role,
              content: m.content,
            })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error?.message ?? "Javob olishda xatolik yuz berdi.",
        );
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer || "Javob topilmadi.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Aloqa uzildi.";
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `⚠️ **Xatolik:** ${errorMessage}`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full border border-orbit/40 bg-ink-950/90 px-4 py-3 text-mist-50 shadow-xl shadow-orbit/10 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-orbit hover:bg-ink-900"
          aria-label="Open AI Cosmic Assistant"
        >
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-success" />
          </span>
          <Sparkles size={16} className="text-orbit" />
          <span className="font-mono text-xs font-medium tracking-[0.14em] uppercase text-mist-100">
            AI Assistant
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 flex h-[82vh] max-h-[640px] w-[calc(100vw-32px)] sm:w-[420px] flex-col overflow-hidden rounded-2xl border border-white/15 bg-ink-950/95 shadow-2xl shadow-black/90 backdrop-blur-2xl transition-all duration-200 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-orbit/40 bg-orbit/10 text-orbit">
                <Bot size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-xs font-semibold tracking-wider text-mist-50 uppercase">
                    Cosmic AI Bot
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded border border-success/40 bg-success/10 px-1.5 py-0.2 font-mono text-[9px] text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                    Online
                  </span>
                </div>
                <p className="font-mono text-[9px] text-mist-500 uppercase tracking-wider">
                  Gemini AI · Space Archive
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                title="Chatni tozalash"
                className="rounded-lg p-1.5 text-mist-500 transition-colors hover:bg-white/5 hover:text-mist-200"
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Yopish"
                className="rounded-lg p-1.5 text-mist-500 transition-colors hover:bg-white/5 hover:text-mist-200"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4 text-[13px] leading-relaxed">
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2.5",
                    isUser ? "justify-end" : "justify-start",
                  )}
                >
                  {!isUser && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-orbit/30 bg-orbit/10 text-orbit">
                      <Sparkles size={12} />
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm",
                      isUser
                        ? "rounded-tr-sm border border-orbit/40 bg-orbit/15 text-mist-50"
                        : "rounded-tl-sm border border-white/10 bg-white/[0.04] text-mist-200",
                    )}
                  >
                    <div className="whitespace-pre-wrap break-words leading-relaxed">
                      {message.content}
                    </div>
                    <div
                      className={cn(
                        "mt-1 text-[9px] font-mono",
                        isUser ? "text-orbit/70 text-right" : "text-mist-600",
                      )}
                    >
                      {message.timestamp}
                    </div>
                  </div>

                  {isUser && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/5 text-mist-400">
                      <User size={12} />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-mist-500">
                <div className="flex h-6 w-6 items-center justify-center rounded-md border border-orbit/30 bg-orbit/10 text-orbit">
                  <Sparkles size={12} className="animate-spin" />
                </div>
                <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.04] px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-orbit [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-orbit [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-orbit" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length <= 2 && (
            <div className="border-t border-white/[0.06] bg-white/[0.01] px-3 py-2">
              <p className="mb-1.5 font-mono text-[9px] uppercase tracking-wider text-mist-500">
                Namunaviy savollar:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-left font-mono text-[10px] text-mist-300 transition-colors hover:border-orbit/50 hover:bg-orbit/10 hover:text-orbit"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Input */}
          <div className="border-t border-white/10 bg-ink-950 p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Koinot yoki apparatlar haqida so'rang..."
                disabled={loading}
                className="flex-1 rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-xs text-mist-50 placeholder-mist-600 outline-none transition-colors focus:border-orbit/60 focus:bg-white/[0.06] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orbit/40 bg-orbit/20 text-orbit transition-all hover:bg-orbit hover:text-ink-950 disabled:opacity-30 disabled:hover:bg-orbit/20 disabled:hover:text-orbit"
              >
                <Send size={14} />
              </button>
            </form>
            <p className="mt-2 text-center font-mono text-[8px] uppercase tracking-wider text-mist-600">
              Space Archive Ephemeris & Gemini 2.5 Flash
            </p>
          </div>
        </div>
      )}
    </>
  );
}
