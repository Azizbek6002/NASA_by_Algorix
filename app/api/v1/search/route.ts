import type { NextRequest } from "next/server";

import { apiJson, parseIntParam } from "@/lib/api";
import { getAllEntries } from "@/lib/data";
import { searchEntries } from "@/lib/filters";

/**
 * GET /api/v1/search?q=perseverance&limit=20
 * Simple deterministic substring ranking — no external search service.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = (params.get("q") ?? "").trim();
  const limit = parseIntParam(params.get("limit"), 20, 100);

  if (query.length < 2) {
    return apiJson({
      query,
      count: 0,
      results: [],
      note: "Provide at least two characters in ?q=",
    });
  }

  const entries = getAllEntries();
  const results = searchEntries(entries, query, limit);

  return apiJson({
    query,
    count: results.length,
    indexSize: entries.length,
    results: results.map((entry) => ({
      id: entry.id,
      name: entry.name,
      category: entry.category,
      type: entry.type,
      status: entry.status,
      country: entry.country,
      href: entry.href,
    })),
  });
}
