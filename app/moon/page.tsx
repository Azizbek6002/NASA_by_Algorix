import { PageHeader } from "@/components/layout/page-header";
import { SurfaceView } from "@/components/surface/surface-view";
import { toSurfaceLite } from "@/lib/client-data";
import { lunarDataset, lunarArtifacts } from "@/lib/data";
import { formatInt } from "@/lib/format";

export const metadata = {
  title: "Lunar Surface",
  description:
    "Locate landers, rovers, experiment packages and impact sites left on the Moon, with NASA catalogue provenance.",
};

export default function MoonPage() {
  const points = lunarArtifacts.map(toSurfaceLite);
  const located = points.filter((point) => point.located).length;
  const unknown = points.length - located;

  return (
    <div className="shell py-8 lg:py-10">
      <PageHeader
        index="03"
        eyebrow="Lunar surface"
        title="The Moon is a museum of hardware."
        description="Descent stages, rovers, seismometers, retroreflectors and impact sites from six decades of lunar exploration. Coordinates are transcribed from the NASA catalogue; two records have no usable coordinate and are shown as unknown."
        meta={
          <>
            <span className="chip border-artifact/40 bg-artifact/5 text-artifact">
              {formatInt(points.length)} artefacts
            </span>
            <span className="chip border-success/40 bg-success/5 text-success">
              {formatInt(located)} located
            </span>
            <span className="chip border-warning/40 bg-warning/5 text-warning">
              {formatInt(unknown)} unknown
            </span>
            <span className="chip border-white/12 text-mist-500">
              NASA History · 2012 catalogue
            </span>
          </>
        }
      />

      <div className="mt-6">
        <SurfaceView
          points={points}
          bodyName="Moon"
          textureUrl="/textures/2k_moon.jpg"
          accent="#E5B45C"
          subtitle="Planetocentric · east-positive longitude · markers exaggerated"
        />
      </div>

      <div className="mt-4 grid gap-3 border-t border-white/10 pt-5 text-[11px] leading-relaxed text-mist-600 md:grid-cols-3">
        <p>
          <span className="font-mono uppercase tracking-[0.14em] text-mist-500">Source:</span>{" "}
          {lunarDataset.provider}. Catalogue coordinates are planetocentric and east-positive.
        </p>
        <p>
          <span className="font-mono uppercase tracking-[0.14em] text-mist-500">Caveat:</span>{" "}
          Coordinates describe a landing or impact site, not the current physical extent of a
          rover or the exact position of every small item.
        </p>
        <p>
          <span className="font-mono uppercase tracking-[0.14em] text-mist-500">Unknowns:</span>{" "}
          {formatInt(unknown)} record{unknown === 1 ? "" : "s"} lack a reliable coordinate.
          Nothing is plotted for them.
        </p>
      </div>
    </div>
  );
}
