import {
  LANDING_KICKER,
  LANDING_PILLARS,
  LANDING_SUBHEAD,
  LANDING_TITLE_LINE2,
  TAGLINE,
} from "../copy";

type Props = { onStart: () => void };

export function Landing({ onStart }: Props) {
  return (
    <section className="pt-10 md:pt-20 text-center">
      <p className="text-sm uppercase tracking-[0.35em] text-[var(--color-rose)]/80 mb-4">
        {LANDING_KICKER}
      </p>
      <p className="max-w-2xl mx-auto text-sm md:text-base text-[var(--color-gold)]/85 mb-8 leading-relaxed italic font-display">
        {TAGLINE}
      </p>
      <h1 className="font-display text-5xl md:text-7xl leading-tight text-[var(--color-fog)] mb-6">
        One mood in.
        <br />
        <span className="italic text-[var(--color-gold)]">{LANDING_TITLE_LINE2}</span>
      </h1>
      <p className="max-w-xl mx-auto text-[var(--color-fog)]/70 text-lg mb-10">
        {LANDING_SUBHEAD}
      </p>
      <button
        type="button"
        onClick={onStart}
        className="glow-btn rounded-full bg-gradient-to-r from-[var(--color-violet)] to-[var(--color-rose)] px-10 py-4 text-base font-medium text-white transition hover:scale-[1.02]"
      >
        Consult the Oracle
      </button>
      <p className="mt-4 text-xs text-white/35">
        No API key? Full demo mode still works. Pure theater, labeled as such.
      </p>
      <div className="mt-16 grid md:grid-cols-3 gap-4 text-left">
        {LANDING_PILLARS.map(([t, d]) => (
          <div key={t} className="glass rounded-2xl p-5">
            <h3 className="font-display text-xl text-[var(--color-gold)] mb-2">{t}</h3>
            <p className="text-sm text-[var(--color-fog)]/65">{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
