import {
  eciToEcf,
  eciToGeodetic,
  gstime,
  json2satrec,
  propagate,
  type EciVec3,
  type SatRec,
} from "satellite.js";

import { EARTH_RADIUS_KM } from "@/lib/constants";


/**
 * SGP4 propagation helpers.
 *
 * Coordinate story:
 *  - CelesTrak OMM elements are mean elements in TEME.
 *  - satellite.js propagates them to TEME, which we treat as ECI for the
 *    precision this atlas needs (sub-kilometre differences over hours).
 *  - The 3D Earth view works in Earth-fixed (ECEF) coordinates, so the Earth
 *    mesh can stay still while everything else moves over it.
 *  - Scene units are Earth radii. The numbers shown in the inspector are
 *    always real kilometres; only the rendering is scaled.
 */

export interface Vector3Km {
  x: number;
  y: number;
  z: number;
}

export interface GeodeticPoint {
  latitude: number;
  longitude: number;
  heightKm: number;
}

const RAD_TO_DEG = 180 / Math.PI;

const satrecCache = new Map<number, SatRec>();

/** Structural subset shared by the full record and the browser-side lite payload. */
export interface SatrecSource {
  noradId: number;
  name: string;
  intlDesignator: string | null;
  epoch: string;
  meanMotion: number;
  eccentricity: number;
  inclination: number;
  raan: number;
  argPerigee: number;
  meanAnomaly: number;
  ephemerisType: number;
  classificationType: string;
  elementSetNo: number | null;
  revAtEpoch: number | null;
  bstar: number;
  meanMotionDot: number;
  meanMotionDdot: number;
}

/**
 * Convert a stored OMM record into an SGP4 record.
 * `json2satrec` expects the raw CelesTrak key names, so we map back.
 */
export function toSatrec(object: SatrecSource): SatRec | null {
  const cached = satrecCache.get(object.noradId);
  if (cached) return cached;

  try {
    const satrec = json2satrec({
      OBJECT_NAME: object.name,
      OBJECT_ID: object.intlDesignator ?? "",
      EPOCH: object.epoch.replace(/Z$/, ""),
      MEAN_MOTION: object.meanMotion,
      ECCENTRICITY: object.eccentricity,
      INCLINATION: object.inclination,
      RA_OF_ASC_NODE: object.raan,
      ARG_OF_PERICENTER: object.argPerigee,
      MEAN_ANOMALY: object.meanAnomaly,
      EPHEMERIS_TYPE: object.ephemerisType,
      CLASSIFICATION_TYPE: object.classificationType,
      NORAD_CAT_ID: object.noradId,
      ELEMENT_SET_NO: object.elementSetNo ?? 999,
      REV_AT_EPOCH: object.revAtEpoch ?? 0,
      BSTAR: object.bstar,
      MEAN_MOTION_DOT: object.meanMotionDot,
      MEAN_MOTION_DDOT: object.meanMotionDdot,
    } as unknown as Parameters<typeof json2satrec>[0]);

    if (!satrec || satrec.error !== 0) return null;
    satrecCache.set(object.noradId, satrec);
    return satrec;
  } catch {
    return null;
  }
}

export function orbitalPeriodMinutes(object: { meanMotion: number }): number {
  if (!object.meanMotion) return 0;
  return 1440 / object.meanMotion;
}

/** Mean semi-major axis in km, derived from the mean motion. */
export function semiMajorAxisKm(object: { meanMotion: number }): number {
  const mu = 398600.4418;
  const n = (object.meanMotion * 2 * Math.PI) / 86400;
  if (!n) return EARTH_RADIUS_KM;
  return Math.cbrt(mu / (n * n));
}

export function propagateEciKm(satrec: SatRec, date: Date): Vector3Km | null {
  const result = propagate(satrec, date);
  if (!result || !result.position || typeof result.position === "boolean") return null;
  const position = result.position as EciVec3<number>;
  if (!Number.isFinite(position.x)) return null;
  return { x: position.x, y: position.y, z: position.z };
}

