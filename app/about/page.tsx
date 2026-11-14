import Link from "next/link";
import {
  CheckCircle2,
  CircleSlash2,
  Compass,
  Globe2,
  Layers,
  Scale,
  ShieldCheck,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  CONFIDENCE_LABEL,
  SITE,
  STATUS_LABEL,
} from "@/lib/constants";
import { getDataSources, getStatistics } from "@/lib/data";
import { formatInt } from "@/lib/format";

export const metadata = {
  title: "About & Method",
  description:
    "How SPACE ARCHIVE sources, validates and presents the location of human hardware beyond Earth.",
};

const CONVENTIONS = [
  {
    scope: "Earth orbit",
    frame: "TEME → Earth-fixed (ECEF)",
    position: "SGP4 propagation of published mean elements",
    uncertainty: "Element age; grows with time from epoch",
  },
  {
    scope: "Moon",
    frame: "Planetocentric, east-positive longitude",
    position: "NASA artefact catalogue coordinates",
    uncertainty: "Verified / approximate / unknown, stated per record",
  },
  {
    scope: "Mars",
    frame: "Planetographic, east-positive longitude",
    position: "Mission landing-site documentation",
    uncertainty: "Verified / approximate / unknown, stated per record",
  },
  {
    scope: "Planets",
    frame: "ICRF, heliocentric",
    position: "JPL Horizons state vector at one epoch",
    uncertainty: "Ephemeris precision; no motion beyond epoch",
  },
  {
    scope: "Deep space",
    frame: "ICRF, heliocentric",
    position: "JPL Horizons state vector at one epoch",
    uncertainty: "Ephemeris solution, not telemetry",
  },
];

export default function AboutPage() {
  const stats = getStatistics();
  const sources = getDataSources();

  return (
    <div className="shell py-10 lg:py-14">
      <PageHeader
        index="09"
        eyebrow="About & method"
        title="An atlas that shows its work."
        description="SPACE ARCHIVE is a data-driven map of the hardware humans have left beyond Earth. It is built to answer one question honestly: where is it, and how do we know?"
        meta={
          <>
            <span className="chip border-white/12 text-mist-300">
              {formatInt(stats.totalCatalogued)} records
            </span>
            <span className="chip border-white/12 text-mist-300">
              {formatInt(sources.length)} datasets
            </span>
            <span className="chip border-success/40 bg-success/5 text-success">
              open data
            </span>
            <span className="chip border-warning/40 bg-warning/5 text-warning">
              snapshot · not live
            </span>
          </>
        }
      />

      <section className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div>
          <SectionHeading eyebrow="Purpose" title="What this is." />
          <div className="mt-5 space-y-4 text-[14px] leading-relaxed text-mist-400">
            <p>
              {SITE.name} is a catalogue and a set of 3D views covering five places: Earth
              orbit, the lunar surface, the Martian surface, the planetary system and the
              region beyond it. It combines public satellite element sets, NASA and ESA mission
              documentation and JPL Horizons ephemerides into one consistent model.
            </p>
            <p>
              The interface is deliberately conservative. Every object opens an inspector with
              its coordinates, status, epoch and source. When a source does not provide a
              coordinate, the record is labelled{" "}
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-warning">
                UNKNOWN LOCATION
              </span>{" "}
              and is not drawn on a globe.
            </p>
            <p>
              There are {formatInt(stats.unknownLocation)} such surface records in this build.
              They are part of the catalogue precisely because hiding them would make the map
              look more complete than the data allows.
            </p>
          </div>

          <div className="mt-10">
            <SectionHeading eyebrow="Boundaries" title="What this is not." />
            <ul className="mt-5 space-y-3">
              {[
                "Not a live tracking service. Earth-orbit markers are propagations from stored element sets; the snapshot date is displayed everywhere.",
                "Not a complete catalogue. The Earth-orbit subset is curated for legibility, not exhaustive coverage.",
                "Not a source of telemetry. Deep-space and planetary positions are ephemeris solutions at one epoch.",
                "Not a rover tracker. Mars traverse paths are omitted unless a verified path dataset is bundled.",
                "Not an authority on mission status. Statuses are preserved as reported by the cited source and may be stale.",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <CircleSlash2 size={14} className="mt-0.5 shrink-0 text-warning/80" />
                  <span className="text-[13px] leading-relaxed text-mist-500">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border border-white/10 bg-ink-900/40 p-5">
            <ShieldCheck size={17} className="text-success" />
            <h3 className="mt-3 text-sm font-medium text-mist-100">Never invent a position</h3>
            <p className="mt-2 text-[12px] leading-relaxed text-mist-500">
              There is no interpolation, smoothing or “best guess” placement in this project.
              A missing coordinate stays missing. A stale element set keeps its age label.
            </p>
          </div>
          <div className="border border-white/10 bg-ink-900/40 p-5">
            <Compass size={17} className="text-orbit" />
            <h3 className="mt-3 text-sm font-medium text-mist-100">Directions are real</h3>
            <p className="mt-2 text-[12px] leading-relaxed text-mist-500">
              Planetary and probe positions preserve the real ICRF direction from the state
              vector. Only radial distance is compressed, and the compression formula is shown
              in the view.
            </p>
          </div>
          <div className="border border-white/10 bg-ink-900/40 p-5">
            <Layers size={17} className="text-artifact" />
            <h3 className="mt-3 text-sm font-medium text-mist-100">Bundled snapshot</h3>
            <p className="mt-2 text-[12px] leading-relaxed text-mist-500">
              No database. The datasets are committed to the repository and imported into the
              serverless bundle. Rebuilding the dataset is an explicit scripted action, not a
              silent background job.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-14">
        <SectionHeading
          eyebrow="Coordinates"
          title="Five scopes, five conventions."
          description="The same lat/lon pair means different things on different bodies. This table is the contract."
        />
        <div className="mt-6 overflow-x-auto border border-white/10 bg-ink-900/40">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-left">
                {["Scope", "Frame", "Position source", "Uncertainty"].map((header) => (
                  <th
                    key={header}
                    className="px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.14em] text-mist-600"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CONVENTIONS.map((row) => (
                <tr key={row.scope} className="border-b border-white/[0.05] last:border-b-0">
                  <td className="px-4 py-3 text-xs text-mist-200">{row.scope}</td>
                  <td className="px-4 py-3 font-mono text-[10px] text-mist-400">{row.frame}</td>
                  <td className="px-4 py-3 text-[11px] text-mist-500">{row.position}</td>
                  <td className="px-4 py-3 text-[11px] text-mist-500">{row.uncertainty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow="Status" title="Status vocabulary." />
          <ul className="mt-5 divide-y divide-white/[0.06] border-y border-white/10">
            {Object.entries(STATUS_LABEL).map(([key, label]) => (
              <li key={key} className="flex items-center justify-between gap-4 py-2.5">
                <span className="text-[13px] text-mist-300">{label}</span>
                <code className="font-mono text-[9px] uppercase tracking-[0.1em] text-mist-600">
                  {key}
                </code>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] leading-relaxed text-mist-600">
            “Unknown” means the catalogue does not state the status. It does not mean inactive.
          </p>
        </div>

        <div>
          <SectionHeading eyebrow="Confidence" title="Location confidence." />
          <ul className="mt-5 space-y-3">
            {[
              ["verified", "Coordinate comes directly from a published catalogue or mission source."],
              ["estimated", "Coordinate is derived from a documented element set or ephemeris."],
              ["approximate", "Source gives a rounded or regional coordinate; treat as a site marker."],
              ["unknown", "No reliable coordinate is available. The record is not plotted."],
            ].map(([key, description]) => (
              <li key={key} className="border-l border-white/15 pl-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-mist-300">
                  {CONFIDENCE_LABEL[key as keyof typeof CONFIDENCE_LABEL]}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-mist-500">{description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow="Rendering" title="Scale, honestly." />
          <div className="mt-5 space-y-4 text-[13px] leading-relaxed text-mist-500">
            <p className="flex gap-3">
              <Globe2 size={15} className="mt-0.5 shrink-0 text-orbit" />
              <span>
                Earth is drawn as a sphere of one scene unit, equal to 6,371 km. Orbit altitude
                is therefore 400 km ≈ 0.063 units. Markers are enlarged so they remain visible.
              </span>
            </p>
            <p className="flex gap-3">
              <Scale size={15} className="mt-0.5 shrink-0 text-artifact" />
              <span>
                Heliocentric views compress radius with{" "}
                <code className="font-mono text-[11px] text-mist-300">
                  r = 2 + 3·√AU + 2·log₁₀(1 + AU)
                </code>
                . Planet sizes are stylised. The inspector always shows real AU, km and light
                time.
              </span>
            </p>
            <p className="flex gap-3">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-success" />
              <span>
                Planet textures are equirectangular maps from Solar System Scope, licensed
                CC BY 4.0. Longitude 0° is mapped to +X with east towards −Z, matching the
                catalogue&apos;s east-positive convention.
              </span>
            </p>
          </div>
        </div>

        <div>
          <SectionHeading eyebrow="Attribution" title="Data and licences." />
          <ul className="mt-5 divide-y divide-white/[0.06] border-y border-white/10">
            {sources.map((source) => (
              <li key={source.id} className="py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-[13px] text-mist-300 underline decoration-white/20 underline-offset-4 transition-colors hover:text-orbit"
                  >
                    {source.provider}
                  </a>
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist-600">
                    {source.dataset}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-mist-600">{source.licence}</p>
              </li>
            ))}
            <li className="py-3">
              <p className="text-[13px] text-mist-300">Solar System Scope</p>
              <p className="mt-1 text-[11px] text-mist-600">
                Planet and moon textures · CC BY 4.0 · https://www.solarsystemscope.com/textures/
              </p>
            </li>
          </ul>
        </div>
      </section>

      <section className="mt-14 grid gap-4 border border-white/10 bg-ink-900/40 p-6 md:grid-cols-3">
        <div>
          <p className="label">Stack</p>
          <p className="mt-2 text-[12px] leading-relaxed text-mist-500">
            Next.js App Router, React Three Fiber/three.js, satellite.js SGP4, Tailwind CSS.
            Deployed as a single Vercel project with no database.
          </p>
        </div>
        <div>
          <p className="label">Assistant</p>
          <p className="mt-2 text-[12px] leading-relaxed text-mist-500">
            The mission librarian is optional. Without an{" "}
            <code className="font-mono text-[11px] text-mist-400">LLM_API_KEY</code> the endpoint
            returns 503 and the rest of the archive is unaffected.
          </p>
        </div>
        <div>
          <p className="label">Feedback</p>
          <p className="mt-2 text-[12px] leading-relaxed text-mist-500">
            Found a coordinate that disagrees with its source? The record includes a link to the
            canonical provider so the discrepancy can be checked directly.{" "}
            <Link
              href="/data-center"
              className="text-mist-300 underline decoration-white/20 underline-offset-4 hover:text-orbit"
            >
              Data centre
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
