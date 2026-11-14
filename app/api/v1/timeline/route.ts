import type { NextRequest } from "next/server";

import { apiJson, parseIntParam } from "@/lib/api";
import { getTimeline } from "@/lib/data";

/** GET /api/v1/timeline?limit=100&category=mars_surface */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const limit = parseIntParam(params.get("limit"), 100, 500);
  const category = params.get("category");
  const order = params.get("order") === "asc" ? "asc" : "desc";

  let items = getTimeline();
  if (category) items = items.filter((item) => item.category === category);
  if (order === "asc") items = [...items].reverse();

  return apiJson({
    count: Math.min(items.length, limit),
    total: items.length,
    order,
    items: items.slice(0, limit),
  });
}
