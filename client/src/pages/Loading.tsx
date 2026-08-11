const LINES = [
  "Aligning day-seed…",
  "Shuffling the emotion deck…",
  "Stamping structured facts…",
  "Consulting the oracle (confidence rising)…",
];

import { useEffect, useState } from "react";

export function Loading() {
  const [pct, setPct] = useState(88);
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => {
      setPct((p) => Math.min(99, p + 1));
      setLineIdx((i) => (i + 1) % LINES.length);
    }, 380);
    return () => window.clearInterval(t);
  }, []);

  return (
    <section className="pt-24 flex flex-col items-center text-center">
      <div className="relative w-28 h-28 mb-10">
        <div className="pulse-ring absolute inset-0 rounded-full border border-[var(--color-gold)]/40" />
        <div className="absolute inset-3 rounded-full bg-gradient-to-br from-[var(--color-violet)]/40 to-[var(--color-rose)]/30" />
        <div className="absolute inset-0 flex items-center justify-center font-display text-3xl text-[var(--color-gold)]">
          *
        </div>
      </div>
      <h2 className="font-display text-3xl mb-6">Reading your weather...</h2>
      <p className="text-sm text-[var(--color-fog)]/55 min-h-[1.5rem]">{LINES[lineIdx]}</p>
      <p className="mt-8 text-xs uppercase tracking-[0.25em] text-[var(--color-rose)]/70">
        precision theater · {pct}%
      </p>
    </section>
  );
}
