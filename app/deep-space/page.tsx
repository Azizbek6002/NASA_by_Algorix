import { PageHeader } from "@/components/layout/page-header";
import { DeepSpaceView } from "@/components/deep-space/deep-space-view";
import { deepSpaceDataset, planets, probes } from "@/lib/data";
import { formatDate, formatInt } from "@/lib/format";

export const metadata = {
  title: "Deep Space",
  description:
    "Voyager, Pioneer and New Horizons positions from JPL Horizons state vectors, with honest light-time and distance figures.",
};

export default function DeepSpacePage() {
  const active = probes.filter((probe) => probe.status === "active").length;
  const farthest = [...probes].sort((a, b) => b.distanceAu - a.distanceAu)[0];

  return (
    <div className="shell py-8 lg:py-10">
      <PageHeader
        index="06"
        eyebrow="Deep space"
        title="The farthest machines we still listen to."
        description="Five probes have crossed, or are approaching, the boundary of the Sun's influence. Their positions come from JPL Horizons ephemerides, not from telemetry. Light time is shown because, at this distance, 'now' is not observable."
        meta={
          <>
            <span className="chip border-[#9B8CFF]/40 bg-[#9B8CFF]/5 text-[#B6AAFF]">
              {formatInt(probes.length)} probes
            </span>
            <span className="chip border-success/40 bg-success/5 text-success">
              {formatInt(active)} active
            </span>
            <span className="chip border-white/12 text-mist-500">
              epoch {formatDate(deepSpaceDataset.epoch)}
            </span>
            <span className="chip border-white/12 text-mist-500">
              {deepSpaceDataset.provider}
            </span>
            {farthest ? (
              <span className="chip border-white/12 text-mist-300">
                farthest: {farthest.name} · {farthest.distanceAu.toFixed(1)} AU
              </span>
            ) : null}
          </>
        }
      />

      <div className="mt-6">
        <DeepSpaceView
          probes={probes}
          planets={planets}
          epoch={deepSpaceDataset.epoch}
          provider={deepSpaceDataset.provider}
        />
      </div>

      <div className="mt-4 grid gap-3 border-t border-white/10 pt-5 text-[11px] leading-relaxed text-mist-600 md:grid-cols-3">
        <p>
          <span className="font-mono uppercase tracking-[0.14em] text-mist-500">Status:</span>{" "}
          Voyager 1, Voyager 2 and New Horizons are listed as active. Pioneer 10 and 11 are
          mission-completed; their last contact dates are recorded, not guessed.
        </p>
        <p>
          <span className="font-mono uppercase tracking-[0.14em] text-mist-500">Positions:</span>{" "}
          One state vector per probe at the epoch. No trajectory is interpolated beyond it and
          no live tracking is implied.
        </p>
        <p>
          <span className="font-mono uppercase tracking-[0.14em] text-mist-500">Scale:</span>{" "}
          The distance ladder is logarithmic. A straight line between two markers is not a
          flight path.
        </p>
      </div>
    </div>
  );
}
