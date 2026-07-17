import { useEffect, useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconSparkle, IconHeart, IconChartUp, IconActivity } from '../components/icons'
import { getHealthCache, pushBiometrics } from '../lib/profile'

// ─────────────────────────────────────────────────────────────────────────────
// Aesthetic Vitality — the science of "the pleasant, positive or artful
// appearance of a person," treated as a longevity/health signal rather than a
// judgment of worth. Perceived human beauty is, across the research, largely a
// read-out of HEALTH: symmetry, proportion, clear skin, and vitality are honest
// signals of good development, low pathogen load, and cardiometabolic fitness.
// So this page scores the *modifiable, health-linked* components of appearance
// from the same device data (Apple Health / WHOOP) the rest of the app uses,
// and explains the evolutionary, cultural, psychological, philosophical,
// historical, design-theory, neurological, and trend dimensions behind them.
//
// It intentionally does NOT rank faces or claim an objective "beauty number" —
// beauty is partly subjective and cultural. The score reflects health-linked
// aesthetic vitality you can actually influence, and every value is entered or
// synced by the user on their own device.
// ─────────────────────────────────────────────────────────────────────────────

const PHI = 1.618 // the golden ratio — a recurring proportion in studies of visual harmony

interface AesData {
  g: 'M' | 'F'
  // Body proportions (cm) — mostly shared with Body Composition.
  waist: number; hip: number; shoulder: number; height: number
  bodyFatPct: number
  // Health-linked "glow"/vitality inputs (sync from devices).
  sleepH: number; hrv: number; rhr: number; vo2: number
  hydrationL: number
  // Optional facial-harmony measurements (self-measured, all same unit).
  faceLen: number; faceWid: number         // face length / width → ideal ≈ PHI
  interocular: number; eyeToEye: number     // spacing symmetry proxy
}

const DEF: AesData = {
  g: 'M', waist: 0, hip: 0, shoulder: 0, height: 0, bodyFatPct: 0,
  sleepH: 0, hrv: 0, rhr: 0, vo2: 0, hydrationL: 0,
  faceLen: 0, faceWid: 0, interocular: 0, eyeToEye: 0,
}
const KEY = 'pmd_aesthetic_v1'

// Pull shared measurements + device data into this page's shape.
function syncFromDevices(cur: AesData): { next: AesData; changed: string[] } {
  const patch: Partial<AesData> = {}
  const changed: string[] = []
  const numFrom = (obj: Record<string, unknown>, k: string) => (typeof obj[k] === 'number' && (obj[k] as number) > 0 ? (obj[k] as number) : undefined)
  try {
    const bc = JSON.parse(localStorage.getItem('pm_bodycomp_v1') || '{}')
    const w = numFrom(bc, 'waist'); if (w && w !== cur.waist) { patch.waist = w; changed.push('Waist') }
    const h = numFrom(bc, 'hip'); if (h && h !== cur.hip) { patch.hip = h; changed.push('Hip') }
    const ht = numFrom(bc, 'h'); if (ht && ht !== cur.height) { patch.height = ht; changed.push('Height') }
    if ((bc.g === 'M' || bc.g === 'F') && bc.g !== cur.g) { patch.g = bc.g; changed.push('Sex') }
  } catch { /* ignore */ }
  const hc = getHealthCache() as Record<string, unknown>
  const sleep = numFrom(hc, 'sleepH'); if (sleep && sleep !== cur.sleepH) { patch.sleepH = sleep; changed.push('Sleep') }
  const hrv = numFrom(hc, 'hrvMs'); if (hrv && hrv !== cur.hrv) { patch.hrv = hrv; changed.push('HRV') }
  const rhr = numFrom(hc, 'restingHr'); if (rhr && rhr !== cur.rhr) { patch.rhr = rhr; changed.push('Resting HR') }
  const vo2 = numFrom(hc, 'vo2max'); if (vo2 && vo2 !== cur.vo2) { patch.vo2 = vo2; changed.push('VO₂max') }
  const bf = numFrom(hc, 'bodyFatPct'); if (bf && bf !== cur.bodyFatPct) { patch.bodyFatPct = bf; changed.push('Body Fat') }
  return { next: { ...cur, ...patch }, changed }
}

