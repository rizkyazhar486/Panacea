import { useRef, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge, Button } from '../components/ui'
import { IconActivity, IconFlame, IconRun } from '../components/icons'
import { api, backendEnabled } from '../lib/api'
import { readAsDataUrl, compressImage } from '../lib/upload'

// ── Physical readiness / SIPSS scoring ─────────────────────────────────────
// Approximate max-score targets (≈ "Excellent") for the Indonesian
// TNI-Polri physical test. Reps within 1 minute unless noted.
type Sex = 'L' | 'P'
const TARGET: Record<Sex, { pushup: number; situp: number; pullup: number; cooper: number }> = {
  L: { pushup: 43, situp: 41, pullup: 18, cooper: 2800 }, // pull-up reps, cooper metres / 12 min
  P: { pushup: 30, situp: 30, pullup: 90, cooper: 2300 }, // women: "pull-up" = chinning hang (seconds)
}
const score = (v: number, target: number) => Math.max(0, Math.min(100, Math.round((v / target) * 100)))

interface FormResult { formScore: number; summary: string; goodPoints: string[]; corrections: string[]; injuryRisk: string }

const EXERCISES = [
  { id: 'pushup', name: 'Push-up', emoji: '🏋️', cues: ['Body straight from head to heels', 'Elbows ±45° from the body', 'Lower until chest nearly touches the floor', 'Core & glutes engaged (don\'t let hips sag)'] },
  { id: 'squat', name: 'Squat', emoji: '🦵', cues: ['Heels flat on the floor', 'Knees track over toes', 'Neutral back, chest up', 'Thighs at least parallel to the floor'] },
  { id: 'pullup', name: 'Pull-up', emoji: '🧗', cues: ['Full dead hang', 'Pull chin above the bar', 'Scapula depressed and retracted, avoid swinging', 'Controlled descent'] },
  { id: 'situp', name: 'Sit-up', emoji: '🔁', cues: ['Knees bent ±90°', 'Hands on chest/behind head without pulling the neck', 'Rise until elbows touch thighs', 'Controlled lower back'] },
  { id: 'burpee', name: 'Burpee', emoji: '💥', cues: ['Squat → straight plank', 'Full push-up (optional)', 'Explosive jump', 'Land with bent knees (absorb impact)'] },
  { id: 'plank', name: 'Plank', emoji: '🧱', cues: ['Straight line shoulder–hip–heel', 'Elbows under shoulders', 'Glutes & core locked', 'Neutral neck'] },
]

const PROGRAMS = [
  { id: 'sipss', emoji: '👮', name: 'SIPSS / Civil Service Test Prep', weeks: 8, focus: 'Push-up, sit-up, pull-up, 12-minute run', plan: ['Mon: Push strength (pyramid push-ups) + core', 'Tue: Interval run 6×400m', 'Wed: Pull-up/chinning + grip', 'Thu: Recovery / mobility', 'Fri: Fitness circuit B (push-up·sit-up·shuttle)', 'Sat: Long tempo run (Cooper)', 'Sun: Rest'] },
  { id: 'hyrox', emoji: '🏟️', name: 'HYROX', weeks: 10, focus: 'Run + 8 functional stations (ski, sled, burpee broad jump, row, wall ball)', plan: ['Run + strength endurance', 'Compromised running (run after loaded work)', 'Sled push/pull & wall ball', 'Erg (ski/row) interval', 'Burpee broad jump volume', 'Station simulation', 'Recovery'] },
  { id: 'marathon', emoji: '🏃', name: 'Marathon (42K)', weeks: 16, focus: 'Base, tempo, progressive long run', plan: ['Easy run', 'VO2max interval', 'Easy + strides', 'Tempo threshold', 'Recovery', 'Long run (gradually building → 32K)', 'Rest'] },
  { id: 'half', emoji: '🥈', name: 'Half Marathon (21K)', weeks: 12, focus: 'Threshold & moderate long run', plan: ['Easy run', 'Interval 5×1K', 'Easy', 'Tempo 6–8K', 'Recovery', 'Long run (→ 18K)', 'Rest'] },
]

