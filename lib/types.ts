/**
 * Shared domain types for SPACE ARCHIVE.
 *
 * Every value in this project is either taken from a published catalogue
 * (CelesTrak, NASA, JPL Horizons) or explicitly marked as unknown. Types are
 * therefore deliberately permissive: `null` always means "the source did not
 * provide this", never "zero".
 */

export type ObjectCategory =
  | "earth_orbit"
  | "lunar_surface"
  | "mars_surface"
  | "deep_space"
  | "planet";

export type ObjectType =
  | "satellite"
  | "rocket_body"
  | "debris"
  | "lander"
  | "rover"
  | "descent_stage"
  | "ascent_stage"
  | "instrument"
  | "impact_site"
  | "probe"
  | "planet"
  | "unknown";

export type ObjectStatus =
  | "active"
  | "partially_operational"
  | "inactive"
  | "mission_completed"
  | "destroyed"
  | "lost_contact"
  | "unknown";

export type Confidence = "verified" | "estimated" | "approximate" | "unknown";

export type OrbitRegime = "LEO" | "MEO" | "GEO" | "GEO+" | "HEO" | "unknown";

export interface SourceRef {
  provider: string;
  url: string;
  recordId?: string | null;
  retrievedAt?: string | null;
}

export interface MissionEvent {
  date: string;
  type: string;
  description: string;
}

/* ------------------------------------------------------------------ */
/* Earth orbit (CelesTrak GP + SATCAT)                                 */
/* ------------------------------------------------------------------ */

export interface EarthOrbitObject {
  id: string;
  noradId: number;
  name: string;
  intlDesignator: string | null;
  category: "earth_orbit";
  type: ObjectType;
  satcatType: string | null;
  ownerCode: string | null;
  country: string | null;
  agency: string | null;
  launchDate: string | null;
  status: ObjectStatus;
  statusLabel: string;
  opsStatusCode: string | null;
  groups: string[];
  sourceUrl: string | null;
  satcatUrl: string | null;
  decayDate: string | null;
  periodMin: number | null;
  altitudeRegime: OrbitRegime;
  apogeeKm: number | null;
  perigeeKm: number | null;
  epoch: string;
  meanMotion: number;
  eccentricity: number;
  inclination: number;
  raan: number;
  argPerigee: number;
  meanAnomaly: number;
  bstar: number;
  meanMotionDot: number;
  meanMotionDdot: number;
  ephemerisType: number;
  classificationType: string;
  elementSetNo: number | null;
  revAtEpoch: number | null;
  confidence: Confidence;
  locationConfidence: Confidence;
  fetchedAt: string;
  description: string;
  history: string | null;
  massKg: number | null;
  dimensions: string | null;
  sources: SourceRef[];
}

export interface OrbitSnapshotMeta {
  provider: string;
  description: string;
  retrievedAt: string;
  elementEpochRange: { min: string; max: string };
  objectCount: number;
  groupCounts: Record<string, number>;
  typeCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  regimeCounts: Record<string, number>;
  contentSha256: string;
  sourceUrls: string[];
  usagePolicy: string;
  note: string;
}

/* ------------------------------------------------------------------ */
/* Surface artifacts (Moon, Mars)                                      */
/* ------------------------------------------------------------------ */

export interface SurfaceLocation {
  body: "moon" | "mars";
  latitude: number | null;
  longitude: number | null;
  elevationM: number | null;
  accuracy: Confidence;
  status: "verified_located" | "unknown_location";
  description: string;
  sourceCoordinates: string;
  longitudeConvention: string;
  coordinateSystem: string;
}

export interface SurfaceArtifact {
  id: string;
  slug: string;
  name: string;
  category: "lunar_surface" | "mars_surface";
  type: ObjectType;
  mission: string;
  agency: string;
  country: string;
  launchDate: string | null;
  status: ObjectStatus;
  confidence: Confidence;
  location: SurfaceLocation;
  description: string;
  history: string;
  significance: string;
  massKg: number | null;
  dimensions: string | null;
  image: string | null;
  roverPath?: unknown | null;
  sources: SourceRef[];
  events: MissionEvent[];
  tags: string[];
}

