"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Headphones,
  MessageSquare,
  Mic,
  MicOff,
  RotateCcw,
  Send,
  Sparkles,
  User,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import { cn } from "@/lib/format";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  audioUrl?: string;
}

type Mode = "chat" | "voice";
type VoiceState = "idle" | "listening" | "thinking" | "speaking";

const QUICK_CHAT_PROMPTS = [
  "Voyager 1 hozir qayerda?",
  "Oyda nechta inson qurilmasi bor?",
  "Marsdagi mashhur roverlar qaysilar?",
  "XKS (ISS) qanday balandlikda uchadi?",
];

const VOICE_SCENARIOS = [
  {
    triggerPhrase: "Hey Space agent!",
    matchWords: ["hey space agent", "space agent", "hey agent", "hello agent"],
    response: "Hi Space Explorer! How can I help you today!",
    audioUrl: "/audio/sophia-greeting.wav",
  },
  {
    triggerPhrase: "How much space debris is there in the Solar System?",
    matchWords: [
      "how much space debris",
      "space debris",
      "debris in the solar system",
      "debris in solar system",
      "kosmik chiqindi",
    ],
    response:
      "ohh...yeah .In Earth's orbit: There are over 11,500 tons of artificial space debris left from human activity.",
    audioUrl: "/audio/sophia-debris.wav",
  },
];

const INITIAL_CHAT_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Salom! Men **SPACE ARCHIVE** sun'iy intellekt kosmik yordamchisiman 🚀.\n\nSizga koinot apparatlari, sun'iy yo'ldoshlar, Oy va Marsdagi missiyalar hamda chuqur fazo zondlari bo'yicha ma'lumot bera olaman. Chat yoki Ovozli rejimni tanlang!",
  timestamp: "Hozir",
};

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

