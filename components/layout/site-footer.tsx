import Link from "next/link";

import { SITE } from "@/lib/constants";

const ATLAS = [
  { href: "/explore", label: "Explore the archive" },
  { href: "/solar-system", label: "Solar system" },
  { href: "/earth-orbit", label: "Earth orbit" },
  { href: "/moon", label: "Lunar surface" },
  { href: "/mars", label: "Mars surface" },
  { href: "/deep-space", label: "Deep space" },
];

const REFERENCE = [
  { href: "/missions", label: "Mission timeline" },
  { href: "/data-center", label: "Data centre" },
  { href: "/about", label: "About & method" },
  { href: "/api/v1/health", label: "API health" },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-ink-950">
      <div className="shell grid gap-10 py-14 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="font-mono text-[13px] tracking-[0.28em] text-mist-50">SPACE ARCHIVE</p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-mist-500">
            {SITE.tagline}. Built from published catalogues — CelesTrak, NASA and JPL
            Horizons — with every gap left visible rather than filled in.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["CelesTrak", "NASA", "JPL Horizons", "Solar System Scope"].map((provider) => (
              <span
                key={provider}
                className="border border-white/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-mist-600"
              >
                {provider}
              </span>
            ))}
          </div>
        </div>

        <div className="md:col-span-3">
          <p className="label">Atlas</p>
          <ul className="mt-4 space-y-2">
            {ATLAS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-mist-500 transition-colors hover:text-mist-50"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className="label">Reference</p>
          <ul className="mt-4 space-y-2">
            {REFERENCE.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-mist-500 transition-colors hover:text-mist-50"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className="label">Status</p>
          <div className="mt-4 space-y-3 text-sm text-mist-500">
            <p className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Static snapshot
            </p>
            <p className="text-xs leading-relaxed text-mist-600">
              Positions are computed from stored element sets and ephemerides. This is not
              a live tracking service and no telemetry is claimed.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.07]">
        <div className="shell flex flex-col gap-2 py-5 font-mono text-[9px] uppercase tracking-[0.16em] text-mist-600 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getUTCFullYear()} Space Archive · open data, open gaps</span>
          <span>
            Planet textures by Solar System Scope (CC BY 4.0) · catalogue data by CelesTrak,
            NASA and JPL
          </span>
        </div>
      </div>
    </footer>
  );
}
