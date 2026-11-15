"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { MapPin, MapPinOff, RotateCw, Search } from "lucide-react";

import { ObjectInspector } from "@/components/inspector/object-inspector";
import { CONFIDENCE_LABEL, TYPE_LABEL } from "@/lib/constants";
import { cn, formatInt, formatLatLon } from "@/lib/format";
import { useInitialQueryParam } from "@/lib/use-query-param";
import type { SurfacePointLite } from "@/lib/types";

const SurfaceGlobeCanvas = dynamic(
  () => import("@/components/three/surface-globe-canvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-ink-950">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist-600">
          Loading surface view…
        </p>
      </div>
    ),
  },
);

const TYPE_ORDER = [
  "lander",
  "rover",
  "descent_stage",
  "instrument",
  "impact_site",
] as const;

export function SurfaceView({
  points,
  bodyName,
  textureUrl,
  normalUrl,
  accent,
  subtitle,
}: {
  points: SurfacePointLite[];
  bodyName: string;
  textureUrl: string;
  normalUrl?: string | null;
  accent: string;
  subtitle: string;
}) {
  const initialId = useInitialQueryParam("object");
  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [query, setQuery] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [agencies, setAgencies] = useState<string[]>([]);
  const [locatedOnly, setLocatedOnly] = useState(false);
  const [unknownOnly, setUnknownOnly] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);

  const agenciesList = useMemo(
    () => [...new Set(points.map((point) => point.agency))].sort(),
    [points],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return points.filter((point) => {
      if (types.length && !types.includes(point.type)) return false;
      if (agencies.length && !agencies.includes(point.agency)) return false;
      if (locatedOnly && !point.located) return false;
      if (unknownOnly && point.located) return false;
      if (
        q &&
        !`${point.name} ${point.mission} ${point.agency} ${point.country} ${point.description}`
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [points, query, types, agencies, locatedOnly, unknownOnly]);

  const locatedCount = points.filter((point) => point.located).length;
  const unknownCount = points.length - locatedCount;

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

  const selectedName = points.find((point) => point.id === selectedId)?.name ?? null;

  return (
    <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_352px]">
      <aside className="order-2 xl:order-1">
        <div className="border border-white/10 bg-ink-900/50">
          <div className="border-b border-white/10 px-4 py-3">
            <span className="label">Index</span>
          </div>
          <div className="space-y-3 px-4 py-4">
            <label className="relative block">
              <Search size={13} className="absolute left-2.5 top-2.5 text-mist-600" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name or mission…"
                className="w-full border border-white/10 bg-ink-950/60 py-2 pl-8 pr-2 font-mono text-[11px] text-mist-50 outline-none placeholder:text-mist-600 focus:border-orbit/50"
              />
            </label>

            <div>
              <p className="label mb-2">Object type</p>
              <div className="flex flex-wrap gap-1.5">
                {TYPE_ORDER.map((type) => {
                  const count = points.filter((point) => point.type === type).length;
                  if (!count) return null;
                  const active = types.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setTypes((current) =>
                          current.includes(type)
                            ? current.filter((item) => item !== type)
                            : [...current, type],
                        )
                      }
                      className={cn(
                        "border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em]",
                        active
                          ? "border-white/40 bg-white/10 text-mist-50"
                          : "border-white/10 text-mist-500 hover:border-white/25",
                      )}
                    >
                      {TYPE_LABEL[type]} · {count}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="label mb-2">Agency</p>
              <div className="flex flex-wrap gap-1.5">
                {agenciesList.map((agency) => {
                  const active = agencies.includes(agency);
                  return (
                    <button
                      key={agency}
                      type="button"
                      onClick={() =>
                        setAgencies((current) =>
                          current.includes(agency)
                            ? current.filter((item) => item !== agency)
                            : [...current, agency],
                        )
                      }
                      className={cn(
                        "border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em]",
                        active
                          ? "border-white/40 bg-white/10 text-mist-50"
                          : "border-white/10 text-mist-500 hover:border-white/25",
                      )}
                    >
                      {agency}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setLocatedOnly((value) => !value);
                  setUnknownOnly(false);
                }}
                className={cn(
                  "flex items-center gap-1.5 border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em]",
                  locatedOnly
                    ? "border-success/50 bg-success/10 text-success"
                    : "border-white/10 text-mist-500 hover:border-white/25",
                )}
              >
                <MapPin size={10} /> Located {formatInt(locatedCount)}
              </button>
              <button
                type="button"
                onClick={() => {
                  setUnknownOnly((value) => !value);
                  setLocatedOnly(false);
                }}
                className={cn(
                  "flex items-center gap-1.5 border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em]",
                  unknownOnly
                    ? "border-warning/50 bg-warning/10 text-warning"
                    : "border-white/10 text-mist-500 hover:border-white/25",
                )}
              >
                <MapPinOff size={10} /> Unknown {formatInt(unknownCount)}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between border-y border-white/10 px-4 py-2">
            <span className="label">Matches</span>
            <span className="data-num text-xs text-mist-300">
              {formatInt(filtered.length)}
              <span className="text-mist-600"> / {formatInt(points.length)}</span>
            </span>
          </div>

          <ul className="max-h-[420px] overflow-y-auto scroll-thin">
            {filtered.map((point) => (
              <li key={point.id}>
                <button
                  type="button"
                  onClick={() => select(point.id)}
                  className={cn(
                    "w-full border-b border-white/[0.04] px-4 py-2.5 text-left transition-colors",
                    selectedId === point.id ? "bg-white/[0.07]" : "hover:bg-white/[0.03]",
                  )}
                >
                  <span className="block truncate text-[11px] text-mist-300">{point.name}</span>
                  <span className="mt-0.5 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.1em] text-mist-600">
                    {point.located ? (
                      <>
                        <MapPin size={8} className="text-success/70" />
                        {formatLatLon(point.latitude, point.longitude)}
                      </>
                    ) : (
                      <>
                        <MapPinOff size={8} className="text-warning/70" />
                        Unknown location
                      </>
                    )}
                  </span>
                  <span className="mt-0.5 block font-mono text-[8px] uppercase tracking-[0.1em] text-mist-600">
                    {point.mission} · {CONFIDENCE_LABEL[point.accuracy]}
                  </span>
                </button>
              </li>
            ))}
            {filtered.length === 0 ? (
              <li className="px-4 py-6 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">
                No records match
              </li>
            ) : null}
          </ul>
        </div>
      </aside>

      <section className="order-1 xl:order-2">
        <div className="flex flex-wrap items-center justify-between gap-3 border border-b-0 border-white/10 bg-ink-900/50 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="label" style={{ color: accent }}>
              {bodyName}
            </span>
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-mist-600 sm:inline">
              {subtitle}
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

        <div className="relative h-[58vh] min-h-[380px] border border-white/10 bg-ink-950 xl:h-[calc(100vh-260px)] xl:min-h-[520px]">
          <SurfaceGlobeCanvas
            points={filtered}
            selectedId={selectedId}
            onSelect={select}
            textureUrl={textureUrl}
            normalUrl={normalUrl}
            accent={accent}
            bodyName={bodyName}
            autoRotate={autoRotate}
          />
          <div className="pointer-events-none absolute left-3 top-3 border border-white/10 bg-ink-950/80 px-3 py-2 backdrop-blur">
            <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-mist-600">
              Sphere radius 1,737 km · markers exaggerated
            </p>
            <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-mist-600">
              {formatInt(locatedCount)} located · {formatInt(unknownCount)} unknown
            </p>
          </div>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-mist-600">
          Drag to rotate the globe; click a marker to inspect the artefact. Markers are
          enlarged so a 4-metre rover remains visible at planetary scale — size is not to scale.
        </p>
      </section>

      <div className="order-3 xl:sticky xl:top-[120px] xl:h-[calc(100vh-140px)]">
        <ObjectInspector id={selectedId} fallbackName={selectedName} onClose={clear} />
      </div>
    </div>
  );
}
