"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { RotateCw, Orbit } from "lucide-react";

import { ObjectInspector } from "@/components/inspector/object-inspector";
import type { HeliocentricBody } from "@/components/three/heliocentric-canvas";
import { auToSceneRadius } from "@/lib/scene";
import { cn, formatAu, formatDecimal, formatInt, formatLightTime } from "@/lib/format";
import { useInitialQueryParam } from "@/lib/use-query-param";
import type { PlanetRecord } from "@/lib/types";

const HeliocentricCanvas = dynamic(
  () => import("@/components/three/heliocentric-canvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-ink-950">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist-600">
          Building heliocentric scene…
        </p>
      </div>
    ),
  },
);

export function SolarSystemView({
  planets,
  epoch,
  provider,
}: {
  planets: PlanetRecord[];
  epoch: string;
  provider: string;
}) {
  const initialId = useInitialQueryParam("object");
  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [autoRotate, setAutoRotate] = useState(false);

  const bodies: HeliocentricBody[] = useMemo(
    () =>
      planets.map((planet) => ({
        id: `planet:${planet.slug}`,
        name: planet.name,
        kind: "planet" as const,
        radiusKm: planet.radiusKm,
        distanceAu: planet.distanceAu,
        meanDistanceAu: planet.meanDistanceAu,
        visualColor: planet.visualColor,
        texture: planet.texture,
        positionKm: planet.positionKm,
        meta: `${formatAu(planet.distanceAu)} from the Sun`,
      })),
    [planets],
  );

  const sorted = useMemo(
    () => [...planets].sort((a, b) => a.distanceAu - b.distanceAu),
    [planets],
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
    planets.find((planet) => `planet:${planet.slug}` === selectedId)?.name ?? null;

  return (
    <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_352px]">
      <aside className="order-2 xl:order-1">
        <div className="border border-white/10 bg-ink-900/50">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="label">Planets</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist-600">
              by distance
            </span>
          </div>
          <ul>
            {sorted.map((planet) => {
              const id = `planet:${planet.slug}`;
              const active = selectedId === id;
              return (
                <li key={planet.slug}>
                  <button
                    type="button"
                    onClick={() => select(id)}
                    className={cn(
                      "flex w-full items-center gap-3 border-b border-white/[0.04] px-4 py-3 text-left transition-colors",
                      active ? "bg-white/[0.07]" : "hover:bg-white/[0.03]",
                    )}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: planet.visualColor }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-mist-200">
                        {planet.name}
                      </span>
                      <span className="mt-0.5 block font-mono text-[8px] uppercase tracking-[0.12em] text-mist-600">
                        {formatAu(planet.distanceAu)} · {formatInt(planet.radiusKm)} km radius
                      </span>
                    </span>
                    <span className="font-mono text-[9px] tabular-nums text-mist-600">
                      {formatDecimal(planet.lightTimeMin, 1)}m
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
          <p className="label">Visual scale</p>
          <p className="mt-2 text-[11px] leading-relaxed text-mist-500">
            Radii are compressed with r = 2 + 3·√AU + 2·log₁₀(1 + AU) scene units so the
            inner and outer planets share one view. Directions are the real ICRF directions
            at the dataset epoch.
          </p>
          <ul className="mt-3 space-y-1.5">
            {[
              ["Mercury", 0.3117],
              ["Earth", 0.9845],
              ["Jupiter", 5.06],
              ["Neptune", 30.1],
            ].map(([name, au]) => (
              <li
                key={name as string}
                className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.1em] text-mist-600"
              >
                <span>{name}</span>
                <span>
                  {au} AU → {formatDecimal(auToSceneRadius(au as number), 2)} u
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="order-1 xl:order-2">
        <div className="flex flex-wrap items-center justify-between gap-3 border border-b-0 border-white/10 bg-ink-900/50 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-mist-500">
              <Orbit size={12} className="text-success" />
              Heliocentric view
            </span>
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-mist-600 sm:inline">
              ICRF directions · compressed radius
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
            mode="planets"
            autoRotate={autoRotate}
          />
          <div className="pointer-events-none absolute right-3 top-3 max-w-[250px] border border-white/10 bg-ink-950/80 px-3 py-2 text-right backdrop-blur">
            <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-mist-600">
              One body per planet · real direction
            </p>
            <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-warning/80">
              Radial distance compressed
            </p>
            <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-mist-600">
              Epoch {epoch.slice(0, 10)}
            </p>
          </div>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-mist-600">
          Click a planet or its label to open the record. The scene places each planet at
          its JPL Horizons direction for {epoch.slice(0, 10)}; it does not animate planetary
          motion, and it never claims to be live.
        </p>

        <div className="mt-4 overflow-x-auto border border-white/10 bg-ink-900/40">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-left">
                {["Planet", "Distance now", "Mean distance", "Light time", "Radius"].map(
                  (header) => (
                    <th
                      key={header}
                      className="px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-mist-600"
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {sorted.map((planet) => (
                <tr
                  key={planet.slug}
                  className="border-b border-white/[0.05] last:border-b-0 hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-2 text-xs text-mist-300">{planet.name}</td>
                  <td className="px-4 py-2 font-mono text-[11px] tabular-nums text-mist-300">
                    {formatAu(planet.distanceAu)}
                  </td>
                  <td className="px-4 py-2 font-mono text-[11px] tabular-nums text-mist-500">
                    {formatAu(planet.meanDistanceAu)}
                  </td>
                  <td className="px-4 py-2 font-mono text-[11px] tabular-nums text-mist-500">
                    {formatLightTime(planet.lightTimeMin / 60)}
                  </td>
                  <td className="px-4 py-2 font-mono text-[11px] tabular-nums text-mist-500">
                    {formatInt(planet.radiusKm)} km
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="order-3 xl:sticky xl:top-[120px] xl:h-[calc(100vh-140px)]">
        <ObjectInspector id={selectedId} fallbackName={selectedName} onClose={() => select(null)} />
      </div>
    </div>
  );
}
