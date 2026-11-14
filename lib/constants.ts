import type { Confidence, ObjectCategory, ObjectStatus, ObjectType } from "@/lib/types";

export const SITE = {
  name: "SPACE ARCHIVE",
  tagline: "A digital atlas of humanity's footprint in space",
  description:
    "Locate every spacecraft, lander, rover and artefact humanity has left beyond Earth. Real catalogue data, real coordinates, honest gaps.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  repo: "https://github.com/",
} as const;

export const CATEGORIES: Record<
  ObjectCategory,
  { label: string; short: string; href: string; accent: string; description: string }
> = {
  earth_orbit: {
    label: "Earth Orbit",
    short: "ORBIT",
    href: "/earth-orbit",
    accent: "#55C8FF",
    description:
      "Payloads, rocket bodies and tracked debris in Earth orbit, propagated with SGP4 from published element sets.",
  },
  lunar_surface: {
    label: "Lunar Surface",
    short: "MOON",
    href: "/moon",
    accent: "#E5B45C",
    description:
      "Landers, rovers, experiment packages and impact sites catalogued on the Moon by NASA and international missions.",
  },
  mars_surface: {
    label: "Mars Surface",
    short: "MARS",
    href: "/mars",
    accent: "#E07A5F",
    description:
      "Landing sites and retired hardware on Mars, from Viking to Perseverance, with confidence levels.",
  },
  deep_space: {
    label: "Deep Space",
    short: "DEEP SPACE",
    href: "/deep-space",
    accent: "#9B8CFF",
    description:
      "Interplanetary probes beyond the planetary region, positioned from JPL Horizons state vectors.",
  },
  planet: {
    label: "Planetary System",
    short: "SOLAR SYSTEM",
    href: "/solar-system",
    accent: "#8FD1A6",
    description:
      "The eight planets at their real heliocentric positions for the dataset epoch.",
  },
};

export const STATUS_LABEL: Record<ObjectStatus, string> = {
  active: "Active",
  partially_operational: "Partially operational",
  inactive: "Inactive",
  mission_completed: "Mission completed",
  destroyed: "Destroyed / impacted",
  lost_contact: "Contact lost",
  unknown: "Unknown",
};

export const STATUS_TONE: Record<ObjectStatus, string> = {
  active: "text-success",
  partially_operational: "text-orbit",
  inactive: "text-mist-500",
  mission_completed: "text-mist-300",
  destroyed: "text-warning",
  lost_contact: "text-warning",
  unknown: "text-mist-500",
};

export const TYPE_LABEL: Record<ObjectType, string> = {
  satellite: "Satellite",
  rocket_body: "Rocket body",
  debris: "Debris",
  lander: "Lander",
  rover: "Rover / vehicle",
  descent_stage: "Descent stage",
  ascent_stage: "Ascent stage",
  instrument: "Instrument",
  impact_site: "Impact site",
  probe: "Probe",
  planet: "Planet",
  unknown: "Unclassified",
};

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  verified: "Verified",
  estimated: "Estimated",
  approximate: "Approximate",
  unknown: "Unknown",
};

export const CONFIDENCE_TONE: Record<Confidence, string> = {
  verified: "border-success/40 text-success bg-success/5",
  estimated: "border-orbit/40 text-orbit bg-orbit/5",
  approximate: "border-artifact/40 text-artifact bg-artifact/5",
  unknown: "border-warning/40 text-warning bg-warning/5",
};

export const REGIME_LABEL: Record<string, string> = {
  LEO: "Low Earth orbit",
  MEO: "Medium Earth orbit",
  GEO: "Geostationary",
  "GEO+": "Above GEO",
  HEO: "Highly elliptical",
  unknown: "Unknown regime",
};

/** Earth radii (km) used consistently by the orbital views. */
export const EARTH_RADIUS_KM = 6371.0;
export const MOON_RADIUS_KM = 1737.4;
export const MARS_RADIUS_KM = 3389.5;
export const AU_KM = 149_597_870.7;
export const C_KM_S = 299_792.458;

export const MOON_MEAN_DISTANCE_KM = 384_400;
export const MOON_ORBITAL_PERIOD_DAYS = 27.321_661;