export function FitnessTest() {
  const [sex, setSex] = useState<Sex>('L')
  const [reps, setReps] = useState({ pushup: 0, situp: 0, pullup: 0, cooper: 0 })
  const t = TARGET[sex]
  const items = [
    { k: 'pushup' as const, label: 'Push-up (1 min)', unit: 'x' },
    { k: 'situp' as const, label: 'Sit-up (1 min)', unit: 'x' },
    { k: 'pullup' as const, label: sex === 'L' ? 'Pull-up' : 'Chinning (sec)', unit: sex === 'L' ? 'x' : 's' },
    { k: 'cooper' as const, label: '12-min Run (Cooper)', unit: 'm' },
  ]
  const scores = items.map((it) => ({ ...it, nilai: score(reps[it.k], t[it.k]) }))
  const total = Math.round(scores.reduce((s, x) => s + x.nilai, 0) / scores.length)
  const lulus = total >= 60 && scores.every((s) => s.nilai >= 41)

  // ── AI form analysis ──
  const [exercise, setExercise] = useState(EXERCISES[0])
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState<FormResult | null>(null)
  const [note, setNote] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function analyzeForm(file?: File) {
    if (!file) return
    setBusy(true); setForm(null); setNote('')
    try {
      const dataUrl = await readAsDataUrl(await compressImage(file, 1280, 0.85))
      setPreview(dataUrl)
      if (!backendEnabled) {
        setNote('AI analysis requires an active server. Use the form checklist below in the meantime.')
        setBusy(false); return
      }
      const prompt = `You are a strength coach & physiotherapist. Analyze the FORM/POSTURE of the "${exercise.name}" movement in this photo (educational, not a diagnosis). Assess body alignment, joint angles, and injury risk. Output ONLY minified JSON: {"formScore":number(0-100),"summary":string,"goodPoints":string[],"corrections":string[],"injuryRisk":string}`
      const r = await api.aiVision(dataUrl, prompt)
      const m = r.text.match(/\{[\s\S]*\}/)
      if (m) setForm(JSON.parse(m[0]))
      else setNote('Could not read the result. Try a side-view photo with good lighting.')
    } catch {
      setNote('Analysis failed. Try again with a clear side-view photo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-2xl">🎖️</span>
        <div>
          <h1 className="text-lg font-black text-ink">Physical Test & Form Analysis</h1>
          <p className="text-xs text-neutral-400">SIPSS/civil service fitness · AI form · Hyrox/Marathon programs</p>
        </div>
      </div>

      {/* 1. Fitness Test Score */}
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Fitness Test Score" subtitle="Estimated score for the SIPSS / TNI-Polri / civil service exam" />
        <div className="mt-3 mb-3 flex gap-2">
          {(['L', 'P'] as Sex[]).map((s) => (
            <button key={s} onClick={() => setSex(s)} className={`flex-1 rounded-xl py-2 text-sm font-bold ${sex === s ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>
              {s === 'L' ? '♂ Male' : '♀ Female'}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {items.map((it) => (
            <Field key={it.k} label={`${it.label} (${it.unit})`}>
              <input type="number" value={reps[it.k] || ''} onChange={(e) => setReps({ ...reps, [it.k]: +e.target.value || 0 })} className={inputClass} />
            </Field>
          ))}
        </div>
        <div className="mt-4 space-y-1.5">
          {scores.map((s) => (
            <div key={s.k} className="flex items-center gap-2 text-xs">
              <span className="w-36 shrink-0 text-neutral-500">{s.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full rounded-full" style={{ width: `${s.nilai}%`, background: s.nilai >= 60 ? '#00BF63' : '#f59e0b' }} />
              </div>
              <span className="w-8 text-right font-bold text-ink">{s.nilai}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl p-3" style={{ background: lulus ? '#E9FAF2' : '#FFF4E5' }}>
          <div>
            <div className="text-[11px] text-neutral-500">Total Score</div>
            <div className="text-2xl font-black" style={{ color: lulus ? '#0B7A4B' : '#B45309' }}>{total}<span className="text-sm">/100</span></div>
          </div>
          <Badge tone={lulus ? 'normal' : 'high'}>{lulus ? '✓ Meets Requirements' : 'Needs Improvement'}</Badge>
        </div>
        <p className="mt-2 text-[10px] text-neutral-400">Equivalency estimate; official thresholds & tables may vary by agency/age. The 12-minute run can be measured automatically via GPS Tracker.</p>
      </Card>

      {/* 2. AI Form Analysis */}
      <Card className="!p-5">
        <SectionTitle icon={<IconFlame size={18} />} title="Form & Posture Analysis (AI)" subtitle="Upload a photo of your movement — AI assesses form & injury risk" />
        <div className="mt-3 flex flex-wrap gap-2">
          {EXERCISES.map((e) => (
            <button key={e.id} onClick={() => { setExercise(e); setForm(null); setPreview(null) }}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${exercise.id === e.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>
              {e.emoji} {e.name}
            </button>
          ))}
        </div>

        {/* "Excellent form" reference slot (filled with a Higgsfield image when credits are available) */}
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-neutral-50 p-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-2xl shadow-sm">{exercise.emoji}</span>
          <div className="min-w-0">
            <div className="text-xs font-bold text-ink">Ideal Form — {exercise.name}</div>
            <ul className="mt-0.5 text-[11px] text-neutral-500">
              {exercise.cues.map((c, i) => <li key={i}>• {c}</li>)}
            </ul>
          </div>
        </div>

        <button onClick={() => fileRef.current?.click()} disabled={busy}
          className="mt-3 w-full rounded-xl border-2 border-dashed border-brand/40 bg-brand-50 py-4 text-sm font-bold text-brand-dark disabled:opacity-60">
          {busy ? 'Analyzing…' : `📷 Upload ${exercise.name} Photo (side view, clear)`}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => analyzeForm(e.target.files?.[0])} />

        {preview && <img src={preview} alt="" className="mt-3 max-h-64 w-full rounded-xl object-contain" />}
        {note && <p className="mt-2 text-xs font-semibold text-amber-600">{note}</p>}

        {form && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-brand-50 p-3">
              <span className="text-sm font-bold text-brand-dark">Form Score</span>
              <span className="text-2xl font-black text-brand-dark">{form.formScore}/100</span>
            </div>
            <p className="text-xs text-neutral-600">{form.summary}</p>
            {form.goodPoints?.length > 0 && <div className="rounded-xl bg-neutral-50 p-2 text-[11px]"><b className="text-brand-dark">✓ Already good:</b> <ul className="mt-1 space-y-0.5 text-neutral-600">{form.goodPoints.map((g, i) => <li key={i}>• {g}</li>)}</ul></div>}
            {form.corrections?.length > 0 && <div className="rounded-xl bg-amber-50 p-2 text-[11px]"><b className="text-amber-700">⚠ To fix:</b> <ul className="mt-1 space-y-0.5 text-amber-800">{form.corrections.map((g, i) => <li key={i}>• {g}</li>)}</ul></div>}
            {form.injuryRisk && <div className="rounded-xl bg-red-50 p-2 text-[11px] text-red-700"><b>Injury risk:</b> {form.injuryRisk}</div>}
            <p className="text-[10px] text-neutral-400">Movement education, not a substitute for direct coach/physiotherapist assessment.</p>
          </div>
        )}
      </Card>

      {/* 3. Training Programs */}
      <Card className="!p-5">
        <SectionTitle icon={<IconRun size={18} />} title="Training Programs" subtitle="Exam & championship preparation" />
        <div className="mt-3 space-y-3">
          {PROGRAMS.map((p) => (
            <details key={p.id} className="rounded-xl border border-neutral-100 p-3">
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-bold text-ink">
                <span className="text-xl">{p.emoji}</span>
                <span className="flex-1">{p.name}</span>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-dark">{p.weeks} wks</span>
              </summary>
              <p className="mt-2 text-[11px] text-neutral-500">Focus: {p.focus}</p>
              <ul className="mt-2 space-y-1 text-[11px] text-neutral-600">
                {p.plan.map((d, i) => <li key={i}>• {d}</li>)}
              </ul>
            </details>
          ))}
        </div>
      </Card>

      <div className="text-center">
        <Button variant="outline" onClick={() => { window.location.hash = '#/athlete' }}>View VO2Max & Training Zones →</Button>
      </div>
    </div>
  )
}
