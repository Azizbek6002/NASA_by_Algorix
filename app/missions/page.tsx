import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { allSurfaceArtifacts, getTimeline, probes } from "@/lib/data";
import { formatDate, formatInt } from "@/lib/format";
import type { ObjectCategory } from "@/lib/types";

export const metadata = {
  title: "Missions",
  description:
    "A chronological index of the missions and dated milestones behind the SPACE ARCHIVE catalogue.",
};

interface MissionRow {
  id: string;
  name: string;
  agency: string;
  country: string;
  category: ObjectCategory;
  objects: number;
  unknownLocations: number;
  firstLaunch: string | null;
  latestLaunch: string | null;
  sampleId: string;
}

function buildMissions(): MissionRow[] {
  const map = new Map<string, MissionRow>();

  for (const artifact of allSurfaceArtifacts) {
    const row = map.get(artifact.mission);
    const located =
      artifact.location.status === "verified_located" &&
      artifact.location.latitude !== null &&
      artifact.location.longitude !== null;

    if (row) {
      row.objects += 1;
      if (!located) row.unknownLocations += 1;
      if (artifact.launchDate) {
        if (!row.firstLaunch || artifact.launchDate < row.firstLaunch) {
          row.firstLaunch = artifact.launchDate;
        }
        if (!row.latestLaunch || artifact.launchDate > row.latestLaunch) {
          row.latestLaunch = artifact.launchDate;
        }
      }
    } else {
      map.set(artifact.mission, {
        id: artifact.mission,
        name: artifact.mission,
        agency: artifact.agency,
        country: artifact.country,
        category: artifact.category,
        objects: 1,
        unknownLocations: located ? 0 : 1,
        firstLaunch: artifact.launchDate,
        latestLaunch: artifact.launchDate,
        sampleId: artifact.id,
      });
    }
  }

  for (const probe of probes) {
    map.set(probe.mission, {
      id: probe.mission,
      name: probe.mission,
      agency: probe.agency,
      country: probe.country,
      category: "deep_space",
      objects: 1,
      unknownLocations: 0,
      firstLaunch: probe.launchDate,
      latestLaunch: probe.launchDate,
      sampleId: probe.id,
    });
  }

  return [...map.values()].sort((a, b) =>
    (b.firstLaunch ?? "").localeCompare(a.firstLaunch ?? ""),
  );
}

function entryHref(category: ObjectCategory, id: string): string {
  if (category === "lunar_surface") return `/moon?object=${id}`;
  if (category === "mars_surface") return `/mars?object=${id}`;
  if (category === "deep_space") return `/deep-space?object=${id}`;
  return `/earth-orbit?object=${id}`;
}

