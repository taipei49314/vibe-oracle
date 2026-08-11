import type { DrawnCard } from "../types";

type Props = { cards: DrawnCard[] };

const POS_LABEL: Record<string, string> = {
  past: "Past weather",
  present: "Present charge",
  horizon: "Horizon pull",
};

export function Ritual({ cards }: Props) {
  return (
    <section className="pt-8">
      <h2 className="font-display text-4xl text-center mb-2">The ritual</h2>
      <p className="text-center text-[var(--color-fog)]/55 mb-10">
        Three cards. Thin engine meanings. No escaping the plot.
      </p>
      <div className="grid md:grid-cols-3 gap-5">
        {cards.map((c, i) => (
          <article
            key={c.id + c.position}
            className="flip-in glass rounded-2xl p-5 min-h-[220px]"
            style={{ animationDelay: `${i * 0.18}s` }}
          >
            <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-rose)]/80 mb-3">
              {POS_LABEL[c.position] ?? c.position}
            </p>
            <h3 className="font-display text-2xl text-[var(--color-gold)] mb-1">{c.name}</h3>
            <p className="text-xs uppercase tracking-wider text-white/40 mb-4">
              {c.orientation}
            </p>
            <p className="text-sm text-[var(--color-fog)]/80 leading-relaxed">{c.reading}</p>
            <p className="mt-4 text-[11px] text-white/35">{c.keywords.join(" · ")}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
