import { PageHeader } from "@/components/layout/page-header";
import { SolarSystemView } from "@/components/solar-system/solar-system-view";
import { planetDataset, planets } from "@/lib/data";
import { formatDate, formatInt } from "@/lib/format";

export const metadata = {
  title: "Solar System",
  description:
    "The eight planets at their real heliocentric directions from JPL Horizons ICRF state vectors for the dataset epoch.",
};

export default function SolarSystemPage() {
  return (
    <div className="shell py-8 lg:py-10">
      <PageHeader
        index="05"
        eyebrow="Solar system"
        title="Eight planets, one instant."
        description="Positions are real ICRF state vectors from JPL Horizons at the dataset epoch. Radial distance is compressed so the whole system fits one view; direction is preserved. The scene does not animate planetary motion."
        meta={
          <>
            <span className="chip border-success/40 bg-success/5 text-success">
              {formatInt(planets.length)} planets
            </span>
            <span className="chip border-white/12 text-mist-300">ICRF · Sun-centred</span>
            <span className="chip border-white/12 text-mist-500">
              epoch {formatDate(planetDataset.epoch)}
            </span>
            <span className="chip border-white/12 text-mist-500">
              {planetDataset.provider}
            </span>
            <span className="chip border-warning/40 bg-warning/5 text-warning">
              compressed radius
            </span>
          </>
        }
      />

      <div className="mt-6">
        <SolarSystemView
          planets={planets}
          epoch={planetDataset.epoch}
          provider={planetDataset.provider}
        />
      </div>

      <div className="mt-4 grid gap-3 border-t border-white/10 pt-5 text-[11px] leading-relaxed text-mist-600 md:grid-cols-3">
        <p>
          <span className="font-mono uppercase tracking-[0.14em] text-mist-500">Frame:</span>{" "}
          {planetDataset.frame}, centre {planetDataset.center}. Vectors are sampled once at the
          epoch, not integrated forward.
        </p>
        <p>
          <span className="font-mono uppercase tracking-[0.14em] text-mist-500">Distance:</span>{" "}
          The inspector and table report AU and light time. Scene units are a display device and
          carry no scientific meaning.
        </p>
        <p>
          <span className="font-mono uppercase tracking-[0.14em] text-mist-500">Tilt:</span>{" "}
          Ecliptic north is up. Orbit rings are circles drawn at each planet&apos;s mean distance;
          real orbits are ellipses with small inclinations.
        </p>
      </div>
    </div>
  );
}
