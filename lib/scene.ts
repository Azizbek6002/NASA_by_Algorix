/**
 * Shared visual scaling for the heliocentric scenes.
 *
 * Real orbital distances span four orders of magnitude (0.31 AU to 172 AU),
 * which is impossible to show on one screen with a linear scale. The atlas
 * therefore compresses radius while preserving direction:
 *
 *   r(au) = 2 + 3·√au + 2·log10(1 + au)
 *
 * The mapping is disclosed in the UI. Never treat scene distance as a
 * measurement; use the AU values shown in the inspector.
 */

export function auToSceneRadius(au: number): number {
  const value = Math.max(au, 0);
  return 2 + 3 * Math.sqrt(value) + 2 * Math.log10(1 + value);
}

/**
 * ICRF (x, y, z; z = ecliptic north) → three.js (x, y = north, z = −y).
 * Only the direction is taken from the state vector; the magnitude is
 * replaced by the compressed scene radius.
 */
export function icrfToScene(
  positionKm: [number, number, number],
  distanceAu: number,
): [number, number, number] {
  const [x, y, z] = positionKm;
  const length = Math.hypot(x, y, z);
  const radius = auToSceneRadius(distanceAu);
  if (!length) return [radius, 0, 0];
  return [(x / length) * radius, (z / length) * radius, (-y / length) * radius];
}

/** Stylised body radius in scene units. Not to scale. */
export function planetVisualRadius(radiusKm: number): number {
  const ratio = Math.max(radiusKm, 1) / 6371;
  return 0.1 + 0.12 * Math.cbrt(ratio);
}

/** Deterministic angle for a body on the schematic orbit ring. */
export function directionAngle(positionKm: [number, number, number]): number {
  const [x, y] = positionKm;
  return Math.atan2(-y, x);
}

export const HELIOPAUSE_AU = 120;
