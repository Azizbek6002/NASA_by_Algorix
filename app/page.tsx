import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Database,
  MapPinOff,
  Radio,
} from "lucide-react";

import { SectionHeading, Stat } from "@/components/ui/section-heading";
import {
  CATEGORIES,
} from "@/lib/constants";
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  getDataSources,
  getStatistics,
  getTimeline,
} from "@/lib/data";
import {
  formatDate,
  formatInt,
  formatTimestamp,
  pluralize,
} from "@/lib/format";

function timelineHref(category: string, id: string): string {
  if (category === "lunar_surface") return `/moon?object=${id}`;
  if (category === "mars_surface") return `/mars?object=${id}`;
  if (category === "deep_space") return `/deep-space?object=${id}`;
  return `/solar-system?object=${id}`;
}

export default function HomePage() {
  const stats = getStatistics();
  const timeline = getTimeline().slice(0, 7);
  const sources = getDataSources();

  const counts: Record<string, number> = {
    earth_orbit: stats.earthOrbit,
    lunar_surface: stats.moon,
    mars_surface: stats.mars,
    deep_space: stats.deepSpace,
    planet: stats.planets,
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10 bg-ink-950">
        {/* Astronaut image positioned to the right with seamless gradient into site background */}
        <div
          className="pointer-events-none absolute inset-0 bg-contain bg-right bg-no-repeat transition-opacity duration-300"
          style={{ backgroundImage: "url('/astronaut.png')" }}
        />
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-25" />
        <div className="shell relative grid items-center gap-12 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="chip border-success/40 bg-success/5 text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Snapshot dataset
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-600">
                retrieved {formatDate(stats.snapshotRetrievedAt)}
              </span>
            </div>

            <h1 className="mt-7 max-w-2xl text-balance text-4xl font-medium leading-[1.05] tracking-tight text-mist-50 sm:text-5xl lg:text-6xl">
              Everything we left behind, mapped.
            </h1>

            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-mist-500">
              SPACE ARCHIVE locates the satellites, landers, rovers, probes and debris that
              humans have placed beyond Earth. Every coordinate comes from a published
              catalogue; every gap is shown as a gap, never filled with a guess.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/explore" className="btn btn-primary">
                Explore the archive <ArrowRight size={14} />
              </Link>
              <Link href="/earth-orbit" className="btn">
                Open Earth orbit
              </Link>
              <Link
                href="/about"
                className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist-500 underline decoration-white/20 underline-offset-4 transition-colors hover:text-mist-50"
              >
                Method & limits
              </Link>
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/10 pt-6 sm:grid-cols-4">
              {[
                ["Catalogued", formatInt(stats.totalCatalogued), "records"],
                ["Earth orbit", formatInt(stats.earthOrbit), "tracked objects"],
                ["Moon", formatInt(stats.moon), "artefacts"],
                ["Mars", formatInt(stats.mars), "sites"],
              ].map(([label, value, unit]) => (
                <div key={label}>
                  <dt className="label">{label}</dt>
                  <dd className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="data-num text-2xl text-mist-50">{value}</span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">
                      {unit}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Right column left open so the astronaut background is clearly visible */}
          <div className="hidden lg:block min-h-[440px]" aria-hidden="true" />
        </div>
      </section>

      {/* Atlas */}
      <section className="shell py-14 lg:py-20">
        <SectionHeading
          index="01"
          eyebrow="The atlas"
          title="Five destinations, one question: where is it now?"
          description="Each view answers the same question at a different scale — from a 400 km orbit to a probe 172 AU away — without pretending the answer is more precise than the source allows."
          action={
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-mist-500 transition-colors hover:text-orbit"
            >
              Browse everything <ArrowUpRight size={13} />
            </Link>
          }
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {CATEGORY_ORDER.map((category, index) => {
            const meta = CATEGORIES[category];
            const count = counts[category] ?? 0;
            return (
              <Link
                key={category}
                href={meta.href}
                className="group relative flex flex-col justify-between overflow-hidden border border-white/10 bg-ink-900/50 p-6 transition-colors hover:border-white/30 hover:bg-ink-850/70"
              >
                <span
                  className="absolute inset-x-0 top-0 h-px"
                  style={{ background: meta.accent, opacity: 0.7 }}
                />
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] tracking-[0.2em] text-mist-600">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <ArrowUpRight
                      size={14}
                      className="text-mist-600 transition-colors group-hover:text-mist-50"
                    />
                  </div>
                  <h3 className="mt-5 text-lg font-medium text-mist-50">{CATEGORY_LABEL(category)}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-mist-500">
                    {meta.description}
                  </p>
                </div>
                <div className="mt-6 flex items-end justify-between border-t border-white/[0.07] pt-4">
                  <div>
                    <p className="data-num text-2xl text-mist-50">{formatInt(count)}</p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist-600">
                      {pluralize(count, "record")}
                    </p>
                  </div>
                  <span
                    className="font-mono text-[9px] uppercase tracking-[0.16em]"
                    style={{ color: meta.accent }}
                  >
                    {meta.short}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Honesty */}
      <section className="border-y border-white/10 bg-ink-900/30">
        <div className="shell py-14 lg:py-20">
          <SectionHeading
            index="02"
            eyebrow="Data integrity"
            title="What this atlas knows — and what it refuses to invent."
            description="A location is only useful if you can tell how it was obtained. Every record carries its source, its epoch and its uncertainty."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="border border-white/10 bg-ink-950/50 p-6">
              <MapPinOff size={18} className="text-warning" />
              <h3 className="mt-4 text-base font-medium text-mist-50">Unknown stays unknown</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-mist-500">
                {formatInt(stats.unknownLocation)} surface records have no reliable published
                coordinate. They appear in the index with{" "}
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-warning">
                  UNKNOWN LOCATION
                </span>{" "}
                and are omitted from the globe rather than placed at a plausible-looking point.
              </p>
              <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.14em] text-mist-600">
                {formatInt(stats.surfaceLocated)} of {formatInt(stats.moon + stats.mars)} surface
                records located
              </p>
            </article>

            <article className="border border-white/10 bg-ink-950/50 p-6">
              <Radio size={18} className="text-orbit" />
              <h3 className="mt-4 text-base font-medium text-mist-50">
                Propagation, not telemetry
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-mist-500">
                Earth-orbit positions are SGP4 propagations of published element sets. The
                element epochs in this snapshot run from{" "}
                {formatTimestamp(stats.elementEpochRange.min)} to{" "}
                {formatTimestamp(stats.elementEpochRange.max)}. Position error grows as elements
                age; the inspector states it explicitly.
              </p>
              <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.14em] text-mist-600">
                No live tracking is claimed anywhere in this project
              </p>
            </article>

            <article className="border border-white/10 bg-ink-950/50 p-6">
              <Database size={18} className="text-success" />
              <h3 className="mt-4 text-base font-medium text-mist-50">Provenance on every card</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-mist-500">
                {sources.length} datasets back this build: CelesTrak GP and SATCAT, the NASA
                lunar artefact catalogue, NASA/ESA Mars mission documentation and JPL Horizons
                state vectors. Source URLs, retrieval dates and licence notes are listed in the
                data centre.
              </p>
              <Link
                href="/data-center"
                className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-mist-300 transition-colors hover:text-success"
              >
                Open data centre <ArrowUpRight size={12} />
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="shell py-14 lg:py-20">
        <SectionHeading
          index="03"
          eyebrow="By the numbers"
          title="The catalogue, counted."
          description="Counts come straight from the bundled snapshot. They describe the archive, not the whole of near-Earth space."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Payloads"
            value={formatInt(stats.satellites)}
            unit="satellites"
            hint="Active, inactive and status-unknown payloads in the curated subset."
            accent="#55C8FF"
          />
          <Stat
            label="Rocket bodies"
            value={formatInt(stats.rocketBodies)}
            unit="stages"
            hint="Spent upper stages tracked in Earth orbit."
            accent="#E5B45C"
          />
          <Stat
            label="Debris"
            value={formatInt(stats.debris)}
            unit="fragments"
            hint="Collision and breakup debris from CelesTrak groups."
            accent="#8B96A5"
          />
          <Stat
            label="Operational"
            value={formatInt(stats.activeEarthOrbit)}
            unit="active"
            hint="Objects with an active SATCAT operations code."
            accent="#70C99B"
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="border border-white/10 bg-ink-900/40 p-6 lg:col-span-2">
            <p className="label">Orbit regimes</p>
            <div className="mt-4 space-y-2.5">
              {[
                ["LEO", stats.regimes.LEO ?? 0, "#55C8FF"],
                ["MEO", stats.regimes.MEO ?? 0, "#8FD1A6"],
                ["GEO", stats.regimes.GEO ?? 0, "#E5B45C"],
                ["HEO", stats.regimes.HEO ?? 0, "#E07A5F"],
              ].map(([label, count, color]) => {
                const total = stats.earthOrbit || 1;
                const width = Math.max(2, (Number(count) / total) * 100);
                return (
                  <div key={label as string} className="flex items-center gap-3">
                    <span className="w-10 font-mono text-[10px] uppercase tracking-[0.14em] text-mist-500">
                      {label}
                    </span>
                    <span className="h-1.5 flex-1 bg-white/[0.06]">
                      <span
                        className="block h-full"
                        style={{ width: `${width}%`, background: color as string }}
                      />
                    </span>
                    <span className="w-12 text-right font-mono text-[10px] tabular-nums text-mist-500">
                      {formatInt(Number(count))}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-mist-600">
              Regime boundaries are derived from mean motion and perigee/apogee, not from a
              mission catalogue. The subset is weighted towards stations, navigation
              constellations, recent launches and named debris families.
            </p>
          </div>

          <div className="border border-white/10 bg-ink-900/40 p-6">
            <p className="label">Archive span</p>
            <dl className="mt-4 space-y-3">
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist-600">
                  Earliest surface/probe launch
                </dt>
                <dd className="mt-1 text-sm text-mist-300">
                  {stats.yearsSpanned.earliest ? formatDate(stats.yearsSpanned.earliest) : "—"}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist-600">
                  Most recent
                </dt>
                <dd className="mt-1 text-sm text-mist-300">
                  {stats.yearsSpanned.latest ? formatDate(stats.yearsSpanned.latest) : "—"}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist-600">
                  Orbital element window
                </dt>
                <dd className="mt-1 text-sm text-mist-300">
                  {formatDate(stats.elementEpochRange.min)} —{" "}
                  {formatDate(stats.elementEpochRange.max)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Recent events */}
      <section className="border-t border-white/10 bg-ink-900/30">
        <div className="shell py-14 lg:py-20">
          <SectionHeading
            index="04"
            eyebrow="Recent events"
            title="The last things that happened out there."
            description="Events are drawn only from records with dated mission milestones. Absence of an event means the archive has no dated milestone, not that nothing happened."
            action={
              <Link
                href="/missions"
                className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-mist-500 transition-colors hover:text-orbit"
              >
                Full timeline <ArrowUpRight size={13} />
              </Link>
            }
          />

          <ol className="mt-8 divide-y divide-white/[0.07] border-y border-white/10">
            {timeline.map((item, index) => (
              <li key={`${item.objectId}-${item.date}-${index}`}>
                <Link
                  href={timelineHref(item.category, item.objectId)}
                  className="group flex flex-col gap-2 py-4 transition-colors hover:bg-white/[0.02] sm:flex-row sm:items-baseline sm:gap-6"
                >
                  <span className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-mist-600">
                    {item.date}
                  </span>
                  <span className="w-40 shrink-0 font-mono text-[9px] uppercase tracking-[0.16em] text-artifact/80">
                    {item.label}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-mist-200 transition-colors group-hover:text-mist-50">
                      {item.objectName}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-relaxed text-mist-500">
                      {item.description}
                    </span>
                  </span>
                  <ArrowUpRight
                    size={13}
                    className="hidden shrink-0 text-mist-600 transition-colors group-hover:text-mist-50 sm:block"
                  />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="shell py-14 lg:py-20">
        <div className="flex flex-col items-start justify-between gap-6 border border-white/10 bg-ink-900/40 p-8 sm:flex-row sm:items-center">
          <div>
            <p className="label">Start anywhere</p>
            <h2 className="mt-2 text-2xl font-medium text-mist-50">
              Pick a destination and inspect the record.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-mist-500">
              Every card opens the same inspector: coordinates, status, epoch, provenance and
              the uncertainty attached to the location.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/solar-system" className="btn">
              Solar system
            </Link>
            <Link href="/deep-space" className="btn">
              Deep space
            </Link>
            <Link href="/earth-orbit" className="btn btn-primary">
              Earth orbit <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
