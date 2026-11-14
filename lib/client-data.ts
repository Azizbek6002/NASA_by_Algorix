import type {
  EarthOrbitObject,
  OrbitObjectLite,
  SurfaceArtifact,
  SurfacePointLite,
} from "@/lib/types";

/** Trim an Earth-orbit record down to the fields the browser needs for SGP4. */
export function toOrbitLite(object: EarthOrbitObject): OrbitObjectLite {
  return {
    id: object.id,
    noradId: object.noradId,
    name: object.name,
    type: object.type,
    status: object.status,
    country: object.country,
    groups: object.groups,
    intlDesignator: object.intlDesignator,
    epoch: object.epoch,
    meanMotion: object.meanMotion,
    eccentricity: object.eccentricity,
    inclination: object.inclination,
    raan: object.raan,
    argPerigee: object.argPerigee,
    meanAnomaly: object.meanAnomaly,
    bstar: object.bstar,
    meanMotionDot: object.meanMotionDot,
    meanMotionDdot: object.meanMotionDdot,
    ephemerisType: object.ephemerisType,
    classificationType: object.classificationType,
    elementSetNo: object.elementSetNo,
    revAtEpoch: object.revAtEpoch,
    perigeeKm: object.perigeeKm,
    apogeeKm: object.apogeeKm,
    altitudeRegime: object.altitudeRegime,
    periodMin: object.periodMin,
  };
}

export function toSurfaceLite(artifact: SurfaceArtifact): SurfacePointLite {
  const located =
    artifact.location.status === "verified_located" &&
    artifact.location.latitude !== null &&
    artifact.location.longitude !== null;
  return {
    id: artifact.id,
    name: artifact.name,
    type: artifact.type,
    status: artifact.status,
    mission: artifact.mission,
    agency: artifact.agency,
    country: artifact.country,
    latitude: artifact.location.latitude,
    longitude: artifact.location.longitude,
    accuracy: artifact.location.accuracy,
    located,
    description: artifact.description,
    sourceCoordinates: artifact.location.sourceCoordinates,
    locationDescription: artifact.location.description,
    significance: artifact.significance,
    launchDate: artifact.launchDate,
    tags: artifact.tags,
  };
}
