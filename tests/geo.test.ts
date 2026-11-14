import { describe, expect, it } from "vitest";

import {
  angularDistanceDeg,
  clusterSurfacePoints,
  latLonToVector3,
  wrapLongitude,
} from "@/lib/geo";

describe("latLonToVector3", () => {
  it("maps (0°, 0°) to +X", () => {
    const v = latLonToVector3(0, 0, 2);
    expect(v.x).toBeCloseTo(2, 10);
    expect(v.y).toBeCloseTo(0, 10);
    expect(v.z).toBeCloseTo(0, 10);
  });

  it("maps the north pole to +Y", () => {
    const v = latLonToVector3(90, 45, 1);
    expect(v.x).toBeCloseTo(0, 10);
    expect(v.y).toBeCloseTo(1, 10);
    expect(v.z).toBeCloseTo(0, 10);
  });

  it("maps east-positive 90° to −Z", () => {
    const v = latLonToVector3(0, 90, 1);
    expect(v.x).toBeCloseTo(0, 10);
    expect(v.z).toBeCloseTo(-1, 10);
  });

  it("stays on the requested sphere", () => {
    for (const [lat, lon] of [
      [0, 0],
      [12.5, -45],
      [-89, 179],
      [45, -170],
    ]) {
      const v = latLonToVector3(lat, lon, 3);
      expect(v.length()).toBeCloseTo(3, 10);
    }
  });
});

describe("angularDistanceDeg", () => {
  it("is zero for identical points", () => {
    expect(angularDistanceDeg(10, 20, 10, 20)).toBeCloseTo(0, 10);
  });

  it("is 90° along the equator", () => {
    expect(angularDistanceDeg(0, 0, 0, 90)).toBeCloseTo(90, 8);
  });

  it("is 180° for antipodal points", () => {
    expect(angularDistanceDeg(0, 0, 0, 180)).toBeCloseTo(180, 8);
    expect(angularDistanceDeg(45, 10, -45, -170)).toBeCloseTo(180, 6);
  });

  it("matches a known great-circle distance", () => {
    // London → New York is approximately 5570 km, 50.1° of arc.
    expect(angularDistanceDeg(51.5074, -0.1278, 40.7128, -74.006)).toBeCloseTo(50.1, 0);
  });
});

describe("clusterSurfacePoints", () => {
  const points = [
    { id: "a", latitude: 0.67, longitude: 23.47 },
    { id: "b", latitude: 0.675, longitude: 23.472 },
    { id: "c", latitude: 26.13, longitude: 3.63 },
    { id: "d", latitude: -10, longitude: 100 },
  ];

  it("groups nearby points and keeps distant ones separate", () => {
    const clusters = clusterSurfacePoints(points, 0.35);
    expect(clusters).toHaveLength(3);
    const first = clusters.find((cluster) => cluster.items.some((item) => item.id === "a"));
    expect(first?.items.map((item) => item.id).sort()).toEqual(["a", "b"]);
  });

  it("ignores non-finite coordinates", () => {
    const clusters = clusterSurfacePoints(
      [...points, { id: "bad", latitude: Number.NaN, longitude: 0 }],
      0.35,
    );
    expect(clusters.flatMap((cluster) => cluster.items)).toHaveLength(4);
  });
});

describe("wrapLongitude", () => {
  it("wraps into −180..180", () => {
    expect(wrapLongitude(190)).toBeCloseTo(-170, 10);
    expect(wrapLongitude(-190)).toBeCloseTo(170, 10);
    expect(wrapLongitude(360)).toBeCloseTo(0, 10);
    expect(wrapLongitude(23.5)).toBeCloseTo(23.5, 10);
  });
});