export interface SurfaceDataset {
  provider: string;
  catalogueUrl?: string;
  cataloguePdfUrl?: string;
  retrievedAt: string;
  coordinateConvention: string;
  coordinateSystem: string;
  note: string;
  objects: SurfaceArtifact[];
}

/* ------------------------------------------------------------------ */
/* Ephemeris (JPL Horizons)                                            */
/* ------------------------------------------------------------------ */

export interface PlanetRecord {
  id: number;
  slug: string;
  name: string;
  radiusKm: number;
  visualColor: string;
  texture: string;
  meanDistanceAu: number;
  epoch: string;
  frame: string;
  center: string;
  positionKm: [number, number, number];
  velocityKmS: [number, number, number];
  distanceAu: number;
  lightTimeMin: number;
  source: string;
  retrievedAt: string;
}

export interface PlanetDataset {
  epoch: string;
  frame: string;
  center: string;
  provider: string;
  source: string;
  retrievedAt: string;
  note: string;
  planets: PlanetRecord[];
}

export interface DeepSpaceProbe {
  id: string;
  targetId: number;
  slug: string;
  name: string;
  agency: string;
  country: string;
  launchDate: string;
  status: ObjectStatus;
  mission: string;
  objective: string;
  lastContact: string;
  epoch: string;
  frame: string;
  center: string;
  positionKm: [number, number, number];
  velocityKmS: [number, number, number];
  distanceAu: number;
  lightTimeHours: number;
  source: string;
  missionSource: string;
  retrievedAt: string;
  note: string;
}

export interface DeepSpaceDataset {
  epoch: string;
  frame: string;
  center: string;
  provider: string;
  source: string;
  retrievedAt: string;
  probes: DeepSpaceProbe[];
}

/* ------------------------------------------------------------------ */
/* Normalised view model + search                                      */
/* ------------------------------------------------------------------ */

export interface ArchiveEntry {
  id: string;
  name: string;
  category: ObjectCategory;
  type: ObjectType;
  status: ObjectStatus;
  statusLabel: string;
  agency: string | null;
  country: string | null;
  launchDate: string | null;
  description: string | null;
  /** Human readable location line, e.g. "LEO · 418 km" or "18.4446°N 77.4509°E" */
  locationLabel: string;
  located: boolean;
  accuracy: Confidence;
  epoch: string | null;
  tags: string[];
  href: string;
}

export interface SearchIndexEntry {
  id: string;
  name: string;
  category: ObjectCategory;
  type: ObjectType;
  status: ObjectStatus;
  country: string | null;
  href: string;
  keywords: string;
}

/* ------------------------------------------------------------------ */
/* Client-side scene payloads                                          */
/* ------------------------------------------------------------------ */

/**
 * The minimum element set required for SGP4. Sent to the browser instead of
 * the full catalogue record to keep the RSC payload small.
 */
export interface OrbitObjectLite {
  id: string;
  noradId: number;
  name: string;
  type: ObjectType;
  status: ObjectStatus;
  country: string | null;
  groups: string[];
  intlDesignator: string | null;
  epoch: string;
  meanMotion: number;
  eccentricity: number;
  inclination: number;
  raan: number;
  argPerigee: number;
  meanAnomaly: number;
  bstar: number;
  meanMotionDot: number;
  meanMotionDdot: number;
  ephemerisType: number;
  classificationType: string;
  elementSetNo: number | null;
  revAtEpoch: number | null;
  perigeeKm: number | null;
  apogeeKm: number | null;
  altitudeRegime: OrbitRegime;
  periodMin: number | null;
}

export interface SurfacePointLite {
  id: string;
  name: string;
  type: ObjectType;
  status: ObjectStatus;
  mission: string;
  agency: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: Confidence;
  located: boolean;
  description: string;
  sourceCoordinates: string;
  locationDescription: string;
  significance: string;
  launchDate: string | null;
  tags: string[];
}

