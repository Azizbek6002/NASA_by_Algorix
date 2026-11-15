"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Headphones,
  HelpCircle,
  MessageSquare,
  Mic,
  MicOff,
  RotateCcw,
  Send,
  Sparkles,
  User,
  Volume2,
  VolumeX,
  Waves,
  X,
} from "lucide-react";

import { cn } from "@/lib/format";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  audioUrl?: string;
  category?: string;
}

type Mode = "chat" | "voice";
type VoiceState = "idle" | "listening" | "thinking" | "speaking";

const QUICK_CHAT_PROMPTS = [
  "Voyager 1 hozir qayerda?",
  "Oyda nechta inson qurilmasi bor?",
  "Marsdagi mashhur roverlar qaysilar?",
  "XKS (ISS) qanday balandlikda uchadi?",
];

// Pre-defined voice responses with authentic Sophia recordings
const SOPHIA_VOICE_RESPONSES = {
  greeting: {
    intent: "greeting" as const,
    label: "1-OVOZ (GREETING)",
    response: "Hi Space Explorer! How can I help you today!",
    audioUrl: "/audio/sophia-greeting.wav",
  },
  debris: {
    intent: "question" as const,
    label: "2-OVOZ (SPACE DEBRIS)",
    response:
      "ohh...yeah .In Earth's orbit: There are over 11,500 tons of artificial space debris left from human activity.",
    audioUrl: "/audio/sophia-debris.wav",
  },
};

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
  maxAlternatives?: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: {
    resultIndex: number;
    results: {
      length: number;
      [key: number]: {
        isFinal?: boolean;
        [key: number]: { transcript: string };
      };
    };
  }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
}

/**
 * Intelligent Speech & Intent Analyzer:
 * - "Hi Space Explorer" (or greeting) -> Voice 1 (sophia-greeting.wav)
 * - "How much space debris is there in the Solar System?" (or question) -> Voice 2 (sophia-debris.wav)
 */
function analyzeVoiceIntent(text: string) {
  const clean = text.toLowerCase().trim();

  // Greeting keywords: "Hi Space Explorer", "Space Explorer", "Hey Space Agent", "Hello", "Salom"
  const greetingKeywords = [
    "hi space explorer",
    "space explorer",
    "hey space explorer",
    "hello space explorer",
    "explorer",
    "hey space agent",
    "space agent",
    "agent",
    "hey",
    "hi",
    "hello",
    "greetings",
    "good morning",
    "good afternoon",
    "good evening",
    "salom",
    "assalom",
    "alaykum",
    "qalay",
    "qalesan",
    "qalesiz",
    "привет",
    "здравствуйте",
    "салам",
  ];

  // Specific question / debris keywords
  const debrisOrQuestionKeywords = [
    "how much space debris is there in the solar system",
    "how much space debris",
    "space debris",
    "debris",
    "solar system",
    "chiqindi",
    "kosmik chiqindi",
    "qancha",
    "how much",
    "how many",
    "tons",
    "tonna",
    "orbit",
    "orbita",
    "nechta",
    "qayerda",
    "nima",
    "qanday",
    "what",
    "where",
    "why",
    "how",
    "tell me",
    "ayt",
    "gapir",
    "tushuntir",
    "сколько",
    "что",
    "где",
    "мусор",
  ];

  const hasDebrisOrQuestion =
    debrisOrQuestionKeywords.some((w) => clean.includes(w)) ||
    clean.includes("?") ||
    clean.endsWith("?");

  const hasGreeting = greetingKeywords.some((w) => clean.includes(w));

  // If question/debris is present and longer than simple greeting
  if (hasDebrisOrQuestion && (!hasGreeting || clean.length > 22)) {
    return SOPHIA_VOICE_RESPONSES.debris;
  }

  // If greeting is present
  if (hasGreeting) {
    return SOPHIA_VOICE_RESPONSES.greeting;
  }

  // Any other query defaults to Voice 2 as specified: "nimadur so'rasek 2-ovoz"
  return SOPHIA_VOICE_RESPONSES.debris;
}

