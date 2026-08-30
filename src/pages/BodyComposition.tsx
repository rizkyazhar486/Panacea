import { useEffect, useMemo, useState } from 'react'
import { Prosa } from '../components/Prosa'
import { KolomAngka } from '../components/KolomAngka'
import { Card, SectionTitle, Field, inputClass, Badge, Button } from '../components/ui'
import { useVitals } from '../lib/useVitals'
import { IconHeart, IconActivity, IconChartUp, IconMoon } from '../components/icons'
import { getHealthCache, pushBiometrics, mergeHealthCache } from '../lib/profile'
import { mergeVitals } from '../lib/healthVitals'

// ─────────────────────────────────────────────────────────────────────────────
// Komposisi Tubuh — InBody-style visual page. Nilai yang diketahui perangkat
// terisi sendiri; sisanya diketik (dari timbangan pintar / cetakan InBody) lalu
// divisualkan dengan
// Under–Normal–Over bars, a 9-cell body-type grid and longevity indicators.
// Persists locally so it works offline.
// ─────────────────────────────────────────────────────────────────────────────

interface Body {
  w: number; h: number; age: number; g: 'M' | 'F'
  waist: number; hip: number; neck: number
  smm: number; bfm: number // optional direct from InBody (0 = estimate)
  rhr: number; hrv: number; sleepH: number; remH: number; deepH: number
  stress: number; anxiety: number; mood: number // 0-10 self report
  mets: number; caffeineCutoff: string; noiseDb: number
  vo2: number
  bmd: number // bone mineral density T-score (from DEXA scan, if available)
}
const DEF: Body = {
  w: 70, h: 170, age: 30, g: 'M', waist: 85, hip: 98, neck: 38,
  smm: 0, bfm: 0, rhr: 65, hrv: 0, sleepH: 7, remH: 1.5, deepH: 1.2,
  stress: 4, anxiety: 3, mood: 7, mets: 6, caffeineCutoff: '14:00', noiseDb: 45, vo2: 0,
  bmd: 0,
}
const KEY = 'pm_bodycomp_v1'
const load = (): Body => {
  let d = DEF
  try { d = { ...DEF, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { /* ignore */ }
  // Seed demographics from the shared profile if the user hasn't set them here yet.
  try {
    const p = JSON.parse(localStorage.getItem('pmd_profile') || '{}')
    if (!localStorage.getItem(KEY)) {
      if (p.age) d.age = p.age
      if (p.sex) d.g = p.sex
      if (p.weightKg) d.w = p.weightKg
      if (p.heightCm) d.h = p.heightCm
    }
  } catch { /* ignore */ }
  return d
}

// US Navy body-fat % (needs waist/neck/hip in cm, height in cm).
function navyBf(b: Body): number {
  const log10 = Math.log10
  // Persamaan lingkar U.S. Navy (Hodgdon & Beckett, 1984, Naval Health
  // Research Center) — sekitar +-3-4% terhadap densitometri.
  if (b.g === 'M') return 495 / (1.0324 - 0.19077 * log10(Math.max(1, b.waist - b.neck)) + 0.15456 * log10(b.h)) - 450
  return 495 / (1.29579 - 0.35004 * log10(Math.max(1, b.waist + b.hip - b.neck)) + 0.221 * log10(b.h)) - 450
}
// Mifflin-St Jeor BMR.
// Mifflin-St Jeor (1990), Am J Clin Nutr 51(2):241-7.
function bmr(b: Body) { return Math.round(10 * b.w + 6.25 * b.h - 5 * b.age + (b.g === 'M' ? 5 : -161)) }

// InBody-style horizontal bar: value plotted on an Under|Normal|Over strip.
function RangeBar({ label, value, unit, lo, hi, max, danger }: {
  label: string; value: number; unit: string; lo: number; hi: number; max: number; danger?: boolean
}) {
  const pct = Math.min(100, Math.max(2, (value / max) * 100))
  const loP = (lo / max) * 100, hiP = (hi / max) * 100
  const inRange = value >= lo && value <= hi
  return (
    <div className="rounded-xl border border-neutral-100 p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-bold text-neutral-500">{label}</span>
        <span className={'text-lg font-extrabold ' + (inRange ? 'text-ink' : danger ? 'text-rose-500' : 'text-amber-600')}>
          {Number.isFinite(value) ? value.toFixed(1) : '—'}<span className="ml-0.5 text-[10px] font-medium text-neutral-500">{unit}</span>
        </span>
      </div>
      <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-neutral-100">
        <div className="absolute inset-y-0 bg-emerald-100" style={{ left: `${loP}%`, width: `${hiP - loP}%` }} />
        <div className={'absolute inset-y-0 left-0 rounded-full ' + (inRange ? 'bg-brand' : 'bg-rose-400')} style={{ width: `${pct}%` }} />
        <div className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-neutral-300" style={{ left: `${loP}%` }} />
        <div className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-neutral-300" style={{ left: `${hiP}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-neutral-500"><span>Under</span><span>Normal</span><span>Over</span></div>
    </div>
  )
}

// 9-cell body-type grid (BMI × PBF) like InBody's Comprehensive Analysis.
function BodyTypeGrid({ bmi, pbf, g }: { bmi: number; pbf: number; g: 'M' | 'F' }) {
  const pbfLo = g === 'M' ? 10 : 18, pbfHi = g === 'M' ? 20 : 28
  const col = pbf < pbfLo ? 0 : pbf <= pbfHi ? 1 : 2
  const row = bmi >= 23 ? 0 : bmi >= 18.5 ? 1 : 2
  const CELLS = [
    ['Athletic', 'Overweight', 'Obesity'],
    ['Muscular', 'Average', 'Mild Obesity'],
    ['Thin', 'Slightly Thin', 'Sarcopenic'],
  ]
  const label = CELLS[row][col]
  return (
    <div>
      <div className="text-xs font-bold text-neutral-500">Body Type</div>
      <div className="text-2xl font-extrabold text-ink">{label}</div>
      <div className="mt-2 grid grid-cols-3 gap-1">
        {CELLS.flatMap((r, ri) => r.map((c, ci) => (
          <div key={`${ri}${ci}`}
            className={'relative rounded-lg p-2 text-[10px] font-bold leading-tight ' + (ri === row && ci === col ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400' : 'bg-neutral-50 text-neutral-500')}>
            {c}
            {ri === row && ci === col && <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full bg-amber-500" />}
          </div>
        )))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-neutral-500"><span>Low PBF</span><span>Normal</span><span>High</span></div>
    </div>
  )
}

// Pull whatever the Health Profile has synced from Apple Health / WHOOP / etc.
// and map it onto this page's fields, so the two don't silently disagree.
function syncFromHealthProfile(cur: Body): { next: Body; changed: string[] } {
  const hc = getHealthCache() as Record<string, unknown>
  const num = (k: string) => (typeof hc[k] === 'number' && (hc[k] as number) > 0 ? (hc[k] as number) : undefined)
  const patch: Partial<Body> = {}
  const changed: string[] = []
  const wKg = num('weightKg'); if (wKg) { patch.w = wKg; changed.push('Weight') }
  const bf = num('bodyFatPct')
  if (bf) { patch.bfm = +(((wKg ?? cur.w) * bf) / 100).toFixed(1); changed.push('Body Fat') }
  const smm = num('muscleMassKg'); if (smm) { patch.smm = smm; changed.push('Muscle Mass') }
  const vo2 = num('vo2max'); if (vo2) { patch.vo2 = vo2; changed.push('VO₂max') }
  const rhr = num('restingHr'); if (rhr) { patch.rhr = rhr; changed.push('Resting HR') }
  const hrv = num('hrvMs'); if (hrv) { patch.hrv = hrv; changed.push('HRV') }
  const sleepH = num('sleepH'); if (sleepH) { patch.sleepH = sleepH; changed.push('Sleep') }
  return { next: { ...cur, ...patch }, changed }
}

export function BodyComposition() {
  // Sync BEFORE the first render (not in an effect) so the push-back effect
  // below never has a chance to commit stale default values over real synced
  // ones — that race is exactly what caused this page to silently disagree
  // with Apple Health/WHOOP data in the first place.
  const [b, setB] = useState<Body>(() => {
    const initial = load()
    if (localStorage.getItem(KEY) == null) return syncFromHealthProfile(initial).next
    return initial
  })
  const [syncNote, setSyncNote] = useState('')
  const [baruDisimpan, setBaruDisimpan] = useState<string | null>(null)
  const vital = useVitals()
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(b)) } catch { /* ignore */ } }, [b])
  // Keep the shared Health Profile cache in sync with manual edits made here too,
  // so calculators elsewhere in the app don't drift from what's shown on this page.
  useEffect(() => { pushBiometrics({ vo2max: b.vo2, restingHr: b.rhr, hrvMs: b.hrv, sleepH: b.sleepH, weightKg: b.w }) }, [b.vo2, b.rhr, b.hrv, b.sleepH, b.w])
  const u = (p: Partial<Body>) => setB((x) => ({ ...x, ...p }))

  function syncNow(silent = false) {
    setB((cur) => {
      const { next, changed } = syncFromHealthProfile(cur)
      if (!silent) setSyncNote(changed.length ? `Synced from Health Profile: ${changed.join(', ')}.` : 'No new device data found in Health Profile.')
      return changed.length ? next : cur
    })
  }

  // Re-sync whenever the tab regains focus, mirroring the same focus-resync
  // pattern Health Profile uses for data pushed in from a phone.
  useEffect(() => {
    const onFocus = () => syncNow(true)
    window.addEventListener('focus', onFocus)
    window.addEventListener('panacea:health-updated', onFocus)
    return () => { window.removeEventListener('focus', onFocus); window.removeEventListener('panacea:health-updated', onFocus) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const d = useMemo(() => {
    const bmi = b.w / Math.pow(b.h / 100, 2)
    const pbf = b.bfm > 0 ? (b.bfm / b.w) * 100 : navyBf(b)
    const fatMass = b.bfm > 0 ? b.bfm : (pbf / 100) * b.w
    const lean = b.w - fatMass
    const smm = b.smm > 0 ? b.smm : lean * 0.55 // approx skeletal from lean
    const whr = b.waist / b.hip
    const basal = bmr(b)
    const visceral = Math.max(1, Math.round((b.waist - (b.g === 'M' ? 78 : 70)) / 2 + pbf / 8))
    // Cardio fitness ≈ VO2max tier + life-expectancy delta heuristic (Mandsager 2018 direction).
    const vo2Tier = b.vo2 >= 52 ? 'Elite' : b.vo2 >= 45 ? 'Excellent' : b.vo2 >= 38 ? 'Fair' : 'Low'
    const lifeBase = b.g === 'M' ? 72 : 76 // Indonesia approx
    // PERINGATAN: koefisien pada lifeAdj, readiness dan aging di bawah ini
    // adalah pilihan penulis, bukan hasil penelitian. Angkanya berguna untuk
    // melihat ARAH perubahan pada diri sendiri, bukan untuk dibandingkan
    // dengan orang lain atau dibaca sebagai tahun hidup.
    const lifeAdj = (b.vo2 - 38) * 0.25 + (smm / b.w > 0.4 ? 2 : 0) - (whr > (b.g === 'M' ? 0.9 : 0.85) ? 2 : 0) - b.stress * 0.2 + (b.sleepH >= 7 ? 1 : -1)
    const lifeExp = Math.round(lifeBase + lifeAdj)
    // Restorative sleep = (REM + deep) / total.
    const restorative = b.sleepH > 0 ? ((b.remH + b.deepH) / b.sleepH) * 100 : 0
    // Body battery 0-100: sleep + HRV − stress − RHR penalty.
    const battery = Math.max(5, Math.min(100, Math.round(b.sleepH / 8 * 50 + (b.hrv > 0 ? Math.min(25, b.hrv / 4) : 15) + (10 - b.stress) * 2.5 - Math.max(0, b.rhr - 60) * 0.5)))
    // Readiness: battery + restorative blend.
    const readiness = Math.round(battery * 0.6 + Math.min(100, restorative * 2) * 0.4)
    // Pace of aging heuristic: 1.0 = normal.
    const aging = Math.max(0.6, Math.min(1.6, 1 + (38 - b.vo2) * 0.01 + b.stress * 0.02 - (b.sleepH - 7) * 0.05))
    // InBody-like score.
    const score = Math.max(20, Math.min(100, Math.round(80 + (smm / b.w - 0.42) * 100 - Math.max(0, pbf - (b.g === 'M' ? 20 : 28)) * 1.5)))
    return { bmi, pbf, fatMass, lean, smm, whr, basal, visceral, vo2Tier, lifeExp, restorative, battery, readiness, aging, score }
  }, [b])

  // Kolom yang sudah diisi perangkat diberi penanda ⌚ supaya angka yang
  // terisi sendiri tidak pernah disangka ketikan sendiri, dan koreksi manual
  // punya tombol ↵ (atau Enter) yang menyiarkannya ke seluruh aplikasi.
  const KE_VITAL: Partial<Record<keyof Body, string>> = {
    w: 'weightKg', vo2: 'vo2max', rhr: 'restingHr', hrv: 'hrvMs',
    sleepH: 'sleepH', smm: 'muscleMassKg',
  }
  const num = (label: string, key: keyof Body, step = 1) => {
    const kv = KE_VITAL[key]
    const nilai = b[key] as number
    const perangkat = kv ? vital[kv] : undefined
    const dariPerangkat = typeof nilai === 'number' && typeof perangkat === 'number'
      && Math.abs(nilai - perangkat) < 0.05
    const kirim = () => {
      if (!kv || typeof nilai !== 'number' || !(nilai > 0) || dariPerangkat) return
      mergeVitals({ [kv]: nilai, source: 'Manual', measuredAt: new Date().toISOString() })
      mergeHealthCache({ [kv]: nilai })
      setBaruDisimpan(String(key))
      setTimeout(() => setBaruDisimpan(null), 1800)
    }
    const perluSimpan = !!kv && typeof nilai === 'number' && nilai > 0 && !dariPerangkat
    return (
      <Field label={
        <span className="flex items-center gap-1">
          <span>{label}</span>
          {dariPerangkat && <span className="rounded bg-brand-50 px-1 text-[10px] font-bold text-brand-dark" title="Filled automatically from your device">⌚</span>}
        </span>
      }>
        <div className="flex items-center gap-1"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); kirim() } }}>
          <KolomAngka
            nilai={b[key] as number | undefined}
            onNilai={(n) => u({ [key]: n } as Partial<Body>)}
            step={step}
            ariaLabel={label} />
          {perluSimpan && baruDisimpan !== String(key) && (
            <button type="button" onClick={kirim} aria-label={`Save ${label}`}
              title="Save this value app-wide (or press Enter)"
              className="shrink-0 rounded-lg bg-brand px-2 py-1.5 text-[12px] font-black text-ink">↵</button>
          )}
          {baruDisimpan === String(key) && <span className="shrink-0 text-[10px] font-bold text-emerald-600" role="status">✓</span>}
        </div>
      </Field>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-24">
      {/* Inputs */}
      <Card className="!p-5">
        <SectionTitle
          icon={<IconActivity size={20} />}
          title="Body Composition & Longevity"
          subtitle="Filled in automatically from your Health Profile (Apple Health / WHOOP / etc.) — you can override any value by hand from a smart scale or an InBody printout"
          right={<Button variant="outline" onClick={() => syncNow(false)}>🔄 Sync from Health Profile</Button>}
        />
        {syncNote && <p className="mt-2 rounded-xl bg-brand-50 px-3 py-2 text-[11px] font-semibold text-brand-dark">{syncNote}</p>}
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {num('Weight (kg)', 'w', 0.1)}
          {num('Height (cm)', 'h')}
          {num('Age', 'age')}
          <Field label="Sex">
            <select className={inputClass} value={b.g} onChange={(e) => u({ g: e.target.value as 'M' | 'F' })}>
              <option value="M">Male</option><option value="F">Female</option>
            </select>
          </Field>
          {num('Waist (cm)', 'waist')}
          {num('Hip (cm)', 'hip')}
          {num('Neck (cm)', 'neck')}
          {num('VO₂max', 'vo2', 0.1)}
          {num('SMM InBody (kg, opt.)', 'smm', 0.1)}
          {num('Fat Mass InBody (kg, opt.)', 'bfm', 0.1)}
          {num('Resting HR', 'rhr')}
          {num('HRV (ms)', 'hrv')}
        </div>
      </Card>

      {/* Score + bento header */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="!p-4 liquid-glass">
          <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">Composition Score</div>
          <div className="text-4xl font-extrabold text-brand-dark">{d.score}<span className="text-sm font-medium text-neutral-500"> /100</span></div>
          <Badge tone={d.score >= 80 ? 'brand' : d.score >= 65 ? 'low' : 'critical'}>{d.score >= 80 ? 'Athletic' : d.score >= 65 ? 'Average' : 'Needs improvement'}</Badge>
        </Card>
        <Card className="!p-4 liquid-glass"><BodyTypeGrid bmi={d.bmi} pbf={d.pbf} g={b.g} /></Card>
      </div>

      <ScaleMeasurements />

      {/* Muscle-Fat analysis bars */}
      <Card className="!p-5">
        <SectionTitle icon={<IconChartUp size={20} />} title="Muscle-Fat Analysis" subtitle="InBody style: Under · Normal · Over" />
        <div className="mt-3 space-y-2.5">
          <RangeBar label="Body Weight" value={b.w} unit="kg" lo={18.5 * Math.pow(b.h / 100, 2)} hi={24.9 * Math.pow(b.h / 100, 2)} max={35 * Math.pow(b.h / 100, 2)} />
          <RangeBar label="Skeletal Muscle Mass" value={d.smm} unit="kg" lo={b.w * 0.37} hi={b.w * 0.5} max={b.w * 0.6} />
          <RangeBar label="Body Fat Mass" value={d.fatMass} unit="kg" lo={b.w * (b.g === 'M' ? 0.08 : 0.15)} hi={b.w * (b.g === 'M' ? 0.2 : 0.28)} max={b.w * 0.45} danger />
          <RangeBar label="BMI" value={d.bmi} unit="kg/m²" lo={18.5} hi={24.9} max={40} />
          <RangeBar label="Percent Body Fat" value={d.pbf} unit="%" lo={b.g === 'M' ? 10 : 18} hi={b.g === 'M' ? 20 : 28} max={50} danger />
          <RangeBar label="Waist-Hip Ratio" value={d.whr} unit="" lo={0.7} hi={b.g === 'M' ? 0.9 : 0.85} max={1.2} danger />
          <RangeBar label="Visceral Fat Level" value={d.visceral} unit="Lv" lo={1} hi={9} max={20} danger />
          <RangeBar label="Lean Body Mass" value={d.lean} unit="kg" lo={b.w * 0.7} hi={b.w * 0.92} max={b.w} />
        </div>
        <div className="mt-3 rounded-xl bg-neutral-50 p-3 text-[11px] leading-relaxed text-neutral-500">
          <b className="text-ink">BMR: {d.basal} kcal</b> (Mifflin-St Jeor) — baseline requirement before activity.
          Body fat is calculated using the US Navy method from body circumference measurements when InBody data is not provided.
        </div>
      </Card>

      {/* Lab & Pemeriksaan Lanjutan */}
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Lab & Advanced Screening" subtitle="Bone mineral density (DEXA) — fill this in if you have a scan result" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {num('T-score BMD (DEXA)', 'bmd', 0.1)}
        </div>
        {b.bmd !== 0 && (
          <div className="mt-3 rounded-xl bg-neutral-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500">WHO Classification</span>
              <Badge tone={b.bmd >= -1 ? 'brand' : b.bmd >= -2.5 ? 'low' : 'critical'}>
                {b.bmd >= -1 ? 'Normal' : b.bmd >= -2.5 ? 'Osteopenia' : 'Osteoporosis'}
              </Badge>
            </div>
            <Prosa kelas="mt-1.5 text-[11px] leading-relaxed text-neutral-500">T-score ≥ −1: normal · −1 to −2.5: osteopenia (low bone mass) · ≤ −2.5: osteoporosis (WHO criteria). Bone density declines naturally with age — resistance training plus adequate calcium, vitamin D and protein help preserve it.</Prosa>
          </div>
        )}
        {b.bmd === 0 && <p className="mt-2 text-[11px] text-neutral-500">No data yet. BMD is measured via a DEXA scan at a health facility/radiology lab.</p>}
      </Card>

      {/* Longevity indicator bento */}
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Daily Markers" subtitle="The direction of change in yourself, not absolute numbers" />
        <p className="mt-2 rounded-xl bg-amber-500/10 px-3 py-2 text-[11px] leading-snug text-amber-800 dark:text-amber-300">
          Readiness, pace of aging and life expectancy below are computed with <b>weights chosen by the author</b>, not
          research findings. Read them as change over time — do not compare them with other people or read them as years of
          life. Body-fat percentage and BMR on this page use published equations (Navy tape; Mifflin-St Jeor).
        </p>
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {num('Total sleep (hrs)', 'sleepH', 0.1)}
          {num('REM (hrs)', 'remH', 0.1)}
          {num('Deep/N3 (hrs)', 'deepH', 0.1)}
          {num('Stress (0-10)', 'stress')}
          {num('Anxiety (0-10)', 'anxiety')}
          {num('Mood (0-10)', 'mood')}
          {num('Exercise METs', 'mets', 0.5)}
          {num('Noise (dB)', 'noiseDb')}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[
            { t: 'Training Readiness', v: `${d.readiness}`, u: '/100', tone: d.readiness >= 70 ? 'text-brand-dark' : d.readiness >= 45 ? 'text-amber-600' : 'text-rose-500', note: d.readiness >= 70 ? 'Ready for a hard session' : d.readiness >= 45 ? 'Light-moderate session' : 'Prioritize recovery' },
            { t: 'Body Battery', v: `${d.battery}`, u: '/100', tone: d.battery >= 60 ? 'text-brand-dark' : 'text-amber-600', note: 'Sleep + HRV − stress' },
            { t: 'Cardio Fitness', v: b.vo2.toFixed(0), u: 'VO₂max', tone: 'text-brand-dark', note: d.vo2Tier },
            { t: 'Resting HR', v: `${b.rhr}`, u: 'bpm', tone: b.rhr <= 60 ? 'text-brand-dark' : b.rhr <= 72 ? 'text-amber-600' : 'text-rose-500', note: b.rhr <= 60 ? 'Healthy' : 'Can be lowered with Zone 2' },
            { t: 'Restorative Sleep', v: d.restorative.toFixed(0), u: '%', tone: d.restorative >= 35 ? 'text-brand-dark' : 'text-amber-600', note: 'REM + Deep out of total' },
            { t: 'Pace of Aging', v: d.aging.toFixed(2), u: '×', tone: d.aging <= 1 ? 'text-brand-dark' : 'text-amber-600', note: d.aging <= 1 ? 'Aging more slowly 🎉' : 'Improve sleep & VO₂max' },
            { t: 'Estimated Life Expectancy', v: `${d.lifeExp}`, u: 'yrs', tone: 'text-ink', note: 'Heuristic — check Longevity Illustrator for actuarial figures' },
            { t: 'Physical Effort', v: b.mets.toFixed(1), u: 'METs', tone: b.mets >= 6 ? 'text-brand-dark' : 'text-amber-600', note: '≥6 METs = vigorous' },
            { t: 'Noise Environment', v: `${b.noiseDb}`, u: 'dB', tone: b.noiseDb <= 55 ? 'text-brand-dark' : 'text-rose-500', note: b.noiseDb <= 55 ? 'Safe' : '>55 dB chronic = stress/CVD risk' },
          ].map((x) => (
            <div key={x.t} className="liquid-glass rounded-xl p-3">
              <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">{x.t}</div>
              <div className={'text-xl font-extrabold ' + x.tone}>{x.v}<span className="text-[10px] font-medium text-neutral-500"> {x.u}</span></div>
              <div className="text-[10px] text-neutral-500">{x.note}</div>
            </div>
          ))}
        </div>

        {/* Caffeine + sleep hygiene */}
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-neutral-50 p-3">
          <div className="text-xs font-bold">☕ Caffeine window</div>
          <input type="time" className={inputClass + ' !w-auto'} value={b.caffeineCutoff} onChange={(e) => u({ caffeineCutoff: e.target.value })} />
          <p className="flex-1 text-[11px] text-neutral-500">Stop caffeine ≥8-10 hours before bed (half-life ±5 hours) so deep sleep isn't cut short.</p>
        </div>

        {/* Mental quick screen */}
        <div className={'mt-3 rounded-xl p-3 ' + ((b.anxiety >= 7 || b.stress >= 8 || b.mood <= 3) ? 'bg-rose-50 border border-rose-200' : 'bg-brand-50')}>
          <div className="text-xs font-bold">🧠 Mental Health</div>
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
            {b.anxiety >= 7 || b.stress >= 8 || b.mood <= 3
              ? 'High anxiety/stress score or low mood over the past few days. Try a 10-minute meditation and talk to the AI counselor — if it continues, consult a professional.'
              : 'Mental condition looks good. Keep up meditation, regular sleep & a gratitude journal.'}
          </p>
          <div className="mt-2 flex gap-2">
            <a href="#/chatbot" className="rounded-full bg-brand px-4 py-2 text-[11px] font-bold text-ink active:scale-95">💬 AI Consultation</a>
            <a href="#/recovery" className="rounded-full bg-neutral-200 px-4 py-2 text-[11px] font-bold text-neutral-600 active:scale-95">🧘 Meditation & Recovery</a>
          </div>
        </div>
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-3 text-center text-[10px] text-neutral-500">
        <IconMoon size={12} className="mr-1 inline" /> Estimates based on validated formulas (US Navy, Mifflin-St Jeor, Cooper) —
        not a substitute for clinical measurement. Data is stored on your device (offline-ready).
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Angka yang HANYA diberikan alat komposisi tubuh (InBody, timbangan BIA), dan
// tidak dimiliki jam tangan maupun perhitungan dari lingkar badan. Ditampilkan
// terpisah supaya jelas asalnya dari pengukuran, bukan dari rumus.
// ─────────────────────────────────────────────────────────────────────────────
function ScaleMeasurements() {
  const v = useVitals()
  const rows: { label: string; nilai?: number; satuan: string; rujukan: string; arti: string }[] = [
    {
      label: 'Body water', nilai: v.bodyWaterPct, satuan: '%',
      rujukan: 'Typically 50–65% in men and 45–60% in women',
      arti: 'Most of the body is water, and most of that water sits INSIDE muscle. So a low water percentage usually signals low muscle mass rather than simply not drinking enough — and the number swings by a few percent through the day with drinking, sweating and salty food.',
    },
    {
      label: 'Protein', nilai: v.proteinPct, satuan: '%',
      rujukan: 'Typically around 16–20% of body weight',
      arti: 'An estimate of the share of the body made of structural protein, almost all of it muscle and organs. A low value usually travels together with low muscle mass.',
    },
    {
      label: 'Muscle mass', nilai: v.musclePct, satuan: '%',
      rujukan: 'Depends on age and sex; judge it alongside body weight, not on its own',
      arti: 'A percentage, not kilograms — so it can RISE purely because fat fell, even if no muscle was gained at all. To judge training progress, muscle mass in kilograms is more honest than the percentage.',
    },
    {
      label: 'Bone mass', nilai: v.boneMassKg, satuan: 'kg',
      rujukan: 'Typically 2–4 kg; changes very slowly',
      arti: 'Estimated from electrical impedance, NOT a measurement of bone density. This number cannot be used to assess osteoporosis — that needs a DEXA scan. Week-to-week changes on these devices are almost always measurement noise.',
    },
    {
      label: 'Subcutaneous fat', nilai: v.subcutaneousFatKg, satuan: 'kg',
      rujukan: 'No standard value — useful compared against yourself',
      arti: 'The fat sitting just under the skin. Unlike visceral fat, this kind is far less strongly linked to cardiovascular and metabolic risk.',
    },
    {
      label: 'Visceral fat', nilai: v.visceralFatIndex ?? v.visceralFatLevel, satuan: '',
      rujukan: 'Generally considered good below 10 on this device scale',
      arti: 'The fat wrapped around the organs in the abdomen. THIS is the kind most strongly linked to type 2 diabetes, hypertension and heart disease — and it can be high even when body weight looks normal. What lowers it most is regular aerobic activity and cutting simple sugars, not abdominal exercises.',
    },
    {
      label: 'Basal metabolic rate', nilai: v.bmrKcal, satuan: 'kcal/day',
      rujukan: 'What the body needs at complete rest',
      arti: 'The energy the body uses simply to stay alive without moving. It is the basis of daily calorie needs, and it falls when muscle mass is lost — one reason repeated crash diets get harder each time round.',
    },
    {
      label: 'Total daily energy', nilai: v.amrKcal, satuan: 'kcal/day',
      rujukan: 'Basal plus activity',
      arti: 'An estimate of daily calorie needs including activity. The device figure is a rough estimate; more trustworthy is adjusting it against your actual weight change over two to three weeks.',
    },
    {
      label: 'Body age', nilai: v.bodyAge, satuan: 'years',
      rujukan: 'Compared against your actual age',
      arti: 'Not a medical quantity. Devices compute it from body composition using closed formulas that differ between brands, so it cannot be compared across devices and means nothing clinically. Useful as encouragement, no more.',
    },
  ]

  const ada = rows.filter((r) => r.nilai != null && Number.isFinite(r.nilai))
  if (!ada.length) return null

  return (
    <Card className="!p-5">
      <SectionTitle
        icon={<IconActivity size={20} />}
        title="From a body-composition device"
        subtitle="Values only an InBody or BIA scale can give — not estimated from a formula"
      />
      <div className="mt-3 space-y-2">
        {ada.map((r) => (
          <div key={r.label} className="rounded-xl border border-neutral-100 p-3 dark:border-white/10">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-bold text-ink dark:text-ink">{r.label}</span>
              <span className="text-lg font-extrabold tabular-nums text-brand-dark">
                {r.nilai}{r.satuan ? ` ${r.satuan}` : ''}
              </span>
            </div>
            <div className="text-[11px] text-neutral-500">{r.rujukan}</div>
            <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{r.arti}</p>
          </div>
        ))}
      </div>
      <Prosa kelas="mt-3 text-[11px] leading-relaxed text-neutral-500">BIA devices measure electrical resistance and then ESTIMATE composition from it, so the result is affected by hydration, food, exercise and time of day. To make readings comparable, measure under the same conditions: in the morning, after urinating, before eating or drinking, and before exercise.</Prosa>
    </Card>
  )
}

export default BodyComposition
