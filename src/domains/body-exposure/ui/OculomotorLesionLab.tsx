import { useMemo, useState } from 'react'
import { Prosa } from '../../../components/Prosa'
import type { OcularSide, OculomotorGazeKey, OculomotorPattern } from '../model/oculomotor'
import {
  OCULOMOTOR_GAZE,
  OCULOMOTOR_LESION_OPTIONS,
  OCULOMOTOR_REFERENCE,
  OCULOMOTOR_SYNDROME_OPTIONS,
  simulateOculomotor,
} from '../engine/oculomotorLesionEngine'

const GAZE_ORDER: OculomotorGazeKey[] = [
  'up-left', 'up', 'up-right',
  'left', 'primary', 'right',
  'down-left', 'down', 'down-right',
]

type PatternChoice = { id: string; label: string; pattern: OculomotorPattern }

const PATTERNS: PatternChoice[] = [
  ...OCULOMOTOR_LESION_OPTIONS.map((item) => ({
    id: `lesion:${item.key}`,
    label: item.label,
    pattern: { scope: 'lesion' as const, key: item.key },
  })),
  ...OCULOMOTOR_SYNDROME_OPTIONS.filter((item) => item.key !== 'none').map((item) => ({
    id: `syndrome:${item.key}`,
    label: item.label,
    pattern: { scope: 'syndrome' as const, key: item.key },
  })),
]

function EyePanel({
  side,
  x,
  y,
  pupilMm,
  lidOpen,
}: {
  side: OcularSide
  x: number
  y: number
  pupilMm: number
  lidOpen: number
}) {
  const cx = 80 + x * 20
  const cy = 72 - y * 16
  const pupilR = 8 + (pupilMm - 3.5) * 1.6
  const lidDrop = (1 - lidOpen) * 42
  return (
    <svg viewBox="0 0 160 144" className="w-full" role="img" aria-label={`${side === 'R' ? 'Right' : 'Left'} eye simulated position`}>
      <path d="M12 72 Q80 15 148 72 Q80 129 12 72Z" fill="#eef8f8" stroke="#78909c" strokeWidth="2"/>
      <circle cx={cx} cy={cy} r="30" fill="#1f7a8c" stroke="#b6eef0" strokeWidth="2"/>
      <circle cx={cx} cy={cy} r={Math.max(5, Math.min(18, pupilR))} fill="#020609"/>
      <circle cx={cx - 7} cy={cy - 8} r="4.5" fill="white" opacity=".78"/>
      {lidDrop > 2 && <path d={`M10 36 Q80 ${28 + lidDrop} 150 36 L150 0 L10 0Z`} fill="#b58f77" opacity=".86"/>}
      <text x="80" y="137" textAnchor="middle" fontSize="10" fontWeight="800" fill="#7f8d96">{side === 'R' ? 'RIGHT EYE' : 'LEFT EYE'}</text>
    </svg>
  )
}

