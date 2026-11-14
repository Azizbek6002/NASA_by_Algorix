import { NextResponse } from "next/server";

export const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
};

export function apiJson<T>(payload: T, init?: ResponseInit) {
  return NextResponse.json(payload, {
    ...init,
    headers: { ...CACHE_HEADERS, ...(init?.headers ?? {}) },
  });
}

export function apiError(status: number, code: string, message: string, hint?: string) {
  return NextResponse.json(
    { error: { code, message, ...(hint ? { hint } : {}) } },
    { status },
  );
}

export function parseListParam(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseIntParam(value: string | null, fallback: number, max: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, max);
}

export function datasetMeta() {
  return {
    dataset: "SPACE ARCHIVE bundled snapshot",
    generatedAt: new Date().toISOString(),
    licence: "See /api/v1/sources for per-dataset provenance",
  };
}
