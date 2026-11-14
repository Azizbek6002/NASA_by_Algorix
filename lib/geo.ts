import { Vector3 } from "three";

/**
 * Map planetocentric coordinates (east-positive longitude, north-positive
 * latitude) onto a three.js sphere whose texture is an equirectangular map
 * with longitude 0° at +X and east towards −Z.
 */
export function latLonToVector3(
  latitude: number,
  longitude: number,
  radius = 1,
): Vector3 {
  const lat = (latitude * Math.PI) / 180;
  const lon = (longitude * Math.PI) / 180;
  const cosLat = Math.cos(lat);
  return new Vector3(
    radius * cosLat * Math.cos(lon),
    radius * Math.sin(lat),
    -radius * cosLat * Math.sin(lon),
  );
}

export function latLonToTuple(
  latitude: number,
  longitude: number,
  radius = 1,
): [number, number, number] {
  const v = latLonToVector3(latitude, longitude, radius);
  return [v.x, v.y, v.z];
}

/** Great-circle distance in degrees between two lat/lon points. */
export function angularDistanceDeg(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = Math.PI / 180;
  const phi1 = lat1 * toRad;
  const phi2 = lat2 * toRad;
  const dPhi = (lat2 - lat1) * toRad;
  const dLambda = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) / toRad;
}

/** Kilometres per degree of great-circle arc on a body of a given radius. */
export function kmPerDegree(radiusKm: number): number {
  return (Math.PI / 180) * radiusKm;
}

/**
 * Visual clustering: group surface points that are within `thresholdDeg` of
 * each other so a dense landing site does not render as a pile of identical
 * markers. Purely cosmetic; the inspector always lists every record.
 */
export interface SurfacePoint {
  id: string;
  latitude: number;
  longitude: number;
}

export interface SurfaceCluster<T extends SurfacePoint> {
  key: string;
  latitude: number;
  longitude: number;
  items: T[];
}

export function clusterSurfacePoints<T extends SurfacePoint>(
  points: T[],
  thresholdDeg = 0.35,
): SurfaceCluster<T>[] {
  const clusters: SurfaceCluster<T>[] = [];

  for (const point of points) {
    if (!Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)) continue;
    let target: SurfaceCluster<T> | undefined;
    for (const cluster of clusters) {
      if (
        angularDistanceDeg(
          cluster.latitude,
          cluster.longitude,
          point.latitude,
          point.longitude,
        ) <= thresholdDeg
      ) {
        target = cluster;
        break;
      }
    }
    if (target) {
      target.items.push(point);
    } else {
      clusters.push({
        key: point.id,
        latitude: point.latitude,
        longitude: point.longitude,
        items: [point],
      });
    }
  }

  return clusters;
}

/** Normalise an angle in degrees into −180..180. */
export function wrapLongitude(degrees: number): number {
  return ((((degrees + 180) % 360) + 360) % 360) - 180;
}
