import { describe, expect, it } from "vitest";

import {
  displayName,
  formatAltitude,
  formatAu,
  formatDate,
  formatDecimal,
  formatDuration,
  formatInt,
  formatKm,
  formatLatLon,
  formatLightTime,
  formatTimestamp,
  pluralize,
} from "@/lib/format";

describe("number formatting", () => {
  it("formats integers with separators", () => {
    expect(formatInt(1075)).toBe("1,075");
    expect(formatInt(0)).toBe("0");
    expect(formatInt(null)).toBe("—");
    expect(formatInt(Number.NaN)).toBe("—");
  });

  it("formats decimals and unknown values", () => {
    expect(formatDecimal(1.2345, 2)).toBe("1.23");
    expect(formatDecimal(null)).toBe("—");
  });

  it("formats kilometres", () => {
    expect(formatKm(418)).toBe("418 km");
    expect(formatKm(1_500_000)).toBe("1.50 million km");
    expect(formatKm(null)).toBe("UNKNOWN");
  });

  it("formats astronomical units", () => {
    expect(formatAu(0.0001)).toBe("0.00010 AU");
    expect(formatAu(1.2345)).toBe("1.234 AU");
    expect(formatAu(172.346)).toBe("172.35 AU");
    expect(formatAu(null)).toBe("UNKNOWN");
  });

  it("formats one-way light time", () => {
    expect(formatLightTime(0.5)).toBe("30.0 min one-way");
    expect(formatLightTime(23.89)).toBe("23.9 h one-way");
    expect(formatLightTime(48)).toBe("2.0 days one-way");
    expect(formatLightTime(172)).toBe("7.2 days one-way");
    expect(formatLightTime(null)).toBe("UNKNOWN");
  });

  it("formats altitude ranges", () => {
    expect(formatAltitude(400, 410)).toBe("400 km");
    expect(formatAltitude(300, 500)).toBe("300–500 km");
    expect(formatAltitude(null, null)).toBe("UNKNOWN");
    expect(formatAltitude(500, null)).toBe("500 km");
  });
});

describe("date formatting", () => {
  it("formats a UTC date deterministically", () => {
    expect(formatDate("2026-11-14T00:00:00Z")).toBe("14 Nov 2026");
    expect(formatDate("1969-07-20T20:17:00Z")).toBe("20 Jul 1969");
    expect(formatDate(null)).toBe("UNKNOWN");
  });

  it("formats a UTC timestamp with minutes", () => {
    expect(formatTimestamp("2026-11-14T09:20:31Z")).toBe("2026-11-14 09:20 UTC");
    expect(formatTimestamp(null)).toBe("UNKNOWN");
  });

  it("formats durations", () => {
    expect(formatDuration(90 * 60_000)).toBe("1.5 h");
    expect(formatDuration(2 * 86_400_000)).toBe("2.0 days");
    expect(formatDuration(400 * 86_400_000)).toBe("1.1 years");
  });
});

describe("coordinates", () => {
  it("renders east-positive coordinates", () => {
    expect(formatLatLon(0.67408, 23.47297)).toBe("0.6741° N  23.4730° E");
  });

  it("renders west and south correctly", () => {
    expect(formatLatLon(22.483, -47.94)).toBe("22.4830° N  47.9400° W");
    expect(formatLatLon(-77.5, 165.4)).toBe("77.5000° S  165.4000° E");
  });

  it("normalises longitude into −180..180 for display", () => {
    expect(formatLatLon(10, 190)).toBe("10.0000° N  170.0000° W");
    expect(formatLatLon(10, -190)).toBe("10.0000° N  170.0000° E");
  });

  it("never invents a coordinate", () => {
    expect(formatLatLon(null, 10)).toBe("UNKNOWN LOCATION");
    expect(formatLatLon(10, null)).toBe("UNKNOWN LOCATION");
  });
});

describe("text helpers", () => {
  it("title-cases catalogue names", () => {
    expect(displayName("ISS (ZARYA)")).toBe("ISS (Zarya)");
    expect(displayName("GPS BIIR-2 (PRN 13)")).toBe("GPS BIIR-2 (PRN 13)");
    expect(displayName("Starlink-1234")).toBe("Starlink-1234");
  });

  it("pluralises counts", () => {
    expect(pluralize(1, "object")).toBe("1 object");
    expect(pluralize(2, "object")).toBe("2 objects");
    expect(pluralize(0, "artefact", "artefacts")).toBe("0 artefacts");
  });
});
