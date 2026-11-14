"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import { GlobalSearch } from "@/components/layout/global-search";
import { cn } from "@/lib/format";

const PRIMARY = [
  { href: "/explore", label: "Explore" },
  { href: "/solar-system", label: "Solar System" },
  { href: "/earth-orbit", label: "Earth Orbit" },
  { href: "/moon", label: "Moon" },
  { href: "/mars", label: "Mars" },
  { href: "/deep-space", label: "Deep Space" },
];

const SECONDARY = [
  { href: "/missions", label: "Missions" },
  { href: "/data-center", label: "Data" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-ink-950/85 backdrop-blur-xl">
      <div className="shell flex h-16 items-center gap-6">
        <Link href="/" className="group flex items-center gap-3" aria-label="SPACE ARCHIVE home">
          <span className="relative flex h-8 w-8 items-center justify-center">
            <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
              <circle cx="16" cy="16" r="3.2" fill="#55C8FF" />
              <ellipse
                cx="16"
                cy="16"
                rx="14"
                ry="6"
                fill="none"
                stroke="#55C8FF"
                strokeOpacity="0.45"
                strokeWidth="0.9"
                transform="rotate(-24 16 16)"
              />
              <ellipse
                cx="16"
                cy="16"
                rx="14"
                ry="6"
                fill="none"
                stroke="#E5B45C"
                strokeOpacity="0.5"
                strokeWidth="0.9"
                transform="rotate(38 16 16)"
              />
              <circle cx="28.2" cy="9.4" r="1.5" fill="#E5B45C" />
            </svg>
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-mono text-[13px] font-semibold tracking-[0.28em] text-mist-50">
              SPACE ARCHIVE
            </span>
            <span className="mt-1 hidden font-mono text-[9px] uppercase tracking-[0.24em] text-mist-500 sm:block">
              Atlas of human hardware
            </span>
          </span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label="Primary">
          {PRIMARY.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors",
                isActive(item.href)
                  ? "text-orbit"
                  : "text-mist-500 hover:text-mist-50",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <GlobalSearch />
          <Link
            href="/about"
            className="hidden border border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-mist-500 transition-colors hover:border-white/30 hover:text-mist-50 xl:inline-flex"
          >
            About
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center border border-white/15 text-mist-300 lg:hidden"
            aria-expanded={open}
            aria-label="Toggle navigation"
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      <div className="hidden border-t border-white/[0.07] lg:block">
        <div className="shell flex h-10 items-center gap-5">
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-mist-600">
            Index
          </span>
          {SECONDARY.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "font-mono text-[10px] uppercase tracking-[0.18em] transition-colors",
                isActive(item.href) ? "text-artifact" : "text-mist-500 hover:text-mist-50",
              )}
            >
              {item.label}
            </Link>
          ))}
          <span className="ml-auto flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-mist-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            Snapshot dataset · not live tracking
          </span>
        </div>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-ink-950/98 lg:hidden">
          <nav className="shell grid grid-cols-2 gap-px py-4" aria-label="Mobile">
            {[...PRIMARY, ...SECONDARY].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "border border-white/[0.06] px-3 py-3 font-mono text-[11px] uppercase tracking-[0.16em]",
                  isActive(item.href) ? "text-orbit" : "text-mist-300",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