function load(): AesData {
  let d: AesData = { ...DEF }
  try { d = { ...DEF, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { /* ignore */ }
  return d
}

// ── Indicator scoring (0-100 each). Every indicator is a HEALTH signal that
// research links to perceived attractiveness — framed as vitality, not verdict.
interface Indicator {
  id: string; emoji: string; name: string; value: string; score: number
  target: string; why: string; weight: number
}

function clamp(n: number, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, n)) }

function indicatorsOf(d: AesData): Indicator[] {
  const out: Indicator[] = []
  const M = d.g === 'M'

  // Waist-to-hip ratio — one of the most cross-culturally robust attractiveness
  // signals (Singh). Ideal ≈ 0.7 (F) / 0.9 (M); it tracks cardiometabolic health.
  if (d.waist > 0 && d.hip > 0) {
    const whr = d.waist / d.hip
    const ideal = M ? 0.9 : 0.7
    const score = clamp(100 - Math.abs(whr - ideal) * (M ? 350 : 300))
    out.push({ id: 'whr', emoji: '⏳', name: 'Waist-Hip Ratio', value: whr.toFixed(2), score, target: M ? '≈0.90' : '≈0.70', why: 'A cross-culturally consistent signal of fertility & cardiometabolic health.', weight: 0.18 })
  }
  // Waist-to-height ratio — a strong health marker; ~0.5 is the "keep waist under
  // half your height" rule, and mid-range reads as healthy/attractive.
  if (d.waist > 0 && d.height > 0) {
    const whtr = d.waist / d.height
    const score = clamp(100 - Math.abs(whtr - 0.46) * 500)
    out.push({ id: 'whtr', emoji: '📏', name: 'Waist-Height Ratio', value: whtr.toFixed(2), score, target: '≈0.46', why: 'Central adiposity marker — low visceral fat reads as healthy and youthful.', weight: 0.12 })
  }
  // Shoulder-to-waist (V-taper for men) / waist-to-hip already covers women.
  if (M && d.shoulder > 0 && d.waist > 0) {
    const swr = d.shoulder / d.waist
    // A shoulder:waist near the golden ratio (~1.618) is the classic "V".
    const score = clamp(100 - Math.abs(swr - PHI) * 120)
    out.push({ id: 'swr', emoji: '🔺', name: 'Shoulder-Waist (V-taper)', value: swr.toFixed(2), score, target: `≈${PHI} (φ)`, why: 'The golden-ratio "V" torso — a marker of upper-body development.', weight: 0.12 })
  }
  // Body fat in a healthy, athletic range signals vitality (not extremes).
  if (d.bodyFatPct > 0) {
    const mid = M ? 14 : 22
    const score = clamp(100 - Math.abs(d.bodyFatPct - mid) * 4)
    out.push({ id: 'bf', emoji: '🫀', name: 'Body Composition', value: `${d.bodyFatPct.toFixed(0)}%`, score, target: M ? '≈10-18%' : '≈18-26%', why: 'A healthy, athletic body-fat range signals fitness without extremes.', weight: 0.12 })
  }
  // "Glow" / skin quality proxy — driven by sleep. Poor sleep visibly ages skin
  // and dulls complexion (well-documented in dermatology).
  if (d.sleepH > 0) {
    const score = clamp(100 - Math.abs(d.sleepH - 7.75) * 26)
    out.push({ id: 'sleep', emoji: '😴', name: 'Sleep (skin repair)', value: `${d.sleepH.toFixed(1)}h`, score, target: '7-8.5h', why: 'Overnight repair drives skin clarity, under-eye tone & a rested look.', weight: 0.14 })
  }
  // HRV & resting HR — autonomic balance shows as calm, vital appearance.
  if (d.hrv > 0) {
    const score = clamp((d.hrv / 70) * 100)
    out.push({ id: 'hrv', emoji: '🌿', name: 'Recovery (HRV)', value: `${d.hrv} ms`, score, target: 'higher is better', why: 'Autonomic recovery reads outwardly as calm, vital, and un-stressed.', weight: 0.1 })
  }
  if (d.rhr > 0) {
    const score = clamp(100 - Math.max(0, d.rhr - 58) * 3)
    out.push({ id: 'rhr', emoji: '❤️', name: 'Resting HR (vitality)', value: `${d.rhr} bpm`, score, target: '50-60 bpm', why: 'Cardiovascular efficiency underlies healthy colour & energy.', weight: 0.08 })
  }
  if (d.vo2 > 0) {
    const good = M ? 46 : 40
    const score = clamp((d.vo2 / good) * 80)
    out.push({ id: 'vo2', emoji: '🏃', name: 'Aerobic Fitness', value: d.vo2.toFixed(0), score, target: `≥${good}`, why: 'Circulation & oxygen delivery support skin, posture & radiance.', weight: 0.08 })
  }
  // Facial harmony (optional). Face length:width near φ, and symmetric eye
  // spacing, are the classic proportion cues studied in facial-attractiveness work.
  if (d.faceLen > 0 && d.faceWid > 0) {
    const ratio = d.faceLen / d.faceWid
    const score = clamp(100 - Math.abs(ratio - PHI) * 90)
    out.push({ id: 'face', emoji: '🙂', name: 'Facial Proportion (φ)', value: ratio.toFixed(2), score, target: `≈${PHI}`, why: 'Length-to-width near the golden ratio is a studied harmony cue — one factor among many.', weight: 0.1 })
  }
  if (d.interocular > 0 && d.eyeToEye > 0) {
    // Interocular distance ≈ eye width is a common "neoclassical canon" symmetry proxy.
    const ratio = d.interocular / d.eyeToEye
    const score = clamp(100 - Math.abs(ratio - 1) * 200)
    out.push({ id: 'sym', emoji: '⚖️', name: 'Facial Symmetry proxy', value: ratio.toFixed(2), score, target: '≈1.00', why: 'Bilateral symmetry is a core, cross-cultural beauty signal of stable development.', weight: 0.08 })
  }
  return out
}

