import { apiJson } from "@/lib/api";
import {
  deepSpaceDataset,
  lunarDataset,
  marsArtifacts,
  planetDataset,
  planets,
  probes,
} from "@/lib/data";

/** GET /api/v1/bodies — the six places the atlas covers, with counts. */
export async function GET() {
  return apiJson({
    epoch: planetDataset.epoch,
    bodies: [
      {
        id: "earth",
        name: "Earth",
        kind: "planet",
        radiusKm: 6371.0,
        texture: "/textures/2k_earth_daymap.jpg",
        positionKm: planets.find((p) => p.slug === "earth")?.positionKm ?? null,
        objects: 0,
        note: "Earth orbit is covered by the CelesTrak catalogue.",
      },
      {
        id: "moon",
        name: "Moon",
        kind: "moon",
        radiusKm: 1737.4,
        texture: "/textures/2k_moon.jpg",
        positionKm: null,
        objects: lunarDataset.objects.length,
        note: lunarDataset.note,
      },
      {
        id: "mars",
        name: "Mars",
        kind: "planet",
        radiusKm: 3389.5,
        texture: "/textures/2k_mars.jpg",
        positionKm: planets.find((p) => p.slug === "mars")?.positionKm ?? null,
        objects: marsArtifacts.length,
        note: marsArtifacts.length
          ? "Curated landing sites and surface assets."
          : "No records.",
      },
      {
        id: "deep-space",
        name: "Deep space",
        kind: "region",
        radiusKm: null,
        texture: null,
        positionKm: null,
        objects: probes.length,
        note: `${deepSpaceDataset.provider} state vectors at ${deepSpaceDataset.epoch}.`,
      },
    ],
    planets: planets.map((planet) => ({
      slug: planet.slug,
      name: planet.name,
      distanceAu: planet.distanceAu,
      radiusKm: planet.radiusKm,
      color: planet.visualColor,
      texture: planet.texture,
    })),
  });
}
