import { useMemo, useState } from "react";
import type { OracleResponse } from "../types";
import { ShareCard } from "../components/ShareCard";

type Props = {
  mood: string;
  result: OracleResponse;
  onAgain: () => void;
};

export function Report({ mood, result, onAgain }: Props) {
  const { report, facts, mode } = result;
  const day = facts.find((f) => f.kind === "day_seed");
  const [copied, setCopied] = useState(false);

  const shareText = useMemo(
    () =>
      `${report.archetype.name} — ${report.shareLine}\n\nvia VibeOracle (pure vibe, not evidence)`,
    [report]
  );

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="pt-6 space-y-8">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-rose)]/75 mb-3">
          {mode === "demo" ? "Demo oracle · no API key" : "Live oracle"} ·{" "}
          {report.confidenceTheater}% confidence theater
        </p>
        <h2 className="font-display text-4xl md:text-6xl text-[var(--color-gold)]">
          {report.archetype.name}
        </h2>
        <p className="mt-3 text-lg text-[var(--color-fog)]/75 italic font-display">
          {report.archetype.tagline}
        </p>
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
        <div className="space-y-5">
          <article className="glass rounded-3xl p-6 md:p-8">
            <h3 className="text-xs uppercase tracking-[0.25em] text-white/40 mb-4">
              Life direction
            </h3>
            <p className="text-[var(--color-fog)]/90 leading-relaxed whitespace-pre-wrap">
              {report.report}
            </p>
          </article>

          <article className="glass rounded-3xl p-6">
            <h3 className="text-xs uppercase tracking-[0.25em] text-white/40 mb-4">
              Three moves this week
            </h3>
            <ol className="space-y-3 list-decimal list-inside text-[var(--color-fog)]/85">
              {report.actions.map((a) => (
                <li key={a} className="leading-relaxed">
                  {a}
                </li>
              ))}
            </ol>
          </article>

          <article className="rounded-3xl p-6 border border-[var(--color-rose)]/30 bg-[var(--color-rose)]/10">
            <h3 className="text-xs uppercase tracking-[0.25em] text-[var(--color-rose)] mb-2">
              Weekly taboo
            </h3>
            <p className="text-[var(--color-fog)]">{report.taboo}</p>
          </article>
        </div>

        <div className="space-y-4">
          <ShareCard
            archetype={report.archetype.name}
            tagline={report.archetype.tagline}
            shareLine={report.shareLine}
            confidence={report.confidenceTheater}
          />
          <button
            type="button"
            onClick={() => void copyShare()}
            className="w-full rounded-full border border-white/15 px-5 py-3 text-sm hover:bg-white/5"
          >
            {copied ? "Copied share line" : "Copy share text"}
          </button>
          <button
            type="button"
            onClick={onAgain}
            className="w-full rounded-full bg-[var(--color-violet)] px-5 py-3 text-sm font-medium glow-btn"
          >
            New reading
          </button>

          <div className="glass rounded-2xl p-4 text-xs text-white/40 space-y-2">
            <p>
              <span className="text-white/55">Your mood:</span> {mood}
            </p>
            {day && day.kind === "day_seed" && (
              <p>
                Day-seed {day.number} · {day.tone} · {day.date}
              </p>
            )}
            <p className="text-white/30">facts stamped: {facts.length}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
