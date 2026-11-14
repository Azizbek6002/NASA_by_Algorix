import orbitObjectsRaw from "@/data/celestrak/orbit-objects.json";
import orbitMetaRaw from "@/data/celestrak/snapshot-meta.json";
import lunarRaw from "@/data/curated/lunar.json";
import marsRaw from "@/data/curated/mars.json";
import planetsRaw from "@/data/ephemeris/planets.json";
import deepSpaceRaw from "@/data/ephemeris/deep-space.json";

import { CATEGORIES, MOON_MEAN_DISTANCE_KM, REGIME_LABEL } from "@/lib/constants";
import { displayName, formatAltitude, formatLatLon, pluralize } from "@/lib/format";
import type {
  ArchiveEntry,
  DeepSpaceDataset,
  DeepSpaceProbe,
  EarthOrbitObject,
  MissionEvent,
  ObjectCategory,
  OrbitSnapshotMeta,
  PlanetDataset,
  PlanetRecord,
  SearchIndexEntry,
  SurfaceArtifact,
  SurfaceDataset,
} from "@/lib/types";

/*
 * The repository is the only place that touches the bundled JSON. Everything
 * else consumes typed, normalised accessors so that a future live provider can
 * be swapped in without changing UI code.
 *
 * Note: data is imported statically so that the files are traced into the
 * Vercel serverless bundle. Client components never import this module.
 */

export const orbitObjects = orbitObjectsRaw as unknown as EarthOrbitObject[];
export const orbitMeta = orbitMetaRaw as unknown as OrbitSnapshotMeta;
export const lunarDataset = lunarRaw as unknown as SurfaceDataset;
export const marsDataset = marsRaw as unknown as SurfaceDataset;
export const planetDataset = planetsRaw as unknown as PlanetDataset;
export const deepSpaceDataset = deepSpaceRaw as unknown as DeepSpaceDataset;

export const lunarArtifacts = lunarDataset.objects;
export const marsArtifacts = marsDataset.objects;
export const planets = planetDataset.planets;
export const probes = deepSpaceDataset.probes;

export const allSurfaceArtifacts: SurfaceArtifact[] = [
  ...lunarArtifacts,
  ...marsArtifacts,
];

export function getOrbitObject(noradId: number): EarthOrbitObject | undefined {
  return orbitObjects.find((o) => o.noradId === noradId);
}

export function getSurfaceArtifact(id: string): SurfaceArtifact | undefined {
  return allSurfaceArtifacts.find((o) => o.id === id || o.slug === id);
}

export function getProbe(slug: string): DeepSpaceProbe | undefined {
  return probes.find((p) => p.slug === slug || p.id === slug);
}

export function getPlanet(slug: string): PlanetRecord | undefined {
  return planets.find((p) => p.slug === slug);
}

/* ------------------------------------------------------------------ */
/* Normalisation                                                       */
/* ------------------------------------------------------------------ */

function entryHref(category: ObjectCategory, id: string): string {
  if (category === "earth_orbit") return `/earth-orbit?object=${id}`;
  if (category === "lunar_surface") return `/moon?object=${id}`;
  if (category === "mars_surface") return `/mars?object=${id}`;
  if (category === "deep_space") return `/deep-space?object=${id}`;
  return `/solar-system?object=${id}`;
}

export function orbitToEntry(o: EarthOrbitObject): ArchiveEntry {
  return {
    id: o.id,
    name: displayName(o.name),
    category: "earth_orbit",
    type: o.type,
    status: o.status,
    statusLabel: o.statusLabel,
    agency: o.ownerCode,
    country: o.country,
    launchDate: o.launchDate,
    description: o.description,
    locationLabel: `${REGIME_LABEL[o.altitudeRegime] ?? "Orbit"} · ${formatAltitude(
      o.perigeeKm,
      o.apogeeKm,
    )}`,
    located: true,
    accuracy: o.locationConfidence,
    epoch: o.epoch,
    tags: o.groups,
    href: entryHref("earth_orbit", o.id),
  };
}

export function surfaceToEntry(o: SurfaceArtifact): ArchiveEntry {
  const located =
    o.location.status === "verified_located" &&
    o.location.latitude !== null &&
    o.location.longitude !== null;
  return {
    id: o.id,
    name: o.name,
    category: o.category,
    type: o.type,
    status: o.status,
    statusLabel: o.status.replace(/_/g, " "),
    agency: o.agency,
    country: o.country,
    launchDate: o.launchDate,
    description: o.description,
    locationLabel: located
      ? formatLatLon(o.location.latitude, o.location.longitude)
      : "UNKNOWN LOCATION",
    located,
    accuracy: o.location.accuracy,
    epoch: null,
    tags: o.tags,
    href: entryHref(o.category, o.id),
  };
}

export function probeToEntry(p: DeepSpaceProbe): ArchiveEntry {
  return {
    id: p.id,
    name: p.name,
    category: "deep_space",
    type: "probe",
    status: p.status,
    statusLabel: p.status.replace(/_/g, " "),
    agency: p.agency,
    country: p.country,
    launchDate: p.launchDate,
    description: p.objective,
    locationLabel: `${p.distanceAu.toFixed(2)} AU from the Sun`,
    located: true,
    accuracy: "estimated",
    epoch: p.epoch,
    tags: ["interplanetary", p.mission],
    href: entryHref("deep_space", p.id),
  };
}

