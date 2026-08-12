import { useEffect, useMemo, useState } from "react";
import { consultOracle, fetchHealth } from "./api";
import type { OracleResponse, Step } from "./types";
import { Landing } from "./pages/Landing";
import { Mood } from "./pages/Mood";
import { Ritual } from "./pages/Ritual";
import { Loading } from "./pages/Loading";
import { Report } from "./pages/Report";
import {
  AGE_NOTICE,
  CRISIS_FOOTER,
  DEMO_BUILD_BANNER,
  FOOTER_DISCLAIMER,
} from "./copy";
import { PUBLIC_DEMO_BUILD } from "./config";

const AGE_KEY = "vibe.ageOk";

export default function App() {
  const [step, setStep] = useState<Step>("landing");
  const [mood, setMood] = useState("");
  const [result, setResult] = useState<OracleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publicDemo, setPublicDemo] = useState(PUBLIC_DEMO_BUILD);
  const [ageOk, setAgeOk] = useState(false);

  const year = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    try {
      setAgeOk(sessionStorage.getItem(AGE_KEY) === "1");
    } catch {
      setAgeOk(false);
    }
    void fetchHealth()
      .then((h) => {
        if (h.publicDemo || PUBLIC_DEMO_BUILD) setPublicDemo(true);
      })
      .catch(() => {
        /* offline — keep build flag */
      });
  }, []);

  async function runOracle(nextMood: string) {
    setMood(nextMood);
    setError(null);
    setStep("loading");
    try {
      const data = await consultOracle(nextMood);
      setResult(data);
      setStep("ritual");
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

  function acceptAge() {
    try {
      sessionStorage.setItem(AGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setAgeOk(true);
  }

  return (
    <div className="min-h-screen flex flex-col">
      {publicDemo && (
        <div className="bg-[var(--color-gold)]/15 text-[var(--color-gold)] text-center text-xs uppercase tracking-[0.2em] py-2 border-b border-[var(--color-gold)]/25">
          {DEMO_BUILD_BANNER}
        </div>
      )}

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
        {!ageOk ? (
          <section className="pt-16 max-w-lg mx-auto glass rounded-3xl p-8 text-center space-y-6">
            <h2 className="font-display text-3xl text-[var(--color-gold)]">
              Before you consult
            </h2>
            <p className="text-[var(--color-fog)]/75 text-sm leading-relaxed">
              {AGE_NOTICE}
            </p>
            <p className="text-[var(--color-fog)]/55 text-xs leading-relaxed">
              {CRISIS_FOOTER}
            </p>
            <button
              type="button"
              onClick={acceptAge}
              className="glow-btn rounded-full bg-[var(--color-violet)] px-8 py-3 text-sm font-medium"
            >
              I am 18+ · continue
            </button>
          </section>
        ) : (
          <>
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
          </>
        )}
      </main>

      <footer className="px-6 py-8 text-center text-xs text-[var(--color-fog)]/35 space-y-2">
        <p>
          © {year} VibeOracle · {FOOTER_DISCLAIMER}
        </p>
        <p className="text-[var(--color-fog)]/25 max-w-xl mx-auto">
          {CRISIS_FOOTER}
        </p>
      </footer>
    </div>
  );
}
