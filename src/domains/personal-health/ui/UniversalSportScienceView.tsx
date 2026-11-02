import React, { useMemo, useState } from 'react';
import {
  computeBanisterFitnessFatigue,
  evaluateAutonomicVagalRecovery,
  computeSubstrateCrossover,
  SPORT_SCIENCE_CITATIONS,
  type BanisterImpulseOutput,
  type AutonomicRecoverySummary,
  type SubstrateCrossoverOutput,
} from '../engine/universalSportScienceEngine';

export interface UniversalSportScienceViewProps {
  readonly initialPeakHr?: number;
  readonly initialHrr60Hr?: number;
  readonly initialMorningRmssd?: number;
  readonly initialBaselineRmssd?: number;
  readonly initialRestingHr?: number;
  readonly initialBaselineRestingHr?: number;
  readonly initialDeepSleepMin?: number;
  readonly initialRemSleepMin?: number;
  readonly initialTotalSleepMin?: number;
  readonly recentDailyLoadsAu?: readonly number[];
  readonly currentWorkoutHr?: number;
}

export const UniversalSportScienceView: React.FC<UniversalSportScienceViewProps> = ({
  initialPeakHr = 178,
  initialHrr60Hr = 144,
  initialMorningRmssd = 68,
  initialBaselineRmssd = 62,
  initialRestingHr = 50,
  initialBaselineRestingHr = 52,
  initialDeepSleepMin = 95,
  initialRemSleepMin = 105,
  initialTotalSleepMin = 460,
  recentDailyLoadsAu = [90, 110, 140, 0, 120, 130, 85, 100, 145, 160, 0, 115, 125, 95],
  currentWorkoutHr = 138,
}) => {
  const [peakHr] = useState(initialPeakHr);
  const [hrr60Hr] = useState(initialHrr60Hr);
  const [morningRmssd] = useState(initialMorningRmssd);
  const [baselineRmssd] = useState(initialBaselineRmssd);
  const [morningHr] = useState(initialRestingHr);
  const [showEvidence, setShowEvidence] = useState(false);

  // 1. Autonomic Vagal Recovery Evaluation
  const autonomic: AutonomicRecoverySummary = useMemo(() => {
    return evaluateAutonomicVagalRecovery({
      peakHeartRateBpm: peakHr,
      heartRateAt60sBpm: hrr60Hr,
      morningRmssdMs: morningRmssd,
      baselineRmssdMs: baselineRmssd,
      morningRestingHrBpm: morningHr,
      baselineRestingHrBpm: initialBaselineRestingHr,
      deepSleepMinutes: initialDeepSleepMin,
      remSleepMinutes: initialRemSleepMin,
      totalSleepMinutes: initialTotalSleepMin,
    });
  }, [peakHr, hrr60Hr, morningRmssd, baselineRmssd, morningHr, initialBaselineRestingHr, initialDeepSleepMin, initialRemSleepMin, initialTotalSleepMin]);

  // 2. Banister Impulse Response
  const banister: BanisterImpulseOutput = useMemo(() => {
    return computeBanisterFitnessFatigue({
      dailyLoadsAu: recentDailyLoadsAu,
    });
  }, [recentDailyLoadsAu]);

  // 3. Substrate Crossover Kinetics
  const substrate: SubstrateCrossoverOutput = useMemo(() => {
    return computeSubstrateCrossover({
      currentHeartRateBpm: currentWorkoutHr,
      restingHeartRateBpm: morningHr,
      maxHeartRateBpm: 192,
      bodyWeightKg: 70,
    });
  }, [currentWorkoutHr, morningHr]);

  const recoveryColor =
    autonomic.recoveryCategory === 'GREEN_SUPERCOMPENSATING'
      ? '#00BF63'
      : autonomic.recoveryCategory === 'YELLOW_STEADY'
      ? '#EAB308'
      : '#EF4444';

  return (
    <section
      aria-label="Universal Sport Science & Autonomic Engine"
      className="w-full max-w-5xl mx-auto p-6 md:p-10 space-y-10 bg-[#090D10] text-[#E8ECEF] rounded-3xl border border-white/5 font-sans"
    >
      {/* Top Bar: Minimal Header + Status Tag */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: recoveryColor }} />
            <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-400">
              Autonomic Vagal Kinetics · Banister TSB
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-neutral-400 border border-white/10">
              Truth-Class: Derived
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-light tracking-tight text-white">
            Autonomic Recovery & Substrate Architecture
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setShowEvidence((v) => !v)}
          className="self-start md:self-auto px-4 py-2 rounded-full text-xs font-mono tracking-wider border border-white/15 hover:border-white/30 transition-colors"
        >
          {showEvidence ? 'Hide Evidence' : 'Peer-Reviewed Grounding'}
        </button>
      </header>

      {/* Primary Metrics Grid (Spacious, Uncrowded, High Negative Space) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Autonomic Vagal Tone */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between space-y-6">
          <div className="space-y-1.5">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
              Autonomic Recovery
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-light tracking-tighter tabular-nums" style={{ color: recoveryColor }}>
                {autonomic.compositeRecoveryScorePercent}%
              </span>
              <span className="text-xs text-neutral-400 uppercase tracking-widest">Composite</span>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/5 text-xs text-neutral-300">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">HRR 60s Drop</span>
              <span className="font-mono tabular-nums text-white">
                {autonomic.hrr60Bpm} bpm{' '}
                <span className="text-[10px] opacity-70">
                  ({autonomic.hrr60ClinicalStatus === 'EXCELLENT_VAGAL_TONE' ? 'Superior' : 'Normal'})
                </span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">rMSSD Morning</span>
              <span className="font-mono tabular-nums text-white">
                {morningRmssd} ms <span className="text-[10px] opacity-70">({(autonomic.rmssdRatioToBaseline * 100).toFixed(0)}% base)</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Restorative Sleep</span>
              <span className="font-mono tabular-nums text-white">
                {autonomic.sleepRestorativeRatioPercent}%{' '}
                <span className="text-[10px] opacity-70">(SWS+REM)</span>
              </span>
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-neutral-400">
            {autonomic.physiologicalSummary}
          </p>
        </div>

        {/* Card 2: Banister Fitness-Fatigue Balance */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between space-y-6">
          <div className="space-y-1.5">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
              Training Stress Balance
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-light tracking-tighter tabular-nums text-white">
                {banister.trainingStressBalanceTsb > 0 ? `+${banister.trainingStressBalanceTsb}` : banister.trainingStressBalanceTsb}
              </span>
              <span className="text-xs text-neutral-400 uppercase tracking-widest">TSB Form</span>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/5 text-xs text-neutral-300">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Chronic Fitness (CTL)</span>
              <span className="font-mono tabular-nums text-white">{banister.chronicTrainingLoadCtl} AU</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Acute Fatigue (ATL)</span>
              <span className="font-mono tabular-nums text-white">{banister.acuteTrainingLoadAtl} AU</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">ACWR Ratio</span>
              <span className="font-mono tabular-nums text-white">
                {banister.acuteChronicWorkloadRatio}{' '}
                <span className="text-[10px] opacity-70">
                  {banister.acuteChronicWorkloadRatio <= 1.3 ? '(Optimal)' : '(Spike)'}
                </span>
              </span>
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-neutral-400">
            {banister.actionableInsight}
          </p>
        </div>

        {/* Card 3: Substrate Crossover Kinetics */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between space-y-6">
          <div className="space-y-1.5">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
              Substrate Crossover
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-light tracking-tighter tabular-nums text-white">
                {substrate.fatOxidationRatioPercent}%
              </span>
              <span className="text-xs text-neutral-400 uppercase tracking-widest">FatMax Fuel</span>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/5 text-xs text-neutral-300">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Glycogen Oxidation</span>
              <span className="font-mono tabular-nums text-white">{substrate.carbohydrateOxidationRatioPercent}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Fat Lipolysis Rate</span>
              <span className="font-mono tabular-nums text-white">{substrate.estimatedFatGramsPerHour} g/hr</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Carb Flux Rate</span>
              <span className="font-mono tabular-nums text-white">{substrate.estimatedCarbsGramsPerHour} g/hr</span>
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-neutral-400">
            {substrate.metabolicSubstrateZone === 'FATMAX_AEROBIC_LIPOLYSIS'
              ? 'Mitochondrial beta-oxidation dominant. Maximum lipid clearance without lactate accumulation.'
              : substrate.metabolicSubstrateZone === 'BALANCED_MIXED_FLUX'
              ? 'Mixed substrate utilization. Balanced aerobic lipolysis and glycolytic flux.'
              : 'Fast-twitch glycolytic recruitment. Rapid glycogen depletion; post-session refeeding recommended.'}
          </p>
        </div>
      </div>

      {/* Expandable Scientific Evidence Drawer */}
      {showEvidence && (
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4 animate-fadeIn">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-300">
            Peer-Reviewed Physiological Grounding
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-neutral-300">
            {SPORT_SCIENCE_CITATIONS.map((cit) => (
              <div key={cit.key} className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <div className="font-medium text-white">{cit.topic}</div>
                <div className="text-neutral-400 font-mono text-[11px]">{cit.citation}</div>
                {cit.pmid && (
                  <div className="text-[#00BF63] text-[10px] font-mono">PMID: {cit.pmid}</div>
                )}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-neutral-500 pt-2 border-t border-white/5">
            Panacea does not utilize opaque proprietary black-boxes. All formulas compute deterministically from canonical biophysical equations.
          </p>
        </div>
      )}
    </section>
  );
};
