"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Headphones,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";

import { cn } from "@/lib/format";

interface RouteGuide {
  title: string;
  subtitle: string;
  audioUrl: string;
  transcript: string;
}

const ROUTE_GUIDES: Record<string, RouteGuide> = {
  "/": {
    title: "Space Archive",
    subtitle: "Welcome Overview",
    audioUrl: "/audio/welcome.wav",
    transcript:
      "Welcome to Space Archive. Explore human hardware, satellites, and debris across the Solar System.",
  },
  "/earth-orbit": {
    title: "Earth Orbit",
    subtitle: "Satellite & Debris Tracking",
    audioUrl: "/audio/earth-orbit.wav",
    transcript:
      "This is Earth Orbit. Track active satellites and orbital debris encircling our planet.",
  },
  "/moon": {
    title: "Moon Surface",
    subtitle: "Lunar Landing Sites & Artefacts",
    audioUrl: "/audio/moon.wav",
    transcript:
      "This is the Moon. Discover historic landing sites, Apollo artefacts, and lunar probes.",
  },
  "/mars": {
    title: "Mars Surface",
    subtitle: "Rovers & Robotic Landers",
    audioUrl: "/audio/mars.wav",
    transcript:
      "Welcome to Mars. Explore robotic landers, rovers, and milestones of Martian exploration.",
  },
  "/solar-system": {
    title: "Solar System",
    subtitle: "Interplanetary 3D Map",
    audioUrl: "/audio/solar-system.wav",
    transcript:
      "You are exploring the Solar System. Navigate planetary orbits and interplanetary trajectories.",
  },
  "/deep-space": {
    title: "Deep Space",
    subtitle: "Interstellar Probes",
    audioUrl: "/audio/deep-space.wav",
    transcript:
      "This is Deep Space. Follow humanity's furthest voyagers venturing into the interstellar medium.",
  },
  "/explore": {
    title: "Explore Catalogue",
    subtitle: "1,146 Tracked Records",
    audioUrl: "/audio/explore.wav",
    transcript:
      "This is the Archive Catalogue. Search, filter, and inspect over one thousand tracked objects.",
  },
};