/**
 * Propagate many objects at one instant and write Earth-fixed positions
 * (in scene units, 1 = Earth radius) into a flat Float32Array.
 * Returns the number of objects that produced a valid position.
 */
export function propagateManyEcefScaled(
  satrecs: (SatRec | null)[],
  date: Date,
  out: Float32Array,
): number {
  const gmst = gstime(date);
  let valid = 0;
  for (let i = 0; i < satrecs.length; i += 1) {
    const satrec = satrecs[i];
    const offset = i * 3;
    if (!satrec) {
      out[offset] = 0;
      out[offset + 1] = 0;
      out[offset + 2] = 0;
      continue;
    }
    const eci = propagateEciKm(satrec, date);
    if (!eci) {
      out[offset] = 0;
      out[offset + 1] = 0;
      out[offset + 2] = 0;
      continue;
    }
    const ecf = eciToEcf(eci, gmst);
    out[offset] = ecf.x / EARTH_RADIUS_KM;
    out[offset + 1] = ecf.z / EARTH_RADIUS_KM; // three.js: Y is up
    out[offset + 2] = -ecf.y / EARTH_RADIUS_KM;
    valid += 1;
  }
  return valid;
}

export function propagateGeodetic(satrec: SatRec, date: Date): GeodeticPoint | null {
  const eci = propagateEciKm(satrec, date);
  if (!eci) return null;
  const gmst = gstime(date);
  const geodetic = eciToGeodetic(eci as EciVec3<number>, gmst);
  return {
    latitude: geodetic.latitude * RAD_TO_DEG,
    longitude: geodetic.longitude * RAD_TO_DEG,
    heightKm: geodetic.height,
  };
}

/**
 * Sample one full orbit for the selected object, in Earth-fixed scene units.
 * Sampling a full period from the current time keeps the ground track honest
 * for the epoch while still showing the shape of the orbit.
 */
export function buildOrbitPath(
  object: SatrecSource,
  date: Date,
  samples = 180,
): [number, number, number][] {
  const satrec = toSatrec(object);
  if (!satrec) return [];

  const periodMs = orbitalPeriodMinutes(object) * 60_000;
  const points: [number, number, number][] = [];

  for (let i = 0; i <= samples; i += 1) {
    const t = new Date(date.getTime() + (periodMs * i) / samples);
    const eci = propagateEciKm(satrec, t);
    if (!eci) continue;
    const gmst = gstime(t);
    const ecf = eciToEcf(eci, gmst);
    points.push([
      ecf.x / EARTH_RADIUS_KM,
      ecf.z / EARTH_RADIUS_KM,
      -ecf.y / EARTH_RADIUS_KM,
    ]);
  }

  return points;
}

export type OrbitalAccuracy = "fresh" | "acceptable" | "degraded" | "unknown";

/**
 * SGP4 accuracy decays with element age. This is a coarse, honest label:
 *  < 1 day   fresh (tens of metres to a few hundred metres typical)
 *  < 7 days  acceptable (kilometre-class)
 *  older     degraded (position may be far from the real object)
 */
export function elementAgeHours(epochIso: string, at: Date): number {
  const epoch = new Date(epochIso).getTime();
  if (Number.isNaN(epoch)) return Number.NaN;
  return (at.getTime() - epoch) / 3_600_000;
}

export function accuracyFromAge(ageHours: number): OrbitalAccuracy {
  if (!Number.isFinite(ageHours)) return "unknown";
  if (ageHours <= 24) return "fresh";
  if (ageHours <= 24 * 7) return "acceptable";
  return "degraded";
}

export const ACCURACY_COPY: Record<OrbitalAccuracy, string> = {
  fresh: "Element set is under a day old. Position is representative of the current orbit.",
  acceptable: "Element set is under a week old. Position is kilometre-class at best.",
  degraded: "Element set is older than a week. Position may be far from the real object.",
  unknown: "Element age could not be determined.",
};
