import React, { useState, useMemo } from "react";
import {
  PANACEA_COMPETITIVE_ANIME_BOTS,
  computeIrt3PLProbability,
  updateBayesianPosterior,
  type AnimeBotId
} from "../competitive-bots/anime-sparring-arena";
import {
  GOLDEN_JOURNEY_STEPS,
  runGoldenJourneyVerificationSession
} from "../../golden-journey/cardiovascular-golden-journey";
import { computeHemodynamics } from "../../body-exposure/omnicausalis-multiscale-bridge";

export interface CompetitiveAnimeTrainingArenaProps {
  readonly learnerId?: string;
  readonly initialTheta?: number;
}

export const CompetitiveAnimeTrainingArena: React.FC<CompetitiveAnimeTrainingArenaProps> = ({
  learnerId = "koas-kelvin-panacea",
  initialTheta = 1.45
}) => {
  const [learnerTheta, setLearnerTheta] = useState<number>(initialTheta);
  const [activeBot, setActiveBot] = useState<AnimeBotId>("DR_SATORU_SENSEI");
  const [score, setScore] = useState<number>(0);

  const journey = useMemo(() => runGoldenJourneyVerificationSession(learnerId), [learnerId]);
  const hemodynamics = useMemo(() => computeHemodynamics(84, 145, 65, 118, 76, 8), []);
  const bayesianPost = useMemo(() => updateBayesianPosterior(0.45, 5.8), []);

  const handleAnswer = (correct: boolean) => {
    const p = computeIrt3PLProbability(learnerTheta, 1.8, 1.0, 0.2);
    const delta = correct ? (1 - p) * 0.35 : -p * 0.25;
    setLearnerTheta(Number(Math.max(-3, Math.min(3, learnerTheta + delta)).toFixed(3)));
    if (correct) setScore((s) => s + 180);
  };

  const botIds: AnimeBotId[] = ["DR_SATORU_SENSEI", "DR_MAKIMA_SENPAI", "DR_SENKU_KUN"];

  return (
    <section aria-label="Prometheus 3-Bot Anime Training Arena" style={{ padding: 24, background: "#0F172A", color: "#F8FAFC", borderRadius: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 99, background: "#064E3B", color: "#34D399", fontWeight: 700 }}>
            TRUTH CLASS: {journey.truthClass}
          </span>
          <h2 style={{ margin: "8px 0 0" }}>PanaceaMed Prometheus x Body Exposure — Anime Bot Arena</h2>
        </div>
        <div style={{ textAlign: "right" }}>
          <div>Learner Theta: <strong>{learnerTheta}</strong> | Score: <strong>{score}</strong></div>
          <div style={{ fontSize: 12, color: "#94A3B8" }}>Golden Journey: {GOLDEN_JOURNEY_STEPS.length}/15 Steps Verified</div>
        </div>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 16 }}>
        {botIds.map((id) => {
          const bot = PANACEA_COMPETITIVE_ANIME_BOTS[id];
          const effectiveTheta = bot.adaptiveRubberBandOffset !== null ? Number((learnerTheta + bot.adaptiveRubberBandOffset).toFixed(2)) : bot.baseIrtTheta;
          return (
            <article key={id} onClick={() => setActiveBot(id)} style={{ padding: 16, borderRadius: 12, background: "#1E293B", border: activeBot === id ? "2px solid " + bot.primaryColorHex : "1px solid #334155", cursor: "pointer" }}>
              <strong style={{ color: bot.primaryColorHex }}>{bot.displayName}</strong>
              <div style={{ fontSize: 12, color: "#94A3B8" }}>{bot.archetype}</div>
              <div style={{ fontSize: 12, marginTop: 8 }}>Bot Effective Theta: <code>{effectiveTheta}</code></div>
              <div style={{ fontSize: 11, color: "#CBD5E1" }}>3D VRM: <code>{bot.vrmModelPath}</code></div>
              <p style={{ fontStyle: "italic", fontSize: 12, marginTop: 8 }}>"{bot.signatureLine}"</p>
            </article>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button type="button" onClick={() => handleAnswer(true)} style={{ padding: "8px 16px", background: "#10B981", color: "#052E16", fontWeight: 700, borderRadius: 8, border: "none" }}>
          Submit Correct Multiscale Localization (+Combo)
        </button>
        <button type="button" onClick={() => handleAnswer(false)} style={{ padding: "8px 16px", background: "#334155", color: "#F8FAFC", borderRadius: 8, border: "none" }}>
          Simulate Error (Test Remediation)
        </button>
      </div>
      <footer style={{ fontSize: 12, color: "#94A3B8" }}>
        Simulated CO: {hemodynamics.cardiacOutputLMin} L/min | LVEF: {hemodynamics.ejectionFractionPercent}% | Bayesian Posterior: {bayesianPost} | Restored Structure: {journey.restoredAnatomicalBookmark.structureId}
      </footer>
    </section>
  );
};