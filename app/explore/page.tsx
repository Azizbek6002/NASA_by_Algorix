import Link from "next/link";
import { ArrowUpRight, MapPinOff } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { CATEGORIES } from "@/lib/constants";
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  allSurfaceArtifacts,
  getDataSources,
  getStatistics,
  orbitObjects,
} from "@/lib/data";
import { displayName, formatDate, formatInt } from "@/lib/format";

export const metadata = {
  title: "Explore the archive",
  description:
    "Browse every catalogued object in SPACE ARCHIVE: Earth orbit, the Moon, Mars, the planets and deep space.",
};

export default function ExplorePage() {
  const stats = getStatistics();
  const sources = getDataSources();

  const counts: Record<string, number> = {
    earth_orbit: stats.earthOrbit,
    lunar_surface: stats.moon,
    mars_surface: stats.mars,
    deep_space: stats.deepSpace,
    planet: stats.planets,
  };

  const unknown = allSurfaceArtifacts.filter(
    (artifact) => artifact.location.status === "unknown_location",
  );

  const recentLaunches = [...orbitObjects]
    .filter((object) => Boolean(object.launchDate))
    .sort((a, b) => (a.launchDate! < b.launchDate! ? 1 : -1))
    .slice(0, 8);

  return (
    <div className="shell py-10 lg:py-14">
      <PageHeader
        index="01"
        eyebrow="Explore"
        title="The whole archive, one index."
        description="Five destinations, 1,100+ records and one rule: a location appears only when a published source supports it. Start with a destination, a mission or the data itself."
        meta={
          <>
            <span className="chip border-white/12 text-mist-300">
              {formatInt(stats.totalCatalogued)} records
            </span>
            <span className="chip border-white/12 text-mist-300">
              {sources.length} datasets
            </span>
            <span className="chip border-warning/40 bg-warning/5 text-warning">
              {formatInt(stats.unknownLocation)} unknown locations
            </span>
            <span className="chip border-white/12 text-mist-500">
              snapshot {formatDate(stats.snapshotRetrievedAt)}
            </span>
          </>
        }
      />

      <section className="mt-10">
        <SectionHeading
          eyebrow="Destinations"
          title="Choose a scale."
          description="Each destination is a different coordinate system and a different accuracy story."
        />
        <div className="mt-6 divide-y divide-white/[0.07] border-y border-white/10">
          {CATEGORY_ORDER.map((category, index) => {
            const meta = CATEGORIES[category];
            return (
              <Link
                key={category}
                href={meta.href}
                className="group grid gap-3 py-5 transition-colors hover:bg-white/[0.02] sm:grid-cols-[56px_220px_minmax(0,1fr)_120px_24px] sm:items-center sm:gap-6"
              >
                <span className="font-mono text-[10px] tracking-[0.2em] text-mist-600">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="flex items-center gap-3">
                  <span
                    className="h-6 w-px"
                    style={{ background: meta.accent }}
                    aria-hidden="true"
                  />
                  <span>
                    <span className="block text-[15px] text-mist-100">
                      {CATEGORY_LABEL(category)}
                    </span>
                    <span
                      className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.16em]"
                      style={{ color: meta.accent }}
                    >
                      {meta.short}
                    </span>
                  </span>
                </span>
                <span className="text-[13px] leading-relaxed text-mist-500">
                  {meta.description}
                </span>
                <span className="sm:text-right">
                  <span className="data-num block text-xl text-mist-50">
                    {formatInt(counts[category] ?? 0)}
                  </span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-mist-600">
                    records
                  </span>
                </span>
                <ArrowUpRight
                  size={15}
                  className="text-mist-600 transition-colors group-hover:text-mist-50"
                />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-2">
        <div>
          <SectionHeading
            eyebrow="Coverage"
            title="Located vs. unknown."
            description="Surface records are the only ones where a published coordinate can be missing. Earth-orbit objects always have an element set; their uncertainty is age, not absence."
          />
          <div className="mt-6 border border-white/10 bg-ink-900/40">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  {["Destination", "Located", "Unknown", "Total"].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-mist-600"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Earth orbit", stats.earthOrbit, 0, stats.earthOrbit],
                  [
                    "Moon",
                    stats.moon - unknown.filter((a) => a.category === "lunar_surface").length,
                    unknown.filter((a) => a.category === "lunar_surface").length,
                    stats.moon,
                  ],
                  [
                    "Mars",
                    stats.mars - unknown.filter((a) => a.category === "mars_surface").length,
                    unknown.filter((a) => a.category === "mars_surface").length,
                    stats.mars,
                  ],
                  ["Deep space", stats.deepSpace, 0, stats.deepSpace],
                  ["Planets", stats.planets, 0, stats.planets],
                ].map(([label, located, missing, total]) => (
                  <tr key={label as string} className="border-b border-white/[0.05] last:border-b-0">
                    <td className="px-4 py-2.5 text-xs text-mist-300">{label}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px] tabular-nums text-success">
                      {formatInt(located as number)}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] tabular-nums text-warning">
                      {formatInt(missing as number)}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] tabular-nums text-mist-500">
                      {formatInt(total as number)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <SectionHeading
            eyebrow="Honesty check"
            title="Records with no location."
            description="These artefacts are real and catalogued, but no reliable coordinate was published. They are never plotted."
          />
          <ul className="mt-6 space-y-3">
            {unknown.map((artifact) => (
              <li
                key={artifact.id}
                className="border border-warning/25 bg-warning/[0.04] px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-warning">
                      <MapPinOff size={11} /> Unknown location
                    </p>
                    <p className="mt-2 text-sm text-mist-100">{artifact.name}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-mist-500">
                      {artifact.location.description}
                    </p>
                  </div>
                  <Link
                    href={`/${artifact.category === "lunar_surface" ? "moon" : "mars"}?object=${artifact.id}`}
                    className="shrink-0 text-mist-500 transition-colors hover:text-mist-50"
                    aria-label={`Open ${artifact.name}`}
                  >
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
                <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">
                  Source coordinate: {artifact.location.sourceCoordinates}
                </p>
              </li>
            ))}
            {unknown.length === 0 ? (
              <li className="border border-white/10 px-4 py-6 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-mist-600">
                Every surface record has a published coordinate
              </li>
            ) : null}
          </ul>
        </div>
      </section>

      <section className="mt-14">
        <SectionHeading
          eyebrow="Earth orbit sample"
          title="Most recent launch dates in the subset."
          description="The Earth-orbit snapshot is curated, not exhaustive. This is a sample of the newest launch dates joined from SATCAT."
          action={
            <Link
              href="/earth-orbit"
              className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist-500 transition-colors hover:text-orbit"
            >
              Open Earth orbit <ArrowUpRight size={13} className="inline" />
            </Link>
          }
        />
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {recentLaunches.map((object) => (
            <li key={object.id}>
              <Link
                href={`/earth-orbit?object=${object.id}`}
                className="flex h-full flex-col justify-between border border-white/10 bg-ink-900/40 p-4 transition-colors hover:border-white/30 hover:bg-ink-850/60"
              >
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist-600">
                    {object.altitudeRegime} · {object.noradId}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-[13px] text-mist-200">
                    {displayName(object.name)}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">
                  <span>{object.launchDate ? formatDate(object.launchDate) : "—"}</span>
                  <span>{object.country ?? "Unknown"}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14 grid gap-4 border border-white/10 bg-ink-900/40 p-6 md:grid-cols-3">
        <div>
          <p className="label">Machine-readable</p>
          <p className="mt-2 text-sm leading-relaxed text-mist-500">
            Every view is backed by a public JSON endpoint. Start with{" "}
            <Link href="/api/v1/objects" className="text-mist-300 underline decoration-white/20 underline-offset-4 hover:text-orbit">
              /api/v1/objects
            </Link>{" "}
            and{" "}
            <Link href="/api/v1/statistics" className="text-mist-300 underline decoration-white/20 underline-offset-4 hover:text-orbit">
              /api/v1/statistics
            </Link>
            .
          </p>
        </div>
        <div>
          <p className="label">Provenance</p>
          <p className="mt-2 text-sm leading-relaxed text-mist-500">
            Source URLs, retrieval dates, record counts and licence notes live in the{" "}
            <Link href="/data-center" className="text-mist-300 underline decoration-white/20 underline-offset-4 hover:text-orbit">
              data centre
            </Link>
            .
          </p>
        </div>
        <div>
          <p className="label">Method</p>
          <p className="mt-2 text-sm leading-relaxed text-mist-500">
            Coordinate conventions, scale compression and status definitions are documented in{" "}
            <Link href="/about" className="text-mist-300 underline decoration-white/20 underline-offset-4 hover:text-orbit">
              About &amp; method
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
