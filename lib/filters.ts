import type { ArchiveEntry, OrbitRegime, SurfaceArtifact } from "@/lib/types";

export interface OrbitFilters {
  query: string;
  types: string[];
  regimes: OrbitRegime[];
  owners: string[];
  statuses: string[];
  groups: string[];
}

export const EMPTY_ORBIT_FILTERS: OrbitFilters = {
  query: "",
  types: [],
  regimes: [],
  owners: [],
  statuses: [],
  groups: [],
};

export function matchesQuery(haystack: string[], query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return haystack.some((value) => value.toLowerCase().includes(q));
}

/** Structural subset shared by the full record and the browser-side lite payload. */
export interface OrbitFilterable {
  id: string;
  noradId: number;
  name: string;
  intlDesignator: string | null;
  type: string;
  status: string;
  country: string | null;
  groups: string[];
  altitudeRegime: OrbitRegime;
}

export function filterOrbitObjects<T extends OrbitFilterable>(
  objects: T[],
  filters: OrbitFilters,
): T[] {
  return objects.filter((object) => {
    if (filters.types.length && !filters.types.includes(object.type)) return false;
    if (filters.regimes.length && !filters.regimes.includes(object.altitudeRegime))
      return false;
    if (filters.statuses.length && !filters.statuses.includes(object.status)) return false;
    if (filters.owners.length && !filters.owners.includes(object.country ?? "Unknown"))
      return false;
    if (filters.groups.length && !object.groups.some((g) => filters.groups.includes(g)))
      return false;
    if (
      filters.query &&
      !matchesQuery(
        [
          object.name,
          object.id,
          String(object.noradId),
          object.intlDesignator ?? "",
          object.country ?? "",
          object.groups.join(" "),
        ],
        filters.query,
      )
    ) {
      return false;
    }
    return true;
  });
}

export function filterSurfaceArtifacts(
  artifacts: SurfaceArtifact[],
  options: {
    query?: string;
    missions?: string[];
    types?: string[];
    agencies?: string[];
    locatedOnly?: boolean;
    unknownOnly?: boolean;
  },
): SurfaceArtifact[] {
  const {
    query = "",
    missions = [],
    types = [],
    agencies = [],
    locatedOnly = false,
    unknownOnly = false,
  } = options;

  return artifacts.filter((artifact) => {
    if (missions.length && !missions.includes(artifact.mission)) return false;
    if (types.length && !types.includes(artifact.type)) return false;
    if (agencies.length && !agencies.includes(artifact.agency)) return false;
    const located =
      artifact.location.status === "verified_located" &&
      artifact.location.latitude !== null &&
      artifact.location.longitude !== null;
    if (locatedOnly && !located) return false;
    if (unknownOnly && located) return false;
    if (
      query &&
      !matchesQuery(
        [
          artifact.name,
          artifact.id,
          artifact.mission,
          artifact.agency,
          artifact.country,
          artifact.description,
          artifact.tags.join(" "),
        ],
        query,
      )
    ) {
      return false;
    }
    return true;
  });
}

export function searchEntries(entries: ArchiveEntry[], query: string, limit = 40): ArchiveEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = entries
    .map((entry) => {
      const name = entry.name.toLowerCase();
      let score = 0;
      if (name === q) score = 100;
      else if (name.startsWith(q)) score = 80;
      else if (name.includes(q)) score = 60;
      else if (entry.id.toLowerCase().includes(q)) score = 40;
      else if ((entry.country ?? "").toLowerCase().includes(q)) score = 20;
      else if ((entry.agency ?? "").toLowerCase().includes(q)) score = 15;
      return { entry, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name));

  return scored.slice(0, limit).map((item) => item.entry);
}

export function uniqueSorted(values: (string | null | undefined)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))].sort();
}

export function countBy<T, K extends string>(items: T[], key: (item: T) => K): Record<K, number> {
  const out = {} as Record<K, number>;
  for (const item of items) {
    const k = key(item);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}
