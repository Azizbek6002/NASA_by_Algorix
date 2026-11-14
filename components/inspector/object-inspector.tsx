"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, X, Loader2, MapPinOff } from "lucide-react";

import { ConfidenceChip, SourceList } from "@/components/ui/source-list";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  CATEGORIES,
  REGIME_LABEL,
  TYPE_LABEL,
} from "@/lib/constants";
import {
  formatAltitude,
  formatAu,
  formatDate,
  formatDecimal,
  formatInt,
  formatLatLon,
  formatLightTime,
  formatTimestamp,
} from "@/lib/format";
import { accuracyFromAge, ACCURACY_COPY, elementAgeHours } from "@/lib/orbital";
import type {
  ArchiveEntry,
  DeepSpaceProbe,
  EarthOrbitObject,
  PlanetRecord,
  SourceRef,
  SurfaceArtifact,
  SurfaceLocation,
} from "@/lib/types";

type Record = EarthOrbitObject | SurfaceArtifact | DeepSpaceProbe | PlanetRecord;

interface DetailPayload {
  entry: ArchiveEntry;
  record: Record;
}

/** Ephemeris records store a single source URL pair instead of a sources array. */
function recordSources(record: Record): SourceRef[] {
  if ("sources" in record && Array.isArray(record.sources)) return record.sources;
  if ("missionSource" in record) {
    return [
      {
        provider: "JPL Horizons",
        url: record.source,
        retrievedAt: record.retrievedAt,
        recordId: String(record.targetId),
      },
      {
        provider: "Mission documentation",
        url: record.missionSource,
        retrievedAt: record.retrievedAt,
      },
    ];
  }
  if ("source" in record) {
    return [
      {
        provider: "JPL Horizons",
        url: record.source,
        retrievedAt: record.retrievedAt,
      },
    ];
  }
  return [];
}

