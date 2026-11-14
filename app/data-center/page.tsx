import Link from "next/link";
import { ArrowUpRight, Boxes, Database, FileCheck2, ShieldAlert } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  deepSpaceDataset,
  getDataSources,
  getStatistics,
  lunarDataset,
  marsDataset,
  orbitMeta,
  planetDataset,
} from "@/lib/data";
import { formatDate, formatInt, formatTimestamp } from "@/lib/format";

export const metadata = {
  title: "Data Centre",
  description:
    "Dataset provenance, snapshot checksums, API endpoints and the limits of the SPACE ARCHIVE catalogue.",
};

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1/objects?category=mars_surface&limit=10",
    description: "Normalised archive entries with category, status, type and pagination.",
  },
  {
    method: "GET",
    path: "/api/v1/objects/planet:mars",
    description: "One full record plus its archive entry. Accepts eo:, lunar:, mars:, ds: and planet: ids.",
  },
  {
    method: "GET",
    path: "/api/v1/search?q=perseverance",
    description: "Deterministic substring ranking over the bundled index.",
  },
  {
    method: "GET",
    path: "/api/v1/statistics",
    description: "Headline counts, owners, regimes and snapshot metadata.",
  },
  {
    method: "GET",
    path: "/api/v1/timeline?limit=50&order=desc",
    description: "Dated mission events derived from surface artefacts and probe launches.",
  },
  {
    method: "GET",
    path: "/api/v1/missions",
    description: "Missions grouped from the surface catalogue.",
  },
  {
    method: "GET",
    path: "/api/v1/sources",
    description: "Provenance manifest for every bundled dataset.",
  },
  {
    method: "GET",
    path: "/api/v1/bodies",
    description: "The bodies covered by the atlas, with counts and textures.",
  },
  {
    method: "GET",
    path: "/api/v1/health",
    description: "Readiness probe and dataset freshness.",
  },
  {
    method: "POST",
    path: "/api/v1/ai/ask",
    description: "Optional grounded assistant. Returns 503 unless LLM_API_KEY is set.",
  },
];

