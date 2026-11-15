// @panacea-claim-boundary: simulation-not-clinical
import React, { useMemo, useState } from 'react';
import { useAdaptive } from '../../../shared/adaptive/useAdaptive.ts';
import {
  DEFAULT_KALOLUMEN_LAYERS, NUSANTARA_FUNCTIONAL_DISHES, PROTEIN_FIGHTER_BOTS,
  evaluateBioEmuConformationalEnsemble, evaluateDeNovoBinderCandidate, evaluateKaloLumenReconstruction,
  evaluateLongevityEnergyBalance, evaluateLongevityNutritionAndExposome, evaluateMitochondrialAutophagyDynamics,
  evaluateOmnicausalisMultiscaleCoupling, evaluateOneOsEncounterPayerHarmonization, evaluatePantheonMultiSpecialistConsensus,
  evaluateRemopReceptorOccupancy, evaluateSensoriumBiometricsAndGait, evaluateSepsisSafeguard,
  mapTextToVrmVisemeFrames, runProteinFighterArenaRound, translateUniversalDeviceEnvelope,
} from '../engine/omnicausalisEngine.ts';
import {
  OMNICAUSALIS_SAFETY_DISCLAIMER, type InteractionGrammarStage, type IonChannelTargetId,
} from '../model/types.ts';

const GRAMMAR_STAGES: readonly { readonly id: InteractionGrammarStage; readonly label: string; readonly prompt: string }[] = [
  { id: 'see', label: '1. See', prompt: 'Unified 7-Pillar Canonical Snapshot: Quantum Biology → UHD DICOM → CDSS → Zero-Loss EMR → Sensorium → Longevity.' },
  { id: 'ask', label: '2. Ask', prompt: 'Interrogate multi-scale drivers across subcellular ΔΨm, KaloLumen Hounsfield layers, and Pantheon ICU specialties.' },
  { id: 'zoom', label: '3. Zoom', prompt: 'Inspect molecular Kd & Boltzmann ensembles alongside continuous CGM Time-in-Range and 3D MTP gait strike kinematics.' },
  { id: 'why', label: '4. Why', prompt: 'Trace causal coupling: PINK1/Parkin mitophagy, Hill-Langmuir receptor occupancy, and inter-specialty conflict resolution.' },
  { id: 'what_if', label: '5. What-If', prompt: 'Run isolated SIMULATED_EDUCATIONAL counterfactuals without mutating OBSERVED_CLINICAL patient records.' },
  { id: 'act', label: '6. Act', prompt: 'Review Surviving Sepsis 1-Hour Bundle & One-OS Payer Harmonization (Requires Authorized Physician Sign-Off).' },
];

