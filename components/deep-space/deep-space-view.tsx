"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { Info, RotateCw } from "lucide-react";

import { ObjectInspector } from "@/components/inspector/object-inspector";
import type { HeliocentricBody } from "@/components/three/heliocentric-canvas";
import { StatusBadge } from "@/components/ui/status-badge";
import { auToSceneRadius } from "@/lib/scene";
import { cn, formatAu, formatDecimal, formatLightTime } from "@/lib/format";
import { useInitialQueryParam } from "@/lib/use-query-param";
import type { DeepSpaceProbe, PlanetRecord } from "@/lib/types";

const HeliocentricCanvas = dynamic(
  () => import("@/components/three/heliocentric-canvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-ink-950">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist-600">
          Plotting deep-space ephemerides…
        </p>
      </div>
    ),
  },
);

const DOMAIN: [number, number] = [0.3, 220];

function DistanceLadder({
  probes,
  planets,
  selectedId,
  onSelect,
}: {
  probes: DeepSpaceProbe[];
  planets: PlanetRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const width = 760;
  const height = 150;
  const pad = 42;
  const lo = Math.log10(DOMAIN[0]);
  const hi = Math.log10(DOMAIN[1]);
  const x = (au: number) => pad + ((Math.log10(au) - lo) / (hi - lo)) * (width - pad * 2);

  const ticks = [0.3, 1, 3, 10, 30, 100, 200];

  return (
    <div className="border border-white/10 bg-ink-900/40 px-4 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="label">Distance ladder · logarithmic</p>
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">
          Sun at left · AU from the Sun
        </p>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-3 h-auto w-full"
        role="img"
        aria-label="Logarithmic distance ladder of planets and deep-space probes"
      >
        <line
          x1={pad}
          y1={78}
          x2={width - pad}
          y2={78}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
        />
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={x(tick)}
              y1={73}
              x2={x(tick)}
              y2={83}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="1"
            />
            <text
              x={x(tick)}
              y={98}
              fill="#6F7B8A"
              fontSize="9"
              fontFamily="ui-monospace, monospace"
              textAnchor="middle"
            >
              {tick} AU
            </text>
          </g>
        ))}

        {planets.map((planet) => (
          <g key={planet.slug}>
            <circle cx={x(planet.distanceAu)} cy={78} r={2.4} fill={planet.visualColor} />
            <text
              x={x(planet.distanceAu)}
              y={118}
              fill="#8B96A5"
              fontSize="8"
              fontFamily="ui-monospace, monospace"
              textAnchor="middle"
            >
              {planet.name}
            </text>
          </g>
        ))}

        {probes.map((probe, index) => {
          const cx = x(probe.distanceAu);
          const cy = index % 2 === 0 ? 50 : 28;
          const selected = selectedId === probe.id;
          return (
            <g
              key={probe.id}
              className="cursor-pointer"
              onClick={() => onSelect(probe.id)}
              role="button"
              tabIndex={0}
            >
              <line
                x1={cx}
                y1={cy + 4}
                x2={cx}
                y2={76}
                stroke={selected ? "#ffffff" : "rgba(155,140,255,0.4)"}
                strokeWidth="1"
              />
              <circle
                cx={cx}
                cy={cy}
                r={selected ? 4.6 : 3.4}
                fill={selected ? "#FFFFFF" : "#9B8CFF"}
              />
              <text
                x={cx}
                y={cy - 8}
                fill={selected ? "#F5F7FA" : "#C3CAD4"}
                fontSize="8.5"
                fontFamily="ui-monospace, monospace"
                textAnchor="middle"
              >
                {probe.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function DeepSpaceView({
  probes,
  planets,
  epoch,
  provider,
}: {
  probes: DeepSpaceProbe[];
  planets: PlanetRecord[];
  epoch: string;
  provider: string;
}) {
  const initialId = useInitialQueryParam("object");
  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [autoRotate, setAutoRotate] = useState(false);

  const sorted = useMemo(
    () => [...probes].sort((a, b) => b.distanceAu - a.distanceAu),
    [probes],
  );

  const bodies: HeliocentricBody[] = useMemo(
    () => [
      ...planets.map((planet) => ({
        id: `planet:${planet.slug}`,
        name: planet.name,
        kind: "planet" as const,
        radiusKm: planet.radiusKm,
        distanceAu: planet.distanceAu,
        meanDistanceAu: planet.meanDistanceAu,
        visualColor: planet.visualColor,
        texture: planet.texture,
        positionKm: planet.positionKm,
        meta: formatAu(planet.distanceAu),
      })),
      ...probes.map((probe) => ({
        id: probe.id,
        name: probe.name,
        kind: "probe" as const,
        radiusKm: 5,
        distanceAu: probe.distanceAu,
        visualColor: "#9B8CFF",
        positionKm: probe.positionKm,
        status: probe.status,
        meta: formatAu(probe.distanceAu),
      })),
    ],
    [planets, probes],
  );

  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("object", id);
    else url.searchParams.delete("object");
    window.history.replaceState({}, "", url);
  }, []);

  const selectedName =
    probes.find((probe) => probe.id === selectedId)?.name ??
    planets.find((planet) => `planet:${planet.slug}` === selectedId)?.name ??
    null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_352px]">
        <aside className="order-2 xl:order-1">
          <div className="border border-white/10 bg-ink-900/50">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="label">Interstellar probes</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist-600">
                {probes.length}
              </span>
            </div>
            <ul>
              {sorted.map((probe) => {
                const active = selectedId === probe.id;
                return (
                  <li key={probe.id}>
                    <button
                      type="button"
                      onClick={() => select(probe.id)}
                      className={cn(
                        "w-full border-b border-white/[0.05] px-4 py-3 text-left transition-colors",
                        active ? "bg-white/[0.07]" : "hover:bg-white/[0.03]",
                      )}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-[13px] text-mist-200">{probe.name}</span>
                        <StatusBadge
                          status={probe.status}
                          label={probe.status.replace(/_/g, " ")}
                        />
                      </span>
                      <span className="mt-1.5 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">
                        <span>{formatAu(probe.distanceAu)} from Sun</span>
                        <span>{formatLightTime(probe.lightTimeHours)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="px-4 py-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist-600">
                {provider} · epoch {epoch.slice(0, 10)}
              </p>
            </div>
          </div>

          <div className="mt-3 border border-white/10 bg-ink-900/40 px-4 py-3">
            <p className="flex items-center gap-2 label">
              <Info size={11} /> What this view is
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-mist-500">
              One state vector per probe from JPL Horizons at {epoch.slice(0, 10)}, mapped to
              a compressed radial scale (r = 2 + 3·√AU + 2·log₁₀(1 + AU)). It is an ephemeris
              snapshot, not telemetry and not a live position.
            </p>
            <ul className="mt-3 space-y-1.5">
              {[
                ["Voyager 1", 172.35],
                ["New Horizons", 66.06],
                ["Heliopause (model)", 120],
              ].map(([name, au]) => (
                <li
                  key={name as string}
                  className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.1em] text-mist-600"
                >
                  <span>{name}</span>
                  <span>{formatDecimal(auToSceneRadius(au as number), 2)} u</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="order-1 xl:order-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border border-b-0 border-white/10 bg-ink-900/50 px-4 py-2.5">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-mist-500">
                <span className="h-1.5 w-1.5 rounded-full bg-[#9B8CFF]" />
                Beyond the planets
              </span>
              <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-mist-600 sm:inline">
                Planets shown for scale context
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAutoRotate((value) => !value)}
              className={cn(
                "flex items-center gap-1.5 border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em]",
                autoRotate
                  ? "border-orbit/50 text-orbit"
                  : "border-white/12 text-mist-500 hover:border-white/30",
              )}
            >
              <RotateCw size={10} /> {autoRotate ? "Rotating" : "Rotate"}
            </button>
          </div>

          <div className="relative h-[58vh] min-h-[400px] border border-white/10 bg-ink-950 xl:h-[calc(100vh-260px)] xl:min-h-[540px]">
            <HeliocentricCanvas
              bodies={bodies}
              selectedId={selectedId}
              onSelect={select}
              mode="deep"
              autoRotate={autoRotate}
            />
            <div className="pointer-events-none absolute right-3 top-3 max-w-[250px] border border-white/10 bg-ink-950/80 px-3 py-2 text-right backdrop-blur">
              <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-mist-600">
                Log-compressed radius
              </p>
              <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-warning/80">
                Ephemeris snapshot · not telemetry
              </p>
              <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-mist-600">
                Epoch {epoch.slice(0, 10)}
              </p>
            </div>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-mist-600">
            Click a probe marker to inspect its state vector. The heliopause ring is a
            schematic at 120 AU, the approximate Voyager 1 crossing distance; it is not a
            measured boundary.
          </p>
        </section>

        <div className="order-3 xl:sticky xl:top-[120px] xl:h-[calc(100vh-140px)]">
          <ObjectInspector
            id={selectedId}
            fallbackName={selectedName}
            onClose={() => select(null)}
          />
        </div>
      </div>

      <DistanceLadder
        probes={probes}
        planets={planets}
        selectedId={selectedId}
        onSelect={select}
      />
    </div>
  );
}
