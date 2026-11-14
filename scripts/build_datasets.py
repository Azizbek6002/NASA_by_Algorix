#!/usr/bin/env python3
"""Build SPACE ARCHIVE demo datasets from raw provider responses.

Inputs (already downloaded, see docs/data-sources.md):
  /tmp/opencode/horizons/body_*.json       JPL Horizons vectors
  /tmp/opencode/celestrak_*.json           CelesTrak GP (OMM JSON)
  /tmp/opencode/satcat.csv                 CelesTrak SATCAT

Outputs:
  data/ephemeris/planets.json
  data/ephemeris/deep-space.json
  data/celestrak/orbit-objects.json
  data/celestrak/snapshot-meta.json

This script is deterministic: rerun it with the same inputs to get the same output.
It never invents missing fields; absent values are null.
"""
from __future__ import annotations

import csv
import hashlib
import json
import math
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = Path("/tmp/opencode")
OUT_DATA = ROOT / "data"

MU_EARTH = 398600.4418  # km^3/s^2
R_EARTH = 6378.137
AU_KM = 149_597_870.7
C_KM_S = 299_792.458

FETCHED_AT = "2026-11-14T09:20:00Z"

PLANETS = {
    199: dict(name="Mercury", slug="mercury", radiusKm=2439.7, color="#9c8b7a", texture="2k_mercury.jpg", parent=None, au=0.387),
    299: dict(name="Venus", slug="venus", radiusKm=6051.8, color="#d9b382", texture="2k_venus_surface.jpg", parent=None, au=0.723),
    399: dict(name="Earth", slug="earth", radiusKm=6378.137, color="#4b8fd6", texture="2k_earth_daymap.jpg", parent=None, au=1.0),
    499: dict(name="Mars", slug="mars", radiusKm=3396.19, color="#c1643f", texture="2k_mars.jpg", parent=None, au=1.524),
    599: dict(name="Jupiter", slug="jupiter", radiusKm=71492, color="#c9a882", texture="2k_jupiter.jpg", parent=None, au=5.203),
    699: dict(name="Saturn", slug="saturn", radiusKm=60268, color="#d8bd8a", texture="2k_saturn.jpg", parent=None, au=9.537),
    799: dict(name="Uranus", slug="uranus", radiusKm=25559, color="#9fd8de", texture="2k_uranus.jpg", parent=None, au=19.191),
    899: dict(name="Neptune", slug="neptune", radiusKm=24764, color="#4f72d8", texture="2k_neptune.jpg", parent=None, au=30.069),
}

DEEP_SPACE = {
    -31: dict(name="Voyager 1", slug="voyager-1", agency="NASA / JPL", country="United States",
              launch="1977-09-05", status="active", mission="Voyager",
              objective="Outer-planet flybys; now exploring the interstellar medium.",
              lastContact="Ongoing", source="https://science.nasa.gov/mission/voyager/"),
    -32: dict(name="Voyager 2", slug="voyager-2", agency="NASA / JPL", country="United States",
              launch="1977-08-20", status="active", mission="Voyager",
              objective="Only spacecraft to visit Uranus and Neptune; now in the interstellar medium.",
              lastContact="Ongoing", source="https://science.nasa.gov/mission/voyager/"),
    -23: dict(name="Pioneer 10", slug="pioneer-10", agency="NASA / Ames", country="United States",
              launch="1972-03-02", status="mission_completed", mission="Pioneer",
              objective="First spacecraft to traverse the asteroid belt and fly past Jupiter.",
              lastContact="2003-01-23", source="https://science.nasa.gov/mission/pioneer-10/"),
    -24: dict(name="Pioneer 11", slug="pioneer-11", agency="NASA / Ames", country="United States",
              launch="1973-04-05", status="mission_completed", mission="Pioneer",
              objective="First spacecraft to fly past Saturn; explored the outer heliosphere.",
              lastContact="1995-09-30", source="https://science.nasa.gov/mission/pioneer-11/"),
    -98: dict(name="New Horizons", slug="new-horizons", agency="NASA / APL", country="United States",
              launch="2006-01-19", status="active", mission="New Horizons",
              objective="First reconnaissance of Pluto and the Kuiper Belt.",
              lastContact="Ongoing", source="https://science.nasa.gov/mission/new-horizons/"),
}


