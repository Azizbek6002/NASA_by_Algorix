import { describe, expect, it } from "vitest";

import {
  EMPTY_ORBIT_FILTERS,
  filterOrbitObjects,
  filterSurfaceArtifacts,
  searchEntries,
  uniqueSorted,
} from "@/lib/filters";
import { getAllEntries, lunarArtifacts, marsArtifacts, orbitObjects } from "@/lib/data";

describe("filterOrbitObjects", () => {
  it("returns everything with empty filters", () => {
    expect(filterOrbitObjects(orbitObjects, EMPTY_ORBIT_FILTERS)).toHaveLength(
      orbitObjects.length,
    );
  });

  it("filters by object type", () => {
    const debris = filterOrbitObjects(orbitObjects, {
      ...EMPTY_ORBIT_FILTERS,
      types: ["debris"],
    });
    expect(debris.length).toBeGreaterThan(0);
    expect(debris.every((object) => object.type === "debris")).toBe(true);
  });

  it("filters by regime", () => {
    const geo = filterOrbitObjects(orbitObjects, {
      ...EMPTY_ORBIT_FILTERS,
      regimes: ["GEO"],
    });
    expect(geo.length).toBeGreaterThan(0);
    expect(geo.every((object) => object.altitudeRegime === "GEO")).toBe(true);
  });

  it("filters by status", () => {
    const active = filterOrbitObjects(orbitObjects, {
      ...EMPTY_ORBIT_FILTERS,
      statuses: ["active"],
    });
    expect(active.length).toBeGreaterThan(0);
    expect(active.every((object) => object.status === "active")).toBe(true);
  });

  it("combines query and type filters", () => {
    const result = filterOrbitObjects(orbitObjects, {
      ...EMPTY_ORBIT_FILTERS,
      types: ["satellite"],
      query: "starlink",
    });
    expect(result.every((object) => object.type === "satellite")).toBe(true);
    expect(result.every((object) => object.name.toLowerCase().includes("starlink"))).toBe(
      true,
    );
  });

  it("matches NORAD ids as text", () => {
    const target = orbitObjects[0];
    const result = filterOrbitObjects(orbitObjects, {
      ...EMPTY_ORBIT_FILTERS,
      query: String(target.noradId),
    });
    expect(result.some((object) => object.id === target.id)).toBe(true);
  });

  it("returns nothing for an unmatched query", () => {
    const result = filterOrbitObjects(orbitObjects, {
      ...EMPTY_ORBIT_FILTERS,
      query: "zzzzzz-not-a-satellite",
    });
    expect(result).toHaveLength(0);
  });
});

describe("filterSurfaceArtifacts", () => {
  const all = [...lunarArtifacts, ...marsArtifacts];

  it("separates located and unknown records", () => {
    const located = filterSurfaceArtifacts(all, { locatedOnly: true });
    const unknown = filterSurfaceArtifacts(all, { unknownOnly: true });
    expect(located.length + unknown.length).toBe(all.length);
    expect(unknown.length).toBeGreaterThan(0);
    expect(
      unknown.every((artifact) => artifact.location.status === "unknown_location"),
    ).toBe(true);
  });

  it("filters by mission", () => {
    const apollo11 = filterSurfaceArtifacts(all, { missions: ["Apollo 11"] });
    expect(apollo11.length).toBeGreaterThan(0);
    expect(apollo11.every((artifact) => artifact.mission === "Apollo 11")).toBe(true);
  });

  it("filters by agency and type together", () => {
    const result = filterSurfaceArtifacts(all, {
      agencies: ["NASA"],
      types: ["rover"],
    });
    expect(result.every((artifact) => artifact.agency === "NASA")).toBe(true);
    expect(result.every((artifact) => artifact.type === "rover")).toBe(true);
  });

  it("does not invent located records", () => {
    for (const artifact of filterSurfaceArtifacts(all, { locatedOnly: true })) {
      expect(artifact.location.latitude).not.toBeNull();
      expect(artifact.location.longitude).not.toBeNull();
    }
  });
});

describe("searchEntries", () => {
  const entries = getAllEntries();

  it("ranks exact and prefix matches first", () => {
    const results = searchEntries(entries, "perseverance", 10);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name.toLowerCase()).toContain("perseverance");
  });

  it("matches by id", () => {
    const target = entries.find((entry) => entry.id === "mars:perseverance");
    expect(target).toBeDefined();
    const results = searchEntries(entries, "mars:perseverance", 5);
    expect(results.some((entry) => entry.id === target!.id)).toBe(true);
  });

  it("returns nothing for an empty query", () => {
    expect(searchEntries(entries, "", 10)).toHaveLength(0);
  });

  it("honours the result limit", () => {
    const results = searchEntries(entries, "a", 10);
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(10);
  });
});

describe("uniqueSorted", () => {
  it("deduplicates, drops nulls and sorts", () => {
    expect(uniqueSorted(["b", null, "a", "b", undefined, "c"])).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});
