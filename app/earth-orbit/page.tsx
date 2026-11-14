import { EarthOrbitView } from "@/components/earth-orbit/earth-orbit-view";
import { PageHeader } from "@/components/layout/page-header";
import { toOrbitLite } from "@/lib/client-data";
import { orbitMeta, orbitObjects } from "@/lib/data";
import { formatDate, formatInt, formatTimestamp } from "@/lib/format";

export const metadata = {
  title: "Earth Orbit",
  description:
    "Propagate 1,075 catalogued satellites, rocket bodies and debris with SGP4 from published CelesTrak element sets.",
};

export default function EarthOrbitPage() {
  const objects = orbitObjects.map(toOrbitLite);
  const satellites = objects.filter((object) => object.type === "satellite").length;
  const rockets = objects.filter((object) => object.type === "rocket_body").length;
  const debris = objects.filter((object) => object.type === "debris").length;

  return (
    <div className="shell py-8 lg:py-10">
      <PageHeader
        index="02"
        eyebrow="Earth orbit"
        title="One thousand objects above your head."
        description="Every marker is an SGP4 propagation of a published element set. Drag to rotate the Earth-fixed frame, change simulation speed, and open any object to see the element age behind its position."
        meta={
          <>
            <span className="chip border-orbit/40 bg-orbit/5 text-orbit">
              {formatInt(objects.length)} objects
            </span>
            <span className="chip border-white/12 text-mist-300">
              {formatInt(satellites)} payloads
            </span>
            <span className="chip border-white/12 text-mist-300">
              {formatInt(rockets)} rocket bodies
            </span>
            <span className="chip border-white/12 text-mist-300">
              {formatInt(debris)} debris
            </span>
            <span className="chip border-white/12 text-mist-500">
              elements {formatDate(orbitMeta.elementEpochRange.min)} —{" "}
              {formatDate(orbitMeta.elementEpochRange.max)}
            </span>
            <span className="chip border-warning/40 bg-warning/5 text-warning">
              snapshot · not live
            </span>
          </>
        }
      />

      <div className="mt-6">
        <EarthOrbitView objects={objects} />
      </div>

      <div className="mt-4 grid gap-3 border-t border-white/10 pt-5 text-[11px] leading-relaxed text-mist-600 md:grid-cols-3">
        <p>
          <span className="font-mono uppercase tracking-[0.14em] text-mist-500">Source:</span>{" "}
          CelesTrak GP (OMM JSON) joined with SATCAT. Snapshot retrieved{" "}
          {formatTimestamp(orbitMeta.retrievedAt)}.
        </p>
        <p>
          <span className="font-mono uppercase tracking-[0.14em] text-mist-500">Propagation:</span>{" "}
          SGP4 in TEME, rotated to Earth-fixed coordinates for a static globe. Mean elements —
          not osculating state vectors.
        </p>
        <p>
          <span className="font-mono uppercase tracking-[0.14em] text-mist-500">Warning:</span>{" "}
          Element age is printed in every inspector. After a week, treat the marker as
          indicative rather than exact.
        </p>
      </div>
    </div>
  );
}