export function OculomotorLesionLab() {
  const [choiceId, setChoiceId] = useState('lesion:VI')
  const [side, setSide] = useState<OcularSide>('R')
  const [severity, setSeverity] = useState(100)
  const [gaze, setGaze] = useState<OculomotorGazeKey>('primary')

  const choice = PATTERNS.find((item) => item.id === choiceId) ?? PATTERNS[0]
  const result = useMemo(
    () => simulateOculomotor({ pattern: choice.pattern, side, severity, gaze }),
    [choice.pattern, side, severity, gaze],
  )
  const target = OCULOMOTOR_GAZE[gaze]

  const pose = (eye: typeof result.right) => {
    const localOutwardSign = eye.side === 'R' ? 1 : -1
    return {
      x: target.x * eye.gazeFunction + localOutwardSign * eye.primaryHorizontal * 0.62,
      y: target.y * eye.gazeFunction + eye.primaryVertical * 0.62,
    }
  }
  const rightPose = pose(result.right)
  const leftPose = pose(result.left)

  return (
    <section className="rounded-[26px] border border-violet-200/60 bg-gradient-to-b from-violet-50/70 to-white p-3 dark:border-violet-300/15 dark:from-violet-300/[.06] dark:to-white/[.02] sm:p-4">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.16em] text-violet-700 dark:text-violet-300">Oculomotor lesion lab</div>
          <h4 className="mt-1 text-base font-black text-neutral-950 dark:text-white">CN III · IV · VI · MLF localization simulator</h4>
          <Prosa kelas="mt-1 max-w-3xl text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">Deterministic educational model adapted from the MIT-licensed docramiro/oculomotor lesion map. It visualizes expected directional deficits, ptosis/pupil teaching proxies and syndrome localization without claiming patient-specific measurements.</Prosa>
        </div>
        <span className="rounded-full border border-violet-200 px-2.5 py-1 text-[8px] font-black text-violet-800 dark:border-violet-300/20 dark:text-violet-200">MIT-derived logic · Panacea domain engine</span>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-3">
          <label className="block rounded-xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-white/[.03]">
            <span className="text-[9px] font-black text-neutral-600 dark:text-neutral-300">Pattern</span>
            <select value={choiceId} onChange={(event) => setChoiceId(event.target.value)} className="mt-2 w-full rounded-lg border border-neutral-200 bg-white px-2 py-2 text-[9px] font-bold text-neutral-800 dark:border-white/10 dark:bg-[#10161c] dark:text-white">
              {PATTERNS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            {(['R', 'L'] as const).map((value) => <button key={value} type="button" aria-pressed={side === value} onClick={() => setSide(value)} className={`rounded-xl border px-3 py-2 text-[9px] font-black ${side === value ? 'border-violet-500 bg-violet-500 text-white' : 'border-neutral-200 bg-white text-neutral-600 dark:border-white/10 dark:bg-white/[.03] dark:text-neutral-300'}`}>{value === 'R' ? 'Right side' : 'Left side'}</button>)}
          </div>

          <label className="block rounded-xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-white/[.03]">
            <div className="flex items-center justify-between text-[9px] font-black text-neutral-600 dark:text-neutral-300"><span>Teaching severity</span><span>{severity}%</span></div>
            <input className="mt-2 w-full accent-violet-500" type="range" min="0" max="100" step="5" value={severity} onChange={(event) => setSeverity(Number(event.target.value))}/>
            <p className="mt-2 text-[8px] leading-relaxed text-neutral-400">Residual effector function: f = 1 − severity/100. This is a didactic control, not a clinical severity scale.</p>
          </label>

          <div className="grid grid-cols-3 gap-1.5">
            {GAZE_ORDER.map((key) => <button key={key} onClick={() => setGaze(key)} className={`min-h-11 rounded-xl border px-1 py-2 text-[8px] font-black ${gaze === key ? 'border-violet-500 bg-violet-500 text-white' : 'border-neutral-200 bg-white text-neutral-600 dark:border-white/10 dark:bg-white/[.035] dark:text-neutral-300'}`}>{OCULOMOTOR_GAZE[key].label}</button>)}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-neutral-200 bg-[#071015] p-3 dark:border-white/10">
            <div className="grid grid-cols-2 gap-2">
              <EyePanel side="R" x={rightPose.x} y={rightPose.y} pupilMm={result.right.pupilMm} lidOpen={result.right.lidOpenFraction}/>
              <EyePanel side="L" x={leftPose.x} y={leftPose.y} pupilMm={result.left.pupilMm} lidOpen={result.left.lidOpenFraction}/>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {[result.right, result.left].map((eye) => (
                <div key={eye.side} className="rounded-xl border border-white/10 bg-white/[.04] p-3 text-[8px] text-neutral-300">
                  <div className="font-black text-violet-200">{eye.side === 'R' ? 'Right' : 'Left'} eye</div>
                  <div className="mt-1">Gaze function: {Math.round(eye.gazeFunction * 100)}%</div>
                  <div>Convergence proxy: {Math.round(eye.convergenceFunction * 100)}%</div>
                  <div>Pupil proxy: {eye.pupilMm.toFixed(1)} mm · lid opening: {Math.round(eye.lidOpenFraction * 100)}%</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-white/[.03]">
            <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">Affected effectors</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.affectedEffectors.length ? result.affectedEffectors.map((item) => <span key={item} className="rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-[8px] font-black text-violet-800 dark:border-violet-300/20 dark:bg-violet-300/10 dark:text-violet-200">{item}</span>) : <span className="text-[9px] text-neutral-500">No impaired effector in the selected pattern.</span>}
            </div>
            <div className="mt-3 space-y-1">
              {result.teachingNotes.map((note) => <p key={note} className="text-[8px] leading-relaxed text-neutral-500 dark:text-neutral-400">• {note}</p>)}
            </div>
            <div className="mt-3 border-t border-neutral-200 pt-2 text-[8px] leading-relaxed text-neutral-400 dark:border-white/10">
              Reference: {OCULOMOTOR_REFERENCE.repository} · {OCULOMOTOR_REFERENCE.license}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default OculomotorLesionLab