export function planetToEntry(p: PlanetRecord): ArchiveEntry {
  return {
    id: `planet:${p.slug}`,
    name: p.name,
    category: "planet",
    type: "planet",
    status: "active",
    statusLabel: "Heliocentric body",
    agency: null,
    country: null,
    launchDate: null,
    description: `Mean orbital distance ${p.meanDistanceAu.toFixed(3)} AU; current distance ${p.distanceAu.toFixed(
      3,
    )} AU.`,
    locationLabel: `${p.distanceAu.toFixed(3)} AU from the Sun`,
    located: true,
    accuracy: "verified",
    epoch: p.epoch,
    tags: ["planet", p.frame],
    href: entryHref("planet", `planet:${p.slug}`),
  };
}

export function getAllEntries(): ArchiveEntry[] {
  return [
    ...orbitObjects.map(orbitToEntry),
    ...allSurfaceArtifacts.map(surfaceToEntry),
    ...probes.map(probeToEntry),
    ...planets.map(planetToEntry),
  ];
}

export function getSearchIndex(): SearchIndexEntry[] {
  return getAllEntries().map((e) => ({
    id: e.id,
    name: e.name,
    category: e.category,
    type: e.type,
    status: e.status,
    country: e.country ?? e.agency ?? null,
    href: e.href,
    keywords: `${e.name} ${e.id} ${e.country ?? ""} ${e.agency ?? ""} ${e.tags.join(" ")}`.toLowerCase(),
  }));
}

/* ------------------------------------------------------------------ */
/* Statistics                                                          */
/* ------------------------------------------------------------------ */

export interface Statistics {
  totalCatalogued: number;
  earthOrbit: number;
  moon: number;
  mars: number;
  deepSpace: number;
  planets: number;
  activeEarthOrbit: number;
  debris: number;
  rocketBodies: number;
  satellites: number;
  unknownLocation: number;
  surfaceLocated: number;
  regimes: Record<string, number>;
  statuses: Record<string, number>;
  owners: { code: string; count: number }[];
  snapshotRetrievedAt: string;
  elementEpochRange: { min: string; max: string };
  yearsSpanned: { earliest: string | null; latest: string | null };
}

export function getStatistics(): Statistics {
  const regimes: Record<string, number> = {};
  const statuses: Record<string, number> = {};
  const owners = new Map<string, number>();
  let active = 0;
  let debris = 0;
  let rockets = 0;
  let satellites = 0;

  for (const o of orbitObjects) {
    regimes[o.altitudeRegime] = (regimes[o.altitudeRegime] ?? 0) + 1;
    statuses[o.status] = (statuses[o.status] ?? 0) + 1;
    if (o.status === "active") active += 1;
    if (o.type === "debris") debris += 1;
    if (o.type === "rocket_body") rockets += 1;
    if (o.type === "satellite") satellites += 1;
    const key = o.country ?? o.ownerCode ?? "Unknown";
    owners.set(key, (owners.get(key) ?? 0) + 1);
  }

  const unknownLocation = allSurfaceArtifacts.filter(
    (o) => o.location.status === "unknown_location",
  ).length;
  const surfaceLocated = allSurfaceArtifacts.length - unknownLocation;

  const launches = allSurfaceArtifacts
    .map((o) => o.launchDate)
    .concat(probes.map((p) => p.launchDate))
    .filter((d): d is string => Boolean(d))
    .sort();

  return {
    totalCatalogued:
      orbitObjects.length + allSurfaceArtifacts.length + probes.length + planets.length,
    earthOrbit: orbitObjects.length,
    moon: lunarArtifacts.length,
    mars: marsArtifacts.length,
    deepSpace: probes.length,
    planets: planets.length,
    activeEarthOrbit: active,
    debris,
    rocketBodies: rockets,
    satellites,
    unknownLocation,
    surfaceLocated,
    regimes,
    statuses,
    owners: [...owners.entries()]
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count),
    snapshotRetrievedAt: orbitMeta.retrievedAt,
    elementEpochRange: orbitMeta.elementEpochRange,
    yearsSpanned: {
      earliest: launches[0] ?? null,
      latest: launches[launches.length - 1] ?? null,
    },
  };
}

export function getHeadline(): string {
  const stats = getStatistics();
  return `${pluralize(stats.totalCatalogued, "object")} located — ${pluralize(
    stats.earthOrbit,
    "in Earth orbit",
  )}, ${pluralize(stats.moon, "on the Moon", "on the Moon")}, ${pluralize(
    stats.mars,
    "on Mars",
  )}, ${pluralize(stats.deepSpace, "beyond the planets", "beyond the planets")}.`;
}

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

export interface TimelineItem {
  date: string;
  label: string;
  description: string;
  objectId: string;
  objectName: string;
  category: ObjectCategory;
  type: string;
}

