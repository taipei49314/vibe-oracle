import { useMemo, useState } from "react";
import { consultOracle } from "./api";
import type { OracleResponse, Step } from "./types";
import { Landing } from "./pages/Landing";
import { Mood } from "./pages/Mood";
import { Ritual } from "./pages/Ritual";
import { Loading } from "./pages/Loading";
import { Report } from "./pages/Report";

export default function App() {
  const [step, setStep] = useState<Step>("landing");
  const [mood, setMood] = useState("");
  const [result, setResult] = useState<OracleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const year = useMemo(() => new Date().getFullYear(), []);

  async function runOracle(nextMood: string) {
    setMood(nextMood);
    setError(null);
    setStep("loading");
    try {
      const data = await consultOracle(nextMood);
      setResult(data);
      setStep("ritual");
      // brief beat to show cards, then report
      window.setTimeout(() => setStep("report"), 2200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Oracle failed");
      setStep("mood");
    }
  }

  function reset() {
    setStep("landing");
    setMood("");
    setResult(null);
    setError(null);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto w-full">
        <button
          type="button"
          onClick={reset}
          className="font-display text-2xl tracking-wide text-[var(--color-gold)]"
        >
          VibeOracle
        </button>
        <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-fog)]/50">
          pure vibe · not evidence
        </span>
      </header>

      <main className="flex-1 px-6 pb-16 max-w-5xl mx-auto w-full">
        {step === "landing" && <Landing onStart={() => setStep("mood")} />}
        {step === "mood" && (
          <Mood
            initial={mood}
            error={error}
            onSubmit={(m) => void runOracle(m)}
          />
        )}
        {step === "loading" && <Loading />}
        {step === "ritual" && result && <Ritual cards={result.ritual} />}
        {step === "report" && result && (
          <Report mood={mood} result={result} onAgain={reset} />
        )}
      </main>

      <footer className="px-6 py-8 text-center text-xs text-[var(--color-fog)]/35">
        © {year} VibeOracle · Not medical, legal, or investment advice · Confidence is theatrical
      </footer>
    </div>
  );
}
