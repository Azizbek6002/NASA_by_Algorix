"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Search, SlidersHorizontal } from "lucide-react";

import { ObjectInspector } from "@/components/inspector/object-inspector";
import {
  EMPTY_ORBIT_FILTERS,
  filterOrbitObjects,
  type OrbitFilters,
} from "@/lib/filters";
import { REGIME_LABEL, TYPE_LABEL } from "@/lib/constants";
import { cn, displayName, formatInt, formatTimestamp } from "@/lib/format";
import { useInitialQueryParam } from "@/lib/use-query-param";
import type { OrbitObjectLite, OrbitRegime } from "@/lib/types";

const EarthOrbitCanvas = dynamic(() => import("@/components/three/earth-orbit-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-ink-950">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist-600">
        Initialising SGP4 view…
      </p>
    </div>
  ),
});

const TYPE_OPTIONS = ["satellite", "rocket_body", "debris"] as const;
const REGIME_OPTIONS: OrbitRegime[] = ["LEO", "MEO", "GEO", "HEO"];
const STATUS_OPTIONS = ["active", "inactive", "unknown"] as const;
const SPEEDS = [
  { label: "1×", value: 1 },
  { label: "60×", value: 60 },
  { label: "300×", value: 300 },
  { label: "1800×", value: 1800 },
];