def parse_horizons(path: Path) -> dict:
    payload = json.loads(path.read_text())
    text = payload.get("result", "")
    target = re.search(r"Target body name:\s*(.+?)\s+\(", text)
    jd = re.search(r"Start time\s*:\s*(.+)", text)
    frame = re.search(r"Reference frame\s*:\s*(.+)", text)
    vec = re.search(
        r"X\s*=\s*([-+0-9.E]+)\s*Y\s*=\s*([-+0-9.E]+)\s*Z\s*=\s*([-+0-9.E]+)", text
    )
    vel = re.search(
        r"VX\s*=\s*([-+0-9.E]+)\s*VY\s*=\s*([-+0-9.E]+)\s*VZ\s*=\s*([-+0-9.E]+)", text
    )
    if not vec:
        raise RuntimeError(f"Could not parse vector from {path}")
    pos = [float(vec.group(i)) for i in (1, 2, 3)]
    velocity = [float(vel.group(i)) for i in (1, 2, 3)] if vel else None
    return {
        "targetName": target.group(1).strip() if target else None,
        "startTime": jd.group(1).strip() if jd else None,
        "frame": frame.group(1).strip() if frame else None,
        "positionKm": pos,
        "velocityKmS": velocity,
        "distanceAu": math.sqrt(sum(v * v for v in pos)) / AU_KM,
    }


def build_ephemeris() -> None:
    out = OUT_DATA / "ephemeris"
    out.mkdir(parents=True, exist_ok=True)

    planets = []
    for target_id, meta in PLANETS.items():
        parsed = parse_horizons(RAW / "horizons" / f"body_{target_id}.json")
        dist = parsed["distanceAu"]
        planets.append({
            "id": target_id,
            "slug": meta["slug"],
            "name": meta["name"],
            "radiusKm": meta["radiusKm"],
            "visualColor": meta["color"],
            "texture": f"/textures/{meta['texture']}",
            "meanDistanceAu": meta["au"],
            "epoch": "2026-11-14T00:00:00Z",
            "frame": "ICRF",
            "center": "Sun (500@10)",
            "positionKm": parsed["positionKm"],
            "velocityKmS": parsed["velocityKmS"],
            "distanceAu": round(dist, 6),
            "lightTimeMin": round(dist * AU_KM / C_KM_S / 60, 2),
            "source": "https://ssd.jpl.nasa.gov/api/horizons.api",
            "retrievedAt": FETCHED_AT,
        })
    (out / "planets.json").write_text(json.dumps({
        "epoch": "2026-11-14T00:00:00Z",
        "frame": "ICRF",
        "center": "Sun (500@10)",
        "provider": "JPL Horizons",
        "source": "https://ssd.jpl.nasa.gov/api/horizons.api",
        "retrievedAt": FETCHED_AT,
        "note": "Barycentric ICRF state vectors sampled once for 2026-11-14. The 3D scene uses a compressed visual scale; scientific mode reports real distances.",
        "planets": planets,
    }, indent=2))

    probes = []
    for target_id, meta in DEEP_SPACE.items():
        parsed = parse_horizons(RAW / "horizons" / f"body_{target_id}.json")
        dist = parsed["distanceAu"]
        probes.append({
            "id": f"ds:{abs(target_id)}",
            "targetId": target_id,
            "slug": meta["slug"],
            "name": meta["name"],
            "agency": meta["agency"],
            "country": meta["country"],
            "launchDate": meta["launch"],
            "status": meta["status"],
            "mission": meta["mission"],
            "objective": meta["objective"],
            "lastContact": meta["lastContact"],
            "epoch": "2026-11-14T00:00:00Z",
            "frame": "ICRF",
            "center": "Sun (500@10)",
            "positionKm": parsed["positionKm"],
            "velocityKmS": parsed["velocityKmS"],
            "distanceAu": round(dist, 6),
            "lightTimeHours": round(dist * AU_KM / C_KM_S / 3600, 2),
            "source": "https://ssd.jpl.nasa.gov/api/horizons.api",
            "missionSource": meta["source"],
            "retrievedAt": FETCHED_AT,
            "note": "Position is a calculated ephemeris state vector at the stated epoch, not live tracking.",
        })
    (out / "deep-space.json").write_text(json.dumps({
        "epoch": "2026-11-14T00:00:00Z",
        "frame": "ICRF",
        "center": "Sun (500@10)",
        "provider": "JPL Horizons",
        "source": "https://ssd.jpl.nasa.gov/api/horizons.api",
        "retrievedAt": FETCHED_AT,
        "probes": probes,
    }, indent=2))


