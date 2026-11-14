import { apiJson } from "@/lib/api";
import { deepSpaceDataset, getDataSources, lunarDataset, marsDataset, orbitMeta, planetDataset } from "@/lib/data";

/** GET /api/v1/sources — provenance manifest for every bundled dataset. */
export async function GET() {
  return apiJson({
    count: getDataSources().length,
    sources: getDataSources(),
    snapshots: {
      orbit: {
        provider: orbitMeta.provider,
        retrievedAt: orbitMeta.retrievedAt,
        sha256: orbitMeta.contentSha256,
        elementEpochRange: orbitMeta.elementEpochRange,
        usagePolicy: orbitMeta.usagePolicy,
      },
      lunar: {
        provider: lunarDataset.provider,
        retrievedAt: lunarDataset.retrievedAt,
        catalogue: lunarDataset.catalogueUrl,
        cataloguePdf: lunarDataset.cataloguePdfUrl,
      },
      mars: {
        provider: marsDataset.provider,
        retrievedAt: marsDataset.retrievedAt,
      },
      planets: {
        provider: planetDataset.provider,
        epoch: planetDataset.epoch,
        retrievedAt: planetDataset.retrievedAt,
      },
      deepSpace: {
        provider: deepSpaceDataset.provider,
        epoch: deepSpaceDataset.epoch,
        retrievedAt: deepSpaceDataset.retrievedAt,
      },
    },
  });
}
