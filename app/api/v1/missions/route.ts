import { apiJson } from "@/lib/api";
import { allSurfaceArtifacts, probes } from "@/lib/data";

export interface MissionSummary {
  id: string;
  name: string;
  agency: string;
  country: string;
  category: string;
  objects: number;
  firstLaunch: string | null;
  latestLaunch: string | null;
  unknownLocations: number;
}

/** GET /api/v1/missions — missions derived from catalogued surface assets. */
export async function GET() {
  const map = new Map<string, MissionSummary>();

  for (const artifact of allSurfaceArtifacts) {
    const id = artifact.mission;
    const existing = map.get(id);
    const located =
      artifact.location.status === "verified_located" &&
      artifact.location.latitude !== null &&
      artifact.location.longitude !== null;

    if (existing) {
      existing.objects += 1;
      if (!located) existing.unknownLocations += 1;
      if (artifact.launchDate) {
        if (!existing.firstLaunch || artifact.launchDate < existing.firstLaunch) {
          existing.firstLaunch = artifact.launchDate;
        }
        if (!existing.latestLaunch || artifact.launchDate > existing.latestLaunch) {
          existing.latestLaunch = artifact.launchDate;
        }
      }
    } else {
      map.set(id, {
        id,
        name: artifact.mission,
        agency: artifact.agency,
        country: artifact.country,
        category: artifact.category,
        objects: 1,
        firstLaunch: artifact.launchDate,
        latestLaunch: artifact.launchDate,
        unknownLocations: located ? 0 : 1,
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
      firstLaunch: probe.launchDate,
      latestLaunch: probe.launchDate,
      unknownLocations: 0,
    });
  }

  const missions = [...map.values()].sort(
    (a, b) => (a.firstLaunch ?? "").localeCompare(b.firstLaunch ?? "") * -1,
  );

  return apiJson({ count: missions.length, missions });
}
