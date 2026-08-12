import { CONFIDENCE_LABEL } from "../copy";

type Props = {
  archetype: string;
  tagline: string;
  shareLine: string;
  confidence: number;
};

export function ShareCard({ archetype, tagline, shareLine, confidence }: Props) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[var(--color-gold)]/25 bg-gradient-to-br from-[#2a1848] via-[#161222] to-[#3a1830] p-6 min-h-[280px] flex flex-col justify-between">
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-[var(--color-violet)]/30 blur-2xl" />
      <div className="absolute -left-6 bottom-0 w-32 h-32 rounded-full bg-[var(--color-rose)]/20 blur-2xl" />
      <div className="relative">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--color-gold)]/80 mb-4">
          VibeOracle
        </p>
        <h3 className="font-display text-3xl text-[var(--color-fog)] leading-tight mb-2">
          {archetype}
        </h3>
        <p className="font-display italic text-[var(--color-fog)]/70">{tagline}</p>
      </div>
      <div className="relative">
        <p className="text-sm text-[var(--color-gold)] mb-3">{shareLine}</p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
          {CONFIDENCE_LABEL(confidence)} · pure vibe
        </p>
      </div>
    </div>
  );
}
