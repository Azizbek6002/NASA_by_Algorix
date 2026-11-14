import type { NextRequest } from "next/server";

import { apiJson, parseIntParam, parseListParam } from "@/lib/api";
import {
  allSurfaceArtifacts,
  getAllEntries,
  getSearchIndex,
  orbitObjects,
  planets,
  probes,
} from "@/lib/data";
import type { ObjectCategory } from "@/lib/types";

const CATEGORIES: ObjectCategory[] = [
  "earth_orbit",
  "lunar_surface",
  "mars_surface",
  "deep_space",
  "planet",
];

/**
 * GET /api/v1/objects
 * Query: category, q, status, type, limit, offset
 *
 * Returns normalised archive entries, not raw provider records. Use the
 * per-object endpoint for full provenance.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const category = params.get("category");
  const query = params.get("q") ?? "";
  const statuses = parseListParam(params.get("status"));
  const types = parseListParam(params.get("type"));
  const limit = parseIntParam(params.get("limit"), 50, 2000);
  const offset = parseIntParam(params.get("offset"), 0, 100_000);

  if (category && !CATEGORIES.includes(category as ObjectCategory)) {
    return apiJson({
      error: {
        code: "invalid_category",
        message: `Unknown category "${category}".`,
        allowed: CATEGORIES,
      },
    }, { status: 400 });
  }

  let entries = getAllEntries();

  if (category) entries = entries.filter((entry) => entry.category === category);
  if (statuses.length) entries = entries.filter((entry) => statuses.includes(entry.status));
  if (types.length) entries = entries.filter((entry) => types.includes(entry.type));
  if (query) {
    const q = query.toLowerCase();
    entries = entries.filter(
      (entry) =>
        entry.name.toLowerCase().includes(q) ||
        entry.id.toLowerCase().includes(q) ||
        (entry.country ?? "").toLowerCase().includes(q) ||
        (entry.agency ?? "").toLowerCase().includes(q),
    );
  }

  const total = entries.length;
  const page = entries.slice(offset, offset + limit);

  return apiJson({
    count: page.length,
    total,
    offset,
    limit,
    results: page,
    index: {
      earthOrbit: orbitObjects.length,
      lunar: allSurfaceArtifacts.filter((a) => a.category === "lunar_surface").length,
      mars: allSurfaceArtifacts.filter((a) => a.category === "mars_surface").length,
      deepSpace: probes.length,
      planets: planets.length,
      searchable: getSearchIndex().length,
    },
  });
}