// ── Conceptual pillars the user asked to be explained ────────────────────────
const PILLARS = [
  { emoji: '🧬', title: 'Evolutionary Biology', body: 'Attractiveness signals evolved as honest cues of health and fertility: symmetry (developmental stability), clear skin (low pathogen load), waist-hip ratio (hormonal & reproductive health), and averageness (genetic diversity). We find "healthy" beautiful because our ancestors who did left more descendants.' },
  { emoji: '📐', title: 'Proportion & the Golden Ratio', body: `The golden ratio (φ ≈ ${PHI}) and simple whole-number proportions recur in analyses of faces and bodies people rate as harmonious. They are tendencies, not laws — attractive faces cluster near certain ratios but the spread is wide, and no single number defines beauty.` },
  { emoji: '🌍', title: 'Cultural Dimension', body: 'On top of the shared biological base, cultures amplify different features and shift over time — body ideals, adornment, grooming, and "microcultures" of style. Beauty is both universal (symmetry/health) and local (what a community celebrates now).' },
  { emoji: '🧠', title: 'Neurology & Psychology', body: 'The brain processes attractive faces in reward circuits (orbitofrontal cortex, nucleus accumbens); fluency — how easily the visual system processes a stimulus — feels pleasant. The "halo effect" then leads us to attribute other good traits to attractive people.' },
  { emoji: '🏛️', title: 'History & Philosophy', body: 'From the Greek canon of proportion and "kalos" to Kant\'s "disinterested" pleasure and Hume\'s "beauty is in the eye of the beholder," thinkers have long balanced objective harmony against subjective taste. Both are real; neither is the whole story.' },
  { emoji: '🎨', title: 'Design Theory & Usability', body: 'Design research finds symmetry, balance, contrast, and clarity make objects and interfaces feel more attractive — and the "aesthetic-usability effect" shows people even perceive beautiful things as working better. The same harmony principles echo in how we read faces and bodies.' },
  { emoji: '📈', title: 'Trends & Appreciation', body: 'Ideals move: fashions in physique, grooming, and features cycle with media and generation. Cultivating your own taste — appreciating the artful and pleasant — is itself a skill, and self-expression is a legitimate, healthy part of aesthetics.' },
]

