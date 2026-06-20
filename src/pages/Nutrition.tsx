import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore, uid } from '../lib/store'
import { Card, SectionTitle, Button, Field, inputClass, Badge } from '../components/ui'
import { IconFood, IconPlus, IconSparkle } from '../components/icons'
import { FOODS, EXERCISES } from '../lib/foods'

const today = () => new Date().toISOString().slice(0, 10)

// Goals used to normalize the comparison chart (each metric → % of its goal).
const GOAL_KCAL = 2000
const GOAL_SLEEP = 8
const GOAL_WATER = 2000 // mL
// Series colors requested: kalori #00BF63, jam tidur hitam, air putih biru.
const COL_KCAL = '#00BF63'
const COL_SLEEP = '#111111'
const COL_WATER = '#2563eb'

export function Nutrition() {
  const { state, addFood } = useStore()
  const [foodName, setFoodName] = useState(FOODS[0].name)
  const [grams, setGrams] = useState(100)

  const todays = state.foods.filter((f) => f.date === today())
  const total = todays.reduce(
    (a, f) => ({ kcal: a.kcal + f.kcal, carbs: a.carbs + f.carbs, protein: a.protein + f.protein, fat: a.fat + f.fat }),
    { kcal: 0, carbs: 0, protein: 0, fat: 0 },
  )
  const targetKcal = 2000

  function add() {
    const base = FOODS.find((f) => f.name === foodName)!
    const k = grams / 100
    addFood({
      id: uid(),
      date: today(),
      name: foodName,
      grams,
      kcal: Math.round(base.kcal * k),
      carbs: Math.round(base.carbs * k),
      protein: Math.round(base.protein * k),
      fat: Math.round(base.fat * k),
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle
          icon={<IconFood size={20} />}
          title="Nutrisi & Hitung Kalori Harian"
          subtitle="Pantau asupan kalori & makronutrien untuk kemajuan kesehatan"
        />
        <div className="grid gap-3 sm:grid-cols-4">
          <Ring label="Kalori" value={total.kcal} max={targetKcal} unit="kkal" />
          <Macro label="Karbohidrat" value={total.carbs} color="#f59e0b" />
          <Macro label="Protein" value={total.protein} color="#00BF63" />
          <Macro label="Lemak" value={total.fat} color="#FF3131" />
        </div>
      </Card>

      <Card>
        <SectionTitle icon={<IconPlus size={18} />} title="Tambah Makanan" />
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-48">
            <Field label="Makanan">
              <select className={inputClass} value={foodName} onChange={(e) => setFoodName(e.target.value)}>
                {FOODS.map((f) => (
                  <option key={f.name}>{f.name}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="w-28">
            <Field label="Gram">
              <input className={inputClass} type="number" value={grams} onChange={(e) => setGrams(Number(e.target.value))} />
            </Field>
          </div>
          <Button onClick={add}>
            <IconPlus size={16} /> Tambah
          </Button>
        </div>
        <div className="mt-4 space-y-2">
          {todays.length === 0 && <p className="text-sm text-neutral-400">Belum ada makanan tercatat hari ini.</p>}
          {todays.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-xl border border-neutral-100 px-3 py-2 text-sm">
              <span className="font-medium">{f.name} <span className="text-neutral-400">· {f.grams} g</span></span>
              <span className="flex gap-3 text-xs">
                <span className="font-bold text-brand-dark">{f.kcal} kkal</span>
                <span className="text-amber-600">K {f.carbs}</span>
                <span className="text-brand">P {f.protein}</span>
                <span className="text-accent">L {f.fat}</span>
              </span>
            </div>
          ))}
        </div>
      </Card>

      <ActivityLog />

      <WellnessTrendChart />

      <LongevityCalculator />

      <Card>
        <SectionTitle title="Anjuran Harian" subtitle="Disesuaikan nutrisi & kondisi pasien" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Tip title="Penjadwalan & Porsi Makan" text="3 kali makan utama + 2 selingan; isi ½ piring sayur/buah, ¼ protein, ¼ karbohidrat kompleks." />
          <Tip title="Jam Tidur" text="7–8 jam, tidur sebelum 23.00; konsisten tiap hari untuk imunitas & metabolik." />
          <Tip title="Pola Olahraga" text="Zona-2 150 menit/minggu + latihan beban 2×/minggu, sesuaikan kondisi." />
          <Tip title="Paparan Sinar Matahari" text="10–20 menit pagi (08.00–10.00) untuk vitamin D & ritme sirkadian." />
          <Tip title="Hidrasi" text="±2 liter/hari, lebih saat aktivitas; pantau warna urine." />
          <Tip title="Follow-up" text="Sesuai gejala — kontrol lebih cepat bila keluhan memberat." />
        </div>
      </Card>
    </div>
  )
}

// -- Olahraga + Tidur + Air log (feeds the comparison chart) -----------------
function ActivityLog() {
  const { state, logWellness } = useStore()
  const w = state.wellness?.[today()] ?? { date: today() }
  const [exName, setExName] = useState(EXERCISES[0].name)
  const [exMin, setExMin] = useState(30)

  const ex = EXERCISES.find((e) => e.name === exName)!
  const burn = Math.round(ex.kcalPerMin * exMin)

  function addExercise() {
    logWellness(today(), {
      exerciseKcal: (w.exerciseKcal ?? 0) + burn,
      exerciseMin: (w.exerciseMin ?? 0) + exMin,
    })
  }

  return (
    <Card>
      <SectionTitle
        icon={<IconPlus size={18} />}
        title="Olahraga, Tidur & Air Putih"
        subtitle="Catat aktivitas harian — dihitung kalorinya & dibandingkan di grafik"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Exercise */}
        <div className="rounded-xl border border-neutral-100 p-3">
          <div className="mb-2 text-sm font-bold">🏃 Olahraga (terbakar {w.exerciseKcal ?? 0} kkal hari ini)</div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-44">
              <Field label="Jenis olahraga">
                <select className={inputClass} value={exName} onChange={(e) => setExName(e.target.value)}>
                  {EXERCISES.map((e) => (
                    <option key={e.name}>{e.emoji} {e.name}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="w-28">
              <Field label="Menit">
                <input className={inputClass} type="number" value={exMin} onChange={(e) => setExMin(Math.max(0, Number(e.target.value)))} />
              </Field>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-neutral-500">Estimasi bakar: <b className="text-accent">{burn} kkal</b> <Badge tone="neutral">{ex.intensity}</Badge></span>
            <Button onClick={addExercise}><IconPlus size={16} /> Catat</Button>
          </div>
        </div>

        {/* Sleep & water */}
        <div className="rounded-xl border border-neutral-100 p-3">
          <div className="mb-2 text-sm font-bold">😴 Tidur & 💧 Air putih hari ini</div>
          <Stepper label="Jam tidur" value={w.sleepHr ?? 0} min={0} max={12} step={0.5} unit="jam" onChange={(v) => logWellness(today(), { sleepHr: v })} />
          <Stepper label="Air putih" value={w.waterMl ?? 0} min={0} max={5000} step={250} unit="mL" onChange={(v) => logWellness(today(), { waterMl: v })} />
          <div className="mt-2 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="rounded-lg bg-neutral-50 py-1.5">Target tidur <b>{GOAL_SLEEP} jam</b></div>
            <div className="rounded-lg bg-neutral-50 py-1.5">Target air <b>{GOAL_WATER} mL</b></div>
          </div>
        </div>
      </div>
    </Card>
  )
}

// -- Stacked-area comparison chart: kalori (#00BF63) · tidur (hitam) · air (biru)
function WellnessTrendChart() {
  const { state, account, addPost } = useStore()
  const [shared, setShared] = useState('')

  // Build the last 7 days of normalized metrics.
  const days: { date: string; kcal: number; sleepHr: number; waterMl: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const date = d.toISOString().slice(0, 10)
    const kcal = state.foods.filter((f) => f.date === date).reduce((a, f) => a + f.kcal, 0)
    const wd = state.wellness?.[date]
    days.push({ date, kcal, sleepHr: wd?.sleepHr ?? 0, waterMl: wd?.waterMl ?? 0 })
  }
  const hasData = days.some((d) => d.kcal || d.sleepHr || d.waterMl)

  // Chart geometry.
  const W = 320, H = 180, base = 160, top = 30, scale = (base - top) / 3 // 3 stacked units
  const xs = days.map((_, i) => 15 + (i * (W - 30)) / 6)
  const nKcal = days.map((d) => Math.min(1, d.kcal / GOAL_KCAL))
  const nSleep = days.map((d) => Math.min(1, d.sleepHr / GOAL_SLEEP))
  const nWater = days.map((d) => Math.min(1, d.waterMl / GOAL_WATER))

  const yKcal = nKcal.map((v) => base - v * scale)
  const ySleep = nKcal.map((v, i) => base - (v + nSleep[i]) * scale)
  const yWater = nKcal.map((v, i) => base - (v + nSleep[i] + nWater[i]) * scale)

  const band = (upper: number[], lower: number[]) => {
    const up = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${upper[i].toFixed(1)}`).join(' ')
    const down = xs.map((_, i) => `L${xs[xs.length - 1 - i].toFixed(1)},${lower[lower.length - 1 - i].toFixed(1)}`).join(' ')
    return `${up} ${down} Z`
  }
  const baseLine = xs.map(() => base)

  // 7-day averages for the share caption.
  const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
  const avgKcal = avg(days.map((d) => d.kcal))
  const avgSleep = (days.reduce((a, d) => a + d.sleepHr, 0) / days.length).toFixed(1)
  const avgWater = avg(days.map((d) => d.waterMl))

  function shareToDashboard() {
    addPost({
      id: uid(),
      authorEmail: account?.email ?? 'me@panaceamed.id',
      authorName: account?.name ?? 'Saya',
      role: account?.role ?? 'pasien',
      postType: 'kebiasaan',
      kind: 'image',
      activity: 'Tren kesehatan 7 hari',
      caption: `Tren 7 hari saya 📊 Kalori rata-rata ${avgKcal} kkal · Tidur ${avgSleep} jam · Air ${avgWater} mL/hari. #PerjalananSehat #Panaceamed`,
      mediaColor: COL_KCAL,
      calories: avgKcal,
      sleepHr: Number(avgSleep),
      waterMl: avgWater,
      likes: 0, comments: 0, reposts: 0,
      at: new Date().toISOString(),
    })
    setShared('feed')
    setTimeout(() => setShared(''), 3000)
  }

  async function shareExternal() {
    const text = `Tren kesehatan 7 hari saya di Panaceamed.id 🌱\nKalori: ${avgKcal} kkal/hari\nTidur: ${avgSleep} jam/hari\nAir putih: ${avgWater} mL/hari`
    try {
      if (navigator.share) await navigator.share({ title: 'Tren Kesehatan Saya — Panaceamed.id', text })
      else { await navigator.clipboard.writeText(text); setShared('copy'); setTimeout(() => setShared(''), 3000) }
    } catch { /* user cancelled */ }
  }

  return (
    <Card>
      <SectionTitle
        icon={<IconSparkle size={20} />}
        title="Grafik Perbandingan 7 Hari"
        subtitle="Bandingkan kalori, jam tidur & air putih harian — dapat dibagikan ke Dashboard/medsos"
      />
      {!hasData ? (
        <div className="rounded-2xl bg-neutral-50 p-6 text-center text-sm text-neutral-500">
          Catat makanan, olahraga, tidur & air putih untuk melihat grafik perbandingan harian Anda.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 280 }}>
              {/* gridlines */}
              {[0, 1, 2, 3].map((u) => (
                <line key={u} x1={12} x2={W - 12} y1={base - u * scale} y2={base - u * scale} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
              ))}
              {/* stacked bands (bottom→top): kalori, tidur, air */}
              <path d={band(yKcal, baseLine)} fill={COL_KCAL} fillOpacity={0.85} />
              <path d={band(ySleep, yKcal)} fill={COL_SLEEP} fillOpacity={0.8} />
              <path d={band(yWater, ySleep)} fill={COL_WATER} fillOpacity={0.8} />
              {/* day labels */}
              {days.map((d, i) => (
                <text key={d.date} x={xs[i]} y={H - 6} textAnchor="middle" fontSize="8" fill="#9ca3af">
                  {new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short' })}
                </text>
              ))}
            </svg>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs">
            <Legend color={COL_KCAL} label={`Kalori (${avgKcal}/hari)`} />
            <Legend color={COL_SLEEP} label={`Tidur (${avgSleep} jam)`} />
            <Legend color={COL_WATER} label={`Air putih (${avgWater} mL)`} />
          </div>
          <p className="mt-1 text-center text-[10px] text-neutral-400">Tinggi tiap warna = % terhadap target (kalori {GOAL_KCAL} · tidur {GOAL_SLEEP} jam · air {GOAL_WATER} mL).</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button onClick={shareToDashboard}>📣 {shared === 'feed' ? 'Dibagikan ke Dashboard!' : 'Bagikan ke Dashboard'}</Button>
            <Button variant="outline" onClick={shareExternal}>🔗 {shared === 'copy' ? 'Disalin!' : 'Bagikan ke Medsos'}</Button>
          </div>
        </>
      )}
    </Card>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 font-semibold text-neutral-600">
      <span className="inline-block h-3 w-3 rounded-sm" style={{ background: color }} /> {label}
    </span>
  )
}

function Ring({ label, value, max, unit }: { label: string; value: number; max: number; unit: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="rounded-xl bg-brand-50 p-3 text-center">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-dark">{label}</div>
      <div className="text-2xl font-extrabold text-brand-dark">{value}</div>
      <div className="text-[10px] text-neutral-500">/ {max} {unit} ({pct}%)</div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function Macro({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl bg-neutral-50 p-3 text-center">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{label}</div>
      <div className="text-2xl font-extrabold" style={{ color }}>{value} g</div>
    </div>
  )
}

function Tip({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-neutral-100 p-3">
      <Badge tone="brand">{title}</Badge>
      <p className="mt-1.5 text-sm text-neutral-600">{text}</p>
    </div>
  )
}

// -- AI Longevity calculator (subscription-gated) ---------------------------
// All inputs are entered manually; the AI computes a calculative longevity score.
function clamp(n: number) { return Math.max(0, Math.min(100, Math.round(n))) }

function computeLongevity(i: {
  mainMeals: number; snacks: number; exerciseFreq: number; exerciseMin: number
  hydrationL: number; sleepHr: number; sunDone: boolean; sunHr: number
}) {
  // Each pillar scored 0–100 vs ideal ranges.
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
  const daysLeft = state.longevitySubExpires
    ? Math.max(0, Math.ceil((new Date(state.longevitySubExpires).getTime() - Date.now()) / 86400000))
    : 0

  function compute() {
    setResult(computeLongevity({ mainMeals, snacks, exerciseFreq, exerciseMin, hydrationL, sleepHr, sunDone, sunHr }))
  }

  function shareToFeed() {
    if (!result) return
    addPost({
      id: uid(),
      authorEmail: account?.email ?? 'me@panaceamed.id',
      authorName: account?.name ?? 'Saya',
      role: account?.role ?? 'pasien',
      postType: 'kebiasaan',
      kind: 'image',
      activity: 'Longevity harian',
      caption: `Nilai Longevity AI saya hari ini: ${result.score}/100 🌱 Terus konsisten! #PerjalananSehat`,
      mediaColor: '#00BF63',
      waterMl: Math.round(hydrationL * 1000),
      veggieServ: mainMeals,
      sleepHr,
      sugaryDrinks: 0,
      likes: 0, comments: 0, reposts: 0,
      at: new Date().toISOString(),
    })
    setShared(true)
    setTimeout(() => setShared(false), 3000)
  }

  return (
    <Card>
      <SectionTitle
        icon={<IconSparkle size={20} />}
        title="Kalkulator Longevity (AI)"
        subtitle="Isi gaya hidup harian Anda secara manual — AI menghitung nilai longevity Anda"
        right={subActive ? <Badge tone="brand">Langganan aktif · {daysLeft} hari</Badge> : <Badge tone="high">Perlu langganan</Badge>}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Manual inputs */}
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-100 p-3">
            <div className="mb-2 text-sm font-bold">🍽️ Penjadwalan Makan</div>
            <Stepper label="Makan utama / hari" value={mainMeals} min={1} max={5} onChange={setMainMeals} />
            <Stepper label="Selingan / hari" value={snacks} min={0} max={4} onChange={setSnacks} />
          </div>
          <div className="rounded-xl border border-neutral-100 p-3">
            <div className="mb-2 text-sm font-bold">🏃 Pola Olahraga</div>
            <Stepper label="Frekuensi (kali/hari)" value={exerciseFreq} min={0} max={4} onChange={setExerciseFreq} />
            <Stepper label="Durasi per sesi (menit)" value={exerciseMin} min={0} max={180} step={5} onChange={setExerciseMin} />
          </div>
          <div className="rounded-xl border border-neutral-100 p-3">
            <div className="mb-2 text-sm font-bold">💧 Hidrasi & 😴 Tidur</div>
            <Stepper label="Air putih (liter)" value={hydrationL} min={0} max={6} step={0.25} onChange={setHydrationL} unit="L" />
            <Stepper label="Jam tidur" value={sleepHr} min={0} max={12} step={0.5} onChange={setSleepHr} unit="jam" />
          </div>
          <div className="rounded-xl border border-neutral-100 p-3">
            <div className="mb-2 text-sm font-bold">☀️ Berjemur (paparan sinar matahari)</div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={sunDone} onChange={(e) => setSunDone(e.target.checked)} className="h-4 w-4 accent-[#00BF63]" />
              Sudah berjemur hari ini?
            </label>
            {sunDone && <div className="mt-2"><Stepper label="Berapa jam?" value={sunHr} min={0} max={3} step={0.25} onChange={setSunHr} unit="jam" /></div>}
          </div>
        </div>

        {/* Result / gating */}
        <div>
          {!subActive ? (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand/40 bg-brand-50/40 p-6 text-center">
              <IconSparkle size={34} className="text-brand" />
              <h3 className="mt-2 text-lg font-bold">Nilai Longevity bertenaga AI</h3>
              <p className="mt-1 max-w-xs text-sm text-neutral-600">
                Fitur ini berlangganan <b>30 hari</b>. Perpanjang tiap bulan <b>Rp{PRICE_LONGEVITY.toLocaleString('id-ID')}</b> melalui Marketplace.
              </p>
              <Button className="mt-4" onClick={() => buyLongevitySub()}>
                <IconSparkle size={16} /> Langganan 30 Hari — Rp{PRICE_LONGEVITY.toLocaleString('id-ID')}
              </Button>
              <Link to="/marketplace" className="mt-2 text-xs font-semibold text-brand-dark hover:underline">Buka di Marketplace →</Link>
            </div>
          ) : result ? (
            <div className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-5 text-white">
              <div className="flex items-center gap-4">
                <Gauge value={result.score} />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-white/70">Nilai Longevity AI</div>
                  <div className="text-4xl font-extrabold">{result.score}<span className="text-lg">/100</span></div>
                  <div className="text-sm text-white/85">{result.score >= 80 ? 'Sangat baik 🌟' : result.score >= 60 ? 'Cukup baik 👍' : 'Perlu perbaikan'}</div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <PillarBar label="Pola makan" v={result.meals} />
                <PillarBar label="Olahraga" v={result.exercise} />
                <PillarBar label="Hidrasi" v={result.hydration} />
                <PillarBar label="Tidur" v={result.sleep} />
                <PillarBar label="Sinar matahari" v={result.sun} />
              </div>
              <p className="mt-3 text-[11px] text-white/70">Dihitung oleh AI Panaceamed dari data gaya hidup Anda hari ini.</p>
              <button onClick={shareToFeed} className="mt-3 w-full rounded-xl bg-white py-2 text-sm font-bold text-brand-dark hover:bg-white/90">
                {shared ? '✓ Dibagikan ke Feed!' : '📣 Bagikan ke Feed'}
              </button>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl bg-neutral-50 p-6 text-center">
              <p className="text-sm text-neutral-500">Isi data di kiri lalu tekan tombol di bawah untuk menghitung nilai longevity Anda.</p>
            </div>
          )}
          {subActive && (
            <Button className="mt-4 w-full" onClick={compute}>
              <IconSparkle size={16} /> Hitung Nilai Longevity (AI)
            </Button>
          )}
        </div>
      </div>
    </Card>
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
      <div className="flex items-center gap-2">
        <button onClick={dec} className="grid h-7 w-7 place-items-center rounded-lg bg-neutral-100 font-bold">−</button>
        <span className="w-16 text-center text-sm font-extrabold">{value}{unit ? ` ${unit}` : ''}</span>
        <button onClick={inc} className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 font-bold text-brand-dark">+</button>
      </div>
    </div>
  )
}

function PillarBar({ label, v }: { label: string; v: number }) {
  const [shown, setShown] = useState(document.documentElement.classList.contains('reduce-motion'))
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-xs"><span>{label}</span><span className="font-bold">{v}</span></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
        <div
          className="h-full rounded-full bg-white"
          style={{ width: `${shown ? v : 0}%`, transition: 'width 0.9s cubic-bezier(0.2,0.7,0.2,1)' }}
        />
      </div>
    </div>
  )
}

function Gauge({ value }: { value: number }) {
  const r = 30
  const c = 2 * Math.PI * r
  // Sweep the arc from 0 → value once mounted (skipped under reduced-motion).
  const [shown, setShown] = useState(document.documentElement.classList.contains('reduce-motion'))
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [])
  const off = c * (1 - (shown ? value : 0) / 100)
  return (
    <svg width="84" height="84" viewBox="0 0 76 76" className="drop-shadow">
      <circle cx="38" cy="38" r={r} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="8" />
      <circle
        cx="38" cy="38" r={r} fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 38 38)"
        style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.2,0.7,0.2,1)' }}
      />
      <text x="38" y="43" textAnchor="middle" fontSize="18" fontWeight="800" fill="#fff">{value}</text>
    </svg>
  )
}
