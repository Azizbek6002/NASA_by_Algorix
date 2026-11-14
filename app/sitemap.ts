import type { MetadataRoute } from "next";

import { SITE } from "@/lib/constants";

const ROUTES = [
  "",
  "/explore",
  "/solar-system",
  "/earth-orbit",
  "/moon",
  "/mars",
  "/deep-space",
  "/missions",
  "/data-center",
  "/about",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url.replace(/\/$/, "");
  const now = new Date();
  return ROUTES.map((route) => ({
    url: `${base}${route || "/"}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
