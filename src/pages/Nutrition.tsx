import { useEffect, useState, useRef } from 'react'
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

/* ══════════════════════════════════════════════════════════════════════════
   MAIN
   ══════════════════════════════════════════════════════════════════════════ */
export function Nutrition() {
  const { state, addFood } = useStore()
  const [foodName, setFoodName] = useState(FOODS[0].name)
  const [grams, setGrams] = useState(100)

  const todays = state.foods.filter((f) => f.date === today())
  const total = todays.reduce(
    (a, f) => ({ kcal: a.kcal + f.kcal, carbs: a.carbs + f.carbs, protein: a.protein + f.protein, fat: a.fat + f.fat }),
    { kcal: 0, carbs: 0, protein: 0, fat: 0 },
  )
  const w = state.wellness?.[today()] ?? { date: today() }
  const sleepHr = (w as Record<string, unknown>).sleepHr as number ?? 0
  const waterMl = (w as Record<string, unknown>).waterMl as number ?? 0
  const exerciseKcal = (w as Record<string, unknown>).exerciseKcal as number ?? 0

  const previewBase = FOODS.find((f) => f.name === foodName)!
  const k = grams / 100
  const preview = {
    kcal: Math.round(previewBase.kcal * k),
    carbs: Math.round(previewBase.carbs * k),
    protein: Math.round(previewBase.protein * k),
    fat: Math.round(previewBase.fat * k),
  }

  const weekDots = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const date = d.toISOString().slice(0, 10)
    return !!(state.foods.some((f) => f.date === date) || state.wellness?.[date])
  })

  function add() {
    addFood({ id: uid(), date: today(), name: foodName, grams, ...preview })
  }

  return (
    <div className="space-y-5">
      {/* ─── HERO ─── */}
      <Card className="!overflow-hidden !p-0">
        <div className="bg-gradient-to-br from-brand/[0.06] via-transparent to-blue-50/40 px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
          <div className="flex flex-col items-center">
            <CircleRing label="Kalori" value={total.kcal} max={GOAL_KCAL} unit="kkal" color={COL_KCAL} size={148} sw={13} />
            <div className="mt-1 flex items-center gap-1">
              {weekDots.map((filled, i) => (
                <div key={i} className={`h-2 w-2 rounded-full transition-all duration-500 ${filled ? 'bg-brand scale-100' : 'bg-neutral-200 scale-75'}`} />
              ))}
              <span className="ml-1.5 text-[10px] text-neutral-400">{weekDots.filter(Boolean).length}/7 hari</span>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <MiniStat icon="😴" label="Tidur" value={sleepHr} max={GOAL_SLEEP} unit="jam" color="#818cf8" />
            <MiniStat icon="💧" label="Air" value={waterMl} max={GOAL_WATER} unit="mL" color={COL_WATER} />
            <MiniStat icon="🔥" label="Olahraga" value={exerciseKcal} max={500} unit="kkal" color="#f97316" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-px bg-neutral-100">
          <MacroCard label="Karbohidrat" value={total.carbs} target={300} color="#f59e0b" emoji="🌾" />
          <MacroCard label="Protein" value={total.protein} target={150} color={COL_KCAL} emoji="🥩" />
          <MacroCard label="Lemak" value={total.fat} target={65} color="#FF3131" emoji="🥑" />
        </div>
      </Card>

      {/* ─── Tambah Makanan ─── */}
      <Card className="!p-5">
        <SectionTitle icon={<IconFood size={18} />} title="Tambah Makanan" />
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="min-w-[170px] flex-1">
            <Field label="Makanan">
              <select className={inputClass} value={foodName} onChange={(e) => setFoodName(e.target.value)}>
                {FOODS.map((f) => <option key={f.name}>{f.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="w-24">
            <Field label="Gram">
              <input className={inputClass} type="number" value={grams} onChange={(e) => setGrams(Number(e.target.value))} />
            </Field>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Button onClick={add} className="h-[38px]"><IconPlus size={15} /> Tambah</Button>
            <div className="flex gap-2 text-[10px] tabular-nums text-neutral-400">
              <span>→ <b className="text-brand-dark">{preview.kcal}</b> kkal</span>
              <span className="text-amber-500">K{preview.carbs}</span>
              <span className="text-brand">P{preview.protein}</span>
              <span className="text-red-400">L{preview.fat}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {todays.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-neutral-200 py-8 text-center">
              <span className="text-3xl">🍽️</span>
              <p className="mt-2 text-sm text-neutral-400">Belum ada makanan tercatat hari ini</p>
            </div>
          )}
          {todays.map((f) => (
            <div key={f.id} className="group flex items-center justify-between rounded-2xl border border-neutral-100 bg-white px-4 py-3 transition-all hover:border-neutral-200 hover:shadow-md active:scale-[0.995]">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-800 truncate">{f.name}</span>
                  <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-400">{f.grams}g</span>
                </div>
                <div className="mt-1.5 flex h-1.5 w-28 overflow-hidden rounded-full bg-neutral-100">
                  {f.kcal > 0 && <>
                    <div className="h-full bg-amber-400 transition-all" style={{ width: `${(f.carbs * 4 / f.kcal) * 100}%` }} />
                    <div className="h-full bg-brand transition-all" style={{ width: `${(f.protein * 4 / f.kcal) * 100}%` }} />
                    <div className="h-full bg-red-400 transition-all" style={{ width: `${(f.fat * 9 / f.kcal) * 100}%` }} />
                  </>}
                </div>
              </div>
              <div className="ml-4 shrink-0 text-right">
                <div className="text-sm font-extrabold text-brand-dark">{f.kcal} <span className="text-[10px] font-medium text-neutral-400">kkal</span></div>
                <div className="mt-0.5 flex gap-2 text-[10px] tabular-nums">
                  <span className="text-amber-500">K {f.carbs}</span>
                  <span className="text-brand">P {f.protein}</span>
                  <span className="text-red-400">L {f.fat}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <ActivityLog />
      <WellnessTrendChart />
      <ChronicMonitor />
      <LongevityCalculator />

      {/* ─── Tips ─── */}
      <Card className="!p-5">
        <SectionTitle title="Anjuran Harian" subtitle="Disesuaikan nutrisi & kondisi pasien" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Tip emoji="🍽️" title="Porsi Makan" text="½ piring sayur/buah, ¼ protein, ¼ karbo kompleks. 3x utama + 2 selingan." accent="#00BF63" />
          <Tip emoji="🌙" title="Jam Tidur" text="7–8 jam, sebelum 23.00. Konsisten tiap hari untuk imunitas." accent="#818cf8" />
          <Tip emoji="🏃" title="Olahraga" text="Zona-2 150 menit/minggu + beban 2×/minggu." accent="#f97316" />
          <Tip emoji="☀️" title="Sinar Matahari" text="10–20 menit pagi (08–10) untuk vitamin D." accent="#eab308" />
          <Tip emoji="💧" title="Hidrasi" text="±2 L/hari, lebih saat aktivitas. Pantau warna urine." accent="#2563eb" />
          <Tip emoji="🩺" title="Follow-up" text="Kontrol lebih cepat bila keluhan memberat." accent="#FF3131" />
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
  const w = state.wellness?.[today()] ?? { date: today() }
  const wSafe = w as Record<string, unknown>
  const [exName, setExName] = useState(EXERCISES[0].name)
  const [exMin, setExMin] = useState(30)
  const ex = EXERCISES.find((e) => e.name === exName)!
  const burn = Math.round(ex.kcalPerMin * exMin)

  function addExercise() {
    logWellness(today(), {
      exerciseKcal: ((wSafe.exerciseKcal as number) ?? 0) + burn,
      exerciseMin: ((wSafe.exerciseMin as number) ?? 0) + exMin,
    })
  }

  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconPlus size={18} />} title="Olahraga, Tidur & Air" subtitle="Catat aktivitas harian Anda" />
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-100 p-4 transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-lg">🔥</span>
              <div>
                <div className="text-sm font-bold text-neutral-800">Olahraga</div>
                <div className="text-[10px] text-neutral-400">Kalori terbakar hari ini</div>
              </div>
            </div>
            <span className="rounded-xl bg-orange-50 px-3 py-1.5 text-sm font-extrabold text-orange-600 tabular-nums">
              <AnimatedNum value={(wSafe.exerciseKcal as number) ?? 0} /> kkal
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="min-w-[150px] flex-1">
              <Field label="Jenis">
                <select className={inputClass} value={exName} onChange={(e) => setExName(e.target.value)}>
                  {EXERCISES.map((e) => <option key={e.name}>{e.emoji} {e.name}</option>)}
                </select>
              </Field>
            </div>
            <div className="w-24">
              <Field label="Menit">
                <input className={inputClass} type="number" value={exMin} onChange={(e) => setExMin(Math.max(0, Number(e.target.value)))} />
              </Field>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-neutral-400">
              Est. <b className="text-orange-500">{burn} kkal</b> · <Badge tone="neutral">{ex.intensity}</Badge>
            </span>
            <Button onClick={addExercise} className="h-8 text-xs"><IconPlus size={14} /> Catat</Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-100 p-4 transition hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-lg">🌙</span>
                <div>
                  <div className="text-sm font-bold text-neutral-800">Tidur</div>
                  <div className="text-[10px] text-neutral-400">Target {GOAL_SLEEP} jam</div>
                </div>
              </div>
              <span className="text-sm font-extrabold text-indigo-500 tabular-nums">
                <AnimatedNum value={(wSafe.sleepHr as number) ?? 0} decimals={1} /> jam
              </span>
            </div>
            <div className="mt-2">
              <Stepper label="" value={(wSafe.sleepHr as number) ?? 0} min={0} max={12} step={0.5} unit="jam" onChange={(v) => logWellness(today(), { sleepHr: v })} />
              <RangeTrack value={(wSafe.sleepHr as number) ?? 0} min={0} max={GOAL_SLEEP} color="#818cf8" />
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-100 p-4 transition hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-lg">💧</span>
                <div>
                  <div className="text-sm font-bold text-neutral-800">Air Putih</div>
                  <div className="text-[10px] text-neutral-400">Target {GOAL_WATER} mL</div>
                </div>
              </div>
              <span className="text-sm font-extrabold text-blue-600 tabular-nums">
                <AnimatedNum value={(wSafe.waterMl as number) ?? 0} /> mL
              </span>
            </div>
            <div className="mt-2">
              <Stepper label="" value={(wSafe.waterMl as number) ?? 0} min={0} max={5000} step={250} unit="mL" onChange={(v) => logWellness(today(), { waterMl: v })} />
              <RangeTrack value={(wSafe.waterMl as number) ?? 0} min={0} max={GOAL_WATER} color={COL_WATER} />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   WELLNESS TREND CHART
   ══════════════════════════════════════════════════════════════════════════ */
function WellnessTrendChart() {
  const { state, account, addPost } = useStore()
  const [shared, setShared] = useState('')
  const [visible, setVisible] = useState(false)
  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  const days: { date: string; kcal: number; sleepHr: number; waterMl: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const date = d.toISOString().slice(0, 10)
    const kcal = state.foods.filter((f) => f.date === date).reduce((a, f) => a + f.kcal, 0)
    const wd = state.wellness?.[date] as Record<string, unknown> | undefined
    days.push({ date, kcal, sleepHr: (wd?.sleepHr as number) ?? 0, waterMl: (wd?.waterMl as number) ?? 0 })
  }
  const hasData = days.some((d) => d.kcal || d.sleepHr || d.waterMl)

  const W = 380, H = 200, base = 176, topY = 24, pad = 20
  const scale = (base - topY) / 3
  const xs = days.map((_, i) => pad + (i * (W - pad * 2)) / 6)
  const nK = days.map((d) => Math.min(1, d.kcal / GOAL_KCAL))
  const nS = days.map((d) => Math.min(1, d.sleepHr / GOAL_SLEEP))
  const nW = days.map((d) => Math.min(1, d.waterMl / GOAL_WATER))
  const yK = nK.map((v) => base - v * scale)
  const yS = nK.map((v, i) => base - (v + nS[i]) * scale)
  const yW = nK.map((v, i) => base - (v + nS[i] + nW[i]) * scale)

  const band = (upper: number[], lower: number[]) => {
    const fwd = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${upper[i].toFixed(1)}`).join(' ')
    const bwd = xs.map((_, i) => `L${xs[xs.length - 1 - i].toFixed(1)},${lower[lower.length - 1 - i].toFixed(1)}`).join(' ')
    return `${fwd} ${bwd} Z`
  }
  const baseLine = xs.map(() => base)

  const avg = (a: number[]) => Math.round(a.reduce((s, v) => s + v, 0) / a.length)
  const avgK = avg(days.map((d) => d.kcal))
  const avgS = (days.reduce((s, d) => s + d.sleepHr, 0) / 7).toFixed(1)
  const avgW = avg(days.map((d) => d.waterMl))

  function shareToDashboard() {
    addPost({
      id: uid(), authorEmail: account?.email ?? 'me@panaceamed.id', authorName: account?.name ?? 'Saya',
      role: account?.role ?? 'pasien', postType: 'kebiasaan', kind: 'image', activity: 'Tren 7 hari',
      caption: `Tren 7 hari 📊 ${avgK} kkal · ${avgS} jam tidur · ${avgW} mL air. #PerjalananSehat`,
      mediaColor: COL_KCAL, calories: avgK, sleepHr: Number(avgS), waterMl: avgW,
      likes: 0, comments: 0, reposts: 0, at: new Date().toISOString(),
    })
    setShared('feed'); setTimeout(() => setShared(''), 3000)
  }

  async function shareExternal() {
    const t = `Tren 7 hari di Panaceamed.id 🌱\nKalori: ${avgK} kkal/hari\nTidur: ${avgS} jam\nAir: ${avgW} mL`
    try {
      if (navigator.share) await navigator.share({ title: 'Tren Kesehatan — Panaceamed', text: t })
      else { await navigator.clipboard.writeText(t); setShared('copy'); setTimeout(() => setShared(''), 3000) }
    } catch { /* cancelled */ }
  }

  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconSparkle size={20} />} title="Tren 7 Hari" subtitle="Perbandingan kalori, tidur & air putih" />
      {!hasData ? (
        <div className="mt-3 rounded-2xl border-2 border-dashed border-neutral-200 py-10 text-center">
          <span className="text-4xl">📊</span>
          <p className="mt-2 text-sm text-neutral-400">Catat data untuk melihat tren</p>
        </div>
      ) : (
        <>
          <div className="mt-3 overflow-x-auto rounded-2xl bg-gradient-to-b from-neutral-50/80 to-white p-4">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 320 }}>
              <defs>
                <linearGradient id="gK" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COL_KCAL} stopOpacity="0.9" /><stop offset="100%" stopColor={COL_KCAL} stopOpacity="0.5" /></linearGradient>
                <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COL_SLEEP} stopOpacity="0.75" /><stop offset="100%" stopColor={COL_SLEEP} stopOpacity="0.4" /></linearGradient>
                <linearGradient id="gW" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COL_WATER} stopOpacity="0.8" /><stop offset="100%" stopColor={COL_WATER} stopOpacity="0.45" /></linearGradient>
              </defs>
              {[0, 1, 2, 3].map((u) => (
                <line key={u} x1={pad - 4} x2={W - pad + 4} y1={base - u * scale} y2={base - u * scale} stroke="rgba(0,0,0,0.04)" strokeWidth={1} strokeDasharray={u === 0 ? 'none' : '4 4'} />
              ))}
              <g style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(8px)', transition: 'all 0.8s ease-out' }}>
                <path d={band(yK, baseLine)} fill="url(#gK)" />
                <path d={band(yS, yK)} fill="url(#gS)" />
                <path d={band(yW, yS)} fill="url(#gW)" />
                {days.map((d, i) => (
                  <g key={d.date}>
                    <circle cx={xs[i]} cy={yK[i]} r="3.5" fill="white" stroke={COL_KCAL} strokeWidth="2" />
                    {d.sleepHr > 0 && <circle cx={xs[i]} cy={yS[i]} r="3" fill="white" stroke={COL_SLEEP} strokeWidth="1.5" />}
                    {d.waterMl > 0 && <circle cx={xs[i]} cy={yW[i]} r="3" fill="white" stroke={COL_WATER} strokeWidth="1.5" />}
                  </g>
                ))}
              </g>
              {days.map((d, i) => (
                <text key={d.date} x={xs[i]} y={H - 4} textAnchor="middle" fontSize="9" fill="#bbb" fontWeight="500">
                  {new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short' })}
                </text>
              ))}
            </svg>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-5">
            <Legend color={COL_KCAL} label={`Kalori ${avgK}/hari`} />
            <Legend color={COL_SLEEP} label={`Tidur ${avgS} jam`} />
            <Legend color={COL_WATER} label={`Air ${avgW} mL`} />
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button onClick={shareToDashboard} className="h-9 text-xs rounded-xl">📣 {shared === 'feed' ? '✓ Dibagikan!' : 'Ke Dashboard'}</Button>
            <Button variant="outline" onClick={shareExternal} className="h-9 text-xs rounded-xl">🔗 {shared === 'copy' ? '✓ Disalin!' : 'Ke Medsos'}</Button>
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
  const loggedToday = !!latest && latest.takenAt.slice(0, 10) === new Date().toISOString().slice(0, 10)

  async function buy(plan: 'monthly' | 'lifetime') {
    setPayMsg('')
    if (!backendEnabled) { buyChronicSub(plan); return }
    try {
      const h = await api.health()
      if (!h.features.payments) { buyChronicSub(plan); return }
      const r = await api.createPayment(0, 'QRIS', `chronic_${plan}`)
      if (r.live && r.redirectUrl) {
        window.open(r.redirectUrl, '_blank')
        setPayMsg('Selesaikan pembayaran di tab Midtrans — langganan aktif otomatis.')
        let n = 0
        const iv = setInterval(async () => {
          n++
          try {
            const s = await api.paymentStatus(r.orderId)
            if (s.status === 'paid') { clearInterval(iv); buyChronicSub(plan); setPayMsg('✅ Pembayaran berhasil!') }
            else if (s.status === 'failed') { clearInterval(iv); setPayMsg('Pembayaran gagal.') }
          } catch { /* retry */ }
          if (n >= 45) clearInterval(iv)
        }, 4000)
      } else { await api.confirmPayment(r.orderId); buyChronicSub(plan) }
    } catch { setPayMsg('Gagal memproses. Coba lagi.') }
  }

  const evals = latest ? evaluateVitals(latest, p.chronicConditions) : []
  const status = overallStatus(evals)

  function save() {
    addVital(p.id, {
      id: uid(), takenAt: new Date().toISOString(),
      systolic: Number(f.sys), diastolic: Number(f.dia), heartRate: Number(f.hr),
      respRate: Number(f.rr), tempC: Number(f.temp), spo2: Number(f.spo2),
      glucose: f.glu ? Number(f.glu) : undefined,
    })
    setShow(false)
  }

  if (!active) return (
    <Card className="!p-5 border-2 border-brand/15">
      <SectionTitle icon={<IconHeart size={20} />} title="Pemantauan Kronis" subtitle="TTV harian pasien kronis" right={<Badge tone="high">Langganan</Badge>} />
      <div className="mt-4 rounded-2xl border-2 border-dashed border-brand/25 bg-gradient-to-br from-brand/[0.03] to-transparent p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-xl">🫀</span>
          <p className="text-sm leading-relaxed text-neutral-600">Untuk pasien <b>hipertensi, diabetes, jantung</b>: catat tekanan darah, gula, nadi, SpO₂ & suhu setiap hari.</p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button onClick={() => buy('monthly')} className="rounded-2xl border-2 border-neutral-200 p-4 text-left transition-all hover:border-brand/40 hover:shadow-md">
            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Bulanan</div>
            <div className="mt-1 text-2xl font-extrabold text-neutral-800">Rp{CHRONIC_MONTHLY.toLocaleString('id-ID')}<span className="text-sm font-medium text-neutral-400">/bln</span></div>
          </button>
          <button onClick={() => buy('lifetime')} className="relative rounded-2xl border-2 border-brand bg-brand/[0.04] p-4 text-left transition-all hover:shadow-md">
            <span className="absolute -top-2.5 right-3 rounded-full bg-brand px-2.5 py-0.5 text-[9px] font-bold text-white shadow-sm">Terbaik</span>
            <div className="text-[10px] font-bold uppercase tracking-widest text-brand-dark">Lifetime</div>
            <div className="mt-1 text-2xl font-extrabold text-brand-dark">Rp{(CHRONIC_LIFETIME / 1e6).toLocaleString('id-ID')}jt</div>
          </button>
        </div>
        {payMsg && <p className="mt-3 text-xs font-semibold text-brand-dark">{payMsg}</p>}
      </div>
    </Card>
  )

  const vitalFields: [string, string, string | number][] = [
    ['sys', 'Sistolik', f.sys], ['dia', 'Diastolik', f.dia], ['hr', 'Nadi', f.hr],
    ['rr', 'RR', f.rr], ['temp', 'Suhu', f.temp], ['spo2', 'SpO₂', f.spo2], ['glu', 'Gula (ops.)', f.glu],
  ]

  return (
    <Card className="!p-5 border-2 border-brand/15">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle icon={<IconHeart size={20} />} title="Pemantauan Kronis" subtitle="Catat TTV harian" />
        <Badge tone="brand">{state.chronicLifetime ? '∞ Lifetime' : `${daysLeft} hari`}</Badge>
      </div>

      {!loggedToday && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand/20 bg-brand/[0.04] px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-medium text-brand-dark">
            <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" /></span>
            Belum mencatat TTV hari ini
          </span>
          <Button onClick={() => setShow(true)} className="h-8 text-xs rounded-xl">Catat Sekarang</Button>
        </div>
      )}
      {status === 'alert' && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3.5">
          <span className="flex items-center gap-2 text-sm font-medium text-red-700">
            <span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" /></span>
            <b>Tanda vital berbahaya.</b> Segera konsultasi atau darurat.
          </span>
          <div className="flex gap-2">
            <Link to="/consult"><Button variant="outline" className="h-8 text-xs rounded-xl"><IconStethoscope size={14} /> Konsultasi</Button></Link>
            <Link to="/hospitals"><Button className="h-8 text-xs rounded-xl"><IconHospital size={14} /> SOS</Button></Link>
          </div>
        </div>
      )}
      {status === 'warn' && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="text-sm font-medium text-amber-800">⚠️ Sebagian nilai di luar target.</span>
          <Link to="/consult"><Button variant="outline" className="h-8 text-xs rounded-xl">Konsultasi</Button></Link>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-neutral-500">
          Status: <b style={{ color: STATUS_COLOR[status] }}>{latest ? STATUS_LABEL[status] : 'Belum ada data'}</b>
          {p.chronicConditions.length > 0 && <span className="ml-1.5 text-[11px] text-neutral-400">· {p.chronicConditions.join(', ')}</span>}
        </span>
        <Button variant="outline" onClick={() => setShow((s) => !s)} className="h-8 text-xs rounded-xl"><IconPlus size={14} /> Catat TTV</Button>
      </div>

      {show && (
        <div className="mt-3 grid grid-cols-2 gap-2.5 rounded-2xl bg-neutral-50 p-4 sm:grid-cols-4">
          {vitalFields.map(([k, label, val]) => (
            <Field key={k} label={label}>
              <input className={inputClass} type="number" value={String(val)} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
            </Field>
          ))}
          <div className="flex items-end"><Button onClick={save} className="h-[38px] rounded-xl">Simpan</Button></div>
        </div>
      )}

      {latest ? (
        <>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
            {evals.map((e) => (
              <div key={e.label} className="relative overflow-hidden rounded-2xl border border-neutral-100 p-3.5 transition-all hover:shadow-sm">
                <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl" style={{ background: STATUS_COLOR[e.status] }} />
                <div className="pl-2">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{e.label}</div>
                  <div className="mt-1 text-2xl font-extrabold leading-tight tabular-nums" style={{ color: STATUS_COLOR[e.status] }}>
                    {e.value} <span className="text-[11px] font-medium text-neutral-400">{e.unit}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLOR[e.status] }} />
                    <span className="text-[10px] text-neutral-400">{e.target} · {STATUS_LABEL[e.status]}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <TtvTrend vitals={vitals} />
          <p className="mt-3 text-[10px] text-neutral-400">{vitals.length} catatan · terakhir {new Date(latest.takenAt).toLocaleString('id-ID')}</p>
        </>
      ) : (
        <div className="mt-4 rounded-2xl border-2 border-dashed border-neutral-200 py-8 text-center">
          <span className="text-3xl">🩺</span>
          <p className="mt-2 text-sm text-neutral-400">Belum ada catatan TTV</p>
        </div>
      )}
    </Card>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   TTV TREND
   ══════════════════════════════════════════════════════════════════════════ */
function TtvTrend({ vitals }: { vitals: VitalSign[] }) {
  const recent = vitals.slice(-14)
  if (recent.length < 2) return null

  const makeLine = (vals: number[], color: string) => {
    const w = 280, h = 44
    const min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1
    const pts: number[][] = vals.map((v, i) => [(i / (vals.length - 1)) * w, h - 4 - ((v - min) / span) * (h - 10)])
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)]
      const p1 = pts[i]
      const p2 = pts[i + 1]
      const p3 = pts[Math.min(pts.length - 1, i + 2)]
      d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
    }
    const fillD = `${d} L${pts[pts.length - 1][0].toFixed(1)},${h} L0,${h} Z`
    return (
      <g>
        <path d={fillD} fill={color} fillOpacity="0.1" />
        <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.5" fill="white" stroke={color} strokeWidth="1.5" />)}
      </g>
    )
  }

  const glu = recent.map((v) => v.glucose).filter((g): g is number => g != null)

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-neutral-100 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Sistolik</span>
          <span className="rounded-lg bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-500 tabular-nums">{recent[recent.length - 1].systolic} mmHg</span>
        </div>
        <svg viewBox="0 0 280 44" className="mt-2 w-full">{makeLine(recent.map((v) => v.systolic), '#FF3131')}</svg>
      </div>
      {glu.length >= 2 && (
        <div className="rounded-2xl border border-neutral-100 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Gula Darah</span>
            <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 tabular-nums">{glu[glu.length - 1]} mg/dL</span>
          </div>
          <svg viewBox="0 0 280 44" className="mt-2 w-full">{makeLine(glu, '#f59e0b')}</svg>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   LONGEVITY CALCULATOR
   ══════════════════════════════════════════════════════════════════════════ */
function clamp(n: number) { return Math.max(0, Math.min(100, Math.round(n))) }

function computeLongevity(i: { mainMeals: number; snacks: number; exerciseFreq: number; exerciseMin: number; hydrationL: number; sleepHr: number; sunDone: boolean; sunHr: number }) {
  const meals = clamp(100 - Math.abs(i.mainMeals - 3) * 18 - Math.max(0, i.snacks - 2) * 12)
  const exercise = clamp((i.exerciseFreq >= 1 ? 60 : i.exerciseFreq * 60) + Math.min(40, (i.exerciseMin / 30) * 40))
  const hydration = clamp(i.hydrationL >= 2 && i.hydrationL <= 3.5 ? 100 : 100 - Math.abs(i.hydrationL - 2.5) * 28)
  const sleep = clamp(i.sleepHr >= 7 && i.sleepHr <= 9 ? 100 : 100 - Math.abs(i.sleepHr - 8) * 16)
  const sun = clamp(!i.sunDone ? 40 : i.sunHr >= 0.17 && i.sunHr <= 0.6 ? 100 : 100 - Math.abs(i.sunHr - 0.33) * 80)
  const score = clamp(meals * 0.2 + exercise * 0.25 + hydration * 0.15 + sleep * 0.25 + sun * 0.15)
  return { score, meals, exercise, hydration, sleep, sun }
}

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

  const subActive = !!state.longevitySubExpires && new Date(state.longevitySubExpires) > new Date()
  const daysLeft = state.longevitySubExpires ? Math.max(0, Math.ceil((new Date(state.longevitySubExpires).getTime() - Date.now()) / 86400000)) : 0

  function compute() { setResult(computeLongevity({ mainMeals, snacks, exerciseFreq, exerciseMin, hydrationL, sleepHr, sunDone, sunHr })) }

  function shareToFeed() {
    if (!result) return
    addPost({
      id: uid(), authorEmail: account?.email ?? 'me@panaceamed.id', authorName: account?.name ?? 'Saya',
      role: account?.role ?? 'pasien', postType: 'kebiasaan', kind: 'image', activity: 'Longevity harian',
      caption: `Nilai Longevity AI: ${result.score}/100 🌱 #PerjalananSehat`,
      mediaColor: '#00BF63', waterMl: Math.round(hydrationL * 1000), veggieServ: mainMeals, sleepHr, sugaryDrinks: 0,
      likes: 0, comments: 0, reposts: 0, at: new Date().toISOString(),
    })
    setShared(true); setTimeout(() => setShared(false), 3000)
  }

  return (
    <Card className="!p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle icon={<IconSparkle size={20} />} title="Kalkulator Longevity" subtitle="AI menghitung skor gaya hidup Anda" />
        {subActive ? <Badge tone="brand">{daysLeft} hari</Badge> : <Badge tone="high">Langganan</Badge>}
      </div>
      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          <InputBlock title="🍽️ Makan">
            <Stepper label="Makan utama" value={mainMeals} min={1} max={5} onChange={setMainMeals} />
            <Stepper label="Selingan" value={snacks} min={0} max={4} onChange={setSnacks} />
          </InputBlock>
          <InputBlock title="🏃 Olahraga">
            <Stepper label="Frekuensi/hari" value={exerciseFreq} min={0} max={4} onChange={setExerciseFreq} />
            <Stepper label="Durasi (menit)" value={exerciseMin} min={0} max={180} step={5} onChange={setExerciseMin} />
          </InputBlock>
          <InputBlock title="💧 Tidur & Hidrasi">
            <Stepper label="Tidur" value={sleepHr} min={0} max={12} step={0.5} unit="jam" onChange={setSleepHr} />
            <Stepper label="Air" value={hydrationL} min={0} max={6} step={0.25} unit="L" onChange={setHydrationL} />
          </InputBlock>
          <InputBlock title="☀️ Sinar Matahari">
            <label className="flex items-center gap-2 py-1 text-sm">
              <input type="checkbox" checked={sunDone} onChange={(e) => setSunDone(e.target.checked)} className="h-4 w-4 accent-[#00BF63] rounded" />
              Sudah berjemur?
            </label>
            {sunDone && <Stepper label="Durasi" value={sunHr} min={0} max={3} step={0.25} unit="jam" onChange={setSunHr} />}
          </InputBlock>
          {subActive && <Button onClick={compute} className="w-full"><IconSparkle size={16} /> Hitung Nilai Longevity</Button>}
        </div>
        <div>
          {!subActive ? (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand/30 bg-brand/[0.03] p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10"><IconSparkle size={24} className="text-brand" /></div>
              <h3 className="mt-3 text-base font-bold text-neutral-800">Nilai Longevity AI</h3>
              <p className="mt-1 max-w-[240px] text-sm text-neutral-500">Langganan 30 hari <b>Rp{PRICE_LONGEVITY.toLocaleString('id-ID')}</b></p>
              <Button className="mt-5" onClick={() => buyLongevitySub()}><IconSparkle size={15} /> Langgani Sekarang</Button>
              <Link to="/marketplace" className="mt-2 text-xs font-semibold text-brand-dark hover:underline">Buka di Marketplace →</Link>
            </div>
          ) : result ? (
            <div className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-5 text-white shadow-lg">
              <div className="flex items-center gap-4">
                <Gauge value={result.score} />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">Skor Longevity</div>
                  <div className="text-4xl font-extrabold leading-none">{result.score}<span className="text-lg font-medium text-white/60">/100</span></div>
                  <div className="mt-1 text-sm text-white/80">{result.score >= 80 ? 'Sangat baik 🌟' : result.score >= 60 ? 'Cukup baik 👍' : 'Perlu perbaikan 💪'}</div>
                </div>
              </div>
              <div className="mt-5 space-y-2.5">
                <PillarBar label="Pola makan" v={result.meals} />
                <PillarBar label="Olahraga" v={result.exercise} />
                <PillarBar label="Hidrasi" v={result.hydration} />
                <PillarBar label="Tidur" v={result.sleep} />
                <PillarBar label="Sinar matahari" v={result.sun} />
              </div>
              <button onClick={shareToFeed} className="mt-4 w-full rounded-xl bg-white py-2.5 text-sm font-bold text-brand-dark transition hover:bg-white/90">
                {shared ? '✓ Dibagikan!' : '📣 Bagikan ke Feed'}
              </button>
            </div>
          ) : (
            <div className="flex h-full min-h-[200px] items-center justify-center rounded-2xl bg-neutral-50 text-center text-sm text-neutral-400">
              Isi data lalu tekan <b>&quot;Hitung Nilai Longevity&quot;</b>
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

function InputBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-100 px-4 py-3">
      <div className="text-sm font-bold text-neutral-800">{title}</div>
      <div className="mt-1">{children}</div>
    </div>
  )
}

function CircleRing({ label, value, max, unit, color, size = 120, sw = 10 }: {
  label: string; value: number; max: number; unit: string; color: string; size?: number; sw?: number
}) {
  const [shown, setShown] = useState(false)
  useEffect(() => { const id = requestAnimationFrame(() => setShown(true)); return () => cancelAnimationFrame(id) }, [])
  const r = (size - sw - 4) / 2
  const c = 2 * Math.PI * r
  const pct = Math.min(1, value / max)
  const off = c * (1 - (shown ? pct : 0))
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeOpacity={0.1} strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,0.61,0.36,1)' }} />
        <text x={size / 2} y={size / 2 - 8} textAnchor="middle" fontSize="30" fontWeight="800" fill="#111">{value}</text>
        <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fontSize="10" fontWeight="600" fill="#aaa">/ {max} {unit}</text>
      </svg>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">{label}</span>
    </div>
  )
}

function MiniStat({ icon, label, value, max, unit, color }: {
  icon: string; label: string; value: number; max: number; unit: string; color: string
}) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-3 text-center transition hover:shadow-sm">
      <div className="text-lg">{icon}</div>
      <div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400">{label}</div>
      <div className="mt-1 text-lg font-extrabold tabular-nums" style={{ color }}>{value}<span className="text-[10px] font-medium text-neutral-400"> {unit}</span></div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="mt-0.5 text-[9px] text-neutral-400 tabular-nums">{pct.toFixed(0)}%</div>
    </div>
  )
}

