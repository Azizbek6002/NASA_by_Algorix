import { PageHeader } from "@/components/layout/page-header";
import { SurfaceView } from "@/components/surface/surface-view";
import { toSurfaceLite } from "@/lib/client-data";
import { marsArtifacts, marsDataset } from "@/lib/data";
import { formatInt } from "@/lib/format";

export const metadata = {
  title: "Mars Surface",
  description:
    "Landing sites, landers and rovers on Mars, from Viking to Perseverance, with confidence levels and mission provenance.",
};

export default function MarsPage() {
  const points = marsArtifacts.map(toSurfaceLite);
  const located = points.filter((point) => point.located).length;
  const unknown = points.length - located;
  const active = points.filter((point) => point.status === "active").length;

  return (
    <div className="shell py-8 lg:py-10">
      <PageHeader
        index="04"
        eyebrow="Mars surface"
        title="Fifteen landing sites, four still working."
        description="Mars is the only other planet where humans have operated mobile hardware for years. This view places landers and rovers at their documented landing sites, with the confidence of each coordinate stated plainly."
        meta={
          <>
            <span className="chip" style={{ borderColor: "rgba(224,122,95,0.4)", color: "#E07A5F" }}>
              {formatInt(points.length)} records
            </span>
            <span className="chip border-success/40 bg-success/5 text-success">
              {formatInt(located)} located
            </span>
            <span className="chip border-warning/40 bg-warning/5 text-warning">
              {formatInt(unknown)} unknown
            </span>
            <span className="chip border-white/12 text-mist-300">
              {formatInt(active)} active
            </span>
          </>
        }
      />

      <div className="mt-6">
        <SurfaceView
          points={points}
          bodyName="Mars"
          textureUrl="/textures/2k_mars.jpg"
          accent="#E07A5F"
          subtitle="Planetographic · east-positive longitude · markers exaggerated"
        />
      </div>

      <div className="mt-4 grid gap-3 border-t border-white/10 pt-5 text-[11px] leading-relaxed text-mist-600 md:grid-cols-3">
        <p>
          <span className="font-mono uppercase tracking-[0.14em] text-mist-500">Source:</span>{" "}
          {marsDataset.provider}. Coordinates are stored east-positive; planetographic latitude
          is used where the mission documentation reports it.
        </p>
        <p>
          <span className="font-mono uppercase tracking-[0.14em] text-mist-500">Rovers:</span>{" "}
          Traverse paths are not drawn unless a verified traverse dataset is bundled. A marker
          is a landing site, not a live rover position.
        </p>
        <p>
          <span className="font-mono uppercase tracking-[0.14em] text-mist-500">Status:</span>{" "}
          Active, completed, contact-lost and destroyed are preserved as reported. The archive
          does not infer that a silent mission is dead.
        </p>
      </div>
    </div>
  );
}