export function AiChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("voice");
  const [messages, setMessages] = useState<Message[]>([INITIAL_CHAT_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Voice Mode States
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [voiceUserSaid, setVoiceUserSaid] = useState<string>("");
  const [voiceBotReplied, setVoiceBotReplied] = useState<string>("");
  const [voiceCategory, setVoiceCategory] = useState<string>("");
  const [isMuted, setIsMuted] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [liveTranscript, setLiveTranscript] = useState<string>("");

  // Animated Wave Equalizer Heights (20 vertical frequency bars)
  const [waveBars, setWaveBars] = useState<number[]>(
    () => new Array(20).fill(16),
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const handleVoiceInputRef = useRef<(text: string) => void>(() => {});
  const liveTranscriptRef = useRef<string>("");
  const animFrameRef = useRef<number | null>(null);
  const voiceStateRef = useRef<VoiceState>("idle");

  // Keep voiceStateRef in sync
  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  // Speech Recognition Setup - Runs ONCE on mount with empty dependencies []
  useEffect(() => {
    const windowWithSpeech = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };

    const SpeechRecognition =
      windowWithSpeech.SpeechRecognition ||
      windowWithSpeech.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.maxAlternatives = 3;

        recognition.onresult = (event) => {
          let interim = "";
          let final = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const item = event.results[i];
            const text = item[0]?.transcript || "";
            if (item.isFinal) {
              final += text;
            } else {
              interim += text;
            }
          }

          const captured = final || interim;
          if (captured) {
            liveTranscriptRef.current = captured;
            setLiveTranscript(captured);
          }

          if (final.trim()) {
            const toAnalyze = final.trim();
            liveTranscriptRef.current = "";
            setLiveTranscript("");
            try {
              recognition.stop();
            } catch {
              // ignore
            }
            handleVoiceInputRef.current(toAnalyze);
          }
        };

        recognition.onerror = () => {
          if (voiceStateRef.current === "listening") {
            // If we have some captured transcript, analyze it
            if (liveTranscriptRef.current.trim()) {
              const text = liveTranscriptRef.current.trim();
              liveTranscriptRef.current = "";
              setLiveTranscript("");
              handleVoiceInputRef.current(text);
            } else {
              setVoiceState("idle");
              setLiveTranscript("");
            }
          }
        };

        recognition.onend = () => {
          if (voiceStateRef.current === "listening") {
            if (liveTranscriptRef.current.trim()) {
              const text = liveTranscriptRef.current.trim();
              liveTranscriptRef.current = "";
              setLiveTranscript("");
              handleVoiceInputRef.current(text);
            } else {
              setVoiceState("idle");
            }
          }
        };

        recognitionRef.current = recognition;
      } catch {
        setSpeechSupported(false);
      }
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

  // Dynamic Audio Waveform Animation Loop
  useEffect(() => {
    let phase = 0;

    const updateWaves = () => {
      phase += 0.12;

      setWaveBars((prev) => {
        return prev.map((_, i) => {
          if (voiceState === "listening") {
            // High energetic wave responding to user voice
            const sine = Math.sin(phase * 1.8 + i * 0.45);
            const noise = (Math.random() - 0.5) * 0.4;
            const height = Math.min(100, Math.max(20, (sine * 0.4 + 0.6 + noise) * 90));
            return Math.round(height);
          } else if (voiceState === "speaking") {
            // Rhythmic harmonic wave following Sophia's speech pattern
            const sine1 = Math.sin(phase * 2.2 + i * 0.35);
            const sine2 = Math.cos(phase * 1.4 + i * 0.6);
            const combined = (sine1 * 0.5 + sine2 * 0.5 + 1) * 0.5;
            const height = Math.min(100, Math.max(18, combined * 95));
            return Math.round(height);
          } else if (voiceState === "thinking") {
            // Sweeping radar scan wave
            const scan = Math.sin(phase * 3 - i * 0.3);
            const height = Math.min(80, Math.max(15, (scan * 0.4 + 0.5) * 75));
            return Math.round(height);
          } else {
            // Gentle ambient idle pulse
            const calm = Math.sin(phase * 0.8 + i * 0.3);
            return Math.round(14 + (calm + 1) * 6);
          }
        });
      });

      animFrameRef.current = requestAnimationFrame(updateWaves);
    };

    animFrameRef.current = requestAnimationFrame(updateWaves);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [voiceState]);

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
    setVoiceState("idle");
  };

  const playVoiceResponse = (text: string, audioUrl?: string) => {
    if (isMuted) {
      setVoiceState("idle");
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
    }

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

  // Start listening with explicit microphone permission request
  const startListening = async () => {
    stopAudio();
    liveTranscriptRef.current = "";
    setLiveTranscript("");

    // Request microphone permission if supported
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Close temporary stream tracks so SpeechRecognition has clean exclusive access
        stream.getTracks().forEach((track) => track.stop());
      } catch {
        // Continue anyway; recognition will trigger browser dialog
      }
    }

    if (recognitionRef.current) {
      try {
        setVoiceState("listening");
        recognitionRef.current.start();
      } catch {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
            setVoiceState("listening");
          } catch {
            setVoiceState("idle");
          }
        }, 150);
      }
    } else {
      // Fallback for browsers without speech recognition
      const simulated = prompt(
        "Ovozli savolingizni yozing:\n1. 'Hi Space Explorer'\n2. 'How much space debris is there in the Solar System?'",
        "Hi Space Explorer",
      );
      if (simulated) {
        handleVoiceInput(simulated);
      }
    }
  };

  const stopListeningAndAnalyze = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    if (liveTranscriptRef.current.trim()) {
      const text = liveTranscriptRef.current.trim();
      liveTranscriptRef.current = "";
      setLiveTranscript("");
      handleVoiceInput(text);
    } else {
      setVoiceState("idle");
    }
  };

  // Main voice input handler & analyzer
  const handleVoiceInput = (spokenText: string) => {
    const query = spokenText.trim();
    if (!query) {
      setVoiceState("idle");
      return;
    }

    setVoiceUserSaid(query);
    setVoiceState("thinking");

    // Perform speech analysis
    const analysis = analyzeVoiceIntent(query);
    setVoiceCategory(analysis.label);

    // Brief realistic delay (400ms) to show analysis then play audio
    setTimeout(() => {
      setVoiceBotReplied(analysis.response);
      addMessagePair(query, analysis.response, analysis.audioUrl, analysis.label);
      playVoiceResponse(analysis.response, analysis.audioUrl);
    }, 400);
  };

  handleVoiceInputRef.current = handleVoiceInput;

  const addMessagePair = (
    userText: string,
    botText: string,
    audioUrl?: string,
    category?: string,
  ) => {
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
        category,
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
    setVoiceBotReplied("");
    setVoiceCategory("");
    setLiveTranscript("");
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
          <Waves size={16} className="text-orbit animate-pulse" />
          <span className="font-mono text-xs font-medium tracking-[0.14em] uppercase text-mist-100">
            Voice & AI Bot
          </span>
        </button>
      )}

      {/* Assistant Modal Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 flex h-[82vh] max-h-[640px] w-[calc(100vw-32px)] sm:w-[420px] flex-col overflow-hidden rounded-2xl border border-white/15 bg-ink-950/95 shadow-2xl shadow-black/90 backdrop-blur-2xl transition-all duration-200 animate-in fade-in zoom-in-95">
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
                  Gemini API · Sophia Voice Waves
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
                  ? "border border-orbit/40 bg-orbit/15 font-medium text-orbit shadow-[0_0_15px_rgba(85,200,255,0.15)]"
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
                        {message.category && (
                          <div className="mb-1 font-mono text-[9px] text-artifact uppercase tracking-wider">
                            {message.category}
                          </div>
                        )}
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

          {/* BODY: Mode = "voice" (Clean, Focused, No Sample Buttons) */}
          {mode === "voice" && (
            <div className="flex flex-1 flex-col justify-between p-5 overflow-hidden">
              {/* Central Cosmic Visualizer Orb & Animated Sound Waves */}
              <div className="my-auto flex flex-col items-center justify-center text-center">
                {/* Visualizer with Concentric Ripples */}
                <div className="relative mb-6 flex h-52 w-full items-center justify-center">
                  {/* Outer Concentric Glowing Waves */}
                  {voiceState === "listening" && (
                    <>
                      <div className="absolute h-48 w-48 rounded-full border border-orbit/50 animate-voice-ripple-1 shadow-[0_0_40px_rgba(85,200,255,0.4)] pointer-events-none" />
                      <div className="absolute h-56 w-56 rounded-full border border-orbit/25 animate-voice-ripple-2 pointer-events-none" />
                    </>
                  )}
                  {voiceState === "speaking" && (
                    <>
                      <div className="absolute h-48 w-48 rounded-full border border-artifact/50 animate-voice-ripple-1 shadow-[0_0_40px_rgba(229,180,92,0.4)] pointer-events-none" />
                      <div className="absolute h-56 w-56 rounded-full border border-artifact/25 animate-voice-ripple-2 pointer-events-none" />
                    </>
                  )}
                  {voiceState === "thinking" && (
                    <div className="absolute h-48 w-48 rounded-full border border-dashed border-orbit/60 animate-spin pointer-events-none" />
                  )}

                  {/* Main Circular Sphere */}
                  <div
                    className={cn(
                      "relative z-10 flex h-40 w-40 flex-col items-center justify-center overflow-hidden rounded-full border bg-gradient-to-b transition-all duration-500 shadow-2xl",
                      voiceState === "listening" &&
                        "border-orbit bg-orbit/15 from-orbit/25 to-ink-950 shadow-[0_0_50px_rgba(85,200,255,0.4)] scale-105",
                      voiceState === "speaking" &&
                        "border-artifact bg-artifact/15 from-artifact/25 to-ink-950 shadow-[0_0_50px_rgba(229,180,92,0.4)] scale-105",
                      voiceState === "thinking" &&
                        "border-orbit/60 bg-orbit/10 from-ink-900 to-ink-950",
                      voiceState === "idle" &&
                        "border-white/15 bg-white/[0.02] from-ink-900 to-ink-950 shadow-[0_0_25px_rgba(255,255,255,0.03)]",
                    )}
                  >
                    {/* Voice Icon */}
                    <div className="mb-2 transition-transform duration-300">
                      {voiceState === "speaking" ? (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-artifact/25 text-artifact animate-pulse">
                          <Volume2 size={26} />
                        </div>
                      ) : voiceState === "listening" ? (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orbit/25 text-orbit animate-bounce">
                          <Mic size={26} />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-orbit">
                          <Headphones size={26} />
                        </div>
                      )}
                    </div>

                    {/* ANIMATED SOUND WAVE EQUALIZER (Ovoz to'lqinlari) */}
                    <div className="flex h-9 items-end justify-center gap-[3px] px-4 w-full">
                      {waveBars.map((heightPercent, idx) => (
                        <span
                          key={idx}
                          className={cn(
                            "w-[3px] rounded-full transition-all duration-75",
                            voiceState === "listening"
                              ? "bg-gradient-to-t from-orbit/50 to-orbit"
                              : voiceState === "speaking"
                              ? "bg-gradient-to-t from-artifact/50 to-artifact"
                              : voiceState === "thinking"
                              ? "bg-gradient-to-t from-orbit/40 to-white/60"
                              : "bg-white/20",
                          )}
                          style={{
                            height: `${heightPercent}%`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* State Status Text Badge */}
                <div className="mb-4">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-all",
                      voiceState === "listening" &&
                        "border-orbit/60 bg-orbit/15 text-orbit animate-pulse shadow-[0_0_15px_rgba(85,200,255,0.3)]",
                      voiceState === "speaking" &&
                        "border-artifact/60 bg-artifact/15 text-artifact shadow-[0_0_15px_rgba(229,180,92,0.3)]",
                      voiceState === "thinking" &&
                        "border-orbit/40 bg-orbit/10 text-mist-300 animate-pulse",
                      voiceState === "idle" &&
                        "border-white/10 bg-white/[0.02] text-mist-400",
                    )}
                  >
                    {voiceState === "listening" && "🎙️ Tinglamoqda... Gapiring"}
                    {voiceState === "speaking" && "🔊 Sophia javob bermoqda..."}
                    {voiceState === "thinking" && "🧠 Gap tahlil qilinmoqda..."}
                    {voiceState === "idle" && "Tayyor (Kutmoqda)"}
                  </span>
                </div>

                {/* Live Speech Recognition Feedback */}
                {liveTranscript && (
                  <div className="mb-3 w-full max-w-sm rounded-xl border border-orbit/50 bg-orbit/10 px-4 py-2.5 text-xs text-orbit animate-pulse">
                    <span className="font-mono text-[9px] uppercase tracking-wider block text-mist-400 mb-0.5">
                      Tinglanmoqda:
                    </span>
                    &ldquo;{liveTranscript}&rdquo;
                  </div>
                )}

                {/* Active Dialogue Bubble (Only shown when spoken / answered) */}
                {voiceUserSaid && (
                  <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 text-left shadow-lg backdrop-blur-md">
                    <div className="mb-2 text-xs text-orbit">
                      <span className="font-mono text-[9px] text-mist-500 uppercase block tracking-wider">
                        Siz dedingiz:
                      </span>
                      <span className="font-medium">&ldquo;{voiceUserSaid}&rdquo;</span>
                    </div>

                    {voiceCategory && (
                      <div className="mb-2 inline-flex items-center gap-1 rounded bg-artifact/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-artifact border border-artifact/30">
                        {voiceCategory}
                      </div>
                    )}

                    {voiceBotReplied && (
                      <div className="text-xs text-mist-100 leading-relaxed">
                        <span className="font-mono text-[9px] text-mist-500 uppercase block tracking-wider">
                          Sophia:
                        </span>
                        {voiceBotReplied}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Voice Controls & Big 'GAPIRISH' Button */}
              <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.08]">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setIsMuted((v) => !v)}
                    className="rounded-xl border border-white/10 p-3 text-mist-400 transition-colors hover:bg-white/5 hover:text-mist-100 shrink-0"
                    title={isMuted ? "Ovozni yoqish" : "Ovozni o'chirish"}
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>

                  {/* Big Interactive 'GAPIRISH' Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (voiceState === "listening") {
                        stopListeningAndAnalyze();
                      } else {
                        startListening();
                      }
                    }}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2.5 rounded-full py-3.5 px-6 font-mono text-xs uppercase tracking-wider font-semibold transition-all duration-300 select-none shadow-lg cursor-pointer",
                      voiceState === "listening"
                        ? "border border-warning bg-warning text-ink-950 shadow-[0_0_25px_rgba(240,120,84,0.6)] animate-pulse"
                        : "border border-orbit/50 bg-orbit/20 text-orbit hover:bg-orbit hover:text-ink-950 shadow-[0_0_20px_rgba(85,200,255,0.25)]",
                    )}
                  >
                    {voiceState === "listening" ? (
                      <>
                        <MicOff size={18} className="animate-spin" />
                        <span>To&apos;xtatish</span>
                      </>
                    ) : (
                      <>
                        <Mic size={18} />
                        <span>Gapirish</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-xl border border-white/10 p-3 text-mist-400 transition-colors hover:bg-white/5 hover:text-mist-100 shrink-0"
                    title="Qayta boshlash"
                  >
                    <RotateCcw size={18} />
                  </button>
                </div>

                <p className="text-center font-mono text-[9px] text-mist-500">
                  Tugmani bosib gapiring · &ldquo;Hi Space Explorer&rdquo; (1-ovoz) · &ldquo;How much space debris...&rdquo; (2-ovoz)
                </p>

                {!speechSupported && (
                  <div className="flex items-center justify-center gap-1.5 font-mono text-[9px] text-warning/90">
                    <HelpCircle size={11} />
                    <span>Brauzeringizda mikrofonga ruxsat bering</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
