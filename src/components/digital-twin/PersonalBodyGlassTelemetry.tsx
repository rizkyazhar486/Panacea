import React, { useState, type CSSProperties } from 'react';

export interface PersonalBodyGlassTelemetryProps {
  readonly userName?: string;
  readonly recoveryScore?: number;
  readonly strainScore?: number;
  readonly sleepScore?: number;
  readonly restingHeartRate?: number;
  readonly rmssdMs?: number;
  readonly hrr60Bpm?: number;
  readonly bodyWeightKg?: number;
  readonly bodyFatPercent?: number;
  readonly leanMassKg?: number;
  readonly biologicalAgeDeltaYears?: number;
  readonly longitudinalId?: string;
}

const cardBase: CSSProperties = {
  backgroundColor: 'rgba(6, 9, 13, 0.88)',
  backdropFilter: 'blur(32px)',
  WebkitBackdropFilter: 'blur(32px)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '28px',
  color: '#FFFFFF',
  padding: '24px',
  boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.9)',
};

const tileBase: CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '18px',
  padding: '16px',
};

export const PersonalBodyGlassTelemetry: React.FC<PersonalBodyGlassTelemetryProps> = ({
  userName = 'You',
  recoveryScore = 86,
  strainScore = 14.2,
  sleepScore = 89,
  restingHeartRate = 48,
  rmssdMs = 76,
  hrr60Bpm = 36,
  bodyWeightKg = 70.4,
  bodyFatPercent = 12.6,
  leanMassKg = 61.5,
  biologicalAgeDeltaYears = -2.8,
  longitudinalId = 'PANACEA-LID-2026-X889',
}) => {
  const [activePillar, setActivePillar] = useState<'CARDIO' | 'METABOLIC' | 'NEURO' | 'ORTHO' | 'ENDOCRINE'>('CARDIO');
  const [showCathedralOath, setShowCathedralOath] = useState<boolean>(false);

  const C = 226.2;
  const recoveryOffset = C - (recoveryScore / 100) * C;
  const strainOffset = C - (Math.min(21, strainScore) / 21) * C;
  const sleepOffset = C - (sleepScore / 100) * C;

  const healthspanPillars = [
    { id: 'CARDIO' as const, label: 'Cardiovascular', jewel: '#0A84FF', score: '94%', metric: 'VO2max 54 · HRR60 36 bpm', desc: 'Superior arterial compliance, endothelial nitric oxide reserve, and rapid vagal cardiac reactivation.' },
    { id: 'METABOLIC' as const, label: 'Metabolism', jewel: '#00BF63', score: '91%', metric: 'FatMax 74% · Glycemic AUC low', desc: 'High mitochondrial flexibility, sustained lipid beta-oxidation, and robust peripheral insulin sensitivity.' },
    { id: 'NEURO' as const, label: 'Neuroplasticity', jewel: '#AF52DE', score: '89%', metric: 'SWS Delta 1h 48m · BDNF high', desc: 'Restorative slow-wave sleep architecture, circadian amplitude stabilization, and synaptic maintenance.' },
    { id: 'ORTHO' as const, label: 'Orthopedic', jewel: '#FF9F0A', score: '88%', metric: 'Lean Mass 61.5 kg · SMI 8.9', desc: 'Myofibrillar hypertrophy preservation, joint kinematic alignment, and tendon elastic energy return.' },
    { id: 'ENDOCRINE' as const, label: 'Endocrine Vitality', jewel: '#FF453A', score: '92%', metric: 'Anabolic Ratio 1.28 · DHEA high', desc: 'Circadian cortisol awakening surge with balanced nocturnal anabolic regeneration and hormonal equilibrium.' },
  ];

  const currentPillar = healthspanPillars.find(p => p.id === activePillar) ?? healthspanPillars[0];

  return (
    <section aria-label="Cathedral Healthspan & Longitudinal Identity Matrix" style={cardBase}>
      {/* Top Cathedral Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: '#00BF63' }} />
            <span style={{ fontSize: '11px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#9CA3AF' }}>
              Longitudinal Healthspan Portfolio · Sagrada Matrix
            </span>
            <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '10px', fontFamily: 'monospace', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {longitudinalId}
            </span>
          </div>
          <h3 style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 300, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>{userName}</span>
            <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '9999px', background: 'rgba(0, 191, 99, 0.15)', color: '#00BF63', border: '1px solid rgba(0, 191, 99, 0.3)' }}>
              Healthspan {biologicalAgeDeltaYears < 0 ? `${Math.abs(biologicalAgeDeltaYears)} Years Ahead` : `${biologicalAgeDeltaYears} Years`}
            </span>
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setShowCathedralOath(v => !v)}
          style={{ padding: '8px 16px', borderRadius: '9999px', fontSize: '12px', fontFamily: 'monospace', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#D1D5DB', cursor: 'pointer' }}
        >
          {showCathedralOath ? 'Close Oath & Doctrine' : 'Hippocratic Charter'}
        </button>
      </div>

      {/* Sagrada Família Sacred Oath Reflection Drawer */}
      {showCathedralOath && (
        <div style={{ marginTop: '16px', padding: '18px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span>🏛️</span>
            <span style={{ fontSize: '11px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#00BF63' }}>
              The Panacea Sacred Architectural Charter & Hippocratic Commitment
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.6, color: '#D1D5DB' }}>
            <span>&ldquo;Like Antoni Gaudí’s Sagrada Família—soaring, cathedral-scaled, yet intimately anchored to nature’s mathematical proportions—PanaceaMed honors the sacred temple of human biology. We reject hollow commodification, opaque black-boxes, and synthetic disease creation. Every signal, pixel, and equation serves to defend human healthspan, foster profound vitality, and uphold the timeless physician’s oath: to cure sometimes, to treat often, to comfort always, and above all, to do no harm.&rdquo;</span>
          </p>
        </div>
      )}

      {/* 3 Jewel-Tone Stained Glass Luminous Rings */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '20px' }}>
        {/* Ring 1: Imperial Jade Vagal Recovery */}
        <div style={{ ...tileBase, border: '1px solid rgba(0, 191, 99, 0.25)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative', width: '72px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ width: '72px', height: '72px', transform: 'rotate(-90deg)' }} viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="36" stroke="rgba(255,255,255,0.06)" strokeWidth="7" fill="none" />
              <circle cx="44" cy="44" r="36" stroke="#00BF63" strokeWidth="7" strokeDasharray={C} strokeDashoffset={recoveryOffset} strokeLinecap="round" fill="none" />
            </svg>
            <span style={{ position: 'absolute', fontSize: '13px', fontWeight: 700, color: '#00BF63' }}>{recoveryScore}%</span>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#9CA3AF' }}>Imperial Jade</div>
            <div style={{ fontSize: '14px', fontWeight: 400, color: '#FFFFFF' }}>Vagal Recovery</div>
            <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace' }}>rMSSD {rmssdMs} ms · HRR60 {hrr60Bpm} bpm</div>
          </div>
        </div>

        {/* Ring 2: Royal Amber Exertion Strain */}
        <div style={{ ...tileBase, border: '1px solid rgba(255, 159, 10, 0.25)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative', width: '72px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ width: '72px', height: '72px', transform: 'rotate(-90deg)' }} viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="36" stroke="rgba(255,255,255,0.06)" strokeWidth="7" fill="none" />
              <circle cx="44" cy="44" r="36" stroke="#FF9F0A" strokeWidth="7" strokeDasharray={C} strokeDashoffset={strainOffset} strokeLinecap="round" fill="none" />
            </svg>
            <span style={{ position: 'absolute', fontSize: '13px', fontWeight: 700, color: '#FF9F0A' }}>{strainScore}</span>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#9CA3AF' }}>Topaz Amber</div>
            <div style={{ fontSize: '14px', fontWeight: 400, color: '#FFFFFF' }}>Cardiovascular Load</div>
            <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace' }}>Banister TSB +6.4 (Form Peak)</div>
          </div>
        </div>

        {/* Ring 3: Imperial Amethyst Delta Sleep */}
        <div style={{ ...tileBase, border: '1px solid rgba(175, 82, 222, 0.25)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative', width: '72px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ width: '72px', height: '72px', transform: 'rotate(-90deg)' }} viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="36" stroke="rgba(255,255,255,0.06)" strokeWidth="7" fill="none" />
              <circle cx="44" cy="44" r="36" stroke="#AF52DE" strokeWidth="7" strokeDasharray={C} strokeDashoffset={sleepOffset} strokeLinecap="round" fill="none" />
            </svg>
            <span style={{ position: 'absolute', fontSize: '13px', fontWeight: 700, color: '#AF52DE' }}>{sleepScore}%</span>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#9CA3AF' }}>Amethyst Violet</div>
            <div style={{ fontSize: '14px', fontWeight: 400, color: '#FFFFFF' }}>Delta Restorative</div>
            <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace' }}>RHR {restingHeartRate} bpm · Deep 1h 48m</div>
          </div>
        </div>
      </div>

      {/* Five Pillars of Transcendent Healthspan */}
      <div style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#9CA3AF' }}>
            5 Essential Healthspan Pillars
          </span>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#0A84FF' }}>
            Living Long In Well-Happy Life
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
          {healthspanPillars.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActivePillar(p.id)}
              style={{
                backgroundColor: activePillar === p.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                border: activePillar === p.id ? `1px solid ${p.jewel}` : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                padding: '12px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: p.jewel }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>{p.score}</span>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 500, color: '#FFFFFF' }}>{p.label}</div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: '12px', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: `4px solid ${currentPillar.jewel}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#FFFFFF' }}>{currentPillar.label} Optimization</h4>
            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#D1D5DB' }}>{currentPillar.metric}</span>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF', lineHeight: 1.5 }}>{currentPillar.desc}</p>
        </div>
      </div>

      {/* Personalized Body Twin Biometrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={tileBase}>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#9CA3AF' }}>Weight</div>
          <div style={{ fontSize: '20px', fontWeight: 300, color: '#FFFFFF' }}>{bodyWeightKg} <span style={{ fontSize: '11px', color: '#9CA3AF' }}>kg</span></div>
          <div style={{ fontSize: '10px', color: '#00BF63', fontFamily: 'monospace' }}>Equilibrium Steady</div>
        </div>

        <div style={tileBase}>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#9CA3AF' }}>Lean Mass</div>
          <div style={{ fontSize: '20px', fontWeight: 300, color: '#FFFFFF' }}>{leanMassKg} <span style={{ fontSize: '11px', color: '#9CA3AF' }}>kg</span></div>
          <div style={{ fontSize: '10px', color: '#0A84FF', fontFamily: 'monospace' }}>Fat Mass: {bodyFatPercent}%</div>
        </div>

        <div style={tileBase}>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#9CA3AF' }}>Biological Age</div>
          <div style={{ fontSize: '20px', fontWeight: 300, color: '#00BF63' }}>{biologicalAgeDeltaYears} <span style={{ fontSize: '11px', color: '#9CA3AF' }}>yrs</span></div>
          <div style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: 'monospace' }}>PhenoAge Lead</div>
        </div>

        <div style={tileBase}>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#9CA3AF' }}>Substrate FatMax</div>
          <div style={{ fontSize: '20px', fontWeight: 300, color: '#FF9F0A' }}>74% <span style={{ fontSize: '11px', color: '#9CA3AF' }}>lipid</span></div>
          <div style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: 'monospace' }}>Mitochondrial Beta-Ox</div>
        </div>
      </div>
    </section>
  );
};