export default function DataCenterPage() {
  const stats = getStatistics();
  const sources = getDataSources();

  return (
    <div className="shell py-10 lg:py-14">
      <PageHeader
        index="08"
        eyebrow="Data centre"
        title="Where the numbers come from."
        description="This build bundles its datasets. Nothing is scraped at request time, no database is required, and the API is read-only. The manifest below is the complete provenance chain."
        meta={
          <>
            <span className="chip border-success/40 bg-success/5 text-success">
              {formatInt(stats.totalCatalogued)} records
            </span>
            <span className="chip border-white/12 text-mist-300">{sources.length} datasets</span>
            <span className="chip border-white/12 text-mist-500">
              snapshot {formatDate(stats.snapshotRetrievedAt)}
            </span>
            <span className="chip border-warning/40 bg-warning/5 text-warning">
              read-only
            </span>
          </>
        }
      />

      <section className="mt-10">
        <SectionHeading
          eyebrow="Sources"
          title="Six datasets, one manifest."
          description="Each dataset is described by provider, record count, retrieval date, licence and update cadence. Links point at the canonical provider, not at a mirrored copy."
        />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {sources.map((source) => (
            <article key={source.id} className="border border-white/10 bg-ink-900/40 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="label">{source.provider}</p>
                  <h3 className="mt-2 text-[15px] text-mist-100">{source.dataset}</h3>
                </div>
                <span className="data-num shrink-0 border border-white/10 px-2 py-1 text-[11px] text-mist-300">
                  {formatInt(source.records)}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-3">
                <div>
                  <dt className="font-mono text-[8px] uppercase tracking-[0.14em] text-mist-600">
                    Retrieved
                  </dt>
                  <dd className="mt-0.5 font-mono text-[10px] text-mist-300">
                    {formatDate(source.retrievedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[8px] uppercase tracking-[0.14em] text-mist-600">
                    Cadence
                  </dt>
                  <dd className="mt-0.5 font-mono text-[10px] text-mist-300">{source.cadence}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="font-mono text-[8px] uppercase tracking-[0.14em] text-mist-600">
                    Licence
                  </dt>
                  <dd className="mt-0.5 text-[11px] text-mist-400">{source.licence}</dd>
                </div>
              </dl>
              <p className="mt-3 text-[11px] leading-relaxed text-mist-500">{source.notes}</p>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-3 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-mist-500 transition-colors hover:text-orbit"
              >
                Provider record <ArrowUpRight size={11} />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-2">
        <div>
          <SectionHeading
            eyebrow="Snapshot integrity"
            title="Earth-orbit subset."
            description="The checksum covers the bundled orbit-objects.json. Rebuilds are expected to change it."
          />
          <div className="mt-6 border border-white/10 bg-ink-900/40 p-5">
            <div className="flex items-start gap-3">
              <FileCheck2 size={16} className="mt-0.5 shrink-0 text-success" />
              <div className="min-w-0">
                <p className="label">SHA-256</p>
                <p className="mt-1 break-all font-mono text-[10px] leading-relaxed text-mist-300">
                  {orbitMeta.contentSha256}
                </p>
              </div>
            </div>
            <dl className="mt-5 space-y-2.5 border-t border-white/[0.07] pt-4">
              {[
                ["Objects", formatInt(orbitMeta.objectCount)],
                ["Retrieved", formatTimestamp(orbitMeta.retrievedAt)],
                ["Earliest element epoch", formatTimestamp(orbitMeta.elementEpochRange.min)],
                ["Latest element epoch", formatTimestamp(orbitMeta.elementEpochRange.max)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-4">
                  <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist-600">
                    {label}
                  </dt>
                  <dd className="text-right font-mono text-[10px] tabular-nums text-mist-300">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[10px] leading-relaxed text-mist-600">
              {orbitMeta.note} Usage policy:{" "}
              <a
                href={orbitMeta.usagePolicy}
                target="_blank"
                rel="noreferrer noopener"
                className="text-mist-400 underline decoration-white/20 underline-offset-4"
              >
                CelesTrak
              </a>
              .
            </p>
          </div>
        </div>

        <div>
          <SectionHeading
            eyebrow="Subset composition"
            title="What is included."
            description="Counts overlap: an object can belong to several CelesTrak groups."
          />
          <div className="mt-6 border border-white/10 bg-ink-900/40 p-5">
            <p className="label">Catalogue groups</p>
            <ul className="mt-3 space-y-2">
              {Object.entries(orbitMeta.groupCounts).map(([group, count]) => (
                <li
                  key={group}
                  className="flex items-center justify-between border-b border-white/[0.05] pb-1.5 last:border-b-0"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-mist-400">
                    {group}
                  </span>
                  <span className="font-mono text-[10px] tabular-nums text-mist-500">
                    {formatInt(count)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[10px] leading-relaxed text-mist-600">
              This is a curated demonstration subset, not the full 70,000+ object catalogue.
              It is weighted towards stations, navigation constellations, recent launches and
              named debris families so the 3D view stays readable.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-14">
        <SectionHeading
          eyebrow="API"
          title="Read-only JSON, no key required."
          description="Cache headers allow five-minute edge caching with stale-while-revalidate. The API serves the same bundled snapshot as the UI."
        />
        <div className="mt-6 border border-white/10 bg-ink-900/40">
          <div className="divide-y divide-white/[0.06]">
            {ENDPOINTS.map((endpoint) => (
              <div
                key={endpoint.path}
                className="grid gap-1.5 px-4 py-3 sm:grid-cols-[54px_1fr] sm:gap-4"
              >
                <span
                  className={`font-mono text-[9px] uppercase tracking-[0.14em] ${
                    endpoint.method === "POST" ? "text-artifact" : "text-success"
                  }`}
                >
                  {endpoint.method}
                </span>
                <div className="min-w-0">
                  <code className="block break-all font-mono text-[11px] text-mist-200">
                    {endpoint.path}
                  </code>
                  <p className="mt-1 text-[11px] leading-relaxed text-mist-500">
                    {endpoint.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-3">
        <div className="border border-white/10 bg-ink-900/40 p-5">
          <Database size={16} className="text-orbit" />
          <h3 className="mt-3 text-sm font-medium text-mist-100">Bundled, not queried</h3>
          <p className="mt-2 text-[12px] leading-relaxed text-mist-500">
            Datasets are imported at build time into the serverless function. There is no
            database, no external API call at request time and no background ingestion.
          </p>
        </div>
        <div className="border border-white/10 bg-ink-900/40 p-5">
          <Boxes size={16} className="text-artifact" />
          <h3 className="mt-3 text-sm font-medium text-mist-100">Surface datasets</h3>
          <p className="mt-2 text-[12px] leading-relaxed text-mist-500">
            Lunar: {formatInt(lunarDataset.objects.length)} records · Mars:{" "}
            {formatInt(marsDataset.objects.length)} · planets:{" "}
            {formatInt(planetDataset.planets.length)} · probes:{" "}
            {formatInt(deepSpaceDataset.probes.length)}. Every record carries at least one source
            URL.
          </p>
        </div>
        <div className="border border-white/10 bg-ink-900/40 p-5">
          <ShieldAlert size={16} className="text-warning" />
          <h3 className="mt-3 text-sm font-medium text-mist-100">Known limits</h3>
          <p className="mt-2 text-[12px] leading-relaxed text-mist-500">
            Curated subset, one-epoch ephemerides, no live telemetry, no rover traverse paths, no
            guarantee that mission status is current. Read{" "}
            <Link
              href="/about"
              className="text-mist-300 underline decoration-white/20 underline-offset-4 hover:text-orbit"
            >
              method &amp; limits
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
