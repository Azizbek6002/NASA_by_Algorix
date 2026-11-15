"use client";

import { usePathname } from "next/navigation";
import { MeteorRain } from "@/components/effects/meteor-rain";

export function AppBackground() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* 1. Dynamic Ambient Neon Nebula Lights (Jonli neon nurlari) */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[650px] w-[650px] rounded-full bg-[radial-gradient(circle,rgba(0,240,255,0.18)_0%,transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute top-10 -right-40 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(176,38,255,0.16)_0%,transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/3 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(0,140,255,0.12)_0%,transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-10 h-[550px] w-[550px] rounded-full bg-[radial-gradient(circle,rgba(255,120,30,0.11)_0%,transparent_70%)] blur-3xl" />

      {/* 2. Earth Horizon (Rasm 3) for all other sections */}
      {!isHome && (
        <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-700">
          <div
            className="h-full w-full bg-cover md:bg-contain bg-center bg-no-repeat opacity-45 sm:opacity-55 transition-opacity duration-500"
            style={{ backgroundImage: "url('/earth-horizon.png')" }}
          />
          {/* Radial mask to ensure crisp readability of charts & tables */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(3,5,8,0.75)_80%)]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-950/70 via-transparent to-ink-950/90" />
        </div>
      )}

      {/* 3. Meteor Shower Animation (Metyoritlar yomg'iri) */}
      <MeteorRain />
    </div>
  );
}