function Row({ label, value, mono = true }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.06] py-2 last:border-b-0">
      <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-mist-600">{label}</span>
      <span className={`text-right text-xs text-mist-300 ${mono ? "font-mono tabular-nums" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-white/10 px-5 py-4">
      <h3 className="label mb-2">{title}</h3>
      {children}
    </section>
  );
}

function OrbitDetail({ record }: { record: EarthOrbitObject }) {
  const age = elementAgeHours(record.epoch, new Date());
  const accuracy = accuracyFromAge(age);
  return (
    <>
      <Section title="Orbit">
        <Row label="Regime" value={REGIME_LABEL[record.altitudeRegime] ?? record.altitudeRegime} />
        <Row label="Altitude" value={formatAltitude(record.perigeeKm, record.apogeeKm)} />
        <Row label="Period" value={record.periodMin ? `${formatDecimal(record.periodMin, 1)} min` : "—"} />
        <Row label="Inclination" value={`${formatDecimal(record.inclination, 3)}°`} />
        <Row label="Eccentricity" value={formatDecimal(record.eccentricity, 6)} />
        <Row label="RAAN" value={`${formatDecimal(record.raan, 3)}°`} />
        <Row label="Argument of perigee" value={`${formatDecimal(record.argPerigee, 3)}°`} />
        <Row label="Mean anomaly" value={`${formatDecimal(record.meanAnomaly, 3)}°`} />
        <Row label="Mean motion" value={`${formatDecimal(record.meanMotion, 6)} rev/day`} />
        <Row label="BSTAR" value={record.bstar.toExponential(3)} />
      </Section>

      <Section title="Element set">
        <Row label="Epoch" value={formatTimestamp(record.epoch)} />
        <Row label="Element age" value={Number.isFinite(age) ? `${formatDecimal(age, 1)} h` : "—"} />
        <Row label="Element set no." value={record.elementSetNo ?? "—"} />
        <Row label="Rev. at epoch" value={record.revAtEpoch ? formatInt(record.revAtEpoch) : "—"} />
        <Row label="Classification" value={record.classificationType} />
        <div className="mt-3 border border-white/10 bg-white/[0.02] px-3 py-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-mist-500">
            Position accuracy · {accuracy}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-mist-500">{ACCURACY_COPY[accuracy]}</p>
        </div>
      </Section>

      <Section title="Identification">
        <Row label="NORAD ID" value={record.noradId} />
        <Row label="International designator" value={record.intlDesignator ?? "—"} />
        <Row label="Object type" value={TYPE_LABEL[record.type]} />
        <Row label="Owner" value={record.country ?? record.ownerCode ?? "—"} />
        <Row label="Launch date" value={record.launchDate ? formatDate(record.launchDate) : "—"} />
        <Row label="Operational status" value={record.statusLabel} />
        <Row label="Catalogue groups" value={record.groups.join(", ")} />
      </Section>
    </>
  );
}

function UnknownLocationNotice({ location }: { location: SurfaceLocation }) {
  return (
    <div className="border border-warning/30 bg-warning/[0.06] px-3 py-3">
      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-warning">
        <MapPinOff size={12} /> Unknown location
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-mist-400">{location.description}</p>
      <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">
        Source coordinate: {location.sourceCoordinates}
      </p>
    </div>
  );
}

function SurfaceDetail({ record }: { record: SurfaceArtifact }) {
  const located =
    record.location.status === "verified_located" &&
    record.location.latitude !== null &&
    record.location.longitude !== null;

  return (
    <>
      <Section title="Location">
        {located ? (
          <>
            <Row
              label="Coordinates"
              value={formatLatLon(record.location.latitude, record.location.longitude)}
            />
            <Row label="Body" value={record.location.body === "moon" ? "Moon" : "Mars"} />
            <Row label="Coordinate system" value={record.location.coordinateSystem} />
            <Row
              label="Longitude convention"
              value={record.location.longitudeConvention.replace(/_/g, " ")}
            />
            <Row label="Site" value={record.location.description} mono={false} />
            <Row label="Source coordinates" value={record.location.sourceCoordinates} />
            <div className="mt-2 flex items-center gap-2">
              <span className="label">Confidence</span>
              <ConfidenceChip confidence={record.location.accuracy} />
            </div>
          </>
        ) : (
          <UnknownLocationNotice location={record.location} />
        )}
      </Section>

      <Section title="Mission">
        <Row label="Mission" value={record.mission} />
        <Row label="Agency" value={record.agency} />
        <Row label="Country" value={record.country} />
        <Row label="Launch" value={record.launchDate ? formatDate(record.launchDate) : "—"} />
        <Row label="Object type" value={TYPE_LABEL[record.type]} />
        {record.massKg ? <Row label="Mass" value={`${formatInt(record.massKg)} kg`} /> : null}
      </Section>

      <Section title="History">
        <p className="text-xs leading-relaxed text-mist-400">{record.history}</p>
        <p className="mt-3 text-xs leading-relaxed text-mist-400">{record.significance}</p>
      </Section>

      {record.events.length ? (
        <Section title="Timeline">
          <ol className="space-y-2">
            {record.events.map((event, index) => (
              <li key={`${event.date}-${index}`} className="flex gap-3">
                <span className="w-20 shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">
                  {event.date}
                </span>
                <span className="text-[11px] leading-relaxed text-mist-400">
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-artifact">
                    {event.type.replace(/_/g, " ")}
                  </span>
                  <br />
                  {event.description}
                </span>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}
    </>
  );
}

function ProbeDetail({ record }: { record: DeepSpaceProbe }) {
  return (
    <>
      <Section title="Position">
        <Row label="Distance from Sun" value={formatAu(record.distanceAu)} />
        <Row label="One-way light time" value={formatLightTime(record.lightTimeHours)} />
        <Row label="Epoch" value={formatTimestamp(record.epoch)} />
        <Row label="Reference frame" value={record.frame} />
        <Row label="Center" value={record.center} />
      </Section>
      <Section title="State vector (ICRF, km)">
        <Row label="X" value={record.positionKm[0].toExponential(6)} />
        <Row label="Y" value={record.positionKm[1].toExponential(6)} />
        <Row label="Z" value={record.positionKm[2].toExponential(6)} />
      </Section>
      <Section title="Mission">
        <Row label="Agency" value={record.agency} />
        <Row label="Launch" value={formatDate(record.launchDate)} />
        <Row label="Last contact" value={record.lastContact} />
        <p className="mt-3 text-xs leading-relaxed text-mist-400">{record.objective}</p>
      </Section>
    </>
  );
}

function PlanetDetail({ record }: { record: PlanetRecord }) {
  return (
    <>
      <Section title="Position">
        <Row label="Distance from Sun" value={formatAu(record.distanceAu)} />
        <Row label="One-way light time" value={formatLightTime(record.lightTimeMin / 60)} />
        <Row label="Mean distance" value={formatAu(record.meanDistanceAu)} />
        <Row label="Epoch" value={formatTimestamp(record.epoch)} />
        <Row label="Frame" value={record.frame} />
      </Section>
      <Section title="Body">
        <Row label="Mean radius" value={`${formatInt(record.radiusKm)} km`} />
        <Row label="Texture" value={record.texture.split("/").pop() ?? "—"} />
      </Section>
    </>
  );
}

export function ObjectInspector({
  id,
  fallbackName,
  onClose,
}: {
  id: string | null;
  fallbackName?: string | null;
  onClose: () => void;
}) {
  const [payload, setPayload] = useState<DetailPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setPayload(null);
      setError(null);
      return undefined;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/v1/objects/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Request failed with ${response.status}`);
        const data = (await response.json()) as DetailPayload;
        setPayload(data);
      })
      .catch((fetchError: Error) => {
        if (fetchError.name !== "AbortError") setError(fetchError.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [id]);

  if (!id) {
    return (
      <aside className="flex h-full min-h-[320px] flex-col items-center justify-center border border-white/10 bg-ink-900/40 px-6 text-center">
        <p className="label">Object inspector</p>
        <p className="mt-3 max-w-[220px] text-sm leading-relaxed text-mist-500">
          Select a marker in the scene or a row in the index to inspect its catalogue record.
        </p>
      </aside>
    );
  }

  const entry = payload?.entry;
  const record = payload?.record;
  const category = entry?.category;
  const accent = category ? CATEGORIES[category].accent : "#55C8FF";

  return (
    <aside className="flex h-full flex-col border border-white/10 bg-ink-900/50">
      <div className="relative border-b border-white/10 px-5 py-4">
        <span className="absolute inset-x-0 top-0 h-px" style={{ background: accent }} />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="label" style={{ color: accent }}>
              {category ? CATEGORIES[category].short : "RECORD"}
              {entry ? ` · ${TYPE_LABEL[entry.type]}` : ""}
            </p>
            <h2 className="mt-2 text-lg font-medium leading-snug text-mist-50">
              {entry?.name ?? fallbackName ?? "Loading record…"}
            </h2>
            {entry ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={entry.status} label={entry.statusLabel} />
                <ConfidenceChip confidence={entry.accuracy} />
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 border border-white/15 p-1.5 text-mist-500 transition-colors hover:border-white/35 hover:text-mist-50"
            aria-label="Close inspector"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin">
        {loading && !payload ? (
          <div className="flex items-center gap-3 px-5 py-6 text-mist-500">
            <Loader2 size={14} className="animate-spin" />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em]">
              Loading catalogue record
            </span>
          </div>
        ) : null}

        {error ? (
          <div className="px-5 py-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-warning">
              Could not load record
            </p>
            <p className="mt-2 text-xs text-mist-500">{error}</p>
          </div>
        ) : null}

        {record && entry ? (
          <>
            {entry.description ? (
              <Section title="Summary">
                <p className="text-xs leading-relaxed text-mist-400">{entry.description}</p>
              </Section>
            ) : null}

            {"noradId" in record ? <OrbitDetail record={record} /> : null}
            {"location" in record ? <SurfaceDetail record={record as SurfaceArtifact} /> : null}
            {"targetId" in record ? <ProbeDetail record={record as DeepSpaceProbe} /> : null}
            {"radiusKm" in record && "meanDistanceAu" in record ? (
              <PlanetDetail record={record as PlanetRecord} />
            ) : null}

            <Section title="Provenance">
              <SourceList sources={recordSources(record)} />
            </Section>

            <div className="border-t border-white/10 px-5 py-4">
              <Link
                href={entry.href}
                className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-mist-500 transition-colors hover:text-orbit"
              >
                Permalink <ArrowUpRight size={12} />
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </aside>
  );
}
