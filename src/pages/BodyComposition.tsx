import { useEffect, useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconHeart, IconActivity, IconChartUp, IconMoon } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Komposisi Tubuh — InBody-style visual page. All values are entered manually
// (from a smart scale / InBody printout / Apple Watch) then visualized with
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
  if (b.g === 'M') return 495 / (1.0324 - 0.19077 * log10(Math.max(1, b.waist - b.neck)) + 0.15456 * log10(b.h)) - 450
  return 495 / (1.29579 - 0.35004 * log10(Math.max(1, b.waist + b.hip - b.neck)) + 0.221 * log10(b.h)) - 450
}
// Mifflin-St Jeor BMR.
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
          {Number.isFinite(value) ? value.toFixed(1) : '—'}<span className="ml-0.5 text-[10px] font-medium text-neutral-400">{unit}</span>
        </span>
      </div>
      <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-neutral-100">
        <div className="absolute inset-y-0 bg-emerald-100" style={{ left: `${loP}%`, width: `${hiP - loP}%` }} />
        <div className={'absolute inset-y-0 left-0 rounded-full ' + (inRange ? 'bg-brand' : 'bg-rose-400')} style={{ width: `${pct}%` }} />
        <div className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-neutral-300" style={{ left: `${loP}%` }} />
        <div className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-neutral-300" style={{ left: `${hiP}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[9px] text-neutral-400"><span>Under</span><span>Normal</span><span>Over</span></div>
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
      <div className="text-xs font-bold text-neutral-400">Body Type</div>
      <div className="text-2xl font-extrabold text-ink">{label}</div>
      <div className="mt-2 grid grid-cols-3 gap-1">
        {CELLS.flatMap((r, ri) => r.map((c, ci) => (
          <div key={`${ri}${ci}`}
            className={'relative rounded-lg p-2 text-[9px] font-bold leading-tight ' + (ri === row && ci === col ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400' : 'bg-neutral-50 text-neutral-400')}>
            {c}
            {ri === row && ci === col && <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full bg-amber-500" />}
          </div>
        )))}
      </div>
      <div className="mt-1 flex justify-between text-[9px] text-neutral-400"><span>Low PBF</span><span>Normal</span><span>High</span></div>
    </div>
  )
}

export function BodyComposition() {
  const [b, setB] = useState<Body>(load)
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(b)) } catch { /* ignore */ } }, [b])
  const u = (p: Partial<Body>) => setB((x) => ({ ...x, ...p }))

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

  const num = (label: string, key: keyof Body, step = 1) => (
    <Field label={label}><input className={inputClass} type="number" step={step} value={(b[key] as number) || ''} onChange={(e) => u({ [key]: +e.target.value } as Partial<Body>)} /></Field>
  )

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-24">
      {/* Inputs */}
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Body Composition & Longevity" subtitle="Enter manually from a smart scale / InBody / Apple Watch — everything is calculated & visualized" />
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
          {num('SMM InBody (kg, ops.)', 'smm', 0.1)}
          {num('Fat Mass InBody (kg, ops.)', 'bfm', 0.1)}
          {num('Resting HR', 'rhr')}
          {num('HRV (ms)', 'hrv')}
        </div>
      </Card>

      {/* Score + bento header */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="!p-4 liquid-glass">
          <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Composition Score</div>
          <div className="text-4xl font-extrabold text-brand-dark">{d.score}<span className="text-sm font-medium text-neutral-400"> /100</span></div>
          <Badge tone={d.score >= 80 ? 'brand' : d.score >= 65 ? 'low' : 'critical'}>{d.score >= 80 ? 'Athletic' : d.score >= 65 ? 'Average' : 'Needs improvement'}</Badge>
        </Card>
        <Card className="!p-4 liquid-glass"><BodyTypeGrid bmi={d.bmi} pbf={d.pbf} g={b.g} /></Card>
      </div>

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
        <SectionTitle icon={<IconActivity size={20} />} title="Lab & Advanced Screening" subtitle="Bone Mass Density (DEXA) — enter if you have test results" />
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
            <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-500">
              T-score ≥ −1: normal · −1 to −2.5: osteopenia (low bone mass) · ≤ −2.5: osteoporosis (WHO criteria).
              Bone density naturally declines with age — resistance training and adequate calcium/vitamin D and protein intake help maintain BMD.
            </p>
          </div>
        )}
        {b.bmd === 0 && <p className="mt-2 text-[11px] text-neutral-400">No data yet. BMD is measured via a DEXA scan at a health facility/radiology lab.</p>}
      </Card>

      {/* Longevity indicator bento */}
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Daily Longevity Indicators" subtitle="Readiness, body battery, aging & mental — enter from today's hours/feelings" />
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
            { t: 'Training Readiness', v: `${d.readiness}`, u: '/100', tone: d.readiness >= 70 ? 'text-brand-dark' : d.readiness >= 45 ? 'text-amber-600' : 'text-rose-500', note: d.readiness >= 70 ? 'Siap sesi berat' : d.readiness >= 45 ? 'Sesi ringan-sedang' : 'Prioritaskan pemulihan' },
            { t: 'Body Battery', v: `${d.battery}`, u: '/100', tone: d.battery >= 60 ? 'text-brand-dark' : 'text-amber-600', note: 'Tidur + HRV − stres' },
            { t: 'Cardio Fitness', v: b.vo2.toFixed(0), u: 'VO₂max', tone: 'text-brand-dark', note: d.vo2Tier },
            { t: 'Resting HR', v: `${b.rhr}`, u: 'bpm', tone: b.rhr <= 60 ? 'text-brand-dark' : b.rhr <= 72 ? 'text-amber-600' : 'text-rose-500', note: b.rhr <= 60 ? 'Sehat' : 'Bisa diturunkan dgn Zone 2' },
            { t: 'Restorative Sleep', v: d.restorative.toFixed(0), u: '%', tone: d.restorative >= 35 ? 'text-brand-dark' : 'text-amber-600', note: 'REM + Deep dari total' },
            { t: 'Pace of Aging', v: d.aging.toFixed(2), u: '×', tone: d.aging <= 1 ? 'text-brand-dark' : 'text-amber-600', note: d.aging <= 1 ? 'Menua lebih lambat 🎉' : 'Perbaiki tidur & VO₂max' },
            { t: 'Estimasi Umur Harapan', v: `${d.lifeExp}`, u: 'thn', tone: 'text-ink', note: 'Heuristik — cek Longevity Illustrator utk aktuaria' },
            { t: 'Physical Effort', v: b.mets.toFixed(1), u: 'METs', tone: b.mets >= 6 ? 'text-brand-dark' : 'text-amber-600', note: '≥6 METs = vigorous' },
            { t: 'Lingkungan Suara', v: `${b.noiseDb}`, u: 'dB', tone: b.noiseDb <= 55 ? 'text-brand-dark' : 'text-rose-500', note: b.noiseDb <= 55 ? 'Aman' : '>55 dB kronis = risiko stres/CVD' },
          ].map((x) => (
            <div key={x.t} className="liquid-glass rounded-xl p-3">
              <div className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">{x.t}</div>
              <div className={'text-xl font-extrabold ' + x.tone}>{x.v}<span className="text-[10px] font-medium text-neutral-400"> {x.u}</span></div>
              <div className="text-[9px] text-neutral-400">{x.note}</div>
            </div>
          ))}
        </div>

        {/* Caffeine + sleep hygiene */}
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-neutral-50 p-3">
          <div className="text-xs font-bold">☕ Caffeine window</div>
          <input type="time" className={inputClass + ' !w-auto'} value={b.caffeineCutoff} onChange={(e) => u({ caffeineCutoff: e.target.value })} />
          <p className="flex-1 text-[11px] text-neutral-500">Stop kafein ≥8-10 jam sebelum tidur (waktu paruh ±5 jam) agar deep sleep tidak terpotong.</p>
        </div>

        {/* Mental quick screen */}
        <div className={'mt-3 rounded-xl p-3 ' + ((b.anxiety >= 7 || b.stress >= 8 || b.mood <= 3) ? 'bg-rose-50 border border-rose-200' : 'bg-brand-50')}>
          <div className="text-xs font-bold">🧠 Kesehatan Mental</div>
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
            {b.anxiety >= 7 || b.stress >= 8 || b.mood <= 3
              ? 'Skor cemas/stres tinggi atau mood rendah beberapa hari terakhir. Coba meditasi 10 menit, dan bicarakan dengan AI konselor — bila berlanjut, konsultasikan ke profesional.'
              : 'Kondisi mental terpantau baik. Pertahankan meditasi, tidur teratur & jurnal syukur.'}
          </p>
          <div className="mt-2 flex gap-2">
            <a href="#/chatbot" className="rounded-full bg-brand px-4 py-2 text-[11px] font-bold text-white active:scale-95">💬 Konsultasi AI</a>
            <a href="#/recovery" className="rounded-full bg-neutral-200 px-4 py-2 text-[11px] font-bold text-neutral-600 active:scale-95">🧘 Meditasi & Recovery</a>
          </div>
        </div>
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-3 text-center text-[10px] text-neutral-400">
        <IconMoon size={12} className="mr-1 inline" /> Estimasi berbasis formula tervalidasi (US Navy, Mifflin-St Jeor, Cooper) —
        bukan pengganti pengukuran klinis. Data tersimpan di perangkat Anda (offline-ready).
      </div>
    </div>
  )
}

export default BodyComposition
