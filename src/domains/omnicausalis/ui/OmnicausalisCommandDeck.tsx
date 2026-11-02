// @panacea-claim-boundary: simulation-not-clinical
import React, { useMemo, useState } from 'react';
import { useAdaptive } from '../../../shared/adaptive/useAdaptive.ts';
import {
  DEFAULT_KALOLUMEN_LAYERS, PROTEIN_FIGHTER_BOTS, evaluateBioEmuConformationalEnsemble,
  evaluateDeNovoBinderCandidate, evaluateKaloLumenReconstruction, evaluateLongevityEnergyBalance,
  evaluateRemopReceptorOccupancy, evaluateSepsisSafeguard, mapTextToVrmVisemeFrames, runProteinFighterArenaRound,
} from '../engine/omnicausalisEngine.ts';
import { OMNICAUSALIS_SAFETY_DISCLAIMER, type IonChannelTargetId } from '../model/types.ts';

export const OmnicausalisCommandDeck: React.FC = () => {
  const { isDesktop } = useAdaptive();
  const [azimuthDeg, setAzimuthDeg] = useState(35);
  const [elevationDeg, setElevationDeg] = useState(42);
  const [sliceCount, setSliceCount] = useState(512);
  const [layerEnabled, setLayerEnabled] = useState<readonly [boolean, boolean, boolean]>([true, true, true]);
  const [channelTarget, setChannelTarget] = useState<IonChannelTargetId>('cav1_2_ltcc');
  const [membraneMv, setMembraneMv] = useState(-15);
  const [deltaGBind, setDeltaGBind] = useState(-11.8);
  const [ipTm, setIpTm] = useState(0.86);
  const [respRate, setRespRate] = useState(24);
  const [sysBp, setSysBp] = useState(92);
  const [gcs, setGcs] = useState(14);
  const [norepiNm, setNorepiNm] = useState(45);

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

  const arenaRound = useMemo(() => runProteinFighterArenaRound(binderAssessment), [binderAssessment]);
  const sepsisResult = useMemo(() => evaluateSepsisSafeguard({
    respiratoryRateBpm: respRate, systolicBpMmHg: sysBp, glasgowComaScale: gcs, paO2FiO2Ratio: 240,
    platelets10e3PerUl: 140, bilirubinMgDl: 1.4, meanArterialPressureMmHg: Math.round(sysBp * 0.72),
    vasopressorActive: norepiNm > 20, creatinineMgDl: 1.5, lactateMmolL: 3.2,
  }), [respRate, sysBp, gcs, norepiNm]);

  const remopResult = useMemo(() => evaluateRemopReceptorOccupancy({
    agentName: 'norepinephrine', plasmaConcentrationNm: norepiNm, dissociationConstantKdNm: 40, hillCoefficient: 1.4,
  }), [norepiNm]);

  const visemePreview = useMemo(() => mapTextToVrmVisemeFrames('Reviewing KaloLumen 3D and BioEmu structural states'), []);
  const longevitySummary = useMemo(() => evaluateLongevityEnergyBalance({
    weightKg: 70, intakeProteinG: 145, intakeCarbsG: 240, intakeFatG: 68,
    restingMetabolicRateKcal: 1680, workoutMet: 7.5, workoutDurationMinutes: 45, hrvRmssdMs: 72, sleepEfficiencyPct: 91,
  }), []);

  const cardStyle: React.CSSProperties = { backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '0.875rem', padding: isDesktop ? '1.125rem' : '0.875rem' };
  const boxStyle: React.CSSProperties = { padding: '0.625rem', borderRadius: '0.5rem', backgroundColor: '#020617', border: '1px solid #1e293b', fontSize: '0.75rem' };

  return (
    <section aria-label="Omnicausalis Transcendental Command Deck" style={{ backgroundColor: '#020617', color: '#f8fafc', borderRadius: '1rem', border: '1px solid #1e293b', padding: isDesktop ? '1.5rem' : '1rem', marginTop: '1rem' }}>
      <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', padding: '0.125rem 0.625rem', borderRadius: '9999px', backgroundColor: '#0c4a6e', color: '#38bdf8', border: '1px solid #0284c7' }}>Omnicausalis Holistic Matrix</span>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.125rem 0.625rem', borderRadius: '9999px', backgroundColor: '#064e3b', color: '#34d399', border: '1px solid #059669' }}>Truth Class: {kaloLumenResult.truthClass} / {sepsisResult.truthClass}</span>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.125rem 0.625rem', borderRadius: '9999px', backgroundColor: '#4c0519', color: '#fb7185', border: '1px solid #e11d48' }}>clinically_reviewed=false</span>
        </div>
        <h2 style={{ fontSize: isDesktop ? '1.375rem' : '1.125rem', fontWeight: 900, color: '#ffffff', marginTop: '0.375rem' }}>KaloLumen 3DCG · BioEmu-2 / BindCraft2 / ProteinFighter · SepsisAgent / REMOP</h2>
        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>{OMNICAUSALIS_SAFETY_DISCLAIMER}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(2, minmax(0, 1fr))' : 'repeat(1, minmax(0, 1fr))', gap: '1rem' }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#38bdf8' }}>KaloLumen 3-Layer DICOM Reconstruction</span>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem', fontSize: '0.75rem' }}>
            <label><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.6875rem' }}>Azimuth ({azimuthDeg}°)</span><input type="range" min={-180} max={180} value={azimuthDeg} onChange={(e) => setAzimuthDeg(Number(e.target.value))} style={{ width: '100%', minHeight: '44px' }} /></label>
            <label><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.6875rem' }}>Elevation ({elevationDeg}°)</span><input type="range" min={-90} max={90} value={elevationDeg} onChange={(e) => setElevationDeg(Number(e.target.value))} style={{ width: '100%', minHeight: '44px' }} /></label>
            <label><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.6875rem' }}>Slices ({sliceCount})</span><input type="range" min={64} max={2048} step={64} value={sliceCount} onChange={(e) => setSliceCount(Number(e.target.value))} style={{ width: '100%', minHeight: '44px' }} /></label>
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '0.375rem', fontFamily: 'monospace' }}>Light Vector: ({kaloLumenResult.payload.lightDirectionVector.x.toFixed(3)}, {kaloLumenResult.payload.lightDirectionVector.y.toFixed(3)}, {kaloLumenResult.payload.lightDirectionVector.z.toFixed(3)})</div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#34d399' }}>BioEmu-2 · BindCraft2 · ProteinFighter Arena</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8' }}>Open Prob: {(bioEmuResult.payload.openProbability * 100).toFixed(1)}%</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {(['cav1_2_ltcc', 'ryr2_sr_release'] as const).map((tid) => (
              <button key={tid} type="button" onClick={() => setChannelTarget(tid)} style={{ minHeight: '44px', flex: 1, borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, backgroundColor: channelTarget === tid ? '#0c4a6e' : '#020617', color: channelTarget === tid ? '#38bdf8' : '#94a3b8', border: '1px solid #1e293b', cursor: 'pointer' }}>{tid === 'cav1_2_ltcc' ? 'Ca_v1.2 LTCC' : 'RyR2 SR Release'}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
            <label><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.6875rem' }}>Vm ({membraneMv} mV)</span><input type="range" min={-90} max={40} value={membraneMv} onChange={(e) => setMembraneMv(Number(e.target.value))} style={{ width: '100%', minHeight: '44px' }} /></label>
            <label><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.6875rem' }}>ΔG_bind ({deltaGBind} kcal)</span><input type="range" min={-18} max={-4} step={0.5} value={deltaGBind} onChange={(e) => setDeltaGBind(Number(e.target.value))} style={{ width: '100%', minHeight: '44px' }} /></label>
            <label><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.6875rem' }}>ipTM ({ipTm.toFixed(2)})</span><input type="range" min={0.4} max={0.98} step={0.02} value={ipTm} onChange={(e) => setIpTm(Number(e.target.value))} style={{ width: '100%', minHeight: '44px' }} /></label>
          </div>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
              <span style={{ fontWeight: 700, color: '#ffffff' }}>Binder Stability: {binderAssessment.payload.stabilityScore.toFixed(1)} / 100</span>
              <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>Kd ≈ {binderAssessment.payload.KdNanomolarEstimate} nM • OOD {(binderAssessment.payload.oodEpistemicUncertainty * 100).toFixed(0)}%</span>
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#cbd5e1', fontStyle: 'italic' }}>{arenaRound.payload.rivalCommentary}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.375rem' }}>
              {PROTEIN_FIGHTER_BOTS.map((b) => <span key={b.botId} style={{ fontSize: '0.6875rem', padding: '0.125rem 0.5rem', borderRadius: '9999px', backgroundColor: '#1e293b', color: '#e2e8f0' }}>{b.displayName}: {b.benchmarkStabilityScore}</span>)}
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#f43f5e' }}>SepsisAgent (qSOFA / SOFA) & REMOP Receptor Occupancy</span>
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
              <span style={{ fontWeight: 700, color: '#e2e8f0' }}>REMOP α1/β1 Occupancy: {(remopResult.payload.fractionalOccupancy * 100).toFixed(1)}%</span>
              <span style={{ color: '#fbbf24', fontWeight: 700 }}>Physician Sign-Off Required: {String(sepsisResult.payload.requiresHumanPhysicianSignoff)}</span>
            </div>
            {sepsisResult.payload.survivingSepsisOneHourBundle.map((item) => <div key={item} style={{ fontSize: '0.6875rem', color: '#cbd5e1', marginTop: '0.125rem' }}>• {item}</div>)}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#a855f7' }}>Wearable Longevity & VRM 5-Viseme Avatar Sync</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399' }}>Readiness: {longevitySummary.payload.autonomicReadinessIndex}/100</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={boxStyle}><span style={{ fontSize: '0.6875rem', color: '#94a3b8', display: 'block' }}>Intake</span><span style={{ fontWeight: 800, color: '#ffffff' }}>{longevitySummary.payload.totalIntakeKcal} kcal</span></div>
            <div style={boxStyle}><span style={{ fontSize: '0.6875rem', color: '#94a3b8', display: 'block' }}>Expenditure</span><span style={{ fontWeight: 800, color: '#ffffff' }}>{longevitySummary.payload.totalExpenditureKcal} kcal</span></div>
            <div style={boxStyle}><span style={{ fontSize: '0.6875rem', color: '#94a3b8', display: 'block' }}>Net Balance</span><span style={{ fontWeight: 800, color: '#38bdf8' }}>+{longevitySummary.payload.netEnergyBalanceKcal} kcal</span></div>
          </div>
          <div style={boxStyle}>
            <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginBottom: '0.375rem' }}>VRM 5-Viseme Lip-Sync Stream (`aa`, `ih`, `ou`, `ee`, `oh`):</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {visemePreview.map((vf) => <span key={vf.index} style={{ fontSize: '0.6875rem', fontFamily: 'monospace', padding: '0.125rem 0.5rem', borderRadius: '0.375rem', backgroundColor: '#1e293b', color: '#38bdf8' }}>{vf.token} → [{vf.viseme}:{vf.weight}]</span>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OmnicausalisCommandDeck;
