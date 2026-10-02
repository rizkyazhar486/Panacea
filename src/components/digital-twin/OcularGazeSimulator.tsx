import { useMemo, useState } from 'react'

type GazeKey = 'primary' | 'right' | 'left' | 'up' | 'down' | 'up-right' | 'up-left' | 'down-right' | 'down-left'

type GazeVector = { x: number; y: number; label: string; muscles: string; pathway: string }

const GAZE: Record<GazeKey, GazeVector> = {
  primary: { x: 0, y: 0, label: 'Primary', muscles: 'Balanced extraocular alignment', pathway: 'Reference position' },
  right: { x: 1, y: 0, label: 'Right', muscles: 'R lateral rectus + L medial rectus', pathway: 'PPRF → CN VI nucleus → contralateral MLF → CN III' },
  left: { x: -1, y: 0, label: 'Left', muscles: 'L lateral rectus + R medial rectus', pathway: 'PPRF → CN VI nucleus → contralateral MLF → CN III' },
  up: { x: 0, y: -1, label: 'Up', muscles: 'Superior rectus + inferior oblique', pathway: 'Vertical gaze network → CN III' },
  down: { x: 0, y: 1, label: 'Down', muscles: 'Inferior rectus + superior oblique', pathway: 'Vertical gaze network → CN III / IV' },
  'up-right': { x: 1, y: -1, label: 'Up-right', muscles: 'R superior rectus + L inferior oblique', pathway: 'Horizontal + vertical gaze networks' },
  'up-left': { x: -1, y: -1, label: 'Up-left', muscles: 'L superior rectus + R inferior oblique', pathway: 'Horizontal + vertical gaze networks' },
  'down-right': { x: 1, y: 1, label: 'Down-right', muscles: 'R inferior rectus + L superior oblique', pathway: 'Horizontal + vertical gaze networks' },
  'down-left': { x: -1, y: 1, label: 'Down-left', muscles: 'L inferior rectus + R superior oblique', pathway: 'Horizontal + vertical gaze networks' },
}

const ORDER: GazeKey[] = ['up-left', 'up', 'up-right', 'left', 'primary', 'right', 'down-left', 'down', 'down-right']

function Eye({ x, y, side }: { x: number; y: number; side: 'R' | 'L' }) {
  const cx = 80 + x * 17
  const cy = 72 + y * 13
  return (
    <svg viewBox="0 0 160 144" className="w-full" role="img" aria-label={`${side} eye gaze position`}>
      <defs><radialGradient id={`iris-${side}`}><stop offset="0" stopColor="#06131b"/><stop offset=".38" stopColor="#0c5d70"/><stop offset="1" stopColor="#7ad7dd"/></radialGradient></defs>
      <path d="M12 72 Q80 15 148 72 Q80 129 12 72Z" fill="#eef8f8" stroke="#78909c" strokeWidth="2"/>
      <circle cx={cx} cy={cy} r="31" fill={`url(#iris-${side})`} stroke="#b6eef0" strokeWidth="2"/>
      <circle cx={cx} cy={cy} r="13" fill="#020609"/>
      <circle cx={cx - 8} cy={cy - 9} r="5" fill="white" opacity=".8"/>
      <text x="80" y="137" textAnchor="middle" fontSize="10" fontWeight="800" fill="#7f8d96">{side === 'R' ? 'RIGHT EYE' : 'LEFT EYE'}</text>
    </svg>
  )
}

export function OcularGazeSimulator() {
  const [gaze, setGaze] = useState<GazeKey>('primary')
  const [convergence, setConvergence] = useState(0)
  const state = GAZE[gaze]
  const eyes = useMemo(() => ({ rightX: state.x - convergence * .35, leftX: state.x + convergence * .35 }), [state.x, convergence])

  return (
    <section className="rounded-[26px] border border-cyan-200/60 bg-gradient-to-b from-cyan-50/70 to-white p-3 dark:border-cyan-300/15 dark:from-cyan-300/[.06] dark:to-white/[.02] sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-700 dark:text-cyan-300">Binocular gaze simulator</div><h4 className="mt-1 text-base font-black text-neutral-950 dark:text-white">See conjugate gaze instead of reading it</h4></div>
        <span className="rounded-full border border-cyan-200 px-2.5 py-1 text-[8px] font-black text-cyan-800 dark:border-cyan-300/20 dark:text-cyan-200">Educational kinematics · not EMG</span>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_270px]">
        <div className="rounded-2xl border border-neutral-200 bg-[#071015] p-3 dark:border-white/10">
          <div className="grid grid-cols-2 gap-2"><Eye side="R" x={eyes.rightX} y={state.y}/><Eye side="L" x={eyes.leftX} y={state.y}/></div>
          <div className="mt-2 rounded-xl border border-white/10 bg-white/[.04] p-3">
            <div className="text-[9px] font-black text-cyan-200">{state.label} gaze</div>
            <div className="mt-1 text-[10px] font-bold text-white">{state.muscles}</div>
            <div className="mt-1 text-[9px] leading-relaxed text-neutral-400">Central teaching context: {state.pathway}. This animation shows direction, not measured muscle force, firing rate, torsion, or patient motility.</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-1.5">{ORDER.map((key) => <button key={key} onClick={() => setGaze(key)} className={`min-h-12 rounded-xl border px-1 py-2 text-[8px] font-black ${gaze === key ? 'border-cyan-500 bg-cyan-500 text-white' : 'border-neutral-200 bg-white text-neutral-600 dark:border-white/10 dark:bg-white/[.035] dark:text-neutral-300'}`}>{GAZE[key].label}</button>)}</div>
          <label className="block rounded-xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-white/[.03]"><div className="flex justify-between text-[9px] font-black text-neutral-600 dark:text-neutral-300"><span>Near convergence teaching control</span><span>{Math.round(convergence * 100)}%</span></div><input className="mt-2 w-full accent-cyan-500" type="range" min="0" max="1" step="0.05" value={convergence} onChange={(event) => setConvergence(Number(event.target.value))}/><p className="mt-2 text-[8px] leading-relaxed text-neutral-400">Moves both schematic visual axes nasally. It does not infer vergence angle, accommodation, pupil size, strabismus, or neurologic disease.</p></label>
        </div>
      </div>
    </section>
  )
}

export default OcularGazeSimulator