export default function MissionsPage() {
  const missions = buildMissions();
  const timeline = getTimeline();

  const byYear = new Map<string, typeof timeline>();
  for (const item of timeline) {
    const year = item.date.slice(0, 4);
    const bucket = byYear.get(year);
    if (bucket) bucket.push(item);
    else byYear.set(year, [item]);
  }
  const years = [...byYear.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <div className="shell py-10 lg:py-14">
      <PageHeader
        index="07"
        eyebrow="Missions"
        title="A chronology of hardware, not of press releases."
        description="The timeline contains only dated events recorded in the bundled mission data: launches, landings, impacts, deployments and losses of contact. A missing event means the archive has no dated milestone, not that nothing occurred."
        meta={
          <>
            <span className="chip border-white/12 text-mist-300">
              {formatInt(missions.length)} missions
            </span>
            <span className="chip border-white/12 text-mist-300">
              {formatInt(timeline.length)} dated milestones
            </span>
            <span className="chip border-warning/40 bg-warning/5 text-warning">
              {formatInt(missions.reduce((sum, mission) => sum + mission.unknownLocations, 0))}{" "}
              unknown locations
            </span>
          </>
        }
      />

      <section className="mt-10">
        <SectionHeading
          eyebrow="Mission index"
          title="Every mission represented in the archive."
          description="Surface missions are grouped by the mission string in the catalogue. Deep-space probes are grouped by programme."
        />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {missions.map((mission) => (
            <Link
              key={mission.id}
              href={entryHref(mission.category, mission.sampleId)}
              className="group flex flex-col justify-between border border-white/10 bg-ink-900/40 p-4 transition-colors hover:border-white/30 hover:bg-ink-850/60"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[14px] text-mist-100">{mission.name}</p>
                  <ArrowUpRight
                    size={13}
                    className="mt-0.5 shrink-0 text-mist-600 transition-colors group-hover:text-mist-50"
                  />
                </div>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-mist-600">
                  {mission.agency} · {mission.country}
                </p>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-3">
                <div>
                  <dt className="font-mono text-[8px] uppercase tracking-[0.12em] text-mist-600">
                    Objects
                  </dt>
                  <dd className="mt-0.5 font-mono text-[11px] tabular-nums text-mist-300">
                    {formatInt(mission.objects)}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[8px] uppercase tracking-[0.12em] text-mist-600">
                    Launch
                  </dt>
                  <dd className="mt-0.5 font-mono text-[10px] tabular-nums text-mist-300">
                    {mission.firstLaunch ? formatDate(mission.firstLaunch) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[8px] uppercase tracking-[0.12em] text-mist-600">
                    Unknown
                  </dt>
                  <dd
                    className={`mt-0.5 font-mono text-[11px] tabular-nums ${
                      mission.unknownLocations ? "text-warning" : "text-mist-500"
                    }`}
                  >
                    {formatInt(mission.unknownLocations)}
                  </dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <SectionHeading
          eyebrow="Timeline"
          title="Dated milestones, newest first."
          description="Filter by year with the anchor rail, or scroll. Every row links back to the object record that carries the event."
          action={
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-mist-500">
              <CalendarDays size={12} />
              {years[0]} — {years[years.length - 1]}
            </span>
          }
        />

        <nav className="mt-6 flex flex-wrap gap-1.5" aria-label="Timeline years">
          {years.map((year) => (
            <a
              key={year}
              href={`#year-${year}`}
              className="border border-white/10 px-2 py-1 font-mono text-[9px] tabular-nums tracking-[0.12em] text-mist-500 transition-colors hover:border-white/30 hover:text-mist-50"
            >
              {year}
            </a>
          ))}
        </nav>

        <div className="mt-6 space-y-8">
          {years.map((year) => (
            <div key={year} id={`year-${year}`} className="scroll-mt-32">
              <div className="flex items-baseline gap-4 border-b border-white/10 pb-2">
                <h3 className="font-mono text-sm tracking-[0.18em] text-artifact">{year}</h3>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist-600">
                  {formatInt(byYear.get(year)?.length ?? 0)} milestones
                </span>
              </div>
              <ol className="divide-y divide-white/[0.05]">
                {(byYear.get(year) ?? []).map((item, index) => (
                  <li key={`${item.objectId}-${item.date}-${index}`}>
                    <Link
                      href={entryHref(item.category, item.objectId)}
                      className="group grid gap-1 py-3 transition-colors hover:bg-white/[0.02] sm:grid-cols-[90px_130px_minmax(0,1fr)_20px] sm:items-baseline sm:gap-5"
                    >
                      <span className="font-mono text-[10px] tabular-nums uppercase tracking-[0.12em] text-mist-600">
                        {item.date}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-artifact/80">
                        {item.label}
                      </span>
                      <span className="min-w-0">
                        <span className="text-[12px] text-mist-200 group-hover:text-mist-50">
                          {item.objectName}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-relaxed text-mist-500">
                          {item.description}
                        </span>
                      </span>
                      <ArrowUpRight
                        size={12}
                        className="hidden text-mist-600 transition-colors group-hover:text-mist-50 sm:block"
                      />
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
