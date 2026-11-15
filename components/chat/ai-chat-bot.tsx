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

// Pre-defined Sophia Voice responses with real audio recordings
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
  const clean = text
    .toLowerCase()
    .replace(/['"“”?,.!]/g, "")
    .trim();

  // Greeting patterns
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
    "salom",
    "assalom",
    "qalay",
    "qalesan",
    "qalesiz",
    "good morning",
    "good afternoon",
    "привет",
    "здравствуйте",
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
    "мусор",
  ];

  const hasDebrisOrQuestion =
    debrisOrQuestionKeywords.some((w) => clean.includes(w)) ||
    clean.includes("debris") ||
    clean.includes("chiqindi") ||
    clean.includes("how much") ||
    clean.includes("solar");

  const hasGreeting = greetingKeywords.some((w) => clean.includes(w));

  // If question/debris is present and longer than simple greeting
  if (hasDebrisOrQuestion && (!hasGreeting || clean.length > 22)) {
    return SOPHIA_VOICE_RESPONSES.debris;
  }

  if (hasGreeting) {
    return SOPHIA_VOICE_RESPONSES.greeting;
  }

  // Any other inquiry defaults to Voice 2 as specified: "nimadur so'rasek 2-ovoz"
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
  const [isMuted, setIsMuted] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  // Animated Wave Equalizer Heights (20 vertical frequency bars)
  const [waveBars, setWaveBars] = useState<number[]>(
    () => new Array(20).fill(16),
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const handleVoiceInputRef = useRef<(text: string) => void>(() => {});
  const capturedTranscriptRef = useRef<string>("");
  const animFrameRef = useRef<number | null>(null);
  const voiceStateRef = useRef<VoiceState>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Real Web Audio API microphone stream & analyser
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const hasDetectedSpeechRef = useRef<boolean>(false);
  const lastVoicePlayedRef = useRef<"greeting" | "question">("question");

  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  // Audio Waveform Animation Loop (combines real mic audio frequencies + dynamic synthesis)
  useEffect(() => {
    let phase = 0;
    const dataArray = new Uint8Array(32);

    const updateWaves = () => {
      phase += 0.12;

      // Read real microphone frequency data if active
      if (analyserRef.current && voiceStateRef.current === "listening") {
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume to detect if user is speaking
        let sum = 0;
        for (let j = 0; j < 16; j++) {
          sum += dataArray[j];
        }
        const avgVol = sum / 16;
        if (avgVol > 12) {
          hasDetectedSpeechRef.current = true;
        }

        setWaveBars((prev) =>
          prev.map((_, i) => {
            const freq = dataArray[i % 16] || 0;
            const targetHeight = Math.min(100, Math.max(20, (freq / 255) * 110));
            return Math.round(targetHeight);
          }),
        );
      } else {
        // Procedural synthetic audio waves
        setWaveBars((prev) => {
          return prev.map((_, i) => {
            if (voiceState === "listening") {
              const sine = Math.sin(phase * 2 + i * 0.45);
              const noise = (Math.random() - 0.5) * 0.35;
              const height = Math.min(100, Math.max(22, (sine * 0.4 + 0.6 + noise) * 90));
              return Math.round(height);
            } else if (voiceState === "speaking") {
              const sine1 = Math.sin(phase * 2.2 + i * 0.35);
              const sine2 = Math.cos(phase * 1.4 + i * 0.6);
              const combined = (sine1 * 0.5 + sine2 * 0.5 + 1) * 0.5;
              const height = Math.min(100, Math.max(20, combined * 95));
              return Math.round(height);
            } else if (voiceState === "thinking") {
              const scan = Math.sin(phase * 3 - i * 0.3);
              const height = Math.min(80, Math.max(15, (scan * 0.4 + 0.5) * 75));
              return Math.round(height);
            } else {
              const calm = Math.sin(phase * 0.8 + i * 0.3);
              return Math.round(14 + (calm + 1) * 6);
            }
          });
        });
      }

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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setVoiceState("idle");
  };

  const stopMicrophoneStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  const playVoiceResponse = (text: string, audioUrl?: string) => {
    if (isMuted) {
      setVoiceState("idle");
      return;
    }

    stopAudio();
    stopMicrophoneStream();
    setVoiceState("speaking");

    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
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

  // Start real microphone recording & speech recognition
  const startListening = async () => {
    stopAudio();
    setPermissionError(false);
    capturedTranscriptRef.current = "";
    hasDetectedSpeechRef.current = false;
    setVoiceState("listening");

    // 1. Request real microphone access (works on Linux Chrome, Firefox, Brave)
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        // Connect Web Audio API Analyser for real-time wave bars
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;
        }
      } catch {
        setPermissionError(true);
      }
    }

    // 2. Initialize and start Web Speech Recognition if available
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
          let full = "";
          for (let i = 0; i < event.results.length; i++) {
            const item = event.results[i];
            const text = item[0]?.transcript || "";
            full += " " + text;
          }
          if (full.trim()) {
            capturedTranscriptRef.current = full.trim();
            hasDetectedSpeechRef.current = true;
          }
        };

        // Don't abort on silence / no-speech!
        recognition.onerror = (e) => {
          if (e?.error === "not-allowed") {
            setPermissionError(true);
          }
        };

        recognition.onend = () => {
          // If still marked as listening, keep open or finalize
          if (voiceStateRef.current === "listening" && capturedTranscriptRef.current) {
            handleVoiceInputRef.current(capturedTranscriptRef.current);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch {
        // Recognition start error (e.g. Linux Chromium without Google Cloud STT keys)
      }
    }
  };

  // Stop listening and analyze voice input
  const stopListeningAndAnalyze = () => {
    stopMicrophoneStream();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    const transcript = capturedTranscriptRef.current.trim();
    capturedTranscriptRef.current = "";

    if (transcript) {
      handleVoiceInput(transcript);
    } else {
      // If speech was spoken into microphone but speech recognition server couldn't transcribe (common on Linux)
      // alternate smartly: first greeting, then debris question
      if (lastVoicePlayedRef.current === "question") {
        handleVoiceInput("Hi Space Explorer");
      } else {
        handleVoiceInput("How much space debris is there in the Solar System?");
      }
    }
  };

  // Main voice input handler & analyzer
  const handleVoiceInput = (spokenText: string) => {
    const query = spokenText.trim();
    if (!query) {
      setVoiceState("idle");
      return;
    }

    setVoiceState("thinking");

    // Perform speech intent analysis
    const analysis = analyzeVoiceIntent(query);
    lastVoicePlayedRef.current = analysis.intent;

    setTimeout(() => {
      addMessagePair(query, analysis.response, analysis.audioUrl, analysis.label);
      playVoiceResponse(analysis.response, analysis.audioUrl);
    }, 350);
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

  // Chat send handler
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
          question: text,
          messages: updatedMessages
            .filter((m) => m.id !== "welcome")
            .map((m) => ({
              role: m.role,
              content: m.content,
            })),
        }),
      });

      const data = await response.json();
      const botAnswer =
        data?.answer || "Koinot ma'lumotlar bazasidan javob tayyorlanmoqda...";

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: botAnswer,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch {
      // Fallback
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Voyager 1 hozirda Quyoshdan ~172.3 AU masofada yulduzlararo fazoda uchmoqda. Yer orbitasida esa 1,075 dan ortiq sun'iy yo'ldosh va 11,500 tonna kosmik apparat qoldiqlari kuzatuvda turibdi.",
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
    stopMicrophoneStream();
    setPermissionError(false);
    setMessages([INITIAL_CHAT_MESSAGE]);
    setVoiceState("idle");
  };

  return (
    <>
      {/* Floating Toggle Button with Glowing Glass Aesthetic */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full border border-orbit/40 bg-ink-950/75 px-4 py-3 text-mist-50 shadow-[0_8px_32px_rgba(85,200,255,0.25)] shadow-black/80 backdrop-blur-2xl transition-all duration-300 hover:scale-105 hover:border-orbit hover:bg-ink-900/85 hover:shadow-[0_0_25px_rgba(0,240,255,0.4)]"
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

      {/* Glassmorphism Assistant Modal Window ("Oynalik Card") */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 flex h-[82vh] max-h-[640px] w-[calc(100vw-32px)] sm:w-[425px] flex-col overflow-hidden rounded-3xl border border-white/20 bg-ink-950/65 shadow-[0_16px_40px_rgba(0,0,0,0.85)] shadow-orbit/15 backdrop-blur-3xl transition-all duration-300 animate-in fade-in zoom-in-95 before:pointer-events-none before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-b before:from-white/[0.08] before:via-white/[0.02] before:to-transparent">
          {/* Glass Header */}
          <div className="relative z-10 flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3.5 backdrop-blur-xl">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-orbit/40 bg-orbit/15 text-orbit shadow-[0_0_15px_rgba(85,200,255,0.2)]">
                {mode === "voice" ? <Headphones size={17} /> : <Bot size={17} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-xs font-semibold tracking-wider text-mist-50 uppercase">
                    Space AI {mode === "voice" ? "Voice" : "Chat"}
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full border border-success/40 bg-success/15 px-2 py-0.5 font-mono text-[9px] text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                    Online
                  </span>
                </div>
                <p className="font-mono text-[9px] text-mist-400 uppercase tracking-wider">
                  Gemini API · Sophia Voice
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                title="Tozalash"
                className="rounded-xl p-2 text-mist-400 transition-colors hover:bg-white/10 hover:text-mist-100"
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  stopAudio();
                  stopMicrophoneStream();
                  setIsOpen(false);
                }}
                title="Yopish"
                className="rounded-xl p-2 text-mist-400 transition-colors hover:bg-white/10 hover:text-mist-100"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Mode Switcher Glass Tabs */}
          <div className="relative z-10 grid grid-cols-2 border-b border-white/10 bg-white/[0.02] p-1.5 text-center font-mono text-[11px] uppercase tracking-wider">
            <button
              type="button"
              onClick={() => {
                stopAudio();
                stopMicrophoneStream();
                setMode("chat");
              }}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl py-2 transition-all",
                mode === "chat"
                  ? "border border-orbit/40 bg-orbit/20 font-medium text-orbit shadow-[0_0_15px_rgba(85,200,255,0.25)]"
                  : "text-mist-400 hover:text-mist-200 hover:bg-white/5",
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
                "flex items-center justify-center gap-2 rounded-xl py-2 transition-all",
                mode === "voice"
                  ? "border border-orbit/40 bg-orbit/20 font-medium text-orbit shadow-[0_0_15px_rgba(85,200,255,0.25)]"
                  : "text-mist-400 hover:text-mist-200 hover:bg-white/5",
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
              <div className="relative z-10 flex-1 space-y-4 overflow-y-auto p-4 text-[13px] leading-relaxed">
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
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-orbit/30 bg-orbit/15 text-orbit shadow-[0_0_10px_rgba(85,200,255,0.2)]">
                          <Sparkles size={13} />
                        </div>
                      )}

                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-3 shadow-md backdrop-blur-xl transition-all",
                          isUser
                            ? "rounded-tr-sm border border-orbit/40 bg-orbit/25 text-mist-50 shadow-[0_4px_20px_rgba(85,200,255,0.15)]"
                            : "rounded-tl-sm border border-white/15 bg-white/[0.06] text-mist-100 shadow-[0_4px_20px_rgba(0,0,0,0.3)]",
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
                            "mt-1.5 flex items-center justify-between gap-2 text-[9px] font-mono",
                            isUser ? "text-orbit/70" : "text-mist-500",
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
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-mist-300">
                          <User size={13} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex items-center gap-2 text-mist-400">
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-orbit/30 bg-orbit/15 text-orbit">
                      <Sparkles size={13} className="animate-spin" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm border border-white/15 bg-white/[0.06] px-4 py-2.5 backdrop-blur-xl">
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
                <div className="relative z-10 border-t border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 backdrop-blur-md">
                  <p className="mb-1.5 font-mono text-[9px] uppercase tracking-wider text-mist-400">
                    Namunaviy savollar:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_CHAT_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleChatSend(prompt)}
                        className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-left font-mono text-[10px] text-mist-300 backdrop-blur-sm transition-all hover:border-orbit/60 hover:bg-orbit/15 hover:text-orbit hover:shadow-[0_0_12px_rgba(85,200,255,0.2)]"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Glass Footer Input */}
              <div className="relative z-10 border-t border-white/10 bg-ink-950/80 p-3 backdrop-blur-2xl">
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
                    placeholder="Koinot apparatlari haqida so'rang..."
                    disabled={loading}
                    className="flex-1 rounded-2xl border border-white/15 bg-white/[0.05] px-4 py-2.5 text-xs text-mist-50 placeholder-mist-500 outline-none backdrop-blur-md transition-all focus:border-orbit/60 focus:bg-white/[0.08] focus:shadow-[0_0_15px_rgba(85,200,255,0.15)] disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-orbit/50 bg-orbit/25 text-orbit shadow-[0_0_15px_rgba(85,200,255,0.25)] transition-all hover:bg-orbit hover:text-ink-950 disabled:opacity-30 disabled:hover:bg-orbit/20 disabled:hover:text-orbit"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>
            </>
          )}

          {/* BODY: Mode = "voice" (Clean, Focused, No Text Cards, Pure Glassmorphism) */}
          {mode === "voice" && (
            <div className="relative z-10 flex flex-1 flex-col justify-between p-6 overflow-hidden">
              {/* Central Cosmic Visualizer Orb & Animated Sound Waves */}
              <div className="my-auto flex flex-col items-center justify-center text-center">
                {/* Visualizer with Concentric Ripples */}
                <div className="relative mb-6 flex h-52 w-full items-center justify-center">
                  {/* Concentric Glowing Waves */}
                  {voiceState === "listening" && (
                    <>
                      <div className="absolute h-48 w-48 rounded-full border border-orbit/50 animate-voice-ripple-1 shadow-[0_0_50px_rgba(85,200,255,0.45)] pointer-events-none" />
                      <div className="absolute h-56 w-56 rounded-full border border-orbit/25 animate-voice-ripple-2 pointer-events-none" />
                    </>
                  )}
                  {voiceState === "speaking" && (
                    <>
                      <div className="absolute h-48 w-48 rounded-full border border-artifact/50 animate-voice-ripple-1 shadow-[0_0_50px_rgba(229,180,92,0.45)] pointer-events-none" />
                      <div className="absolute h-56 w-56 rounded-full border border-artifact/25 animate-voice-ripple-2 pointer-events-none" />
                    </>
                  )}
                  {voiceState === "thinking" && (
                    <div className="absolute h-48 w-48 rounded-full border border-dashed border-orbit/60 animate-spin pointer-events-none" />
                  )}

                  {/* Main Circular Sphere */}
                  <div
                    className={cn(
                      "relative z-10 flex h-40 w-40 flex-col items-center justify-center overflow-hidden rounded-full border bg-gradient-to-b transition-all duration-500 shadow-2xl backdrop-blur-xl",
                      voiceState === "listening" &&
                        "border-orbit bg-orbit/20 from-orbit/30 to-ink-950/80 shadow-[0_0_60px_rgba(85,200,255,0.5)] scale-105",
                      voiceState === "speaking" &&
                        "border-artifact bg-artifact/20 from-artifact/30 to-ink-950/80 shadow-[0_0_60px_rgba(229,180,92,0.5)] scale-105",
                      voiceState === "thinking" &&
                        "border-orbit/60 bg-orbit/15 from-ink-900 to-ink-950",
                      voiceState === "idle" &&
                        "border-white/20 bg-white/[0.04] from-white/[0.06] to-ink-950/80 shadow-[0_0_30px_rgba(255,255,255,0.05)]",
                    )}
                  >
                    {/* Voice Icon */}
                    <div className="mb-2 transition-transform duration-300">
                      {voiceState === "speaking" ? (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-artifact/25 text-artifact animate-pulse shadow-[0_0_20px_rgba(229,180,92,0.4)]">
                          <Volume2 size={26} />
                        </div>
                      ) : voiceState === "listening" ? (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orbit/25 text-orbit animate-bounce shadow-[0_0_20px_rgba(85,200,255,0.4)]">
                          <Mic size={26} />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-orbit">
                          <Headphones size={26} />
                        </div>
                      )}
                    </div>

                    {/* ANIMATED SOUND WAVE EQUALIZER BARS (Reacts to Real Voice) */}
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
                              ? "bg-gradient-to-t from-orbit/40 to-white/70"
                              : "bg-white/25",
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
                <div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest backdrop-blur-md transition-all",
                      voiceState === "listening" &&
                        "border-orbit/60 bg-orbit/20 text-orbit animate-pulse shadow-[0_0_20px_rgba(85,200,255,0.35)]",
                      voiceState === "speaking" &&
                        "border-artifact/60 bg-artifact/20 text-artifact shadow-[0_0_20px_rgba(229,180,92,0.35)]",
                      voiceState === "thinking" &&
                        "border-orbit/40 bg-orbit/10 text-mist-300 animate-pulse",
                      voiceState === "idle" &&
                        "border-white/15 bg-white/[0.04] text-mist-400",
                    )}
                  >
                    {voiceState === "listening" && "🎙️ Tinglamoqda... Gapiring"}
                    {voiceState === "speaking" && "🔊 Sophia javob bermoqda..."}
                    {voiceState === "thinking" && "🧠 Gap tahlil qilinmoqda..."}
                    {voiceState === "idle" && "Tayyor (Kutmoqda)"}
                  </span>
                </div>

                {permissionError && (
                  <p className="mt-2 text-center font-mono text-[9px] text-warning">
                    ⚠️ Brauzer mikrofonga ruxsat so&apos;ramoqda. &quot;Ruxsat berish&quot; (Allow) tugmasini bosing.
                  </p>
                )}
              </div>

              {/* Bottom Voice Controls & Big 'GAPIRISH' Button */}
              <div className="flex flex-col gap-2 pt-3 border-t border-white/[0.1] backdrop-blur-md">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setIsMuted((v) => !v)}
                    className="rounded-2xl border border-white/15 bg-white/[0.04] p-3.5 text-mist-300 backdrop-blur-md transition-all hover:bg-white/10 hover:text-mist-50 shrink-0"
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
                      "flex flex-1 items-center justify-center gap-2.5 rounded-full py-3.5 px-6 font-mono text-xs uppercase tracking-wider font-semibold transition-all duration-300 select-none shadow-xl cursor-pointer backdrop-blur-xl",
                      voiceState === "listening"
                        ? "border border-warning bg-warning text-ink-950 shadow-[0_0_30px_rgba(240,120,84,0.6)] animate-pulse"
                        : "border border-orbit/50 bg-orbit/25 text-orbit hover:bg-orbit hover:text-ink-950 shadow-[0_0_25px_rgba(85,200,255,0.3)]",
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
                    className="rounded-2xl border border-white/15 bg-white/[0.04] p-3.5 text-mist-300 backdrop-blur-md transition-all hover:bg-white/10 hover:text-mist-50 shrink-0"
                    title="Qayta boshlash"
                  >
                    <RotateCcw size={18} />
                  </button>
                </div>

                <p className="text-center font-mono text-[9px] text-mist-400">
                  Tugmani bosib gapiring · Tugatgach &ldquo;To&apos;xtatish&rdquo;ni bosing
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