export function AestheticVitality() {
  const [d, setD] = useState<AesData>(() => syncFromDevices(load()).next)
  const [syncNote, setSyncNote] = useState('')
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(d)) } catch { /* ignore */ } }, [d])
  useEffect(() => { pushBiometrics({ sleepH: d.sleepH, hrvMs: d.hrv, restingHr: d.rhr, vo2max: d.vo2 }) }, [d.sleepH, d.hrv, d.rhr, d.vo2])
  const u = (p: Partial<AesData>) => setD((x) => ({ ...x, ...p }))

  function syncNow(silent = false) {
    setD((cur) => {
      const { next, changed } = syncFromDevices(cur)
      if (!silent) setSyncNote(changed.length ? `Updated from your devices & Body Composition: ${changed.join(', ')}.` : 'Already up to date with your device data.')
      return changed.length ? next : cur
    })
  }
  useEffect(() => {
    const onFocus = () => syncNow(true)
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const indicators = useMemo(() => indicatorsOf(d), [d])
  const score = indicators.length >= 3
    ? Math.round(indicators.reduce((s, i) => s + i.score * i.weight, 0) / indicators.reduce((s, i) => s + i.weight, 0))
    : null
  const scoreColor = score == null ? '#a3a3a3' : score >= 75 ? '#00BF63' : score >= 55 ? '#f59e0b' : '#ef4444'

  const num = (label: string, key: keyof AesData, step = 1, ph = '') => (
    <Field label={label}>
      <input className={inputClass} type="number" step={step} placeholder={ph}
        value={(d[key] as number) || ''} onChange={(e) => u({ [key]: +e.target.value } as Partial<AesData>)} />
    </Field>
  )

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      {/* Hero score */}
      <Card className="!p-5">
        <SectionTitle
          icon={<IconSparkle size={20} />}
          title="Aesthetic Vitality"
          subtitle="The science of a healthy, radiant appearance — read as vitality, not a verdict. Proportion, skin & recovery indicators auto-sync from your Health Profile and Body Composition."
          right={<button onClick={() => syncNow(false)} className="shrink-0 rounded-full border border-brand/30 bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-dark active:scale-95">🔄 Sync devices</button>}
        />
        {syncNote && <p className="mt-2 rounded-xl bg-brand-50 px-3 py-2 text-[11px] font-semibold text-brand-dark">{syncNote}</p>}
        <div className="mt-3 flex items-center gap-5">
          <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
            <svg width="120" height="120" className="-rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="10" />
              <circle cx="60" cy="60" r="52" fill="none" stroke={scoreColor} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 52} strokeDashoffset={2 * Math.PI * 52 * (1 - (score ?? 0) / 100)}
                style={{ transition: 'stroke-dashoffset 0.8s ease', filter: `drop-shadow(0 0 8px ${scoreColor}55)` }} />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <div className="text-3xl font-black" style={{ color: scoreColor }}>{score ?? '—'}</div>
                <div className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">Vitality Index</div>
              </div>
            </div>
          </div>
          <div className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
            {score == null
              ? 'Enter or sync at least three indicators below to see your Aesthetic Vitality Index — a blend of proportion, body composition, skin-repair, and vitality signals that research links to a healthy, attractive appearance.'
              : <>Your index blends <b>{indicators.length}</b> health-linked signals. It reflects the modifiable, health-driven part of appearance — improving sleep, recovery, and body composition moves it, and each also adds years of healthspan.</>}
          </div>
        </div>
      </Card>

      {/* Live indicators */}
      {indicators.length > 0 && (
        <Card className="!p-5">
          <SectionTitle icon={<IconChartUp size={20} />} title="Your Live Indicators" subtitle="Each is a health signal research links to perceived attractiveness" />
          <div className="mt-3 space-y-2">
            {indicators.map((i) => (
              <div key={i.id} className="rounded-xl border border-neutral-100 p-3 dark:border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-bold text-ink dark:text-white"><span>{i.emoji}</span>{i.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-black text-ink dark:text-white">{i.value}</span>
                    <Badge tone={i.score >= 75 ? 'brand' : i.score >= 50 ? 'low' : 'critical'}>{Math.round(i.score)}</Badge>
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                  <div className="h-full rounded-full" style={{ width: `${i.score}%`, background: i.score >= 75 ? '#00BF63' : i.score >= 50 ? '#f59e0b' : '#ef4444' }} />
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">Target {i.target} · {i.why}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Inputs */}
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Measurements" subtitle="Proportion & vitality inputs — most auto-fill from other pages; facial ones are optional & self-measured" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Sex">
            <select className={inputClass} value={d.g} onChange={(e) => u({ g: e.target.value as 'M' | 'F' })}>
              <option value="M">Male</option><option value="F">Female</option>
            </select>
          </Field>
          {num('Waist (cm)', 'waist')}
          {num('Hip (cm)', 'hip')}
          {num('Shoulder (cm)', 'shoulder')}
          {num('Height (cm)', 'height')}
          {num('Body Fat %', 'bodyFatPct', 0.1)}
          {num('Sleep (hrs)', 'sleepH', 0.1)}
          {num('HRV (ms)', 'hrv')}
          {num('Resting HR', 'rhr')}
          {num('VO₂max', 'vo2', 0.1)}
        </div>
        <div className="mt-4 text-[11px] font-bold uppercase tracking-wide text-neutral-400">Optional facial harmony (any consistent unit)</div>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {num('Face length', 'faceLen', 0.1)}
          {num('Face width', 'faceWid', 0.1)}
          {num('Inter-eye gap', 'interocular', 0.1)}
          {num('Single eye width', 'eyeToEye', 0.1)}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-400">
          Facial ratios are one small, uncertain factor among many — enter them only if curious. Measure from a straight-on photo with a ruler; face length ÷ width near φ ({PHI}) and inter-eye gap ≈ one eye width are the classic proportion/symmetry cues.
        </p>
      </Card>

      {/* Concept pillars */}
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="What Makes Something Beautiful?" subtitle="The evolutionary, cultural, psychological, philosophical & design dimensions" />
        <div className="mt-3 space-y-3">
          {PILLARS.map((p) => (
            <div key={p.title} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
              <div className="flex items-center gap-2 text-sm font-bold text-ink dark:text-white"><span className="text-lg">{p.emoji}</span>{p.title}</div>
              <p className="mt-1 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">{p.body}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Healthy framing */}
      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        <IconSparkle size={12} className="mr-1 inline" />
        This is an educational, health-forward tool: it scores the modifiable, health-linked components of appearance and explains the science of beauty. It is <b>not</b> a judgment of your worth, not a comparison to others, and not a clinical or cosmetic assessment. Beauty is partly subjective and cultural — the healthiest goal is vitality, self-expression, and appreciating the pleasant and artful, in yourself and the world.
      </div>
    </div>
  )
}

export default AestheticVitality