function Chip({
  active,
  children,
  onClick,
  accent,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  accent?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors",
        active
          ? "border-white/40 bg-white/10 text-mist-50"
          : "border-white/10 bg-transparent text-mist-500 hover:border-white/25 hover:text-mist-300",
      )}
      style={active && accent ? { borderColor: `${accent}66`, color: accent } : undefined}
    >
      {children}
    </button>
  );
}

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function EarthOrbitView({ objects }: { objects: OrbitObjectLite[] }) {
  const initialId = useInitialQueryParam("object");
  const [filters, setFilters] = useState<OrbitFilters>(EMPTY_ORBIT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [playing, setPlaying] = useState(true);
  const [timeScale, setTimeScale] = useState(60);
  const [resetToken, setResetToken] = useState(0);
  const [stats, setStats] = useState<{ valid: number; total: number; simTime: number } | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const statsRef = useRef(stats);

  const handleStats = useCallback((next: { valid: number; total: number; simTime: number }) => {
    setStats((current) =>
      current && Math.abs(current.simTime - next.simTime) < 400 && current.valid === next.valid
        ? current
        : next,
    );
  }, []);

  const filtered = useMemo(() => filterOrbitObjects(objects, filters), [objects, filters]);
  const owners = useMemo(() => {
    const map = new Map<string, number>();
    for (const object of objects) {
      const key = object.country ?? "Unknown";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [objects]);

  const select = useCallback((id: string) => {
    setSelectedId(id);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("object", id);
      window.history.replaceState({}, "", url);
    }
  }, []);

  const clear = useCallback(() => {
    setSelectedId(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("object");
      window.history.replaceState({}, "", url);
    }
  }, []);

  const activeFilterCount =
    filters.types.length +
    filters.regimes.length +
    filters.statuses.length +
    filters.owners.length +
    (filters.query ? 1 : 0);

  statsRef.current = stats;
  const selectedName = objects.find((object) => object.id === selectedId)?.name ?? null;

  return (
    <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_352px]">
      {/* Filter rail */}
      <aside className="order-2 xl:order-1">
        <div className="border border-white/10 bg-ink-900/50">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="label">Filters</span>
            <div className="flex items-center gap-2">
              {activeFilterCount ? (
                <button
                  type="button"
                  onClick={() => setFilters(EMPTY_ORBIT_FILTERS)}
                  className="font-mono text-[9px] uppercase tracking-[0.14em] text-artifact hover:text-artifact/80"
                >
                  Reset {activeFilterCount}
                </button>
              ) : null}
              <button
                type="button"
                className="xl:hidden"
                onClick={() => setPanelOpen((value) => !value)}
                aria-label="Toggle filters"
              >
                <SlidersHorizontal size={14} className="text-mist-500" />
              </button>
            </div>
          </div>

          <div className={cn("space-y-4 px-4 py-4", panelOpen ? "block" : "hidden xl:block")}>
            <label className="relative block">
              <Search size={13} className="absolute left-2.5 top-2.5 text-mist-600" />
              <input
                value={filters.query}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, query: event.target.value }))
                }
                placeholder="Name, NORAD ID…"
                className="w-full border border-white/10 bg-ink-950/60 py-2 pl-8 pr-2 font-mono text-[11px] text-mist-50 outline-none placeholder:text-mist-600 focus:border-orbit/50"
              />
            </label>

            <div>
              <p className="label mb-2">Object type</p>
              <div className="flex flex-wrap gap-1.5">
                {TYPE_OPTIONS.map((type) => {
                  const count = objects.filter((object) => object.type === type).length;
                  return (
                    <Chip
                      key={type}
                      active={filters.types.includes(type)}
                      onClick={() =>
                        setFilters((current) => ({
                          ...current,
                          types: toggleValue(current.types, type),
                        }))
                      }
                    >
                      {TYPE_LABEL[type]} · {formatInt(count)}
                    </Chip>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="label mb-2">Orbit regime</p>
              <div className="flex flex-wrap gap-1.5">
                {REGIME_OPTIONS.map((regime) => (
                  <Chip
                    key={regime}
                    active={filters.regimes.includes(regime)}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        regimes: toggleValue(current.regimes, regime),
                      }))
                    }
                  >
                    {regime}
                  </Chip>
                ))}
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-mist-600">
                {REGIME_LABEL.LEO} &lt; 2,000 km · {REGIME_LABEL.MEO} · geostationary belt ·{" "}
                {REGIME_LABEL.HEO} eccentric orbits.
              </p>
            </div>

            <div>
              <p className="label mb-2">Status</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((status) => (
                  <Chip
                    key={status}
                    active={filters.statuses.includes(status)}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        statuses: toggleValue(current.statuses, status),
                      }))
                    }
                  >
                    {status === "unknown" ? "not stated" : status}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <p className="label mb-2">Operator</p>
              <select
                value={filters.owners[0] ?? ""}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    owners: event.target.value ? [event.target.value] : [],
                  }))
                }
                className="w-full border border-white/10 bg-ink-950/60 px-2 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-mist-300 outline-none focus:border-orbit/50"
              >
                <option value="">All operators</option>
                {owners.slice(0, 30).map(([owner, count]) => (
                  <option key={owner} value={owner}>
                    {owner} ({count})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-white/10">
            <div className="flex items-center justify-between px-4 py-2">
              <span className="label">Matches</span>
              <span className="data-num text-xs text-mist-300">
                {formatInt(filtered.length)}
                <span className="text-mist-600"> / {formatInt(objects.length)}</span>
              </span>
            </div>
            <ul className="max-h-[380px] overflow-y-auto scroll-thin border-t border-white/[0.06]">
              {filtered.slice(0, 200).map((object) => (
                <li key={object.id}>
                  <button
                    type="button"
                    onClick={() => select(object.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 border-b border-white/[0.04] px-4 py-2 text-left transition-colors",
                      selectedId === object.id ? "bg-white/[0.07]" : "hover:bg-white/[0.03]",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] text-mist-300">
                        {displayName(object.name)}
                      </span>
                      <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-mist-600">
                        {object.altitudeRegime} · {object.noradId}
                      </span>
                    </span>
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{
                        background:
                          object.type === "debris"
                            ? "#6F7B8A"
                            : object.type === "rocket_body"
                              ? "#E5B45C"
                              : "#55C8FF",
                      }}
                    />
                  </button>
                </li>
              ))}
              {filtered.length > 200 ? (
                <li className="px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">
                  Showing first 200 of {formatInt(filtered.length)}. Narrow the filters.
                </li>
              ) : null}
              {filtered.length === 0 ? (
                <li className="px-4 py-6 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">
                  No objects match
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </aside>

      {/* Viewport */}
      <section className="order-1 xl:order-2">
        <div className="flex flex-wrap items-center justify-between gap-3 border border-b-0 border-white/10 bg-ink-900/50 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-mist-500">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  playing ? "animate-pulse bg-success" : "bg-mist-600",
                )}
              />
              {playing ? "Simulating" : "Paused"}
            </span>
            <span className="hidden font-mono text-[10px] tabular-nums text-mist-400 sm:inline">
              {stats ? formatTimestamp(new Date(stats.simTime).toISOString()) : "——"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {SPEEDS.map((speed) => (
              <Chip
                key={speed.value}
                active={timeScale === speed.value}
                onClick={() => setTimeScale(speed.value)}
              >
                {speed.label}
              </Chip>
            ))}
            <button
              type="button"
              onClick={() => setPlaying((value) => !value)}
              className="ml-1 border border-white/12 p-1.5 text-mist-400 transition-colors hover:border-white/30 hover:text-mist-50"
              aria-label={playing ? "Pause simulation" : "Resume simulation"}
            >
              {playing ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <button
              type="button"
              onClick={() => setResetToken((value) => value + 1)}
              className="border border-white/12 p-1.5 text-mist-400 transition-colors hover:border-white/30 hover:text-mist-50"
              aria-label="Reset simulation to now"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        <div className="relative h-[58vh] min-h-[380px] border border-white/10 bg-ink-950 xl:h-[calc(100vh-260px)] xl:min-h-[520px]">
          <EarthOrbitCanvas
            objects={filtered}
            selectedId={selectedId}
            onSelect={select}
            timeScale={timeScale}
            playing={playing}
            showSelectionOrbit
            resetToken={resetToken}
            onStats={handleStats}
          />
          <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-3 border border-white/10 bg-ink-950/80 px-3 py-2 backdrop-blur">
            {[
              { label: "Payload", color: "#55C8FF", count: filtered.filter((o) => o.type === "satellite").length },
              { label: "Rocket body", color: "#E5B45C", count: filtered.filter((o) => o.type === "rocket_body").length },
              { label: "Debris", color: "#6F7B8A", count: filtered.filter((o) => o.type === "debris").length },
            ].map((entry) => (
              <span
                key={entry.label}
                className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-mist-500"
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: entry.color }} />
                {entry.label} {formatInt(entry.count)}
              </span>
            ))}
          </div>
          <div className="pointer-events-none absolute right-3 top-3 max-w-[230px] border border-white/10 bg-ink-950/80 px-3 py-2 text-right backdrop-blur">
            <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-mist-600">
              Scale · 1 unit = 6,371 km
            </p>
            <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-warning/80">
              SGP4 estimate · not live tracking
            </p>
            <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-mist-600">
              {stats ? `${formatInt(stats.valid)} of ${formatInt(stats.total)} propagated` : "—"}
            </p>
          </div>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-mist-600">
          Drag to rotate, scroll to zoom. Earth stays fixed in the Earth-fixed frame while
          objects advance along their computed orbits. Click a marker (or a row in the index)
          to open its record.
        </p>
      </section>

      {/* Inspector */}
      <div className="order-3 xl:sticky xl:top-[120px] xl:h-[calc(100vh-140px)]">
        <ObjectInspector id={selectedId} fallbackName={selectedName} onClose={clear} />
      </div>
    </div>
  );
}