export function AiChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("chat");
  const [messages, setMessages] = useState<Message[]>([INITIAL_CHAT_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Voice Mode States
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [voiceUserSaid, setVoiceUserSaid] = useState<string>("");
  const [voiceBotReplied, setVoiceBotReplied] = useState<string>(
    "Salom Space Explorer! Gapirish uchun mikrofonni bosing yoki namunaviy iboralardan birini tanlang.",
  );
  const [isMuted, setIsMuted] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const handleVoiceInputRef = useRef<(text: string) => void>(() => {});

  // Initialize SpeechRecognition on mount
  useEffect(() => {
    const windowWithSpeech = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };

    const SpeechRecognition =
      windowWithSpeech.SpeechRecognition ||
      windowWithSpeech.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          handleVoiceInputRef.current(transcript);
        }
      };

      recognition.onerror = () => {
        setVoiceState("idle");
      };

      recognition.onend = () => {
        setVoiceState((current) =>
          current === "listening" ? "idle" : current,
        );
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      stopAudio();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && mode === "chat") {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, loading, mode]);

  const stopAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const playVoiceResponse = (text: string, audioUrl?: string) => {
    if (isMuted) {
      setVoiceState("idle");
      return;
    }

    stopAudio();
    setVoiceState("speaking");

    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;
      audio.onended = () => {
        setVoiceState("idle");
      };
      audio.onerror = () => {
        fallbackTTS(text);
      };
      audio.play().catch(() => {
        fallbackTTS(text);
      });
    } else {
      fallbackTTS(text);
    }
  };

  const fallbackTTS = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const cleanText = text.replace(/[*_#`]/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setVoiceState("idle");
      utterance.onerror = () => setVoiceState("idle");
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setVoiceState("idle"), 2500);
    }
  };

  const startListening = () => {
    stopAudio();
    if (recognitionRef.current) {
      try {
        setVoiceState("listening");
        recognitionRef.current.start();
      } catch {
        recognitionRef.current.stop();
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
          } catch {
            setVoiceState("idle");
          }
        }, 100);
      }
    } else {
      // Fallback for browsers without Web Speech API
      const simulated = prompt("Ovozli savolingizni kiriting:", "Hey Space agent!");
      if (simulated) {
        handleVoiceInput(simulated);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setVoiceState("idle");
  };

  const handleVoiceInput = async (spokenText: string) => {
    const query = spokenText.trim();
    if (!query) {
      setVoiceState("idle");
      return;
    }

    setVoiceUserSaid(query);
    setVoiceState("thinking");

    const lowerQuery = query.toLowerCase();

    // Check specific voice triggers (Sophia voice files)
    for (const scenario of VOICE_SCENARIOS) {
      const isMatch = scenario.matchWords.some((word) =>
        lowerQuery.includes(word),
      );
      if (isMatch) {
        setVoiceBotReplied(scenario.response);
        // Also add to chat history
        addMessagePair(query, scenario.response, scenario.audioUrl);
        playVoiceResponse(scenario.response, scenario.audioUrl);
        return;
      }
    }

    // Otherwise, ask Gemini API
    try {
      const response = await fetch("/api/v1/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message ?? "Xatolik yuz berdi.");
      }

      const answer = data.answer || "Javob topilmadi.";
      setVoiceBotReplied(answer);
      addMessagePair(query, answer);
      playVoiceResponse(answer);
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : "Aloqada xatolik yuz berdi.";
      setVoiceBotReplied(`Xatolik: ${errMsg}`);
      setVoiceState("idle");
    }
  };

  handleVoiceInputRef.current = handleVoiceInput;

  const addMessagePair = (userText: string, botText: string, audioUrl?: string) => {
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "user",
        content: userText,
        timestamp: time,
      },
      {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: botText,
        timestamp: time,
        audioUrl,
      },
    ]);
  };

  const handleChatSend = async (textToSend?: string) => {
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
    stopAudio();
    setMessages([INITIAL_CHAT_MESSAGE]);
    setVoiceUserSaid("");
    setVoiceBotReplied(
      "Salom Space Explorer! Gapirish uchun mikrofonni bosing yoki namunaviy iboralardan birini tanlang.",
    );
    setVoiceState("idle");
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

      {/* Assistant Modal Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 flex h-[84vh] max-h-[660px] w-[calc(100vw-32px)] sm:w-[440px] flex-col overflow-hidden rounded-2xl border border-white/15 bg-ink-950/95 shadow-2xl shadow-black/90 backdrop-blur-2xl transition-all duration-200 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-orbit/40 bg-orbit/10 text-orbit">
                {mode === "voice" ? <Headphones size={18} /> : <Bot size={18} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-xs font-semibold tracking-wider text-mist-50 uppercase">
                    Space AI {mode === "voice" ? "Voice" : "Chat"}
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded border border-success/40 bg-success/10 px-1.5 py-0.2 font-mono text-[9px] text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                    Online
                  </span>
                </div>
                <p className="font-mono text-[9px] text-mist-500 uppercase tracking-wider">
                  Gemini API · Sophia Voice
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                title="Tozalash"
                className="rounded-lg p-1.5 text-mist-500 transition-colors hover:bg-white/5 hover:text-mist-200"
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  stopAudio();
                  setIsOpen(false);
                }}
                title="Yopish"
                className="rounded-lg p-1.5 text-mist-500 transition-colors hover:bg-white/5 hover:text-mist-200"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 border-b border-white/10 bg-white/[0.02] p-1.5 text-center font-mono text-[11px] uppercase tracking-wider">
            <button
              type="button"
              onClick={() => {
                stopAudio();
                setMode("chat");
              }}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg py-1.5 transition-all",
                mode === "chat"
                  ? "border border-orbit/40 bg-orbit/15 font-medium text-orbit"
                  : "text-mist-500 hover:text-mist-200",
              )}
            >
              <MessageSquare size={13} />
              Chat Rejimi
            </button>
            <button
              type="button"
              onClick={() => {
                stopAudio();
                setMode("voice");
              }}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg py-1.5 transition-all",
                mode === "voice"
                  ? "border border-orbit/40 bg-orbit/15 font-medium text-orbit"
                  : "text-mist-500 hover:text-mist-200",
              )}
            >
              <Headphones size={13} />
              Ovozli Rejim
            </button>
          </div>

          {/* BODY: Mode = "chat" */}
          {mode === "chat" && (
            <>
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
                            "mt-1 flex items-center justify-between gap-2 text-[9px] font-mono",
                            isUser ? "text-orbit/70" : "text-mist-600",
                          )}
                        >
                          <span>{message.timestamp}</span>
                          {message.audioUrl && (
                            <button
                              type="button"
                              onClick={() => playVoiceResponse(message.content, message.audioUrl)}
                              className="inline-flex items-center gap-1 text-orbit hover:underline"
                            >
                              <Volume2 size={10} /> Ovozni eshitish
                            </button>
                          )}
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

              {/* Quick Chat Prompts */}
              {messages.length <= 2 && (
                <div className="border-t border-white/[0.06] bg-white/[0.01] px-3 py-2">
                  <p className="mb-1.5 font-mono text-[9px] uppercase tracking-wider text-mist-500">
                    Namunaviy savollar:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_CHAT_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleChatSend(prompt)}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-left font-mono text-[10px] text-mist-300 transition-colors hover:border-orbit/50 hover:bg-orbit/10 hover:text-orbit"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Footer Input */}
              <div className="border-t border-white/10 bg-ink-950 p-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleChatSend();
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
                  Space Archive Ephemeris & Gemini AI
                </p>
              </div>
            </>
          )}

          {/* BODY: Mode = "voice" */}
          {mode === "voice" && (
            <div className="flex flex-1 flex-col justify-between p-4">
              {/* Voice Orb & Visualizer */}
              <div className="my-auto flex flex-col items-center justify-center text-center">
                {/* Glowing Cosmic Orb */}
                <div className="relative mb-6 flex items-center justify-center">
                  <div
                    className={cn(
                      "h-32 w-32 rounded-full border transition-all duration-500 flex items-center justify-center",
                      voiceState === "listening" &&
                        "border-orbit bg-orbit/20 shadow-[0_0_50px_rgba(85,200,255,0.4)] scale-110",
                      voiceState === "speaking" &&
                        "border-artifact bg-artifact/20 shadow-[0_0_50px_rgba(229,180,92,0.4)] scale-105",
                      voiceState === "thinking" &&
                        "border-orbit/60 bg-orbit/10 animate-spin",
                      voiceState === "idle" &&
                        "border-white/20 bg-white/[0.03] shadow-[0_0_30px_rgba(255,255,255,0.05)]",
                    )}
                  >
                    {/* Inner Orb Core */}
                    <div
                      className={cn(
                        "h-20 w-20 rounded-full transition-all duration-300 flex items-center justify-center",
                        voiceState === "listening" && "bg-orbit/30 animate-pulse",
                        voiceState === "speaking" && "bg-artifact/30 animate-pulse",
                        voiceState === "idle" && "bg-white/5",
                      )}
                    >
                      {voiceState === "speaking" ? (
                        <Volume2 size={32} className="text-artifact animate-bounce" />
                      ) : (
                        <Headphones size={32} className="text-orbit" />
                      )}
                    </div>
                  </div>

                  {/* Pulsing Aura Rings */}
                  {voiceState === "listening" && (
                    <span className="absolute h-40 w-40 animate-ping rounded-full border border-orbit/40" />
                  )}
                  {voiceState === "speaking" && (
                    <span className="absolute h-40 w-40 animate-ping rounded-full border border-artifact/40" />
                  )}
                </div>

                {/* State Status Text */}
                <div className="mb-2">
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest",
                      voiceState === "listening" &&
                        "border-orbit/50 bg-orbit/10 text-orbit animate-pulse",
                      voiceState === "speaking" &&
                        "border-artifact/50 bg-artifact/10 text-artifact",
                      voiceState === "thinking" &&
                        "border-white/30 bg-white/5 text-mist-300",
                      voiceState === "idle" &&
                        "border-white/10 bg-white/[0.02] text-mist-500",
                    )}
                  >
                    {voiceState === "listening" && "🎙️ Sizni tinglamoqda..."}
                    {voiceState === "speaking" && "🔊 Sophia gapirmoqda..."}
                    {voiceState === "thinking" && "⏳ O'ylanmoqda..."}
                    {voiceState === "idle" && "Tayyor (Kutmoqda)"}
                  </span>
                </div>

                {/* Dialogue Display Box */}
                <div className="w-full max-h-40 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left">
                  {voiceUserSaid && (
                    <div className="mb-2 text-xs text-orbit">
                      <span className="font-mono text-[9px] text-mist-500 uppercase block">
                        Siz dedingiz:
                      </span>
                      &ldquo;{voiceUserSaid}&rdquo;
                    </div>
                  )}
                  <div className="text-xs text-mist-100 leading-relaxed">
                    <span className="font-mono text-[9px] text-mist-500 uppercase block">
                      Sophia javobi:
                    </span>
                    {voiceBotReplied}
                  </div>
                </div>
              </div>

              {/* Voice Scenarios (Exact Audio Triggers) */}
              <div className="my-2 border-t border-b border-white/[0.08] py-2.5">
                <p className="mb-1.5 font-mono text-[9px] uppercase tracking-wider text-mist-500 text-center">
                  Ovozli namuna iboralar (bosing yoki ayting):
                </p>
                <div className="flex flex-col gap-1.5">
                  {VOICE_SCENARIOS.map((scen) => (
                    <button
                      key={scen.triggerPhrase}
                      type="button"
                      onClick={() => handleVoiceInput(scen.triggerPhrase)}
                      className="group flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-left font-mono text-[10px] text-mist-300 transition-colors hover:border-orbit/50 hover:bg-orbit/10 hover:text-orbit"
                    >
                      <span className="truncate">&ldquo;{scen.triggerPhrase}&rdquo;</span>
                      <Volume2
                        size={12}
                        className="text-mist-500 transition-colors group-hover:text-orbit shrink-0 ml-2"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom Voice Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setIsMuted((v) => !v)}
                  className="rounded-xl border border-white/10 p-2.5 text-mist-400 transition-colors hover:bg-white/5 hover:text-mist-100"
                  title={isMuted ? "Ovozni yoqish" : "Ovozni o'chirish"}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>

                {/* Big Mic Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (voiceState === "listening") {
                      stopListening();
                    } else {
                      startListening();
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-6 py-3 font-mono text-xs uppercase tracking-wider transition-all duration-300",
                    voiceState === "listening"
                      ? "border border-warning bg-warning text-ink-950 shadow-[0_0_20px_rgba(240,120,84,0.5)] animate-pulse"
                      : "border border-orbit/50 bg-orbit/20 text-orbit hover:bg-orbit hover:text-ink-950 shadow-[0_0_15px_rgba(85,200,255,0.2)]",
                  )}
                >
                  {voiceState === "listening" ? (
                    <>
                      <MicOff size={16} /> To&apos;xtatish
                    </>
                  ) : (
                    <>
                      <Mic size={16} /> Gapirish
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={stopAudio}
                  className="rounded-xl border border-white/10 p-2.5 text-mist-400 transition-colors hover:bg-white/5 hover:text-mist-100"
                  title="Ovozni to'xtatish"
                >
                  <RotateCcw size={16} />
                </button>
              </div>

              {!speechSupported && (
                <p className="mt-2 text-center font-mono text-[8px] text-warning/80">
                  Brauzeringizda ovozli mikrofondan foydalanish cheklangan. Yuqoridagi iboralarni bosib ovozli javobni tinglashingiz mumkin.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
