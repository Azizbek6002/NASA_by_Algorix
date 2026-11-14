import { describe, expect, it } from "vitest";

import { EARTH_RADIUS_KM } from "@/lib/constants";
import { orbitObjects } from "@/lib/data";
import { toOrbitLite } from "@/lib/client-data";
import {
  accuracyFromAge,
  buildOrbitPath,
  elementAgeHours,
  propagateEciKm,
  propagateManyEcefScaled,
  semiMajorAxisKm,
  toSatrec,
} from "@/lib/orbital";

const sample = orbitObjects.find(
  (object) =>
    object.type === "satellite" &&
    object.altitudeRegime === "LEO" &&
    object.perigeeKm !== null &&
    object.apogeeKm !== null,
);

describe("dataset sanity", () => {
  it("contains the curated Earth-orbit subset", () => {
    expect(orbitObjects.length).toBeGreaterThan(900);
    expect(orbitObjects.every((object) => object.category === "earth_orbit")).toBe(true);
  });

  it("has a citable source and epoch on every record", () => {
    for (const object of orbitObjects) {
      expect(object.epoch).toMatch(/Z$/);
      expect(Number.isFinite(object.meanMotion)).toBe(true);
      expect(object.sources.length).toBeGreaterThan(0);
    }
  });

  it("has no invalid orbital regime labels", () => {
    for (const object of orbitObjects) {
      expect(["LEO", "MEO", "GEO", "GEO+", "HEO", "unknown"]).toContain(
        object.altitudeRegime,
      );
    }
  });
});

describe("SGP4 helpers", () => {
  it("builds a satrec from the stored OMM fields", () => {
    expect(sample).toBeDefined();
    const satrec = toSatrec(sample!);
    expect(satrec).not.toBeNull();
    expect(satrec?.error).toBe(0);
  });

  it("caches the satrec per NORAD id", () => {
    const first = toSatrec(sample!);
    const second = toSatrec(sample!);
    expect(first).toBe(second);
  });

  it("accepts the trimmed client payload", () => {
    const lite = toOrbitLite(sample!);
    const satrec = toSatrec(lite);
    expect(satrec).not.toBeNull();
  });

  it("propagates to a finite position inside the orbit envelope", () => {
    const satrec = toSatrec(sample!);
    expect(satrec).not.toBeNull();
    const position = propagateEciKm(satrec!, new Date(sample!.epoch));
    expect(position).not.toBeNull();
    const radius = Math.hypot(position!.x, position!.y, position!.z);
    const lower = EARTH_RADIUS_KM + (sample!.perigeeKm ?? 0) - 60;
    const upper = EARTH_RADIUS_KM + (sample!.apogeeKm ?? 0) + 60;
    expect(radius).toBeGreaterThan(lower);
    expect(radius).toBeLessThan(upper);
  });

  it("derives a plausible semi-major axis from mean motion", () => {
    const a = semiMajorAxisKm(sample!);
    expect(a).toBeGreaterThan(EARTH_RADIUS_KM);
    expect(a).toBeLessThan(60_000);
  });

  it("samples a closed-looking orbit path", () => {
    const points = buildOrbitPath(sample!, new Date(sample!.epoch), 120);
    expect(points.length).toBeGreaterThan(100);
    const [x, y, z] = points[0];
    expect(Number.isFinite(x + y + z)).toBe(true);
    const first = points[0];
    const last = points[points.length - 1];
    const gap = Math.hypot(first[0] - last[0], first[1] - last[1], first[2] - last[2]);
    expect(gap).toBeLessThan(0.8);
  });

  it("fills an ECEF buffer in scene units", () => {
    const satrecs = [toSatrec(sample!), null];
    const out = new Float32Array(6);
    const valid = propagateManyEcefScaled(satrecs, new Date(sample!.epoch), out);
    expect(valid).toBe(1);
    expect(Number.isFinite(out[0] + out[1] + out[2])).toBe(true);
    expect(Math.hypot(out[3], out[4], out[5])).toBe(0);
    expect(Math.hypot(out[0], out[1], out[2])).toBeGreaterThan(1);
  });
});

describe("element age", () => {
  it("computes age in hours", () => {
    const epoch = "2026-11-14T00:00:00Z";
    expect(elementAgeHours(epoch, new Date("2026-11-14T12:00:00Z"))).toBeCloseTo(12, 6);
    expect(Number.isNaN(elementAgeHours("not a date", new Date()))).toBe(true);
  });

  it("labels accuracy bands", () => {
    expect(accuracyFromAge(1)).toBe("fresh");
    expect(accuracyFromAge(24)).toBe("fresh");
    expect(accuracyFromAge(48)).toBe("acceptable");
    expect(accuracyFromAge(24 * 7)).toBe("acceptable");
    expect(accuracyFromAge(24 * 30)).toBe("degraded");
    expect(accuracyFromAge(Number.NaN)).toBe("unknown");
  });
});