const TIMELINE_TYPES = new Set([
  "launch",
  "landing",
  "impact",
  "rover_deployment",
  "instrument_activation",
  "loss_of_communication",
  "mission_completion",
]);

export function getTimeline(): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const artifact of allSurfaceArtifacts) {
    for (const event of artifact.events as MissionEvent[]) {
      if (!TIMELINE_TYPES.has(event.type)) continue;
      items.push({
        date: event.date,
        label: event.type.replace(/_/g, " "),
        description: event.description,
        objectId: artifact.id,
        objectName: artifact.name,
        category: artifact.category,
        type: artifact.type,
      });
    }
  }

  for (const probe of probes) {
    items.push({
      date: probe.launchDate,
      label: "launch",
      description: `${probe.name} launched toward the outer solar system.`,
      objectId: probe.id,
      objectName: probe.name,
      category: "deep_space",
      type: "probe",
    });
  }

  return items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/* ------------------------------------------------------------------ */
/* Sources / data centre                                               */
/* ------------------------------------------------------------------ */

export interface DataSource {
  id: string;
  provider: string;
  dataset: string;
  records: number;
  url: string;
  retrievedAt: string;
  licence: string;
  cadence: string;
  notes: string;
}

export function getDataSources(): DataSource[] {
  return [
    {
      id: "celestrak-gp",
      provider: "CelesTrak",
      dataset: "General Perturbations (OMM JSON)",
      records: orbitObjects.length,
      url: "https://celestrak.org/NORAD/elements/",
      retrievedAt: orbitMeta.retrievedAt,
      licence: "Public catalogue, CelesTrak usage policy",
      cadence: "Multiple times daily",
      notes:
        "Curated subset of stations, GPS, visual, recently launched objects and collision debris plus a stratified sample of active payloads.",
    },
    {
      id: "celestrak-satcat",
      provider: "CelesTrak",
      dataset: "SATCAT",
      records: 71_308,
      url: "https://celestrak.org/pub/satcat.csv",
      retrievedAt: orbitMeta.retrievedAt,
      licence: "Public catalogue, CelesTrak usage policy",
      cadence: "Daily",
      notes:
        "Object type, owner, launch date and operational status, joined on NORAD catalogue number.",
    },
    {
      id: "nasa-lunar",
      provider: "NASA History Program Office",
      dataset: "Catalogue of Manmade Material on the Moon",
      records: lunarArtifacts.length,
      url:
        lunarDataset.catalogueUrl ??
        "https://www.nasa.gov/wp-content/uploads/static/history/humanartifacts.html",
      retrievedAt: lunarDataset.retrievedAt,
      licence: "NASA public domain",
      cadence: "Static reference (2012 catalogue)",
      notes:
        "Curated selection of artefacts with catalogued coordinates. One source coordinate (Ranger 9) is out of range and is stored as unknown.",
    },
    {
      id: "nasa-mars",
      provider: "NASA / ESA mission documentation",
      dataset: "Mars landing sites and surface assets",
      records: marsArtifacts.length,
      url: "https://science.nasa.gov/mars/",
      retrievedAt: marsDataset.retrievedAt,
      licence: "NASA public domain / ESA terms",
      cadence: "Per mission",
      notes:
        "Hand-curated from mission pages and landing-site documentation. Unknown landing points are stored without coordinates.",
    },
    {
      id: "jpl-planets",
      provider: "JPL Horizons",
      dataset: "Heliocentric ICRF state vectors",
      records: planets.length,
      url: "https://ssd.jpl.nasa.gov/api/horizons.api",
      retrievedAt: planetDataset.retrievedAt,
      licence: "NASA/JPL public domain",
      cadence: "Per dataset epoch",
      notes:
        "One vector sample per planet at the stated epoch. Not a live feed; positions do not advance beyond the epoch.",
    },
    {
      id: "jpl-probes",
      provider: "JPL Horizons",
      dataset: "Deep-space probe state vectors",
      records: probes.length,
      url: "https://ssd.jpl.nasa.gov/api/horizons.api",
      retrievedAt: deepSpaceDataset.retrievedAt,
      licence: "NASA/JPL public domain",
      cadence: "Per dataset epoch",
      notes:
        "Voyager 1/2, Pioneer 10/11 and New Horizons. Positions are ephemeris solutions, not telemetry.",
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Derived helpers used by 3D scenes                                   */
/* ------------------------------------------------------------------ */

export function getSurfaceByBody(body: "moon" | "mars"): SurfaceArtifact[] {
  return body === "moon" ? lunarArtifacts : marsArtifacts;
}

/** Compressed radial mapping used by the solar-system view. */
export const MOON_DISTANCE_LABEL = `${(MOON_MEAN_DISTANCE_KM / 1000).toFixed(0)} thousand km`;

export const CATEGORY_ORDER: ObjectCategory[] = [
  "earth_orbit",
  "lunar_surface",
  "mars_surface",
  "deep_space",
  "planet",
];

export const CATEGORY_LABEL = (c: ObjectCategory) => CATEGORIES[c].label;