export function PageAudioGuide() {
  const pathname = usePathname();
  const guide = ROUTE_GUIDES[pathname];

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [hasPlayedThisSession, setHasPlayedThisSession] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Initialize mute state from localStorage
  useEffect(() => {
    try {
      const savedMute = localStorage.getItem("space_voice_guide_muted");
      if (savedMute === "true") {
        setIsMuted(true);
      }
    } catch {
      // LocalStorage not available
    }
  }, []);

  // Listen for AI Chatbot audio to pause guide and prevent overlap
  useEffect(() => {
    const handleChatAudio = () => {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    window.addEventListener("space:chat-audio-play", handleChatAudio);
    return () => {
      window.removeEventListener("space:chat-audio-play", handleChatAudio);
    };
  }, []);

  // Stop previous audio when navigating away or unmounting
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Play a specific guide audio
  const playGuideAudio = (guideData: RouteGuide, markAsPlayed = true) => {
    // Stop any ongoing audio first
    stopAudio();

    // Signal other components (like AI Chatbot) to yield audio
    window.dispatchEvent(new CustomEvent("space:guide-audio-play"));

    const audio = new Audio(guideData.audioUrl);
    audio.muted = isMuted;
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0);
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.onerror = () => {
      setIsPlaying(false);
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setAutoplayBlocked(false);
          if (markAsPlayed) {
            try {
              sessionStorage.setItem(`space_narrated_${pathname}`, "true");
              setHasPlayedThisSession(true);
            } catch {
              // Ignore storage errors
            }
          }
        })
        .catch((err: Error) => {
          // Browser Autoplay Policy blocked playback
          if (err.name === "NotAllowedError") {
            setAutoplayBlocked(true);
            setIsPlaying(false);
          }
        });
    }
  };

  // Route Change Handler: Auto-narrate on first visit in the session
  useEffect(() => {
    if (!guide) {
      stopAudio();
      return;
    }

    // Check if this route has already been narrated in current session
    let alreadyPlayed = false;
    try {
      alreadyPlayed = sessionStorage.getItem(`space_narrated_${pathname}`) === "true";
    } catch {
      alreadyPlayed = false;
    }

    setHasPlayedThisSession(alreadyPlayed);
    setAutoplayBlocked(false);

    // If muted or already narrated, do not autoplay
    if (isMuted || alreadyPlayed) {
      stopAudio();
      return;
    }

    // Auto-narrate on 1st visit
    playGuideAudio(guide, true);

    return () => {
      stopAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isMuted]);

  // One-time interaction fallback if browser blocked autoplay on first visit
  useEffect(() => {
    if (!autoplayBlocked || !guide) return;

    const handleFirstGesture = () => {
      if (autoplayBlocked && guide && !isMuted) {
        playGuideAudio(guide, true);
      }
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
    };

    window.addEventListener("pointerdown", handleFirstGesture, { once: true });
    window.addEventListener("keydown", handleFirstGesture, { once: true });

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplayBlocked, guide, isMuted]);

  // Handle Mute Toggle
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    try {
      localStorage.setItem("space_voice_guide_muted", String(nextMuted));
    } catch {
      // Ignore
    }

    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
      if (nextMuted && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Handle Play/Pause toggle
  const togglePlayPause = () => {
    if (!guide) return;

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (audioRef.current && audioRef.current.src.includes(guide.audioUrl)) {
        window.dispatchEvent(new CustomEvent("space:guide-audio-play"));
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      } else {
        playGuideAudio(guide, false);
      }
    }
  };

  // Replay from start
  const handleReplay = () => {
    if (!guide) return;
    playGuideAudio(guide, false);
  };

  if (!guide) {
    return null;
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <aside
      aria-label="Sophia Space Audio Guide"
      className={cn(
        "fixed bottom-5 left-5 z-40 transition-all duration-300",
        isCollapsed ? "translate-y-0" : "translate-y-0",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border backdrop-blur-2xl transition-all duration-300 shadow-2xl",
          isPlaying
            ? "border-orbit/40 bg-ink-950/85 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_25px_rgba(85,200,255,0.2)]"
            : "border-white/15 bg-ink-950/75 shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_15px_rgba(255,255,255,0.05)]",
        )}
      >
        {/* Animated Top Progress Bar when audio is playing */}
        {isPlaying && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-orbit to-cyan-300 transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Collapsed Pill Button */}
        {isCollapsed ? (
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-left font-mono text-xs text-mist-200 transition-colors hover:text-white"
            title="Sophia Audio Guide-ni ochish"
          >
            <div
              className={cn(
                "relative flex h-7 w-7 items-center justify-center rounded-xl border",
                isPlaying
                  ? "border-orbit/50 bg-orbit/20 text-orbit shadow-[0_0_12px_rgba(85,200,255,0.4)] animate-pulse"
                  : "border-white/20 bg-white/10 text-mist-300",
              )}
            >
              <Headphones size={14} />
            </div>
            <span className="text-[11px] font-semibold tracking-wide">Sophia Guide</span>
            <ChevronUp size={14} className="text-mist-400" />
          </button>
        ) : (
          /* Expanded Guide Pill */
          <div className="flex flex-col p-3 sm:flex-row sm:items-center sm:gap-3.5 max-w-[340px] sm:max-w-none">
            {/* Left: Avatar + Animated Wave Equalizer */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={togglePlayPause}
                className={cn(
                  "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-300",
                  isPlaying
                    ? "border-orbit bg-orbit/25 text-orbit shadow-[0_0_20px_rgba(85,200,255,0.5)] scale-105"
                    : autoplayBlocked
                    ? "border-warning bg-warning/20 text-warning animate-bounce"
                    : "border-white/20 bg-white/10 text-mist-300 hover:border-orbit/60 hover:text-orbit",
                )}
                title={isPlaying ? "Pauza" : "Eshitish"}
              >
                {isPlaying ? (
                  <Pause size={16} />
                ) : autoplayBlocked ? (
                  <Play size={16} className="translate-x-0.5" />
                ) : (
                  <Play size={16} className="translate-x-0.5" />
                )}
              </button>

              {/* Guide Info */}
              <div className="min-w-0 pr-1">
                <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-mist-400">
                  <span
                    className={cn(
                      "inline-block h-1.5 w-1.5 rounded-full",
                      isPlaying
                        ? "bg-orbit shadow-[0_0_8px_#55C8FF] animate-ping"
                        : autoplayBlocked
                        ? "bg-warning animate-pulse"
                        : "bg-mist-500",
                    )}
                  />
                  <span>SOPHIA GUIDE</span>
                  {isPlaying && (
                    <span className="text-orbit font-semibold">· IJRO ETILMOQDA</span>
                  )}
                  {autoplayBlocked && (
                    <span className="text-warning font-semibold">· TINGLASH UCHUN BOSING</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <p className="truncate text-xs font-semibold text-mist-100">
                    {guide.title}
                  </p>
                  <span className="hidden text-[10px] text-mist-400 sm:inline">·</span>
                  <p className="hidden truncate text-[11px] text-mist-400 sm:inline">
                    {guide.subtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Mini Equalizer Waves when Playing */}
            {isPlaying && (
              <div
                className="hidden sm:flex h-5 items-end gap-[2px] px-1"
                aria-hidden="true"
              >
                <span className="h-3 w-[2px] rounded-full bg-orbit animate-[pulse_0.6s_ease-in-out_infinite]" />
                <span className="h-4 w-[2px] rounded-full bg-orbit animate-[pulse_0.4s_ease-in-out_infinite_0.1s]" />
                <span className="h-2 w-[2px] rounded-full bg-orbit animate-[pulse_0.7s_ease-in-out_infinite_0.2s]" />
                <span className="h-5 w-[2px] rounded-full bg-cyan-300 animate-[pulse_0.5s_ease-in-out_infinite_0.15s]" />
                <span className="h-3 w-[2px] rounded-full bg-orbit animate-[pulse_0.6s_ease-in-out_infinite_0.25s]" />
              </div>
            )}

            {/* Actions: Replay, Mute, Collapse */}
            <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 sm:mt-0 sm:border-t-0 sm:pt-0 sm:gap-1.5 shrink-0">
              {/* Replay */}
              <button
                type="button"
                onClick={handleReplay}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[10px] text-mist-300 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white"
                title="Boshidan qayta tinglash"
              >
                <RotateCcw size={12} />
                <span className="text-[10px]">Qayta</span>
              </button>

              {/* Mute / Unmute */}
              <button
                type="button"
                onClick={toggleMute}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg border transition-all",
                  isMuted
                    ? "border-warning/40 bg-warning/15 text-warning"
                    : "border-white/10 bg-white/[0.04] text-mist-300 hover:bg-white/10 hover:text-white",
                )}
                title={isMuted ? "Ovozni yoqish" : "Ovozni o'chirish (Mute)"}
              >
                {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
              </button>

              {/* Collapse */}
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent text-mist-400 hover:text-mist-200"
                title="Kichraytirish"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
