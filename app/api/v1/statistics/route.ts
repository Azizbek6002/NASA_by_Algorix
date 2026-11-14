import { apiJson } from "@/lib/api";
import { getStatistics, orbitMeta } from "@/lib/data";

/** GET /api/v1/statistics — headline counts used by the home page and API clients. */
export async function GET() {
  const stats = getStatistics();
  return apiJson({
    ...stats,
    snapshot: {
      provider: orbitMeta.provider,
      retrievedAt: orbitMeta.retrievedAt,
      objectCount: orbitMeta.objectCount,
      contentSha256: orbitMeta.contentSha256,
      note: orbitMeta.note,
    },
  });
}
