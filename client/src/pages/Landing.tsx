type Props = { onStart: () => void };

export function Landing({ onStart }: Props) {
  return (
    <section className="pt-10 md:pt-20 text-center">
      <p className="text-sm uppercase tracking-[0.35em] text-[var(--color-rose)]/80 mb-6">
        The OS for your next chapter
      </p>
      <h1 className="font-display text-5xl md:text-7xl leading-tight text-[var(--color-fog)] mb-6">
        One mood in.
        <br />
        <span className="italic text-[var(--color-gold)]">A destiny card out.</span>
      </h1>
      <p className="max-w-xl mx-auto text-[var(--color-fog)]/70 text-lg mb-10">
        Archetype. Three moves. One weekly taboo. A shareable reading built from ritual cards and
        pure LLM swagger — no evidence required.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="glow-btn rounded-full bg-gradient-to-r from-[var(--color-violet)] to-[var(--color-rose)] px-10 py-4 text-base font-medium text-white transition hover:scale-[1.02]"
      >
        Consult the Oracle
      </button>
      <div className="mt-16 grid md:grid-cols-3 gap-4 text-left">
        {[
          ["Ritual", "Three emotion cards — past, present, horizon."],
          ["Thin engines", "Day-seed + deck meanings stamp structured facts."],
          ["Personality report", "Bold, shareable, never says insufficient."],
        ].map(([t, d]) => (
          <div key={t} className="glass rounded-2xl p-5">
            <h3 className="font-display text-xl text-[var(--color-gold)] mb-2">{t}</h3>
            <p className="text-sm text-[var(--color-fog)]/65">{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