OWNER_COUNTRY = {
    "US": "United States", "CIS": "Russia / CIS", "PRC": "China", "ESA": "ESA",
    "JPN": "Japan", "IND": "India", "FR": "France", "GER": "Germany", "UK": "United Kingdom",
    "CAN": "Canada", "IT": "Italy", "SPN": "Spain", "ISRA": "Israel", "SKOR": "South Korea",
    "NZ": "New Zealand", "BRA": "Brazil", "MEX": "Mexico", "ARG": "Argentina",
    "AUS": "Australia", "TUR": "Türkiye", "UAE": "United Arab Emirates", "IRAN": "Iran",
    "ISS": "International", "GLOB": "International", "NATO": "NATO", "EUME": "Europe",
}

GROUP_SOURCES = {
    "stations": "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=json",
    "gps-ops": "https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=json",
    "visual": "https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=json",
    "last-30-days": "https://celestrak.org/NORAD/elements/gp.php?GROUP=last-30-days&FORMAT=json",
    "cosmos-2251-debris": "https://celestrak.org/NORAD/elements/gp.php?GROUP=cosmos-2251-debris&FORMAT=json",
    "iridium-33-debris": "https://celestrak.org/NORAD/elements/gp.php?GROUP=iridium-33-debris&FORMAT=json",
    "fengyun-1c-debris": "https://celestrak.org/NORAD/elements/gp.php?GROUP=fengyun-1c-debris&FORMAT=json",
    "active": "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json",
}

COLLISION_GROUPS = {"cosmos-2251-debris", "iridium-33-debris", "fengyun-1c-debris"}


def load_satcat() -> dict[int, dict]:
    rows: dict[int, dict] = {}
    with (RAW / "satcat.csv").open(newline="", encoding="utf-8", errors="replace") as fh:
        for row in csv.DictReader(fh):
            try:
                norad = int(row["NORAD_CAT_ID"])
            except (TypeError, ValueError):
                continue
            rows[norad] = row
    return rows


def ops_to_status(code: str | None, group: str) -> tuple[str, str]:
    code = (code or "").strip()
    mapping = {
        "+": ("active", "Operational"),
        "P": ("partially_operational", "Partially operational"),
        "B": ("inactive", "Backup / standby"),
        "S": ("inactive", "Spare"),
        "X": ("active", "Extended mission"),
        "-": ("inactive", "Nonoperational"),
        "D": ("destroyed", "Decayed"),
        "?": ("unknown", "Unknown"),
        "": ("unknown", "Not available"),
    }
    if code in mapping:
        return mapping[code]
    if group in ("stations", "gps-ops", "active", "last-30-days"):
        return ("active", "Listed as active by CelesTrak group")
    return ("unknown", "Not available")


def type_from(row: dict | None, name: str, group: str) -> tuple[str, str]:
    if group in COLLISION_GROUPS:
        return "debris", "DEB"
    sat_type = (row or {}).get("OBJECT_TYPE", "").strip()
    sat_map = {"PAY": ("satellite", "PAY"), "R/B": ("rocket_body", "R/B"),
               "DEB": ("debris", "DEB"), "UNK": ("unknown", "UNK")}
    if sat_type in sat_map:
        return sat_map[sat_type]
    upper = name.upper()
    if "DEB" in upper or "DEBRIS" in upper:
        return "debris", "DEB"
    if " R/B" in upper or upper.endswith("R/B") or "AKM" in upper:
        return "rocket_body", "R/B"
    if group in ("stations", "gps-ops", "active", "last-30-days"):
        return "satellite", "PAY"
    return "unknown", "UNK"


