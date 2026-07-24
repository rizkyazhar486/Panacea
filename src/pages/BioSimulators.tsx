import { useMemo, useState } from 'react'
import { Card, SectionTitle } from '../components/ui'
import { IconSparkle } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Bio-Simulators — three illustrative visualizations of longevity mechanisms
// (mTOR/AMPK balance, the circadian clock, telomere attrition) driven by
// simple, clearly-labeled math over user sliders. These are teaching
// illustrations rendered with SVG/CSS, not real physics/fluid-dynamics
// simulations or a measurement of the user's actual biology — WebGL/Three.js
// would add a large new dependency for a visual that doesn't need it, so
// this uses lightweight SVG instead. Pure client-side, no external API.
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'mtor' | 'circadian' | 'telomere'

function MtorSeesaw() {
  const [protein, setProtein] = useState(50)
  const [fasting, setFasting] = useState(50)
  const tilt = (protein - fasting) / 2 // -50 (AMPK/cleanup) .. +50 (mTOR/growth)
  return (
    <Card className="!p-6 text-center">
      <p className="text-[13px] text-neutral-500">Protein intake & resistance training push toward mTOR (growth); fasting & cardio push toward AMPK (cellular cleanup) — both matter, in balance.</p>
      <div className="mt-4">
        <label className="text-[11px] font-bold text-neutral-500">Protein / resistance training today: {protein}%</label>
        <input className="mt-1 w-full accent-brand" type="range" min={0} max={100} value={protein} onChange={(e) => setProtein(Number(e.target.value))} />
      </div>
      <div className="mt-3">
        <label className="text-[11px] font-bold text-neutral-500">Fasting / cardio duration today: {fasting}%</label>
        <input className="mt-1 w-full accent-brand" type="range" min={0} max={100} value={fasting} onChange={(e) => setFasting(Number(e.target.value))} />
      </div>
      <svg viewBox="0 0 300 140" className="mx-auto mt-6 w-full max-w-xs">
        <line x1="20" y1="120" x2="280" y2="120" stroke="#e5e5e5" strokeWidth="4" />
        <g transform={`rotate(${tilt * 0.4} 150 100)`}>
          <line x1="40" y1="100" x2="260" y2="100" stroke="#00BF63" strokeWidth="6" strokeLinecap="round" />
          <circle cx="40" cy="100" r="16" fill="#00BF63" />
          <circle cx="260" cy="100" r="16" fill="#0B7A4B" />
        </g>
        <line x1="150" y1="100" x2="150" y2="120" stroke="#666" strokeWidth="4" />
        <text x="40" y="80" textAnchor="middle" fontSize="11" fill="#00BF63" fontWeight="bold">mTOR</text>
        <text x="260" y="80" textAnchor="middle" fontSize="11" fill="#0B7A4B" fontWeight="bold">AMPK</text>
      </svg>
      <p className="mt-3 text-[12px] text-neutral-400">Illustrative balance, not a measurement of your actual mTOR/AMPK activity.</p>
    </Card>
  )
}

function CircadianOscillator() {
  const [lightHour, setLightHour] = useState(7)
  const [mealHour, setMealHour] = useState(19)
  const points = useMemo(() => Array.from({ length: 25 }, (_, h) => {
    // Illustrative PER/CRY-style oscillation, phase-shifted by light and meal timing
    const phaseShift = (lightHour - 7) * 2 + (mealHour - 19) * 1
    const per = 50 + 45 * Math.sin(((h - 6 - phaseShift) / 24) * 2 * Math.PI)
    return { h, per }
  }), [lightHour, mealHour])

  return (
    <Card className="!p-6">
      <p className="text-[13px] text-neutral-500 text-center">Morning light and meal timing are two of the strongest external cues ("zeitgebers") that entrain your circadian clock genes.</p>
      <div className="mt-4">
        <label className="text-[11px] font-bold text-neutral-500">First light exposure: {lightHour}:00</label>
        <input className="mt-1 w-full accent-brand" type="range" min={4} max={12} value={lightHour} onChange={(e) => setLightHour(Number(e.target.value))} />
      </div>
      <div className="mt-3">
        <label className="text-[11px] font-bold text-neutral-500">Last meal: {mealHour}:00</label>
        <input className="mt-1 w-full accent-brand" type="range" min={14} max={23} value={mealHour} onChange={(e) => setMealHour(Number(e.target.value))} />
      </div>
      <svg viewBox="0 0 300 100" className="mt-4 w-full">
        <polyline fill="none" stroke="#00BF63" strokeWidth="2" points={points.map((p) => `${p.h * 12},${100 - p.per}`).join(' ')} />
        <line x1="0" y1="50" x2="300" y2="50" stroke="#e5e5e5" strokeWidth="1" strokeDasharray="4" />
      </svg>
      <p className="mt-2 text-center text-[11px] text-neutral-400">Illustrative clock-gene oscillation over 24h — earlier, consistent light and an earlier last meal are associated with tighter circadian alignment in sleep research.</p>
    </Card>
  )
}

