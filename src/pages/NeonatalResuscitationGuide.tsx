import { useEffect, useRef, useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconActivity } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Neonatal Resuscitation education guide — the standard NRP (Neonatal
// Resuscitation Program) initial-steps algorithm, presented as a step-by-step
// checklist plus a live "Golden Minute" timer (first 60 seconds after birth
// during which initial steps + assessment + PPV, if indicated, should occur).
// Educational reference only — always follow your institution's NRP-certified
// training and current AAP/ILCOR guidelines.
// ─────────────────────────────────────────────────────────────────────────────

const ALGORITHM_STEPS = [
  { t: 'Birth', text: 'Term gestation? Good tone? Breathing/crying?', note: 'If YES to all → routine care (dry, skin-to-skin, ongoing evaluation). If NO to any → proceed with initial steps.' },
  { t: '~30s', text: 'Initial steps', note: 'Warm, position airway (sniffing position), clear secretions if needed, dry, stimulate. Keep the baby warm throughout (radiant warmer, dry, remove wet linen).' },
  { t: '~60s ("Golden Minute")', text: 'Evaluate: heart rate & breathing', note: 'HR ≥100 and breathing well → routine/supportive care. HR <100 or apnea/gasping → begin positive-pressure ventilation (PPV).' },
  { t: 'If PPV started', text: 'PPV with SpO2 monitoring ± ECG', note: 'Effective PPV = visible chest rise. If HR <100 after 15s of effective PPV, apply MR. SOPA corrective steps (Mask adjustment, Reposition airway, Suction mouth/nose, Open mouth) before escalating.' },
  { t: 'If HR <60', text: 'Chest compressions + PPV (3:1 ratio), consider intubation/laryngeal mask', note: 'Coordinate compressions and ventilation, reassess HR every 60s. Consider umbilical venous access.' },
  { t: 'If HR remains <60', text: 'Epinephrine (IV/IO preferred), consider hypovolemia/pneumothorax', note: 'Reassess ETT/LMA placement, ventilation technique, and chest compression technique — most resuscitations fail due to inadequate ventilation, not drug timing.' },
]

const TARGET_SPO2 = [
  { min: '1 min', range: '60–65%' },
  { min: '2 min', range: '65–70%' },
  { min: '3 min', range: '70–75%' },
  { min: '4 min', range: '75–80%' },
  { min: '5 min', range: '80–85%' },
  { min: '10 min', range: '85–95%' },
]

function GoldenMinuteTimer() {
  const [running, setRunning] = useState(false)
  const [elapsedSec, setElapsedSec] = useState(0)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (running) {
      timerRef.current = window.setInterval(() => setElapsedSec((s) => s + 1), 1000)
    }
    return () => { if (timerRef.current) window.clearInterval(timerRef.current) }
  }, [running])

  function reset() { setRunning(false); setElapsedSec(0); if (timerRef.current) window.clearInterval(timerRef.current) }

  const phase = elapsedSec < 30 ? 'Initial steps' : elapsedSec < 60 ? 'Evaluate HR & breathing' : 'Past the Golden Minute — reassess & escalate per algorithm'
  const tone = elapsedSec < 60 ? 'brand' : 'critical'

  return (
    <Card className="!p-6 text-center">
      <div className="text-5xl font-black tabular-nums text-brand-dark">{Math.floor(elapsedSec / 60)}:{String(elapsedSec % 60).padStart(2, '0')}</div>
      <div className="mt-2"><Badge tone={tone as 'brand' | 'critical'}>{phase}</Badge></div>
      <div className="mt-4 flex justify-center gap-2">
        {!running ? (
          <button onClick={() => setRunning(true)} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white">▶ Start</button>
        ) : (
          <button onClick={() => setRunning(false)} className="rounded-xl bg-neutral-800 px-5 py-2.5 text-sm font-bold text-white dark:bg-white/20">⏸ Pause</button>
        )}
        <button onClick={reset} className="rounded-xl bg-neutral-100 px-5 py-2.5 text-sm font-bold text-neutral-600 dark:bg-white/10">↺ Reset</button>
      </div>
      <p className="mt-3 text-[11px] text-neutral-400">A training-aid stopwatch for drills — during a real resuscitation, follow your team's monitor and NRP-certified lead.</p>
    </Card>
  )
}

export function NeonatalResuscitationGuide() {
  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Neonatal Resuscitation (NRP) Guide" subtitle="The initial-steps algorithm & Golden Minute, as a study/drill aid" />
        <p className="mt-2 text-[13px] leading-relaxed text-amber-700 dark:text-amber-300">
          Educational reference only, aligned to the standard AAP/ILCOR NRP initial-steps algorithm —
          not a substitute for NRP certification, your institution's protocol, or real-time clinical
          judgment during an actual resuscitation.
        </p>
      </Card>

      <GoldenMinuteTimer />

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Algorithm — Initial Steps</div>
        <div className="mt-3 space-y-3">
          {ALGORITHM_STEPS.map((s, i) => (
            <div key={i} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <Badge tone="neutral">{s.t}</Badge>
                <span className="text-[13px] font-bold text-ink dark:text-white">{s.text}</span>
              </div>
              <p className="mt-1 text-[12px] text-neutral-500">{s.note}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Target Preductal SpO2 (by minute of life)</div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {TARGET_SPO2.map((r) => (
            <div key={r.min} className="rounded-xl bg-brand/10 p-2 text-center">
              <div className="text-[11px] font-bold text-neutral-500">{r.min}</div>
              <div className="text-sm font-black text-brand-dark">{r.range}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Reference: American Academy of Pediatrics / American Heart Association Neonatal Resuscitation
        Program (NRP) 8th edition algorithm; ILCOR consensus. Study aid only — always defer to your
        NRP-certified training and institutional protocol during a real resuscitation.
      </div>
    </div>
  )
}

export default NeonatalResuscitationGuide