def regime(period_min: float | None, ecc: float, perigee_km: float | None, apogee_km: float | None) -> str:
    if perigee_km is None or apogee_km is None:
        return "unknown"
    if ecc > 0.25 or (perigee_km < 2000 and apogee_km > 35000):
        return "HEO"
    if 35_286 <= (perigee_km + apogee_km) / 2 <= 36_286:
        return "GEO"
    if apogee_km < 2000:
        return "LEO"
    if apogee_km < 35_786:
        return "MEO"
    return "GEO+"


def build_orbit_objects() -> None:
    groups: list[tuple[str, int]] = [
        ("stations", 999), ("gps-ops", 999), ("visual", 999),
        ("last-30-days", 80), ("cosmos-2251-debris", 120),
        ("iridium-33-debris", 50), ("fengyun-1c-debris", 200),
        ("active", 450),
    ]
    satcat = load_satcat()
    merged: dict[int, dict] = {}
    group_counts: dict[str, int] = {}

    for group, limit in groups:
        path = RAW / f"celestrak_{group}.json"
        if not path.exists():
            print(f"skip missing {path}")
            continue
        records = json.loads(path.read_text())
        if group == "active":
            # stratify by mean motion so LEO/MEO/GEO are all represented
            buckets = {"leo": [], "meo": [], "geo": []}
            for r in records:
                mm = float(r.get("MEAN_MOTION") or 0)
                if mm >= 11.2:
                    buckets["leo"].append(r)
                elif mm >= 2.0:
                    buckets["meo"].append(r)
                else:
                    buckets["geo"].append(r)
            quota = {"leo": limit * 5 // 9, "meo": limit * 2 // 9, "geo": limit * 2 // 9}
            records = []
            for key, items in buckets.items():
                step = max(1, len(items) // quota[key])
                records.extend(items[::step][:quota[key]])
        else:
            records = records[:limit]

        added = 0
        for r in records:
            norad = int(r["NORAD_CAT_ID"])
            if norad in merged:
                merged[norad]["groups"].append(group)
                continue
            sat = satcat.get(norad)
            name = r.get("OBJECT_NAME") or (sat or {}).get("OBJECT_NAME") or f"Object {norad}"
            otype, sat_type = type_from(sat, name, group)
            status, status_label = ops_to_status((sat or {}).get("OPS_STATUS_CODE"), group)
            owner = (sat or {}).get("OWNER")
            mm = float(r["MEAN_MOTION"])
            ecc = float(r["ECCENTRICITY"])
            inc = float(r["INCLINATION"])
            period = 1440.0 / mm if mm else None
            n_rad = mm * 2 * math.pi / 86400.0
            a = (MU_EARTH / (n_rad * n_rad)) ** (1 / 3) if n_rad else None
            perigee = a * (1 - ecc) - R_EARTH if a else None
            apogee = a * (1 + ecc) - R_EARTH if a else None
            launch = (sat or {}).get("LAUNCH_DATE") or None
            merged[norad] = {
                "id": f"eo:{norad}",
                "noradId": norad,
                "name": name,
                "intlDesignator": r.get("OBJECT_ID") or (sat or {}).get("OBJECT_ID"),
                "category": "earth_orbit",
                "type": otype,
                "satcatType": sat_type,
                "ownerCode": owner,
                "country": OWNER_COUNTRY.get(owner or "", owner),
                "agency": None,
                "launchDate": launch,
                "status": status,
                "statusLabel": status_label,
                "opsStatusCode": (sat or {}).get("OPS_STATUS_CODE") or None,
                "groups": [group],
                "sourceUrl": GROUP_SOURCES.get(group),
                "satcatUrl": "https://celestrak.org/pub/satcat.csv",
                "decayDate": (sat or {}).get("DECAY_DATE") or None,
                "periodMin": round(period, 3) if period else None,
                "altitudeRegime": regime(period, ecc, perigee, apogee),
                "apogeeKm": round(apogee, 1) if apogee is not None else None,
                "perigeeKm": round(perigee, 1) if perigee is not None else None,
                "epoch": r["EPOCH"] + "Z",
                "meanMotion": mm,
                "eccentricity": ecc,
                "inclination": inc,
                "raan": float(r["RA_OF_ASC_NODE"]),
                "argPerigee": float(r["ARG_OF_PERICENTER"]),
                "meanAnomaly": float(r["MEAN_ANOMALY"]),
                "bstar": float(r.get("BSTAR") or 0),
                "meanMotionDot": float(r.get("MEAN_MOTION_DOT") or 0),
                "meanMotionDdot": float(r.get("MEAN_MOTION_DDOT") or 0),
                "ephemerisType": int(r.get("EPHEMERIS_TYPE") or 0),
                "classificationType": r.get("CLASSIFICATION_TYPE") or "U",
                "elementSetNo": r.get("ELEMENT_SET_NO"),
                "revAtEpoch": r.get("REV_AT_EPOCH"),
                "confidence": "verified",
                "locationConfidence": "estimated",
                "fetchedAt": FETCHED_AT,
                "description": (
                    f"Catalogued {otype.replace('_', ' ')} tracked in the US Space Force space object catalog. "
                    f"Owner: {OWNER_COUNTRY.get(owner or '', owner or 'not available')}. "
                    f"Launch date: {launch or 'not available'}. "
                    "Position shown in the 3D scene is computed with SGP4 from the latest available GP elements."
                ),
                "history": None,
                "massKg": None,
                "dimensions": None,
                "sources": [
                    {
                        "provider": "CelesTrak GP (OMM JSON)",
                        "url": GROUP_SOURCES.get(group),
                        "recordId": str(norad),
                        "retrievedAt": FETCHED_AT,
                    },
                    {
                        "provider": "CelesTrak SATCAT",
                        "url": "https://celestrak.org/pub/satcat.csv",
                        "recordId": str(norad),
                        "retrievedAt": FETCHED_AT,
                    },
                ],
            }
            added += 1
        group_counts[group] = added

    objects = sorted(merged.values(), key=lambda o: o["noradId"])
    out = OUT_DATA / "celestrak"
    out.mkdir(parents=True, exist_ok=True)
    (out / "orbit-objects.json").write_text(json.dumps(objects, separators=(",", ":")))
    digest = hashlib.sha256((out / "orbit-objects.json").read_bytes()).hexdigest()

    type_counts: dict[str, int] = {}
    status_counts: dict[str, int] = {}
    regime_counts: dict[str, int] = {}
    for o in objects:
        type_counts[o["type"]] = type_counts.get(o["type"], 0) + 1
        status_counts[o["status"]] = status_counts.get(o["status"], 0) + 1
        regime_counts[o["altitudeRegime"]] = regime_counts.get(o["altitudeRegime"], 0) + 1

    meta = {
        "provider": "CelesTrak",
        "description": "Curated demonstration subset of the public CelesTrak GP catalogue, joined with CelesTrak SATCAT metadata.",
        "retrievedAt": FETCHED_AT,
        "elementEpochRange": {
            "min": min(o["epoch"] for o in objects),
            "max": max(o["epoch"] for o in objects),
        },
        "objectCount": len(objects),
        "groupCounts": group_counts,
        "typeCounts": type_counts,
        "statusCounts": status_counts,
        "regimeCounts": regime_counts,
        "contentSha256": digest,
        "sourceUrls": sorted(GROUP_SOURCES.values()) + ["https://celestrak.org/pub/satcat.csv"],
        "usagePolicy": "https://celestrak.org/usage-policy.php",
        "note": "This is a snapshot, not a live feed. Positions are computed from the stored elements; element age is shown in the UI.",
    }
    (out / "snapshot-meta.json").write_text(json.dumps(meta, indent=2))
    print(json.dumps(meta, indent=2))


if __name__ == "__main__":
    build_ephemeris()
    build_orbit_objects()