function MacroCard({ label, value, target, color, emoji }: {
  label: string; value: number; target: number; color: string; emoji: string
}) {
  const pct = Math.min(100, (value / target) * 100)
  return (
    <div className="bg-white px-4 py-3.5 text-center transition hover:bg-neutral-50">
      <div className="text-lg">{emoji}</div>
      <div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400">{label}</div>
      <div className="mt-1 text-xl font-extrabold tabular-nums" style={{ color }}>{value}g</div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="mt-0.5 text-[9px] text-neutral-400 tabular-nums">/ {target}g</div>
    </div>
  )
}

function AnimatedNum({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const startVal = parseFloat(el.textContent || '0')
    if (startVal === value) return
    const dur = 600
    const t0 = performance.now()
    let raf = 0
    function tick() {
      const now = performance.now()
      const p = Math.min(1, (now - t0) / dur)
      const ease = 1 - Math.pow(1 - p, 3)
      const cur = startVal + (value - startVal) * ease
      const target = ref.current
      if (target) target.textContent = cur.toFixed(decimals)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, decimals])
  return <span ref={ref}>{value.toFixed(decimals)}</span>
}

function RangeTrack({ value, min, max, color }: { value: number; min: number; max: number; color: string }) {
  const pct = Math.min(100, ((value - min) / (max - min)) * 100)
  return (
    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-neutral-100">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color, opacity: 0.6 }} />
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} /> {label}
    </span>
  )
}

