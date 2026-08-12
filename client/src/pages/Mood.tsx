import { useState } from "react";
import { MOOD_MAX_CHARS_UX } from "../config";

type Props = {
  initial: string;
  error: string | null;
  onSubmit: (mood: string) => void;
};

export function Mood({ initial, error, onSubmit }: Props) {
  const [mood, setMood] = useState(initial);
  const len = mood.length;

  return (
    <section className="pt-8 md:pt-14 max-w-2xl mx-auto">
      <h2 className="font-display text-4xl md:text-5xl mb-3 text-center">
        What weather are you carrying?
      </h2>
      <p className="text-center text-[var(--color-fog)]/60 mb-8">
        One sentence is enough. The oracle thrives on incomplete stories.
      </p>
      <form
        className="glass rounded-3xl p-6 md:p-8 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (mood.trim().length >= 3) onSubmit(mood.trim());
        }}
      >
        <textarea
          value={mood}
          onChange={(e) => setMood(e.target.value.slice(0, MOOD_MAX_CHARS_UX))}
          rows={5}
          maxLength={MOOD_MAX_CHARS_UX}
          placeholder="I keep starting things and abandoning them at 80%…"
          className="w-full resize-none rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-[var(--color-fog)] placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-[var(--color-violet)]/60"
        />
        <p className="text-xs text-white/35 text-right">
          {len}/{MOOD_MAX_CHARS_UX} characters (approx)
        </p>
        {error && (
          <p className="text-sm text-rose-300" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={mood.trim().length < 3}
          className="w-full rounded-full bg-[var(--color-violet)] disabled:opacity-40 px-6 py-3.5 font-medium glow-btn"
        >
          Draw the ritual
        </button>
      </form>
    </section>
  );
}
