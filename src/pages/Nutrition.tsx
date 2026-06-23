import { useEffect, useState, useRef, useCallback, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { useStore, uid } from '../lib/store'
import { Card, SectionTitle, Button, Field, inputClass, Badge } from '../components/ui'
import { IconFood, IconPlus, IconSparkle, IconHeart, IconStethoscope, IconHospital } from '../components/icons'
import { FOODS, EXERCISES } from '../lib/foods'
import { api, backendEnabled } from '../lib/api'
import { evaluateVitals, overallStatus, STATUS_COLOR, STATUS_LABEL } from '../lib/chronic'
import type { VitalSign } from '../lib/types'

const today = () => new Date().toISOString().slice(0, 10)
const GOAL_KCAL = 2000
const GOAL_SLEEP = 8
const GOAL_WATER = 2000
const COL_KCAL = '#00BF63'
const COL_SLEEP = '#111111'
const COL_WATER = '#2563eb'

function getW(state: ReturnType<typeof useStore>['state'], date: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = (state.wellness?.[date] ?? {}) as any
  return {
    sleepHr: (w.sleepHr as number) ?? 0,
    waterMl: (w.waterMl as number) ?? 0,
    exerciseKcal: (w.exerciseKcal as number) ?? 0,
    exerciseMin: (w.exerciseMin as number) ?? 0,
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   VITAL SIGNS IMPORT — Parser CSV/JSON + Web Bluetooth
   ══════════════════════════════════════════════════════════════════════════ */
interface ImportedVital {
  date: string
  heartRate?: number
  steps?: number
  systolic?: number
  diastolic?: number
  spo2?: number
  sleepHours?: number
  vo2Max?: number
  hrv?: number
}

const KEY_MAP: Record<string, string> = {
  date: 'date', tanggal: 'date',
  heartrate: 'heartRate', hr: 'heartRate', nadi: 'heartRate', detakjantung: 'heartRate', 'heart_rate': 'heartRate',
  steps: 'steps', langkah: 'steps', jumlahlangkah: 'steps', step_count: 'steps',
  systolic: 'systolic', sistolik: 'systolic', bp_systolic: 'systolic', tensiatas: 'systolic',
  diastolic: 'diastolic', diastolik: 'diastolic', bp_diastolic: 'diastolic', tensibawah: 'diastolic',
  spo2: 'spo2', oxygen: 'spo2', oksigen: 'spo2', saturation: 'spo2', 'sp_o2': 'spo2',
  sleephours: 'sleepHours', sleep: 'sleepHours', tidur: 'sleepHours', durasisleep: 'sleepHours', 'sleep_hours': 'sleepHours',
  vo2max: 'vo2Max', vo2: 'vo2Max', 'vo2_max': 'vo2Max',
  hrv: 'hrv', heartratevariability: 'hrv', variabilitasdetak: 'hrv', rmssd: 'hrv', 'hr_v': 'hrv',
}

function normKey(key: string) {
  return KEY_MAP[key.toLowerCase().trim().replace(/[\s_-]+/g, '')] ?? ''
}

function parseCSV(text: string): ImportedVital[] {
  const lines = text.trim().split('\n').filter((l) => l.trim())
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(normKey)
  const di = headers.indexOf('date')
  if (di === -1) return []
  return lines.slice(1).map((line) => {
    const vals = line.split(',').map((v) => v.trim())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = { date: vals[di] || '' }
    headers.forEach((h, i) => {
      if (h && h !== 'date' && vals[i] != null) {
        const n = parseFloat(vals[i])
        if (!isNaN(n)) obj[h] = n
      }
    })
    return obj as ImportedVital
  }).filter((v) => v.date)
}

function parseJSON(text: string): ImportedVital[] {
  try {
    const data = JSON.parse(text)
    const arr = Array.isArray(data) ? data : [data]
    return arr
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = {}
        Object.entries(item).forEach(([k, v]) => {
          const nk = normKey(k)
          if (nk && v != null) obj[nk] = typeof v === 'number' ? v : parseFloat(v) || undefined
        })
        return obj as ImportedVital
      })
      .filter((v) => v.date)
  } catch {
    return []
  }
}

function parseHealthFile(text: string, filename: string): ImportedVital[] {
  return filename.split('.').pop()?.toLowerCase() === 'json' ? parseJSON(text) : parseCSV(text)
}

function avgVitals(vitals: ImportedVital[]) {
  if (!vitals.length) return { avgHeartRate: undefined, avgSpo2: undefined, avgSteps: undefined, avgHrv: undefined, vo2Max: undefined, avgSystolic: undefined, count: 0 }
  const avg = (k: keyof ImportedVital) => {
    const v = vitals.map((x) => x[k]).filter((x): x is number => typeof x === 'number')
    return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : undefined
  }
  return { avgHeartRate: avg('heartRate'), avgSpo2: avg('spo2'), avgSteps: avg('steps'), avgHrv: avg('hrv'), vo2Max: avg('vo2Max'), avgSystolic: avg('systolic'), count: vitals.length }
}

/* ══════════════════════════════════════════════════════════════════════════
   LONGEVITY COMPUTE (dengan vital signs)
   ══════════════════════════════════════════════════════════════════════════ */
function clamp(n: number) { return Math.max(0, Math.min(100, Math.round(n))) }

function computeLongevity(i: {
  mainMeals: number; snacks: number; exerciseFreq: number; exerciseMin: number
  hydrationL: number; sleepHr: number; sunDone: boolean; sunHr: number
  avgHeartRate?: number; avgSpo2?: number; avgSteps?: number
  avgHrv?: number; vo2Max?: number; avgSystolic?: number
}) {
  const meals = clamp(100 - Math.abs(i.mainMeals - 3) * 18 - Math.max(0, i.snacks - 2) * 12)
  const exercise = clamp((i.exerciseFreq >= 1 ? 60 : i.exerciseFreq * 60) + Math.min(40, (i.exerciseMin / 30) * 40))
  const hydration = clamp(i.hydrationL >= 2 && i.hydrationL <= 3.5 ? 100 : 100 - Math.abs(i.hydrationL - 2.5) * 28)
  const sleep = clamp(i.sleepHr >= 7 && i.sleepHr <= 9 ? 100 : 100 - Math.abs(i.sleepHr - 8) * 16)
  const sun = clamp(!i.sunDone ? 40 : i.sunHr >= 0.17 && i.sunHr <= 0.6 ? 100 : 100 - Math.abs(i.sunHr - 0.33) * 80)

  let vitals = 50
  const parts: number[] = []
  if (i.avgHeartRate != null) { parts.push(clamp(i.avgHeartRate >= 55 && i.avgHeartRate <= 75 ? 100 : 100 - Math.abs(i.avgHeartRate - 65) * 2.5)) }
  if (i.avgSpo2 != null) { parts.push(clamp(i.avgSpo2 >= 97 ? 100 : 100 - (97 - i.avgSpo2) * 25)) }
  if (i.avgSteps != null) { parts.push(clamp(i.avgSteps >= 8000 ? 100 : (i.avgSteps / 8000) * 100)) }
  if (i.avgHrv != null) { parts.push(clamp(i.avgHrv >= 40 ? 100 : (i.avgHrv / 40) * 100)) }
  if (i.vo2Max != null) { parts.push(clamp(i.vo2Max >= 40 ? 100 : (i.vo2Max / 40) * 100)) }
  if (i.avgSystolic != null) { parts.push(clamp(i.avgSystolic >= 110 && i.avgSystolic <= 130 ? 100 : 100 - Math.abs(i.avgSystolic - 120) * 2)) }
  if (parts.length) vitals = clamp(parts.reduce((a, b) => a + b, 0) / parts.length)

  const hasVitals = parts.length > 0
  const wV = hasVitals ? 0.20 : 0
  const r = 1 - wV
  const score = clamp(meals * 0.15 * r + exercise * 0.25 * r + hydration * 0.10 * r + sleep * 0.25 * r + sun * 0.10 * r + vitals * wV)
  return { score, meals, exercise, hydration, sleep, sun, vitals, hasVitals }
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN
   ══════════════════════════════════════════════════════════════════════════ */
export function Nutrition() {
  const { state, addFood } = useStore()
  const [foodName, setFoodName] = useState(FOODS[0].name)
  const [grams, setGrams] = useState(100)
  const todays = state.foods.filter((f) => f.date === today())
  const total = todays.reduce((a, f) => ({ kcal: a.kcal + f.kcal, carbs: a.carbs + f.carbs, protein: a.protein + f.protein, fat: a.fat + f.fat }), { kcal: 0, carbs: 0, protein: 0, fat: 0 })
  const wt = getW(state, today())
  const k = grams / 100
  const preview = { kcal: Math.round(FOODS.find((f) => f.name === foodName)!.kcal * k), carbs: Math.round(FOODS.find((f) => f.name === foodName)!.carbs * k), protein: Math.round(FOODS.find((f) => f.name === foodName)!.protein * k), fat: Math.round(FOODS.find((f) => f.name === foodName)!.fat * k) }

  const weekDots = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const date = d.toISOString().slice(0, 10)
    return !!(state.foods.some((f) => f.date === date) || state.wellness?.[date])
  })

  return (
    <div className="space-y-5">
      {/* ─── HERO ─── */}
      <Card className="!p-5">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center sm:gap-8">
          <CircleRing label="Kalori" value={total.kcal} max={GOAL_KCAL} unit="kkal" color={COL_KCAL} size={140} sw={12} />
          <div className="flex gap-4 sm:flex-col sm:gap-3">
            <MiniStat icon="😴" label="Tidur" value={wt.sleepHr} max={GOAL_SLEEP} unit="jam" color="#818cf8" />
            <MiniStat icon="💧" label="Air" value={wt.waterMl} max={GOAL_WATER} unit="mL" color={COL_WATER} />
            <MiniStat icon="🔥" label="Olahraga" value={wt.exerciseKcal} max={500} unit="kkal" color="#f97316" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-1">
          {weekDots.map((f, i) => <div key={i} className={`h-1.5 w-1.5 rounded-full ${f ? 'bg-brand' : 'bg-neutral-200'}`} />)}
          <span className="ml-1 text-[10px] text-neutral-400">{weekDots.filter(Boolean).length}/7 hari</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 rounded-2xl bg-neutral-50 p-3">
          <MacroBox label="Karbo" value={total.carbs} target={300} color="#f59e0b" emoji="🌾" />
          <MacroBox label="Protein" value={total.protein} target={150} color={COL_KCAL} emoji="🥩" />
          <MacroBox label="Lemak" value={total.fat} target={65} color="#FF3131" emoji="🥑" />
        </div>
      </Card>

      {/* ─── TAMBAH MAKANAN ─── */}
      <Card className="!p-5">
        <SectionTitle icon={<IconFood size={18} />} title="Tambah Makanan" />
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="min-w-[160px] flex-1">
            <Field label="Makanan">
              <select className={inputClass} value={foodName} onChange={(e) => setFoodName(e.target.value)}>{FOODS.map((f) => <option key={f.name}>{f.name}</option>)}</select>
            </Field>
          </div>
          <div className="w-24">
            <Field label="Gram"><input className={inputClass} type="number" value={grams} onChange={(e) => setGrams(+e.target.value)} /></Field>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Button onClick={() => addFood({ id: uid(), date: today(), name: foodName, grams, ...preview })} className="h-[38px]"><IconPlus size={15} /> Tambah</Button>
            <span className="text-[10px] tabular-nums text-neutral-400">→ <b className="text-brand-dark">{preview.kcal}</b> kkal · <span className="text-amber-500">K{preview.carbs}</span> <span className="text-brand">P{preview.protein}</span> <span className="text-red-400">L{preview.fat}</span></span>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {todays.length === 0 && <EmptyState emoji="🍽️" text="Belum ada makanan tercatat hari ini" />}
          {todays.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-xl border border-neutral-100 px-4 py-2.5 transition hover:shadow-sm">
              <div className="min-w-0">
                <span className="font-semibold text-neutral-800">{f.name}</span>
                <span className="ml-2 text-[10px] text-neutral-400">{f.grams}g</span>
              </div>
              <div className="shrink-0 text-right tabular-nums">
                <span className="text-sm font-extrabold text-brand-dark">{f.kcal}</span>
                <span className="text-[10px] text-neutral-400"> kkal</span>
                <span className="ml-2 text-[10px]"><span className="text-amber-500">K{f.carbs}</span> <span className="text-brand">P{f.protein}</span> <span className="text-red-400">L{f.fat}</span></span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <ActivityLog />
      <WellnessTrendChart />
      <ChronicMonitor />
      <LongevityCalculator />

      <Card className="!p-5">
        <SectionTitle title="Anjuran Harian" subtitle="Disesuaikan nutrisi & kondisi pasien" />
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {([
            ['🍽️', 'Porsi Makan', '½ piring sayur/buah, ¼ protein, ¼ karbo kompleks.', '#00BF63'],
            ['🌙', 'Jam Tidur', '7–8 jam, sebelum 23.00, konsisten tiap hari.', '#818cf8'],
            ['🏃', 'Olahraga', 'Zona-2 150 menit/minggu + beban 2×/minggu.', '#f97316'],
            ['☀️', 'Sinar Matahari', '10–20 menit pagi (08–10) untuk vitamin D.', '#eab308'],
            ['💧', 'Hidrasi', '±2 L/hari, lebih saat aktivitas.', '#2563eb'],
            ['🩺', 'Follow-up', 'Kontrol lebih cepat bila keluhan memberat.', '#FF3131'],
          ] as const).map(([emoji, title, text, accent]) => (
            <div key={title} className="flex items-start gap-2.5 rounded-xl border border-neutral-100 p-3 transition hover:shadow-sm">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm" style={{ background: accent + '15' }}>{emoji}</span>
              <div><div className="text-xs font-bold text-neutral-800">{title}</div><p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">{text}</p></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   ACTIVITY LOG
   ══════════════════════════════════════════════════════════════════════════ */
function ActivityLog() {
  const { state, logWellness } = useStore()
  const wt = getW(state, today())
  const [exName, setExName] = useState(EXERCISES[0].name)
  const [exMin, setExMin] = useState(30)
  const ex = EXERCISES.find((e) => e.name === exName)!
  const burn = Math.round(ex.kcalPerMin * exMin)

  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconPlus size={18} />} title="Olahraga, Tidur & Air" />
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        {/* Olahraga */}
        <div className="rounded-xl border border-neutral-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><span className="text-lg">🔥</span><div><div className="text-sm font-bold">Olahraga</div><div className="text-[10px] text-neutral-400">Kalori terbakar</div></div></div>
            <span className="rounded-lg bg-orange-50 px-2.5 py-1 text-sm font-extrabold text-orange-600 tabular-nums"><ANum v={wt.exerciseKcal} /> kkal</span>
          </div>
          <div className="mt-3 flex gap-2">
            <div className="flex-1"><Field label="Jenis"><select className={inputClass} value={exName} onChange={(e) => setExName(e.target.value)}>{EXERCISES.map((e) => <option key={e.name}>{e.emoji} {e.name}</option>)}</select></Field></div>
            <div className="w-20"><Field label="Min"><input className={inputClass} type="number" value={exMin} onChange={(e) => setExMin(Math.max(0, +e.target.value))} /></Field></div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-neutral-400">Est. <b className="text-orange-500">{burn} kkal</b> · <Badge tone="neutral">{ex.intensity}</Badge></span>
            <Button onClick={() => logWellness(today(), { exerciseKcal: wt.exerciseKcal + burn, exerciseMin: wt.exerciseMin + exMin })} className="h-7 text-xs"><IconPlus size={13} /> Catat</Button>
          </div>
        </div>
        {/* Tidur */}
        <div className="rounded-xl border border-neutral-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><span className="text-lg">🌙</span><div><div className="text-sm font-bold">Tidur</div><div className="text-[10px] text-neutral-400">Target {GOAL_SLEEP} jam</div></div></div>
            <span className="text-sm font-extrabold text-indigo-500 tabular-nums"><ANum v={wt.sleepHr} d={1} /> jam</span>
          </div>
          <div className="mt-3"><Stepper value={wt.sleepHr} min={0} max={12} step={0.5} unit="jam" onChange={(v) => logWellness(today(), { sleepHr: v })} /></div>
          <RangeTrack value={wt.sleepHr} min={0} max={GOAL_SLEEP} color="#818cf8" />
        </div>
        {/* Air */}
        <div className="rounded-xl border border-neutral-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><span className="text-lg">💧</span><div><div className="text-sm font-bold">Air Putih</div><div className="text-[10px] text-neutral-400">Target {GOAL_WATER} mL</div></div></div>
            <span className="text-sm font-extrabold text-blue-600 tabular-nums"><ANum v={wt.waterMl} /> mL</span>
          </div>
          <div className="mt-3"><Stepper value={wt.waterMl} min={0} max={5000} step={250} unit="mL" onChange={(v) => logWellness(today(), { waterMl: v })} /></div>
          <RangeTrack value={wt.waterMl} min={0} max={GOAL_WATER} color={COL_WATER} />
        </div>
      </div>
    </Card>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   WELLNESS TREND CHART (simplified)
   ══════════════════════════════════════════════════════════════════════════ */
function WellnessTrendChart() {
  const { state, account, addPost } = useStore()
  const [shared, setShared] = useState('')
  const [vis, setVis] = useState(false)
  useEffect(() => { requestAnimationFrame(() => setVis(true)) }, [])

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const date = d.toISOString().slice(0, 10)
    const kcal = state.foods.filter((f) => f.date === date).reduce((a, f) => a + f.kcal, 0)
    const wd = getW(state, date)
    return { date, kcal, sleepHr: wd.sleepHr, waterMl: wd.waterMl }
  })
  const hasData = days.some((d) => d.kcal || d.sleepHr || d.waterMl)
  const W = 380, H = 180, base = 160, topY = 20, pad = 20, scale = (base - topY) / 3
  const xs = days.map((_, i) => pad + (i * (W - pad * 2)) / 6)
  const nK = days.map((d) => Math.min(1, d.kcal / GOAL_KCAL))
  const nS = days.map((d) => Math.min(1, d.sleepHr / GOAL_SLEEP))
  const nW = days.map((d) => Math.min(1, d.waterMl / GOAL_WATER))
  const yK = nK.map((v) => base - v * scale)
  const yS = nK.map((v, i) => base - (v + nS[i]) * scale)
  const yW = nK.map((v, i) => base - (v + nS[i] + nW[i]) * scale)
  const band = (u: number[], l: number[]) => {
    const f = xs.map((x, i) => `${i ? 'L' : 'M'}${x},${u[i]}`).join(' ')
    const b = xs.map((_, i) => `L${xs[6 - i]},${l[6 - i]}`).join(' ')
    return `${f} ${b} Z`
  }
  const avgK = Math.round(days.reduce((s, d) => s + d.kcal, 0) / 7)
  const avgS = (days.reduce((s, d) => s + d.sleepHr, 0) / 7).toFixed(1)
  const avgW = Math.round(days.reduce((s, d) => s + d.waterMl, 0) / 7)

  function shareToDashboard() {
    addPost({ id: uid(), authorEmail: account?.email ?? '', authorName: account?.name ?? 'Saya', role: account?.role ?? 'pasien', postType: 'kebiasaan', kind: 'image', activity: 'Tren 7 hari', caption: `Tren 7 hari 📊 ${avgK} kkal · ${avgS} jam · ${avgW} mL air. #PerjalananSehat`, mediaColor: COL_KCAL, calories: avgK, sleepHr: +avgS, waterMl: avgW, likes: 0, comments: 0, reposts: 0, at: new Date().toISOString() })
    setShared('feed'); setTimeout(() => setShared(''), 3000)
  }
  async function shareExternal() {
    const t = `Tren 7 hari 🌱\nKalori: ${avgK} kkal/hari\nTidur: ${avgS} jam\nAir: ${avgW} mL`
    try { if (navigator.share) await navigator.share({ title: 'Tren Kesehatan', text: t }); else { await navigator.clipboard.writeText(t); setShared('copy'); setTimeout(() => setShared(''), 3000) } } catch { /* cancelled */ }
  }

  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconSparkle size={20} />} title="Tren 7 Hari" />
      {!hasData ? <EmptyState emoji="📊" text="Catat data untuk melihat tren" /> : (
        <>
          <div className="mt-3 overflow-x-auto rounded-xl bg-neutral-50/80 p-3">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 300 }}>
              <defs>
                <linearGradient id="gK" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COL_KCAL} stopOpacity="0.85" /><stop offset="100%" stopColor={COL_KCAL} stopOpacity="0.4" /></linearGradient>
                <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COL_SLEEP} stopOpacity="0.7" /><stop offset="100%" stopColor={COL_SLEEP} stopOpacity="0.35" /></linearGradient>
                <linearGradient id="gW" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COL_WATER} stopOpacity="0.75" /><stop offset="100%" stopColor={COL_WATER} stopOpacity="0.4" /></linearGradient>
              </defs>
              {[0, 1, 2, 3].map((u) => <line key={u} x1={pad - 4} x2={W - pad + 4} y1={base - u * scale} y2={base - u * scale} stroke="rgba(0,0,0,0.04)" strokeWidth={1} strokeDasharray={u ? '4 4' : 'none'} />)}
              <g style={{ opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(6px)', transition: 'all 0.7s ease-out' }}>
                <path d={band(yK, xs.map(() => base))} fill="url(#gK)" />
                <path d={band(yS, yK)} fill="url(#gS)" />
                <path d={band(yW, yS)} fill="url(#gW)" />
                {days.map((d, i) => (<g key={d.date}><circle cx={xs[i]} cy={yK[i]} r="3" fill="white" stroke={COL_KCAL} strokeWidth="2" />{d.sleepHr > 0 && <circle cx={xs[i]} cy={yS[i]} r="2.5" fill="white" stroke={COL_SLEEP} strokeWidth="1.5" />}{d.waterMl > 0 && <circle cx={xs[i]} cy={yW[i]} r="2.5" fill="white" stroke={COL_WATER} strokeWidth="1.5" />}</g>))}
              </g>
              {days.map((d, i) => <text key={d.date} x={xs[i]} y={H - 4} textAnchor="middle" fontSize="9" fill="#bbb" fontWeight="500">{new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short' })}</text>)}
            </svg>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
            {([COL_KCAL, `Kalori ${avgK}/hari`], [COL_SLEEP, `Tidur ${avgS} jam`], [COL_WATER, `Air ${avgW} mL`] as const).map(([c, l]) => <span key={l} className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600"><span className="h-2 w-2 rounded-sm" style={{ background: c }} />{l}</span>)}
          </div>
          <div className="mt-3 flex justify-center gap-2">
            <Button onClick={shareToDashboard} className="h-8 text-xs rounded-xl">📣 {shared === 'feed' ? '✓ Dibagikan!' : 'Ke Dashboard'}</Button>
            <Button variant="outline" onClick={shareExternal} className="h-8 text-xs rounded-xl">🔗 {shared === 'copy' ? '✓ Disalin!' : 'Bagikan'}</Button>
          </div>
        </>
      )}
    </Card>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   CHRONIC MONITOR
   ══════════════════════════════════════════════════════════════════════════ */
const CHRONIC_MONTHLY = 50000
const CHRONIC_LIFETIME = 7500000

function ChronicMonitor() {
  const { state, activePatient, addVital, buyChronicSub } = useStore()
  const p = activePatient
  const vitals = state.vitals[p.id] ?? []
  const latest = vitals[vitals.length - 1]
  const [show, setShow] = useState(false)
  const [payMsg, setPayMsg] = useState('')
  const [f, setF] = useState({ sys: 120, dia: 80, hr: 78, rr: 16, temp: 36.6, spo2: 98, glu: '' })

  const active = !!state.chronicLifetime || (!!state.chronicSubExpires && new Date(state.chronicSubExpires) > new Date())
  const daysLeft = state.chronicSubExpires ? Math.max(0, Math.ceil((new Date(state.chronicSubExpires).getTime() - Date.now()) / 86400000)) : 0
  const loggedToday = !!latest && latest.takenAt.slice(0, 10) === today()

  async function buy(plan: 'monthly' | 'lifetime') {
    setPayMsg('')
    if (!backendEnabled) { buyChronicSub(plan); return }
    try {
      const h = await api.health()
      if (!h.features.payments) { buyChronicSub(plan); return }
      const r = await api.createPayment(0, 'QRIS', `chronic_${plan}`)
      if (r.live && r.redirectUrl) {
        window.open(r.redirectUrl, '_blank'); setPayMsg('Selesaikan pembayaran di tab Midtrans — aktif otomatis.')
        let n = 0; const iv = setInterval(async () => { n++; try { const s = await api.paymentStatus(r.orderId); if (s.status === 'paid') { clearInterval(iv); buyChronicSub(plan); setPayMsg('✅ Berhasil!') } else if (s.status === 'failed') { clearInterval(iv); setPayMsg('Gagal.') } } catch { /* retry */ } if (n >= 45) clearInterval(iv) }, 4000)
      } else { await api.confirmPayment(r.orderId); buyChronicSub(plan) }
    } catch { setPayMsg('Gagal memproses.') }
  }

  const evals = latest ? evaluateVitals(latest, p.chronicConditions) : []
  const status = overallStatus(evals)

  function save() {
    addVital(p.id, { id: uid(), takenAt: new Date().toISOString(), systolic: +f.sys, diastolic: +f.dia, heartRate: +f.hr, respRate: +f.rr, tempC: +f.temp, spo2: +f.spo2, glucose: f.glu ? +f.glu : undefined })
    setShow(false)
  }

  /* Paywall */
  if (!active) return (
    <Card className="!p-5 border-2 border-brand/15">
      <SectionTitle icon={<IconHeart size={20} />} title="Pemantauan Kronis" right={<Badge tone="high">Langganan</Badge>} />
      <div className="mt-4 rounded-2xl border-2 border-dashed border-brand/25 bg-brand/[0.03] p-6">
        <p className="text-sm text-neutral-600">Untuk pasien <b>hipertensi, diabetes, jantung</b>: catat TTV harian, sistem menilai apakah terkontrol dan memberi peringatan dini.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button onClick={() => buy('monthly')} className="rounded-xl border-2 border-neutral-200 p-4 text-left transition hover:border-brand/40 hover:shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Bulanan</div>
            <div className="mt-1 text-2xl font-extrabold">Rp{CHRONIC_MONTHLY.toLocaleString('id-ID')}<span className="text-sm font-medium text-neutral-400">/bln</span></div>
          </button>
          <button onClick={() => buy('lifetime')} className="relative rounded-xl border-2 border-brand bg-brand/[0.04] p-4 text-left transition hover:shadow-sm">
            <span className="absolute -top-2.5 right-3 rounded-full bg-brand px-2 py-0.5 text-[9px] font-bold text-white">Terbaik</span>
            <div className="text-[10px] font-bold uppercase tracking-widest text-brand-dark">Lifetime</div>
            <div className="mt-1 text-2xl font-extrabold text-brand-dark">Rp{(CHRONIC_LIFETIME / 1e6).toLocaleString('id-ID')}jt</div>
          </button>
        </div>
        {payMsg && <p className="mt-3 text-xs font-semibold text-brand-dark">{payMsg}</p>}
      </div>
    </Card>
  )

  /* Active */
  const fields: [string, string][] = [['sys', 'Sistolik'], ['dia', 'Diastolik'], ['hr', 'Nadi'], ['rr', 'RR'], ['temp', 'Suhu'], ['spo2', 'SpO₂'], ['glu', 'Gula (ops.)']]

  return (
    <Card className="!p-5 border-2 border-brand/15">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <SectionTitle icon={<IconHeart size={20} />} title="Pemantauan Kronis" />
        <Badge tone="brand">{state.chronicLifetime ? '∞ Lifetime' : `${daysLeft} hari`}</Badge>
      </div>

      {!loggedToday && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-brand/20 bg-brand/[0.04] px-4 py-2.5">
          <span className="flex items-center gap-2 text-sm font-medium text-brand-dark"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-brand" /></span>Belum catat TTV hari ini</span>
          <Button onClick={() => setShow(true)} className="h-7 text-xs rounded-xl">Catat</Button>
        </div>
      )}
      {status === 'alert' && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3">
          <span className="text-sm font-medium text-red-700"><b>Tanda vital berbahaya.</b> Segera konsultasi atau darurat.</span>
          <div className="flex gap-2">
            <Link to="/consult"><Button variant="outline" className="h-7 text-xs rounded-xl"><IconStethoscope size={13} /> Konsultasi</Button></Link>
            <Link to="/hospitals"><Button className="h-7 text-xs rounded-xl"><IconHospital size={13} /> SOS</Button></Link>
          </div>
        </div>
      )}
      {status === 'warn' && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
          <span className="text-sm font-medium text-amber-800">⚠️ Sebagian nilai di luar target.</span>
          <Link to="/consult"><Button variant="outline" className="h-7 text-xs rounded-xl">Konsultasi</Button></Link>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-sm text-neutral-500">Status: <b style={{ color: STATUS_COLOR[status] }}>{latest ? STATUS_LABEL[status] : 'Belum ada data'}</b>{p.chronicConditions.length > 0 && <span className="ml-1 text-[11px] text-neutral-400">· {p.chronicConditions.join(', ')}</span>}</span>
        <Button variant="outline" onClick={() => setShow((s) => !s)} className="h-7 text-xs rounded-xl"><IconPlus size={13} /> Catat TTV</Button>
      </div>

      {show && (
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-neutral-50 p-3 sm:grid-cols-4">
          {fields.map(([key, label]) => <Field key={key} label={label}><input className={inputClass} type="number" value={(f as Record<string, string | number>)[key]} onChange={(e) => setF({ ...f, [key]: e.target.value } as typeof f)} /></Field>)}
          <div className="flex items-end"><Button onClick={save} className="h-[38px] rounded-xl">Simpan</Button></div>
        </div>
      )}

      {latest ? (
        <>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {evals.map((e) => (
              <div key={e.label} className="relative overflow-hidden rounded-xl border border-neutral-100 p-3">
                <div className="absolute left-0 top-0 h-full w-1" style={{ background: STATUS_COLOR[e.status] }} />
                <div className="pl-2">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{e.label}</div>
                  <div className="mt-0.5 text-xl font-extrabold tabular-nums" style={{ color: STATUS_COLOR[e.status] }}>{e.value} <span className="text-[10px] font-medium text-neutral-400">{e.unit}</span></div>
                  <div className="mt-0.5 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLOR[e.status] }} /><span className="text-[10px] text-neutral-400">{e.target} · {STATUS_LABEL[e.status]}</span></div>
                </div>
              </div>
            ))}
          </div>
          <TtvTrend vitals={vitals} />
          <p className="mt-2 text-[10px] text-neutral-400">{vitals.length} catatan · terakhir {new Date(latest.takenAt).toLocaleString('id-ID')}</p>
        </>
      ) : <EmptyState emoji="🩺" text="Belum ada catatan TTV" />}
    </Card>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   TTV TREND
   ══════════════════════════════════════════════════════════════════════════ */
function TtvTrend({ vitals }: { vitals: VitalSign[] }) {
  const recent = vitals.slice(-14)
  if (recent.length < 2) return null
  const line = (vals: number[], color: string) => {
    const w = 260, h = 40, mn = Math.min(...vals), mx = Math.max(...vals), sp = mx - mn || 1
    const pts = vals.map((v, i) => [(i / (vals.length - 1)) * w, h - 4 - ((v - mn) / sp) * (h - 10)])
    let d = `M${pts[0][0]},${pts[0][1]}`
    for (let i = 0; i < pts.length - 1; i++) { const [x1, y1] = pts[i]; const [x2, y2] = pts[i + 1]; d += ` C${x1 + (x2 - (pts[Math.max(0, i - 1)][0])) / 6},${y1 + (y2 - (pts[Math.max(0, i - 1)][1])) / 6} ${x2 - (pts[Math.min(pts.length - 1, i + 2)][0] - x1) / 6},${y2 - (pts[Math.min(pts.length - 1, i + 2)][1] - y1) / 6} ${x2},${y2}` }
    return <g><path d={`${d} L${pts[pts.length - 1][0]},${h} L0,${h} Z`} fill={color} fillOpacity="0.1" /><path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />{pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2" fill="white" stroke={color} strokeWidth="1.5" />)}</g>
  }
  const glu = recent.map((v) => v.glucose).filter((g): g is number => g != null)
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      <div className="rounded-xl border border-neutral-100 p-2.5">
        <div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Sistolik</span><span className="rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-500 tabular-nums">{recent[recent.length - 1].systolic} mmHg</span></div>
        <svg viewBox="0 0 260 40" className="mt-1 w-full">{line(recent.map((v) => v.systolic), '#FF3131')}</svg>
      </div>
      {glu.length >= 2 && (
        <div className="rounded-xl border border-neutral-100 p-2.5">
          <div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Gula Darah</span><span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 tabular-nums">{glu[glu.length - 1]} mg/dL</span></div>
          <svg viewBox="0 0 260 40" className="mt-1 w-full">{line(glu, '#f59e0b')}</svg>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   LONGEVITY CALCULATOR + VITAL SIGNS IMPORT
   ══════════════════════════════════════════════════════════════════════════ */
const PRICE_LONGEVITY = 125000

function LongevityCalculator() {
  const { state, account, buyLongevitySub, addPost } = useStore()
  const [shared, setShared] = useState(false)
  const [mainMeals, setMainMeals] = useState(3)
  const [snacks, setSnacks] = useState(2)
  const [exerciseFreq, setExerciseFreq] = useState(1)
  const [exerciseMin, setExerciseMin] = useState(30)
  const [hydrationL, setHydrationL] = useState(2)
  const [sleepHr, setSleepHr] = useState(7)
  const [sunDone, setSunDone] = useState(false)
  const [sunHr, setSunHr] = useState(0.25)
  const [result, setResult] = useState<ReturnType<typeof computeLongevity> | null>(null)

  /* ── Vital signs import state ── */
  const [importedVitals, setImportedVitals] = useState<ImportedVital[]>([])
  const [importSummary, setImportSummary] = useState<ReturnType<typeof avgVitals> | null>(null)
  const [importMsg, setImportMsg] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [btHR, setBtHR] = useState<number | null>(null)
  const [btLoading, setBtLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const subActive = !!state.longevitySubExpires && new Date(state.longevitySubExpires) > new Date()
  const daysLeft = state.longevitySubExpires ? Math.max(0, Math.ceil((new Date(state.longevitySubExpires).getTime() - Date.now()) / 86400000)) : 0

  /* ── File handler ── */
  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const parsed = parseHealthFile(text, file.name)
      if (!parsed.length) { setImportMsg('❌ Tidak ada data yang bisa dibaca. Pastikan file memiliki kolom "date".'); return }
      setImportedVitals(parsed)
      const summary = avgVitals(parsed)
      setImportSummary(summary)
      setImportMsg(`✅ ${summary.count} data berhasil diimpor dari ${file.name}`)
      // Jika ada HR dari Bluetooth, gabungkan
      if (btHR != null) {
        const todayStr = today()
        const exists = parsed.some((v) => v.date === todayStr)
        if (!exists) {
          const updated = [...parsed, { date: todayStr, heartRate: btHR }]
          setImportedVitals(updated)
          setImportSummary(avgVitals(updated))
        }
      }
    }
    reader.readAsText(file)
  }, [btHR])

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }, [handleFile])
  const onDragOver = useCallback((e: DragEvent) => { e.preventDefault(); setDragOver(true) }, [])
  const onDragLeave = useCallback(() => setDragOver(false), [])
  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleFile(f) }, [handleFile])

  /* ── Web Bluetooth Heart Rate ── */
  async function connectBT() {
    if (!navigator.bluetooth) { setImportMsg('❌ Browser tidak mendukung Web Bluetooth. Gunakan Chrome/Edge.'); return }
    setBtLoading(true); setImportMsg('Mencari perangkat heart rate monitor...')
    try {
      const device = await navigator.bluetooth.requestDevice({ filters: [{ services: ['heart_rate'] }] })
      const server = await device.gatt.connect()
      const service = await server.getPrimaryService('heart_rate')
      const char = await service.getCharacteristic('heart_rate_measurement')
      const hr = await new Promise<number>((resolve, reject) => {
        const timeout = setTimeout(() => { char.stopNotifications(); reject(new Error('Timeout')) }, 15000)
        char.addEventListener('characteristicvaluechanged', (ev) => {
          const v = (ev.target as BluetoothRemoteGATTCharacteristic).value!
          const flags = v.getUint8(0)
          const heartRate = flags & 0x01 ? v.getUint16(1, true) : v.getUint8(1)
          clearTimeout(timeout); char.stopNotifications(); resolve(heartRate)
        })
        char.startNotifications()
      })
      setBtHR(hr)
      setImportMsg(`✅ Heart rate terbaca: ${hr} bpm dari ${device.name || 'perangkat Bluetooth'}`)
      // Auto-add to imported vitals
      const todayStr = today()
      const exists = importedVitals.some((v) => v.date === todayStr)
      if (!exists) {
        const updated = [...importedVitals, { date: todayStr, heartRate: hr }]
        setImportedVitals(updated)
        setImportSummary(avgVitals(updated))
      } else {
        const updated = importedVitals.map((v) => v.date === todayStr ? { ...v, heartRate: hr } : v)
        setImportedVitals(updated)
        setImportSummary(avgVitals(updated))
      }
      server.disconnect()
    } catch (err: any) {
      setImportMsg(`❌ ${err.message || 'Gagal menghubungkan ke perangkat'}`)
    } finally { setBtLoading(false) }
  }

  function clearImport() { setImportedVitals([]); setImportSummary(null); setImportMsg(''); setBtHR(null) }

  function compute() {
    const s = importSummary
    setResult(computeLongevity({
      mainMeals, snacks, exerciseFreq, exerciseMin, hydrationL, sleepHr, sunDone, sunHr,
      avgHeartRate: s?.avgHeartRate, avgSpo2: s?.avgSpo2, avgSteps: s?.avgSteps,
      avgHrv: s?.avgHrv, vo2Max: s?.vo2Max, avgSystolic: s?.avgSystolic,
    }))
  }

  function shareToFeed() {
    if (!result) return
    addPost({ id: uid(), authorEmail: account?.email ?? '', authorName: account?.name ?? 'Saya', role: account?.role ?? 'pasien', postType: 'kebiasaan', kind: 'image', activity: 'Longevity harian', caption: `Nilai Longevity: ${result.score}/100 ${result.hasVitals ? '(dengan data vital)' : ''} 🌱 #PerjalananSehat`, mediaColor: '#00BF63', waterMl: Math.round(hydrationL * 1000), veggieServ: mainMeals, sleepHr, sugaryDrinks: 0, likes: 0, comments: 0, reposts: 0, at: new Date().toISOString() })
    setShared(true); setTimeout(() => setShared(false), 3000)
  }

  return (
    <Card className="!p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <SectionTitle icon={<IconSparkle size={20} />} title="Kalkulator Longevity" subtitle="Skor gaya hidup + tanda vital" />
        {subActive ? <Badge tone="brand">{daysLeft} hari</Badge> : <Badge tone="high">Langganan</Badge>}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* ── KOLOM KIRI: Input ── */}
        <div className="space-y-3">
          {/* Import Tanda Vital */}
          <div className="rounded-xl border border-neutral-100 p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-base">💓</span>
              <div>
                <div className="text-sm font-bold text-neutral-800">Import Tanda Vital</div>
                <div className="text-[10px] text-neutral-400">Dari Apple Health, Google Fit, Samsung Health, Fitbit, dll.</div>
              </div>
            </div>

            {/* App quick-links */}
            <div className="mt-3 flex flex-wrap gap-2">
              {([
                ['🍎', 'Apple Health', 'Ekspor sebagai CSV di app Kesehatan → Bagikan → Ekspor Data Kesehatan'],
                ['🏃', 'Google Fit', 'Ekspor data di fit.google.com → Download CSV'],
                ['💙', 'Samsung Health', 'Ekspor di Samsung Health → Menu → Ekspor data'],
                ['⌚', 'Fitbit', 'Download CSV dari fitbit.com/dashboard/data'],
              ] as const).map(([icon, name, tip]) => (
                <button key={name} onClick={() => setImportMsg(`💡 ${tip}`)} className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[11px] font-medium text-neutral-600 transition hover:border-brand/30 hover:bg-brand/[0.03] active:scale-95" title={tip}>
                  <span>{icon}</span> {name}
                </button>
              ))}
            </div>

            {/* Drag & drop zone */}
            <div
              className={`mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 transition-all ${dragOver ? 'border-brand bg-brand/[0.06]' : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'}`}
              onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
              onClick={() => fileRef.current?.click()}
            >
              <span className="text-2xl">📁</span>
              <p className="mt-1 text-xs font-medium text-neutral-500">Seret file CSV/JSON di sini</p>
              <p className="text-[10px] text-neutral-400">atau klik untuk pilih file</p>
              <input ref={fileRef} type="file" accept=".csv,.json,.txt" className="hidden" onChange={onFileChange} />
            </div>

            {/* Bluetooth HR */}
            <div className="mt-2 flex items-center gap-2">
              <button onClick={connectBT} disabled={btLoading} className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-50 active:scale-95">
                <span className={`inline-block h-2 w-2 rounded-full ${btLoading ? 'animate-pulse bg-blue-400' : btHR != null ? 'bg-green-500' : 'bg-blue-400'}`} />
                {btLoading ? 'Menghubungkan...' : btHR != null ? `HR ${btHR} bpm ✓` : '⚡ Baca Heart Rate via Bluetooth'}
              </button>
            </div>

            {/* Import summary */}
            {importMsg && (
              <div className={`mt-2 rounded-lg px-3 py-2 text-[11px] font-medium ${importMsg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {importMsg}
              </div>
            )}
            {importSummary && importSummary.count > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Data terimpor:</span>
                {importSummary.avgHeartRate != null && <span className="rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">HR {importSummary.avgHeartRate} bpm</span>}
                {importSummary.avgSpo2 != null && <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">SpO₂ {importSummary.avgSpo2}%</span>}
                {importSummary.avgSteps != null && <span className="rounded-md bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-600">{Math.round(importSummary.avgSteps).toLocaleString('id-ID')} langkah/hari</span>}
                {importSummary.avgHrv != null && <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-600">HRV {importSummary.avgHrv} ms</span>}
                {importSummary.vo2Max != null && <span className="rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600">VO₂Max {importSummary.vo2Max}</span>}
                {importSummary.avgSystolic != null && <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">Sistolik {importSummary.avgSystolic} mmHg</span>}
                <button onClick={clearImport} className="ml-auto text-[10px] font-semibold text-neutral-400 hover:text-red-500">✕ Hapus</button>
              </div>
            )}

            {/* Format guide */}
            <details className="mt-2">
              <summary className="cursor-pointer text-[10px] font-semibold text-neutral-400 hover:text-neutral-600">Format file yang didukung</summary>
              <div className="mt-1.5 rounded-lg bg-neutral-50 p-2.5 text-[10px] text-neutral-500 font-mono leading-relaxed">
                <div className="font-bold text-neutral-700 mb-1">CSV:</div>
                date,heart_rate,steps,spo2,sleep_hours,hrv,vo2_max,systolic,diastolic<br/>
                2025-01-15,72,8500,98,7.5,45,42,120,80<br/>
                <div className="font-bold text-neutral-700 mt-2 mb-1">JSON:</div>
                [{"date":"2025-01-15","heartRate":72,"steps":8500,"spo2":98}]
                <div className="mt-2 text-neutral-400">Kolom mendukung bahasa Indonesia: nadi, langkah, tidur, oksigen, dll.</div>
              </div>
            </details>
          </div>

          {/* Gaya Hidup */}
          <div className="rounded-xl border border-neutral-100 p-4 space-y-1">
            <div className="text-sm font-bold text-neutral-800 mb-2">🍽️ Pola Makan</div>
            <Stepper label="Makan utama" value={mainMeals} min={1} max={5} onChange={setMainMeals} />
            <Stepper label="Selingan" value={snacks} min={0} max={4} onChange={setSnacks} />
            <div className="text-sm font-bold text-neutral-800 mt-2 mb-1">🏃 Olahraga</div>
            <Stepper label="Frekuensi/hari" value={exerciseFreq} min={0} max={4} onChange={setExerciseFreq} />
            <Stepper label="Durasi (menit)" value={exerciseMin} min={0} max={180} step={5} onChange={setExerciseMin} />
            <div className="text-sm font-bold text-neutral-800 mt-2 mb-1">💤 Tidur & Hidrasi</div>
            <Stepper label="Tidur" value={sleepHr} min={0} max={12} step={0.5} unit="jam" onChange={setSleepHr} />
            <Stepper label="Air" value={hydrationL} min={0} max={6} step={0.25} unit="L" onChange={setHydrationL} />
            <div className="text-sm font-bold text-neutral-800 mt-2 mb-1">☀️ Sinar Matahari</div>
            <label className="flex items-center gap-2 py-1 text-sm">
              <input type="checkbox" checked={sunDone} onChange={(e) => setSunDone(e.target.checked)} className="h-4 w-4 accent-[#00BF63] rounded" /> Sudah berjemur?
            </label>
            {sunDone && <Stepper label="Durasi" value={sunHr} min={0} max={3} step={0.25} unit="jam" onChange={setSunHr} />}
          </div>

          {subActive && <Button onClick={compute} className="w-full"><IconSparkle size={16} /> Hitung Nilai Longevity</Button>}
        </div>

        {/* ── KOLOM KANAN: Hasil ── */}
        <div>
          {!subActive ? (
            <div className="flex h-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand/30 bg-brand/[0.03] p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10"><IconSparkle size={24} className="text-brand" /></div>
              <h3 className="mt-3 text-base font-bold">Nilai Longevity AI</h3>
              <p className="mt-1 text-sm text-neutral-500">Langganan 30 hari <b>Rp{PRICE_LONGEVITY.toLocaleString('id-ID')}</b></p>
              <Button className="mt-4" onClick={() => buyLongevitySub()}><IconSparkle size={15} /> Langgani Sekarang</Button>
              <Link to="/marketplace" className="mt-2 text-xs font-semibold text-brand-dark hover:underline">Buka di Marketplace →</Link>
            </div>
          ) : result ? (
            <div className="rounded-xl bg-gradient-to-br from-brand to-brand-dark p-5 text-white shadow-lg">
              <div className="flex items-center gap-4">
                <Gauge value={result.score} />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">Skor Longevity</div>
                  <div className="text-4xl font-extrabold leading-none">{result.score}<span className="text-lg font-medium text-white/60">/100</span></div>
                  <div className="mt-1 text-sm text-white/80">{result.score >= 80 ? 'Sangat baik 🌟' : result.score >= 60 ? 'Cukup baik 👍' : 'Perlu perbaikan 💪'}</div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <PillarBar label="Pola makan" v={result.meals} />
                <PillarBar label="Olahraga" v={result.exercise} />
                <PillarBar label="Hidrasi" v={result.hydration} />
                <PillarBar label="Tidur" v={result.sleep} />
                <PillarBar label="Sinar matahari" v={result.sun} />
                {result.hasVitals && <PillarBar label="💓 Tanda vital (data objektif)" v={result.vitals} highlight />}
              </div>
              <button onClick={shareToFeed} className="mt-4 w-full rounded-xl bg-white py-2.5 text-sm font-bold text-brand-dark transition hover:bg-white/90">
                {shared ? '✓ Dibagikan!' : '📣 Bagikan ke Feed'}
              </button>
            </div>
          ) : (
            <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl bg-neutral-50 text-center text-sm text-neutral-400">
              Isi data & import tanda vital, lalu tekan <b>&quot;Hitung Nilai Longevity&quot;</b>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ══════════════════════════════════════════════════════════════════════════ */
function EmptyState({ emoji, text }: { emoji: string; text: string }) {
  return <div className="rounded-xl border-2 border-dashed border-neutral-200 py-8 text-center"><span className="text-3xl">{emoji}</span><p className="mt-2 text-sm text-neutral-400">{text}</p></div>
}

function CircleRing({ label, value, max, unit, color, size = 120, sw = 10 }: { label: string; value: number; max: number; unit: string; color: string; size?: number; sw?: number }) {
  const [on, setOn] = useState(false)
  useEffect(() => { requestAnimationFrame(() => setOn(true)) }, [])
  const r = (size - sw - 4) / 2, c = 2 * Math.PI * r, pct = Math.min(1, value / max), off = c * (1 - (on ? pct : 0))
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeOpacity="0.1" strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,0.61,0.36,1)' }} />
        <text x={size / 2} y={size / 2 - 6} textAnchor="middle" fontSize="28" fontWeight="800" fill="#111">{value}</text>
        <text x={size / 2} y={size / 2 + 12} textAnchor="middle" fontSize="10" fontWeight="600" fill="#aaa">/ {max} {unit}</text>
      </svg>
      <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400">{label}</span>
    </div>
  )
}

function MiniStat({ icon, label, value, max, unit, color }: { icon: string; label: string; value: number; max: number; unit: string; color: string }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="rounded-xl border border-neutral-100 bg-white px-4 py-3 text-center transition hover:shadow-sm">
      <div className="text-lg">{icon}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{label}</div>
      <div className="mt-0.5 text-lg font-extrabold tabular-nums" style={{ color }}>{value}<span className="text-[10px] font-medium text-neutral-400"> {unit}</span></div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  )
}

function MacroBox({ label, value, target, color, emoji }: { label: string; value: number; target: number; color: string; emoji: string }) {
  return (
    <div className="text-center">
      <div className="text-base">{emoji}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{label}</div>
      <div className="mt-0.5 text-lg font-extrabold tabular-nums" style={{ color }}>{value}g</div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-neutral-200"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (value / target) * 100)}%`, background: color }} /></div>
      <div className="mt-0.5 text-[9px] text-neutral-400">/ {target}g</div>
    </div>
  )
}

function ANum({ v, d = 0 }: { v: number; d?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    let cur = Number(el.textContent) || 0; if (Math.abs(cur - v) < 0.01) return
    const s = cur, dur = 500, t0 = performance.now()
    let raf = 0
    const tick = (now: number) => { const p = Math.min(1, (now - t0) / dur); cur = s + (v - s) * (1 - Math.pow(1 - p, 3)); el.textContent = cur.toFixed(d); if (p < 1) raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf)
  }, [v, d])
  return <span ref={ref}>{v.toFixed(d)}</span>
}

function RangeTrack({ value, min, max, color }: { value: number; min: number; max: number; color: string }) {
  return <div className="mt-1 h-1 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, ((value - min) / (max - min)) * 100)}%`, background: color, opacity: 0.6 }} /></div>
}

function Stepper({ label, value, min, max, step = 1, unit, onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-sm text-neutral-600">{label}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))} className="grid h-7 w-7 place-items-center rounded-lg bg-neutral-100 text-sm font-bold text-neutral-600 transition hover:bg-neutral-200 active:scale-90">−</button>
        <span className="w-16 text-center text-sm font-bold tabular-nums">{value}{unit ? ` ${unit}` : ''}</span>
        <button onClick={() => onChange(Math.min(max, +(value + step).toFixed(2)))} className="grid h-7 w-7 place-items-center rounded-lg bg-brand/10 text-sm font-bold text-brand-dark transition hover:bg-brand/20 active:scale-90">+</button>
      </div>
    </div>
  )
}

function PillarBar({ label, v, highlight }: { label: string; v: number; highlight?: boolean }) {
  const [on, setOn] = useState(false)
  useEffect(() => { requestAnimationFrame(() => setOn(true)) }, [])
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-[11px] font-medium"><span className={highlight ? 'text-white font-bold' : 'text-white/70'}>{label}</span><span className="font-bold">{v}</span></div>
      <div className={`h-1.5 overflow-hidden rounded-full ${highlight ? 'bg-white/30' : 'bg-white/20'}`}>
        <div className={`h-full rounded-full transition-all duration-700 ${highlight ? 'bg-yellow-300' : 'bg-white'}`} style={{ width: `${on ? v : 0}%` }} />
      </div>
    </div>
  )
}

function Gauge({ value }: { value: number }) {
  const r = 30, c = 2 * Math.PI * r
  const [on, setOn] = useState(false)
  useEffect(() => { requestAnimationFrame(() => setOn(true)) }, [])
  return (
    <svg width="84" height="84" viewBox="0 0 76 76" className="drop-shadow-lg">
      <circle cx="38" cy="38" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="7" />
      <circle cx="38" cy="38" r={r} fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - (on ? value : 0) / 100)} transform="rotate(-90 38 38)" style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.22,0.61,0.36,1)' }} />
      <text x="38" y="42" textAnchor="middle" fontSize="18" fontWeight="800" fill="#fff">{value}</text>
    </svg>
  )
}
