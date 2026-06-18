import { useState } from 'react'
import { useStore, uid } from '../lib/store'
import { Card, SectionTitle, Button, Field, inputClass, Badge } from '../components/ui'
import { IconFood, IconPlus } from '../components/icons'
import { FOODS } from '../lib/foods'

const today = () => new Date().toISOString().slice(0, 10)

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