function Tip({ emoji, title, text, accent }: { emoji: string; title: string; text: string; accent: string }) {
  return (
    <div className="group rounded-2xl border border-neutral-100 p-3.5 transition-all hover:shadow-sm hover:border-neutral-200">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm" style={{ background: accent + '15' }}>{emoji}</span>
        <span className="text-xs font-bold text-neutral-800">{title}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">{text}</p>
    </div>
  )
}

function Stepper({ label, value, min, max, step = 1, unit, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void
}) {
  const dec = () => onChange(Math.max(min, +(value - step).toFixed(2)))
  const inc = () => onChange(Math.min(max, +(value + step).toFixed(2)))
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-neutral-600">{label}</span>
      <div className="flex items-center gap-1.5">
        <button onClick={dec} className="grid h-7 w-7 place-items-center rounded-lg bg-neutral-100 text-sm font-bold text-neutral-600 transition hover:bg-neutral-200 active:scale-90">−</button>
        <span className="w-16 text-center text-sm font-bold tabular-nums">{value}{unit ? ` ${unit}` : ''}</span>
        <button onClick={inc} className="grid h-7 w-7 place-items-center rounded-lg bg-brand/10 text-sm font-bold text-brand-dark transition hover:bg-brand/20 active:scale-90">+</button>
      </div>
    </div>
  )
}

