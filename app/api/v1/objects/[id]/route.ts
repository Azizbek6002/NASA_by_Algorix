import { apiError, apiJson } from "@/lib/api";
import {
  getOrbitObject,
  getPlanet,
  getProbe,
  getSurfaceArtifact,
  orbitToEntry,
  planetToEntry,
  probeToEntry,
  surfaceToEntry,
} from "@/lib/data";

/**
 * GET /api/v1/objects/:id
 * Accepts ids such as `eo:25544`, `lunar:apollo-11-lm-descent-stage`,
 * `mars:perseverance`, `ds:ds:31` or `planet:mars`.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const id = decodeURIComponent(params.id);

  if (id.startsWith("eo:")) {
    const norad = Number.parseInt(id.slice(3), 10);
    const object = Number.isNaN(norad) ? undefined : getOrbitObject(norad);
    if (!object) return apiError(404, "not_found", `No Earth-orbit object with id ${id}.`);
    return apiJson({ entry: orbitToEntry(object), record: object });
  }

  if (id.startsWith("lunar:") || id.startsWith("mars:")) {
    const artifact = getSurfaceArtifact(id);
    if (!artifact) return apiError(404, "not_found", `No surface artifact with id ${id}.`);
    return apiJson({ entry: surfaceToEntry(artifact), record: artifact });
  }

  if (id.startsWith("ds:")) {
    const probe = getProbe(id) ?? getProbe(id.replace(/^ds:ds:/, ""));
    if (!probe) return apiError(404, "not_found", `No deep-space probe with id ${id}.`);
    return apiJson({ entry: probeToEntry(probe), record: probe });
  }

  if (id.startsWith("planet:")) {
    const planet = getPlanet(id.slice(7));
    if (!planet) return apiError(404, "not_found", `No planet with id ${id}.`);
    return apiJson({ entry: planetToEntry(planet), record: planet });
  }

  return apiError(
    400,
    "invalid_id",
    "Object id must start with eo:, lunar:, mars:, ds: or planet:.",
  );
}
