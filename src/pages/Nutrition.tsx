import { useMemo, useState } from 'react'
import { useStore, uid } from '../lib/store'
import { Card, SectionTitle, Button, Field, inputClass, Badge } from '../components/ui'
import { IconFood, IconPlus, IconRun, IconDrop, IconFlame } from '../components/icons'
import { FOODS } from '../lib/foods'

const today = () => new Date().toISOString().slice(0, 10)

export function Nutrition() {
  const { state, activePatient, addFood } = useStore()
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

      <ActivityLifestyle intakeKcal={total.kcal} defaultWeight={activePatient?.weightKg ?? 65} />

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

// -- Detailed activity & lifestyle calorie calculator -----------------------
// MET (Metabolic Equivalent) values; kcal = MET × weightKg × hours.
type Intensity = 'Ringan' | 'Sedang' | 'Berat'
const ACTIVITY_MET: { name: string; met: number; intensity: Intensity }[] = [
  { name: 'Menyapu / pekerjaan rumah', met: 3.3, intensity: 'Ringan' },
  { name: 'Jalan kaki santai', met: 3.0, intensity: 'Ringan' },
  { name: 'Yoga / peregangan', met: 2.5, intensity: 'Ringan' },
  { name: 'Jalan cepat', met: 4.3, intensity: 'Sedang' },
  { name: 'Bersepeda santai', met: 6.0, intensity: 'Sedang' },
  { name: 'Berkebun', met: 4.0, intensity: 'Sedang' },
  { name: 'Angkat beban (gym)', met: 5.0, intensity: 'Sedang' },
  { name: 'Berenang', met: 8.0, intensity: 'Berat' },
  { name: 'Lari', met: 9.8, intensity: 'Berat' },
  { name: 'Futsal / sepak bola', met: 9.0, intensity: 'Berat' },
  { name: 'HIIT / olahraga khusus', met: 10.0, intensity: 'Berat' },
]
const SUGARY_KCAL = 90 // avg kcal per sugary drink serving

interface ActLog { id: string; name: string; minutes: number; kcal: number; intensity: Intensity }
const intensityTone: Record<Intensity, 'normal' | 'low' | 'high'> = { Ringan: 'normal', Sedang: 'low', Berat: 'high' }

function ActivityLifestyle({ intakeKcal, defaultWeight }: { intakeKcal: number; defaultWeight: number }) {
  const [weight, setWeight] = useState(defaultWeight)
  const [actName, setActName] = useState(ACTIVITY_MET[0].name)
  const [minutes, setMinutes] = useState(30)
  const [logs, setLogs] = useState<ActLog[]>([])
  const [waterMl, setWaterMl] = useState(0)
  const [sugary, setSugary] = useState(0)
  const [screenHr, setScreenHr] = useState(0)

  const burned = useMemo(() => logs.reduce((a, l) => a + l.kcal, 0), [logs])
  const sugaryKcal = sugary * SUGARY_KCAL
  const net = intakeKcal + sugaryKcal - burned
  const waterTarget = 2000
  const waterPct = Math.min(100, Math.round((waterMl / waterTarget) * 100))

  function addActivity() {
    const a = ACTIVITY_MET.find((x) => x.name === actName)!
    const kcal = Math.round(a.met * weight * (minutes / 60))
    setLogs((l) => [{ id: uid(), name: a.name, minutes, kcal, intensity: a.intensity }, ...l])
  }

  return (
    <Card>
      <SectionTitle
        icon={<IconRun size={20} />}
        title="Kalkulator Aktivitas & Gaya Hidup"
        subtitle="Hitung kalori terbakar dari aktivitas (ringan–berat) serta pantau air minum, minuman manis & screen time"
      />

      {/* summary */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Asupan</div>
          <div className="text-2xl font-extrabold text-amber-600">{intakeKcal + sugaryKcal}</div>
          <div className="text-[10px] text-neutral-400">kkal masuk</div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Terbakar</div>
          <div className="text-2xl font-extrabold text-brand">{burned}</div>
          <div className="text-[10px] text-neutral-400">kkal aktivitas</div>
        </div>
        <div className="rounded-xl bg-brand-50 p-3 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-dark">Saldo Net</div>
          <div className={`text-2xl font-extrabold ${net > 0 ? 'text-accent' : 'text-brand-dark'}`}>{net > 0 ? '+' : ''}{net}</div>
          <div className="text-[10px] text-neutral-500">{net > 0 ? 'surplus' : 'defisit'} kkal</div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Air Putih</div>
          <div className="text-2xl font-extrabold text-blue-500">{(waterMl / 1000).toFixed(1)}L</div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-blue-500" style={{ width: `${waterPct}%` }} />
          </div>
        </div>
      </div>

      {/* activity input */}
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="w-24">
          <Field label="Berat (kg)">
            <input className={inputClass} type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
          </Field>
        </div>
        <div className="w-56">
          <Field label="Aktivitas">
            <select className={inputClass} value={actName} onChange={(e) => setActName(e.target.value)}>
              {ACTIVITY_MET.map((a) => (
                <option key={a.name}>{a.name}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="w-28">
          <Field label="Durasi (menit)">
            <input className={inputClass} type="number" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
          </Field>
        </div>
        <Button onClick={addActivity}><IconFlame size={16} /> Hitung & Catat</Button>
      </div>
      <div className="mt-3 space-y-2">
        {logs.length === 0 && <p className="text-sm text-neutral-400">Belum ada aktivitas tercatat hari ini.</p>}
        {logs.map((l) => (
          <div key={l.id} className="flex items-center justify-between rounded-xl border border-neutral-100 px-3 py-2 text-sm">
            <span className="flex items-center gap-2 font-medium">
              {l.name} <Badge tone={intensityTone[l.intensity]}>{l.intensity}</Badge>
              <span className="text-neutral-400">· {l.minutes} mnt</span>
            </span>
            <span className="font-bold text-brand">−{l.kcal} kkal</span>
          </div>
        ))}
      </div>

      {/* lifestyle trackers */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Tracker
          icon={<IconDrop size={18} className="text-blue-500" />}
          label="Air Minum"
          value={`${waterMl} ml`}
          hint={waterMl >= waterTarget ? 'Target tercapai 👍' : `Sisa ${waterTarget - waterMl} ml`}
          onMinus={() => setWaterMl((w) => Math.max(0, w - 250))}
          onPlus={() => setWaterMl((w) => w + 250)}
          step="+250ml"
        />
        <Tracker
          icon={<IconFlame size={18} className="text-accent" />}
          label="Minuman Manis"
          value={`${sugary} gelas`}
          hint={sugary === 0 ? 'Bagus, tanpa gula tambahan' : `≈ ${sugaryKcal} kkal gula`}
          onMinus={() => setSugary((s) => Math.max(0, s - 1))}
          onPlus={() => setSugary((s) => s + 1)}
          step="+1"
        />
        <Tracker
          icon={<IconRun size={18} className="text-neutral-500" />}
          label="Screen Time"
          value={`${screenHr} jam`}
          hint={screenHr > 6 ? 'Tinggi — selingi gerak & istirahat mata' : 'Dalam batas wajar'}
          onMinus={() => setScreenHr((s) => Math.max(0, s - 1))}
          onPlus={() => setScreenHr((s) => s + 1)}
          step="+1 jam"
        />
      </div>
    </Card>
  )
}

function Tracker({
  icon, label, value, hint, onMinus, onPlus, step,
}: {
  icon: React.ReactNode; label: string; value: string; hint: string; onMinus: () => void; onPlus: () => void; step: string
}) {
  return (
    <div className="rounded-xl border border-neutral-100 p-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">{icon} {label}</div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xl font-extrabold">{value}</span>
        <div className="flex items-center gap-1.5">
          <button onClick={onMinus} className="grid h-7 w-7 place-items-center rounded-lg bg-neutral-100 font-bold">−</button>
          <button onClick={onPlus} className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-xs font-bold text-brand-dark">{step}</button>
        </div>
      </div>
      <p className="mt-1 text-[11px] text-neutral-500">{hint}</p>
    </div>
  )
}