function PillarBar({ label, v }: { label: string; v: number }) {
  const [shown, setShown] = useState(false)
  useEffect(() => { const id = requestAnimationFrame(() => setShown(true)); return () => cancelAnimationFrame(id) }, [])
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-[11px] font-medium">
        <span className="text-white/70">{label}</span>
        <span className="font-bold">{v}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
        <div className="h-full rounded-full bg-white" style={{ width: `${shown ? v : 0}%`, transition: 'width 0.8s cubic-bezier(0.22,0.61,0.36,1)' }} />
      </div>
    </div>
  )
}

function Gauge({ value }: { value: number }) {
  const r = 30, c = 2 * Math.PI * r
  const [shown, setShown] = useState(false)
  useEffect(() => { const id = requestAnimationFrame(() => setShown(true)); return () => cancelAnimationFrame(id) }, [])
  const off = c * (1 - (shown ? value : 0) / 100)
  return (
    <svg width="84" height="84" viewBox="0 0 76 76" className="drop-shadow-lg">
      <circle cx="38" cy="38" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="7" />
      <circle cx="38" cy="38" r={r} fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 38 38)"
        style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.22,0.61,0.36,1)' }} />
      <text x="38" y="42" textAnchor="middle" fontSize="18" fontWeight="800" fill="#fff">{value}</text>
    </svg>
  )
}