export const OmnicausalisCommandDeck: React.FC = () => {
  const { isDesktop } = useAdaptive();
  const [grammarStage, setGrammarStage] = useState<InteractionGrammarStage>('see');
  const [azimuthDeg, setAzimuthDeg] = useState(35);
  const [elevationDeg, setElevationDeg] = useState(42);
  const [sliceCount, setSliceCount] = useState(512);
  const [layerEnabled, setLayerEnabled] = useState<readonly [boolean, boolean, boolean]>([true, true, true]);
  const [channelTarget, setChannelTarget] = useState<IonChannelTargetId>('cav1_2_ltcc');
  const [membraneMv, setMembraneMv] = useState(-15);
  const [deltaGBind, setDeltaGBind] = useState(-11.8);
  const [ipTm, setIpTm] = useState(0.86);
  const [mitoPsiMv, setMitoPsiMv] = useState(-158);
  const [respRate, setRespRate] = useState(24);
  const [sysBp, setSysBp] = useState(92);
  const [gcs, setGcs] = useState(14);
  const [norepiNm, setNorepiNm] = useState(45);
  const [mtpAngleDeg, setMtpAngleDeg] = useState(28);
  const [saunaMinutes, setSaunaMinutes] = useState(60);
  const [residualPct, setResidualPct] = useState(8);

  const kaloLumenResult = useMemo(() => evaluateKaloLumenReconstruction({
    studyId: 'KALOLUMEN-CT-THORAX-01', sliceCount, voxelSpacingMm: [0.7, 0.7, 1.0],
    layers: DEFAULT_KALOLUMEN_LAYERS.map((l, idx) => ({ ...l, enabled: layerEnabled[idx] ?? true })),
    lighting: { azimuthDeg, elevationDeg },
  }), [azimuthDeg, elevationDeg, sliceCount, layerEnabled]);

  const bioEmuResult = useMemo(() => evaluateBioEmuConformationalEnsemble({
    targetId: channelTarget, temperatureKelvin: 310.15, deltaGOpenMinusClosedKcalMol: 0.8,
    membranePotentialMv: membraneMv, phosphorylationFraction: 0.65,
  }), [channelTarget, membraneMv]);

  const binderAssessment = useMemo(() => evaluateDeNovoBinderCandidate({
    binderId: 'BC2-OMNI-01', sequence: 'MKTIIALSYIFCLVFADYKDDDDKGGGGSGGGGSHHHHHH',
    plddtMean: 91.2, ptmScore: 0.88, ipTmScore: ipTm, deltaGBindKcalMol: deltaGBind,
    buriedSurfaceAreaA2: 1880, paeInterfaceMeanAngstrom: 4.8, sequenceIdentityToTrainingMax: 0.62,
  }), [deltaGBind, ipTm]);

  const mitoResult = useMemo(() => evaluateMitochondrialAutophagyDynamics({
    deltaPsiMMv: mitoPsiMv, nadPlusToNadhRatio: 4.2, ampkToMtorRatio: 2.8, substrateOxygenSaturationPct: 96,
  }), [mitoPsiMv]);

  const udtEnvelope = useMemo(() => translateUniversalDeviceEnvelope({
    deviceId: 'UDT-RING-CGM-09', deviceEra: 'present_wearable_cgm', provenanceSource: 'FHIR_OBSERVATION_R4_CGM_RING',
    consentVerified: true, timePrecisionMs: 60000,
    heartRateBpm: 62, hrvRmssdMs: 68, cgmGlucoseMgDl: 104, thoracicBioimpedanceOhm: null,
  }), []);

  const arenaRound = useMemo(() => runProteinFighterArenaRound(binderAssessment), [binderAssessment]);
  const sepsisResult = useMemo(() => evaluateSepsisSafeguard({
    respiratoryRateBpm: respRate, systolicBpMmHg: sysBp, glasgowComaScale: gcs, paO2FiO2Ratio: 240,
    platelets10e3PerUl: 140, bilirubinMgDl: 1.4, meanArterialPressureMmHg: Math.round(sysBp * 0.72),
    vasopressorActive: norepiNm > 20, creatinineMgDl: 1.5, lactateMmolL: 3.2,
  }), [respRate, sysBp, gcs, norepiNm]);

  const remopResult = useMemo(() => evaluateRemopReceptorOccupancy({
    agentName: 'norepinephrine', plasmaConcentrationNm: norepiNm, dissociationConstantKdNm: 40, hillCoefficient: 1.4,
  }), [norepiNm]);

  const pantheonResult = useMemo(() => evaluatePantheonMultiSpecialistConsensus({
    lvefPct: 34, meanArterialPressureMmHg: Math.round(sysBp * 0.72),
    lactateMmolL: 3.2, egfrMlMin173m2: 38, paO2FiO2Ratio: 185,
  }), [sysBp]);

  const oneOsResult = useMemo(() => evaluateOneOsEncounterPayerHarmonization({
    encounterId: 'ENC-JKT-2026-088', currentStage: 'universal_payer_claim', patientIdentityVerified: true,
    icd10PrimaryCode: 'A41.9', diagnosticReferralClosed: true, clinicianSignedOff: false,
  }), []);

  const sensoriumResult = useMemo(() => evaluateSensoriumBiometricsAndGait({
    cgmReadingsMgDl: [92, 98, 108, 124, 142, 131, 115, 102, 96, 89],
    hrvRmssdMs: 68, hrvSdnnMs: 82, spo2Pct: 97,
    mtpDorsiflexionDeg: mtpAngleDeg, calcaneusFloorClearanceMm: mtpAngleDeg >= 15 ? 18 : 2,
  }), [mtpAngleDeg]);

  const longevityExposome = useMemo(() => evaluateLongevityNutritionAndExposome({
    chronologicalAgeYears: 42, phenoAgeEstimateYears: 38.4,
    fsrsCurrentStabilityDays: 21, daysSinceLastThermalHabit: 2,
    saunaMinutesWeekly: saunaMinutes, pm25UgM3: 16, uvIndex: 5, circadianDaylightLux: 11500,
  }), [saunaMinutes]);

  const visemePreview = useMemo(() => mapTextToVrmVisemeFrames('Reviewing KaloLumen 3D and BioEmu structural states'), []);
  const longevitySummary = useMemo(() => evaluateLongevityEnergyBalance({
    weightKg: 70, intakeProteinG: 145, intakeCarbsG: 240, intakeFatG: 68,
    restingMetabolicRateKcal: 1680, workoutMet: 7.5, workoutDurationMinutes: 45, hrvRmssdMs: 72, sleepEfficiencyPct: 91,
  }), []);

  const multiscaleCoupling = useMemo(() => evaluateOmnicausalisMultiscaleCoupling({
    bioEmuOpenProbability: bioEmuResult.payload.openProbability,
    mitoOxPhosAtpFluxIndex: mitoResult.payload.oxPhosAtpFluxIndex,
    mitophagyActive: mitoResult.payload.pink1ParkinMitophagyActive,
    remopReceptorOccupancy: remopResult.payload.fractionalOccupancy,
    sepsisSofaTotalScore: sepsisResult.payload.sofaTotalScore,
    cgmTimeInRangePct: sensoriumResult.payload.cgmTimeInRangePct,
    footStrikeClassification: sensoriumResult.payload.footStrikeClassification,
    bioAgeDeltaYears: longevityExposome.payload.bioAgeDeltaYears,
    exposomeOxidativeBurdenIndex: longevityExposome.payload.exposomeOxidativeBurdenIndex,
    recordedDeviceChannelsCount: udtEnvelope.payload.recordedChannelsCount,
    predictionVsObservedResidualPct: residualPct,
  }), [
    bioEmuResult.payload.openProbability, mitoResult.payload.oxPhosAtpFluxIndex,
    mitoResult.payload.pink1ParkinMitophagyActive, remopResult.payload.fractionalOccupancy,
    sepsisResult.payload.sofaTotalScore, sensoriumResult.payload.cgmTimeInRangePct,
    sensoriumResult.payload.footStrikeClassification, longevityExposome.payload.bioAgeDeltaYears,
    longevityExposome.payload.exposomeOxidativeBurdenIndex, udtEnvelope.payload.recordedChannelsCount,
    residualPct,
  ]);

  const cardStyle: React.CSSProperties = { backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '0.875rem', padding: isDesktop ? '1.125rem' : '0.875rem' };
  const boxStyle: React.CSSProperties = { padding: '0.625rem', borderRadius: '0.5rem', backgroundColor: '#020617', border: '1px solid #1e293b', fontSize: '0.75rem' };
  const activeStageMeta = GRAMMAR_STAGES.find((s) => s.id === grammarStage) ?? GRAMMAR_STAGES[0]!;

  return (
    <section aria-label="Omnicausalis Transcendental Command Deck" style={{ backgroundColor: '#020617', color: '#f8fafc', borderRadius: '1rem', border: '1px solid #1e293b', padding: isDesktop ? '1.5rem' : '1rem', marginTop: '1rem' }}>
      <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', padding: '0.125rem 0.625rem', borderRadius: '9999px', backgroundColor: '#0c4a6e', color: '#38bdf8', border: '1px solid #0284c7' }}>Omnicausalis 7-Pillar Matrix</span>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.125rem 0.625rem', borderRadius: '9999px', backgroundColor: '#064e3b', color: '#34d399', border: '1px solid #059669' }}>Truth Classes: {udtEnvelope.truthClass} / {sepsisResult.truthClass} / {kaloLumenResult.truthClass}</span>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.125rem 0.625rem', borderRadius: '9999px', backgroundColor: '#4c0519', color: '#fb7185', border: '1px solid #e11d48' }}>clinically_reviewed=false</span>
        </div>
        <h2 style={{ fontSize: isDesktop ? '1.375rem' : '1.125rem', fontWeight: 900, color: '#ffffff', marginTop: '0.375rem' }}>Panacea-OS Transcendental Architecture: Quantum Biology · UHD DICOM · Pantheon CDSS · Sensorium · Longevity</h2>
        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>{OMNICAUSALIS_SAFETY_DISCLAIMER}</p>

        <div role="tablist" aria-label="Interaction Grammar Bar" style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(6, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))', gap: '0.5rem', marginTop: '0.75rem' }}>
          {GRAMMAR_STAGES.map((st) => (
            <button key={st.id} type="button" role="tab" aria-selected={grammarStage === st.id} onClick={() => setGrammarStage(st.id)} style={{ minHeight: '44px', padding: '0.375rem 0.625rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 800, backgroundColor: grammarStage === st.id ? '#0284c7' : '#0f172a', color: grammarStage === st.id ? '#ffffff' : '#cbd5e1', border: '1px solid #1e293b', cursor: 'pointer' }}>
              {st.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>{activeStageMeta.prompt}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(2, minmax(0, 1fr))' : 'repeat(1, minmax(0, 1fr))', gap: '1rem' }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#38bdf8' }}>Pilar II · KaloLumen 3DCG & Universal Device Translation OS</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: kaloLumenResult.payload.subTenSecondCompliant ? '#34d399' : '#f43f5e' }}>{kaloLumenResult.payload.estimatedReconstructionMs} ms (&lt; 10s OK)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {kaloLumenResult.payload.layers.map((layer, idx) => (
              <div key={layer.layerId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', backgroundColor: '#020617', border: '1px solid #1e293b', fontSize: '0.75rem' }}>
                <div><div style={{ fontWeight: 700, color: '#e2e8f0' }}>{layer.label}</div><div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>HU [{layer.hounsfieldMin}, {layer.hounsfieldMax}] • Opacity {(layer.opacity * 100).toFixed(0)}%</div></div>
                <button type="button" onClick={() => { const next: [boolean, boolean, boolean] = [...layerEnabled] as [boolean, boolean, boolean]; next[idx] = !next[idx]; setLayerEnabled(next); }} style={{ minHeight: '44px', minWidth: '64px', padding: '0.25rem 0.625rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, backgroundColor: layer.enabled ? '#065f46' : '#1e293b', color: layer.enabled ? '#a7f3d0' : '#94a3b8', border: '1px solid #334155', cursor: 'pointer' }}>{layer.enabled ? 'ON' : 'OFF'}</button>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
            <label><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.6875rem' }}>Azimuth ({azimuthDeg}°)</span><input type="range" min={-180} max={180} value={azimuthDeg} onChange={(e) => setAzimuthDeg(Number(e.target.value))} style={{ width: '100%', minHeight: '44px' }} /></label>
            <label><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.6875rem' }}>Elevation ({elevationDeg}°)</span><input type="range" min={-90} max={90} value={elevationDeg} onChange={(e) => setElevationDeg(Number(e.target.value))} style={{ width: '100%', minHeight: '44px' }} /></label>
            <label><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.6875rem' }}>Slices ({sliceCount})</span><input type="range" min={64} max={2048} step={64} value={sliceCount} onChange={(e) => setSliceCount(Number(e.target.value))} style={{ width: '100%', minHeight: '44px' }} /></label>
          </div>
          <div style={boxStyle}>
            <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginBottom: '0.25rem' }}>UDT-OS Envelope ({udtEnvelope.payload.deviceId} • Light Vec {kaloLumenResult.payload.lightDirectionVector.x.toFixed(2)}, {kaloLumenResult.payload.lightDirectionVector.y.toFixed(2)}, {kaloLumenResult.payload.lightDirectionVector.z.toFixed(2)}):</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {Object.entries(udtEnvelope.payload.normalizedTelemetry).map(([ch, val]) => (
                <span key={ch} style={{ fontSize: '0.6875rem', padding: '0.125rem 0.5rem', borderRadius: '0.375rem', backgroundColor: '#1e293b', color: val === null ? '#fbbf24' : '#34d399' }}>
                  {ch}: {val === null ? '— (Missing)' : val}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#34d399' }}>Pilar I · BioEmu-2 · BindCraft2 · Mitochondrial OxPhos</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8' }}>Open Prob: {(bioEmuResult.payload.openProbability * 100).toFixed(1)}% • ATP: {mitoResult.payload.oxPhosAtpFluxIndex}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {(['cav1_2_ltcc', 'ryr2_sr_release'] as const).map((tid) => (
              <button key={tid} type="button" onClick={() => setChannelTarget(tid)} style={{ minHeight: '44px', flex: 1, borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, backgroundColor: channelTarget === tid ? '#0c4a6e' : '#020617', color: channelTarget === tid ? '#38bdf8' : '#94a3b8', border: '1px solid #1e293b', cursor: 'pointer' }}>{tid === 'cav1_2_ltcc' ? 'Ca_v1.2 LTCC' : 'RyR2 SR Release'}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.5rem', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
            <label><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.6875rem' }}>Vm ({membraneMv}mV)</span><input type="range" min={-90} max={40} value={membraneMv} onChange={(e) => setMembraneMv(Number(e.target.value))} style={{ width: '100%', minHeight: '44px' }} /></label>
            <label><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.6875rem' }}>ΔG ({deltaGBind})</span><input type="range" min={-18} max={-4} step={0.5} value={deltaGBind} onChange={(e) => setDeltaGBind(Number(e.target.value))} style={{ width: '100%', minHeight: '44px' }} /></label>
            <label><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.6875rem' }}>ipTM ({ipTm.toFixed(2)})</span><input type="range" min={0.4} max={0.98} step={0.02} value={ipTm} onChange={(e) => setIpTm(Number(e.target.value))} style={{ width: '100%', minHeight: '44px' }} /></label>
            <label><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.6875rem' }}>ΔΨm ({mitoPsiMv}mV)</span><input type="range" min={-200} max={-60} value={mitoPsiMv} onChange={(e) => setMitoPsiMv(Number(e.target.value))} style={{ width: '100%', minHeight: '44px' }} /></label>
          </div>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: 700, color: '#ffffff' }}>Binder: {binderAssessment.payload.stabilityScore.toFixed(1)}/100 (Kd ≈ {binderAssessment.payload.KdNanomolarEstimate} nM)</span>
              <span style={{ color: '#34d399', fontFamily: 'monospace' }}>LC3-II: {mitoResult.payload.lc3IITurnoverRate} • Resilience: {mitoResult.payload.bioenergeticResilienceScore}</span>
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#cbd5e1', fontStyle: 'italic' }}>{arenaRound.payload.rivalCommentary}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.375rem' }}>
              {PROTEIN_FIGHTER_BOTS.map((b) => <span key={b.botId} style={{ fontSize: '0.6875rem', padding: '0.125rem 0.5rem', borderRadius: '9999px', backgroundColor: '#1e293b', color: '#e2e8f0' }}>{b.displayName}: {b.benchmarkStabilityScore}</span>)}
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#f43f5e' }}>Pilar III & IV · SepsisAgent · Pantheon Consensus · One-OS Payer</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: sepsisResult.payload.qSofaHighRisk ? '#fb7185' : '#34d399' }}>qSOFA {sepsisResult.payload.qSofaScore}/3 • SOFA {sepsisResult.payload.sofaTotalScore}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.5rem', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
            <label><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.6875rem' }}>RR ({respRate}/m)</span><input type="range" min={10} max={45} value={respRate} onChange={(e) => setRespRate(Number(e.target.value))} style={{ width: '100%', minHeight: '44px' }} /></label>
            <label><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.6875rem' }}>SBP ({sysBp})</span><input type="range" min={60} max={180} value={sysBp} onChange={(e) => setSysBp(Number(e.target.value))} style={{ width: '100%', minHeight: '44px' }} /></label>
            <label><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.6875rem' }}>GCS ({gcs})</span><input type="range" min={3} max={15} value={gcs} onChange={(e) => setGcs(Number(e.target.value))} style={{ width: '100%', minHeight: '44px' }} /></label>
            <label><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.6875rem' }}>NE ({norepiNm} nM)</span><input type="range" min={0} max={200} value={norepiNm} onChange={(e) => setNorepiNm(Number(e.target.value))} style={{ width: '100%', minHeight: '44px' }} /></label>
          </div>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: 700, color: '#e2e8f0' }}>REMOP Occupancy: {(remopResult.payload.fractionalOccupancy * 100).toFixed(1)}%</span>
              <span style={{ color: '#fbbf24', fontWeight: 700 }}>Sign-Off Required: {String(sepsisResult.payload.requiresHumanPhysicianSignoff)} • Zero-Loss: {String(oneOsResult.payload.zeroLossContinuityVerified)}</span>
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#38bdf8', marginBottom: '0.25rem' }}>Pantheon: {pantheonResult.payload.harmonizedProtocol[0]?.directive}</div>
            {sepsisResult.payload.survivingSepsisOneHourBundle.slice(0, 2).map((item) => <div key={item} style={{ fontSize: '0.6875rem', color: '#cbd5e1' }}>• {item}</div>)}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#a855f7' }}>Pilar V & VI · Sensorium Gait · Nusantara Nutrition · Exposome</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399' }}>TIR: {sensoriumResult.payload.cgmTimeInRangePct}% • ΔBioAge: {longevityExposome.payload.bioAgeDeltaYears}y</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.5rem', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
            <label><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.6875rem' }}>MTP Angle ({mtpAngleDeg}°)</span><input type="range" min={5} max={45} value={mtpAngleDeg} onChange={(e) => setMtpAngleDeg(Number(e.target.value))} style={{ width: '100%', minHeight: '44px' }} /></label>
            <label><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.6875rem' }}>Sauna ({saunaMinutes}m/wk)</span><input type="range" min={0} max={180} step={15} value={saunaMinutes} onChange={(e) => setSaunaMinutes(Number(e.target.value))} style={{ width: '100%', minHeight: '44px' }} /></label>
          </div>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ color: '#e2e8f0', fontWeight: 700 }}>Strike: {sensoriumResult.payload.footStrikeClassification} ({longevitySummary.payload.netEnergyBalanceKcal} kcal net)</span>
              <span style={{ color: '#38bdf8' }}>FSRS Stability: {longevityExposome.payload.fsrsNextStabilityDays}d</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.375rem' }}>
              {NUSANTARA_FUNCTIONAL_DISHES.slice(0, 3).map((d) => <span key={d.dishId} style={{ fontSize: '0.6875rem', padding: '0.125rem 0.5rem', borderRadius: '0.375rem', backgroundColor: '#1e293b', color: '#a7f3d0' }}>{d.displayName} ({d.proteinG}g P)</span>)}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {visemePreview.slice(0, 4).map((vf) => <span key={vf.index} style={{ fontSize: '0.6875rem', fontFamily: 'monospace', padding: '0.125rem 0.4rem', borderRadius: '0.375rem', backgroundColor: '#1e293b', color: '#38bdf8' }}>{vf.token}→{vf.viseme}</span>)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, marginTop: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#38bdf8' }}>
            Multiscale Omnicausalis Coupling & Reality Engine Identifiability Gate
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, padding: '0.125rem 0.5rem', borderRadius: '9999px', backgroundColor: multiscaleCoupling.payload.parameterIdentifiabilityVerified ? '#064e3b' : '#78350f', color: multiscaleCoupling.payload.parameterIdentifiabilityVerified ? '#34d399' : '#fbbf24' }}>
              {multiscaleCoupling.payload.parameterIdentifiabilityVerified ? 'IDENTIFIABLE (Calibration Permitted)' : 'UNIDENTIFIED (Calibration Locked)'}
            </span>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.125rem 0.5rem', borderRadius: '9999px', backgroundColor: '#1e293b', color: '#cbd5e1' }}>
              isolatedFromCanonicalHistory={String(multiscaleCoupling.payload.isolatedFromCanonicalHistory)}
            </span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={boxStyle}>
            <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.6875rem' }}>Myocardial Bioenergetic Reserve</span>
            <span style={{ fontWeight: 800, color: '#34d399', fontSize: '0.875rem' }}>{multiscaleCoupling.payload.myocardialBioenergeticReservePct}%</span>
          </div>
          <div style={boxStyle}>
            <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.6875rem' }}>Coupled Hemodynamic Stability</span>
            <span style={{ fontWeight: 800, color: multiscaleCoupling.payload.vascularHyporeactivityRisk ? '#fb7185' : '#38bdf8', fontSize: '0.875rem' }}>
              {multiscaleCoupling.payload.coupledHemodynamicStabilityIndex}/100 {multiscaleCoupling.payload.vascularHyporeactivityRisk ? '(Hyporeactive Alert)' : ''}
            </span>
          </div>
          <div style={boxStyle}>
            <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.6875rem' }}>Systemic Allostatic Load</span>
            <span style={{ fontWeight: 800, color: '#a855f7', fontSize: '0.875rem' }}>{multiscaleCoupling.payload.systemicAllostaticLoadIndex}/100</span>
          </div>
          <div style={boxStyle}>
            <label>
              <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.6875rem' }}>Prediction-vs-Reality Residual ({residualPct}% • Gap {multiscaleCoupling.payload.realityGapScore}%)</span>
              <input type="range" min={0} max={40} value={residualPct} onChange={(e) => setResidualPct(Number(e.target.value))} style={{ width: '100%', minHeight: '44px' }} />
            </label>
          </div>
        </div>
        <div style={{ ...boxStyle, color: '#cbd5e1', fontSize: '0.6875rem' }}>
          {multiscaleCoupling.payload.counterfactualBranchSummary}
        </div>
      </div>
    </section>
  );
};

export default OmnicausalisCommandDeck;
