import { apiJson } from "@/lib/api";
import { allSurfaceArtifacts, deepSpaceDataset, orbitMeta, planetDataset, probes } from "@/lib/data";

/** GET /api/v1/health — readiness probe plus dataset freshness. */
export async function GET() {
  return apiJson({
    status: "ok",
    service: "space-archive",
    version: "0.1.0",
    checkedAt: new Date().toISOString(),
    datasets: {
      earthOrbit: {
        objects: orbitMeta.objectCount,
        retrievedAt: orbitMeta.retrievedAt,
        sha256: orbitMeta.contentSha256,
      },
      surface: {
        objects: allSurfaceArtifacts.length,
      },
      deepSpace: {
        probes: probes.length,
        epoch: deepSpaceDataset.epoch,
      },
      planets: {
        count: planetDataset.planets.length,
        epoch: planetDataset.epoch,
      },
    },
    capabilities: {
      liveTracking: false,
      aiAssistant: Boolean(process.env.LLM_API_KEY),
      textSearch: true,
      sgp4Propagation: true,
    },
    notes: [
      "SPACE ARCHIVE serves a bundled snapshot. It never claims live telemetry.",
      "Set LLM_API_KEY to enable the optional mission-librarian assistant.",
    ],
  });
}