function TelomereAttrition() {
  const [age, setAge] = useState(35)
  const [stress, setStress] = useState(3)
  const [exercise, setExercise] = useState(3)
  // Illustrative model: baseline attrition ~20-40bp/year, stress accelerates,
  // regular exercise is associated with slower attrition in observational studies.
  const baseAttritionPerYear = 30
  const stressMultiplier = 0.7 + stress * 0.15
  const exerciseMultiplier = 1.2 - exercise * 0.08
  const attritionPerYear = baseAttritionPerYear * stressMultiplier * exerciseMultiplier
  const startLength = 10000 // illustrative baseline telomere length (bp), roughly typical at birth-ish reference
  const currentLength = Math.max(4000, startLength - age * attritionPerYear)
  const pct = (currentLength / startLength) * 100

  return (
    <Card className="!p-6 text-center">
      <p className="text-[13px] text-neutral-500">Telomeres shorten with each cell division; chronic stress is linked to faster attrition, regular exercise to slower attrition, in observational research.</p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-left">
        <label className="text-[11px] font-bold text-neutral-500">Age
          <input className="mt-1 w-full accent-brand" type="range" min={18} max={80} value={age} onChange={(e) => setAge(Number(e.target.value))} />
        </label>
        <label className="text-[11px] font-bold text-neutral-500">Stress (1-5)
          <input className="mt-1 w-full accent-brand" type="range" min={1} max={5} value={stress} onChange={(e) => setStress(Number(e.target.value))} />
        </label>
        <label className="text-[11px] font-bold text-neutral-500">Exercise (1-5)
          <input className="mt-1 w-full accent-brand" type="range" min={1} max={5} value={exercise} onChange={(e) => setExercise(Number(e.target.value))} />
        </label>
      </div>
      <svg viewBox="0 0 200 60" className="mx-auto mt-6 w-full max-w-xs">
        <rect x="20" y="20" width="160" height="20" rx="10" fill="#e5e5e5" />
        <rect x="20" y="20" width={Math.max(4, (pct / 100) * 160)} height="20" rx="10" fill="#00BF63" />
      </svg>
      <p className="mt-2 text-[12px] text-neutral-500">Illustrative telomere length: <b>{Math.round(pct)}%</b> of reference baseline</p>
      <p className="mt-2 text-[11px] text-neutral-400">A stylized model from published average attrition rates — not a measurement of your actual telomere length, which requires a specialized lab (qPCR or flow-FISH) test.</p>
    </Card>
  )
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'mtor', label: 'mTOR / AMPK Seesaw' },
  { id: 'circadian', label: 'Circadian Oscillator' },
  { id: 'telomere', label: 'Telomere Attrition' },
]

export function BioSimulators() {
  const [tab, setTab] = useState<Tab>('mtor')
  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconSparkle size={20} />} title="Bio-Simulators" subtitle="Illustrative visualizations of longevity mechanisms" />
        <p className="mt-2 text-[13px] leading-relaxed text-amber-700 dark:text-amber-300">
          These are teaching illustrations built from simple published-average math, not real
          physics/biology simulations or a measurement of your actual cells.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${tab === t.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{t.label}</button>
          ))}
        </div>
      </Card>

      {tab === 'mtor' && <MtorSeesaw />}
      {tab === 'circadian' && <CircadianOscillator />}
      {tab === 'telomere' && <TelomereAttrition />}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Educational illustrations only — not lab measurements, medical advice, or a personalized
        biological model of your body.
      </div>
    </div>
  )
}

export default BioSimulators
