import { useEffect, useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconFood } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Nutrition Longevity Toolkit — six small real nutrition habit-trackers in
// one page: a Mediterranean-diet daily checklist, a sugar-free streak
// counter, an antioxidant color tracker, a weekly plant-diversity counter,
// a coffee-hydration adjuster, and an electrolyte estimate for longer fasts.
// Pure client-side state, localStorage-persisted, no external API.
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'mediterranean' | 'sugar' | 'antioxidant' | 'plants' | 'coffee' | 'electrolyte'

const MED_FOODS = ['Olive oil', 'Leafy greens', 'Whole grains', 'Legumes/beans', 'Nuts & seeds', 'Fatty fish', 'Fresh fruit', 'Tomatoes/vegetables', 'Herbs & garlic', 'Fermented dairy (yogurt/kefir)']
const MED_KEY = 'pmd_med_checklist_v1'
function MediterraneanChecklist() {
  const today = new Date().toISOString().slice(0, 10)
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    try { const s = JSON.parse(localStorage.getItem(MED_KEY) || '{}'); return s.day === today ? s.items : {} } catch { return {} }
  })
  useEffect(() => { try { localStorage.setItem(MED_KEY, JSON.stringify({ day: today, items: done })) } catch { /* ignore */ } }, [done, today])
  const count = Object.values(done).filter(Boolean).length
  return (
    <Card className="!p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-neutral-500">Check off what you ate today.</p>
        <Badge tone={count >= 6 ? 'brand' : 'low'}>{count}/{MED_FOODS.length}</Badge>
      </div>
      <div className="mt-3 space-y-1.5">
        {MED_FOODS.map((f) => (
          <label key={f} className="flex items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2 dark:bg-white/5">
            <input type="checkbox" checked={!!done[f]} onChange={(e) => setDone((d) => ({ ...d, [f]: e.target.checked }))} className="h-4 w-4 accent-brand" />
            <span className={`text-[13px] font-semibold ${done[f] ? 'text-neutral-400 line-through' : 'text-ink dark:text-white'}`}>{f}</span>
          </label>
        ))}
      </div>
    </Card>
  )
}

const SUGAR_KEY = 'pmd_sugar_streak_v1'
function SugarStreak() {
  const [start, setStart] = useState<number | null>(() => { const v = localStorage.getItem(SUGAR_KEY); return v ? Number(v) : null })
  const days = start ? Math.floor((Date.now() - start) / 86400000) : 0
  return (
    <Card className="!p-6 text-center">
      <p className="text-[13px] text-neutral-500">Days without refined/added sugar.</p>
      <div className="mt-3 text-5xl font-black text-brand-dark">{days}</div>
      <div className="text-[12px] text-neutral-500">day streak</div>
      <div className="mt-4 flex gap-2">
        {!start
          ? <button onClick={() => { const t = Date.now(); setStart(t); localStorage.setItem(SUGAR_KEY, String(t)) }} className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-bold text-white">Start streak</button>
          : <button onClick={() => { localStorage.removeItem(SUGAR_KEY); setStart(null) }} className="flex-1 rounded-xl bg-red-50 py-2.5 text-sm font-bold text-red-600 dark:bg-red-500/10 dark:text-red-300">Had sugar — reset</button>}
      </div>
    </Card>
  )
}

const COLORS = [
  { name: 'Red', emoji: '🔴', ex: 'tomato, strawberry, red pepper' },
  { name: 'Green', emoji: '🟢', ex: 'spinach, broccoli, kiwi' },
  { name: 'Purple/Blue', emoji: '🟣', ex: 'blueberry, eggplant, purple cabbage' },
  { name: 'Orange/Yellow', emoji: '🟠', ex: 'carrot, mango, sweet potato' },
]
const ANTIOX_KEY = 'pmd_antioxidant_v1'
function AntioxidantTracker() {
  const today = new Date().toISOString().slice(0, 10)
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    try { const s = JSON.parse(localStorage.getItem(ANTIOX_KEY) || '{}'); return s.day === today ? s.items : {} } catch { return {} }
  })
  useEffect(() => { try { localStorage.setItem(ANTIOX_KEY, JSON.stringify({ day: today, items: done })) } catch { /* ignore */ } }, [done, today])
  return (
    <Card className="!p-5">
      <p className="text-[13px] text-neutral-500">Different pigment colors mean different antioxidant compounds — aim for all four today.</p>
      <div className="mt-3 space-y-1.5">
        {COLORS.map((c) => (
          <label key={c.name} className="flex items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2 dark:bg-white/5">
            <input type="checkbox" checked={!!done[c.name]} onChange={(e) => setDone((d) => ({ ...d, [c.name]: e.target.checked }))} className="h-4 w-4 accent-brand" />
            <span className="text-lg">{c.emoji}</span>
            <div>
              <div className={`text-[13px] font-bold ${done[c.name] ? 'text-neutral-400 line-through' : 'text-ink dark:text-white'}`}>{c.name}</div>
              <div className="text-[11px] text-neutral-400">{c.ex}</div>
            </div>
          </label>
        ))}
      </div>
    </Card>
  )
}

const PLANTS_KEY = 'pmd_plant_diversity_v1'
function PlantDiversity() {
  const weekKey = useMemo(() => { const d = new Date(); const day = d.getDay(); d.setDate(d.getDate() - day); return d.toISOString().slice(0, 10) }, [])
  const [plants, setPlants] = useState<string[]>(() => {
    try { const s = JSON.parse(localStorage.getItem(PLANTS_KEY) || '{}'); return s.week === weekKey ? s.list : [] } catch { return [] }
  })
  const [text, setText] = useState('')
  useEffect(() => { try { localStorage.setItem(PLANTS_KEY, JSON.stringify({ week: weekKey, list: plants })) } catch { /* ignore */ } }, [plants, weekKey])
  const add = () => { if (!text.trim() || plants.includes(text.trim().toLowerCase())) { setText(''); return }; setPlants((p) => [...p, text.trim().toLowerCase()]); setText('') }
  return (
    <Card className="!p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-neutral-500">"Eat 30 different plants a week" — vegetables, fruit, whole grains, legumes, nuts, seeds, herbs and spices all count.</p>
        <Badge tone={plants.length >= 30 ? 'brand' : 'low'}>{plants.length}/30</Badge>
      </div>
      <div className="mt-3 flex gap-2">
        <input className="flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/10 dark:bg-white/5 dark:text-white" placeholder="e.g. lentils" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button onClick={add} className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white">Add</button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {plants.map((p) => <Badge key={p} tone="neutral">{p}</Badge>)}
        {plants.length === 0 && <p className="text-[12px] text-neutral-400">Nothing logged this week yet.</p>}
      </div>
    </Card>
  )
}

function CoffeeHydration() {
  const [cups, setCups] = useState(2)
  const extraMl = Math.round(cups * 150 * 1.5)
  return (
    <Card className="!p-5">
      <Field label="Cups of coffee today">
        <input className={inputClass} type="number" min={0} max={15} value={cups} onChange={(e) => setCups(Number(e.target.value) || 0)} />
      </Field>
      <div className="mt-3 rounded-xl bg-brand/10 p-4 text-center">
        <div className="text-2xl font-black text-brand-dark">+{extraMl} mL</div>
        <div className="text-[11px] text-neutral-500">Extra water suggested to offset caffeine's mild diuretic effect</div>
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-neutral-500">
        Coffee still contributes to daily fluid intake overall — this is a small top-up, not a
        1-for-1 replacement rule.
      </p>
    </Card>
  )
}

function ElectrolyteCalc() {
  const [hours, setHours] = useState(16)
  const sodium = Math.min(3000, Math.round(hours * 60))
  const potassium = Math.min(2500, Math.round(hours * 45))
  const magnesium = Math.min(350, Math.round(hours * 8))
  return (
    <Card className="!p-5">
      <Field label="Hours into your fast">
        <input className={inputClass} type="number" min={0} max={72} value={hours} onChange={(e) => setHours(Number(e.target.value) || 0)} />
      </Field>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-brand/10 p-2"><div className="text-lg font-black text-brand-dark">{sodium}mg</div><div className="text-[10px] text-neutral-500">Sodium</div></div>
        <div className="rounded-xl bg-brand/10 p-2"><div className="text-lg font-black text-brand-dark">{potassium}mg</div><div className="text-[10px] text-neutral-500">Potassium</div></div>
        <div className="rounded-xl bg-brand/10 p-2"><div className="text-lg font-black text-brand-dark">{magnesium}mg</div><div className="text-[10px] text-neutral-500">Magnesium</div></div>
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-neutral-500">
        Rough daily targets during longer fasts (beyond ~16h), when electrolyte loss without food intake
        can cause headaches/fatigue. Not medical advice — if you have kidney, heart, or blood pressure
        conditions, check with a clinician before fasting or supplementing electrolytes.
      </p>
    </Card>
  )
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'mediterranean', label: 'Mediterranean' },
  { id: 'sugar', label: 'Sugar Streak' },
  { id: 'antioxidant', label: 'Antioxidant Colors' },
  { id: 'plants', label: 'Plant Diversity' },
  { id: 'coffee', label: 'Coffee Hydration' },
  { id: 'electrolyte', label: 'Electrolytes' },
]

export function NutritionToolkit() {
  const [tab, setTab] = useState<Tab>('mediterranean')
  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconFood size={20} />} title="Nutrition Longevity Toolkit" subtitle="Six small daily nutrition habit-trackers in one place" />
        <div className="mt-3 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${tab === t.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{t.label}</button>
          ))}
        </div>
      </Card>

      {tab === 'mediterranean' && <MediterraneanChecklist />}
      {tab === 'sugar' && <SugarStreak />}
      {tab === 'antioxidant' && <AntioxidantTracker />}
      {tab === 'plants' && <PlantDiversity />}
      {tab === 'coffee' && <CoffeeHydration />}
      {tab === 'electrolyte' && <ElectrolyteCalc />}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Habit-tracking based on general nutrition-science patterns (Mediterranean diet, dietary
        diversity, polyphenol variety) — not personalized medical or dietetic advice.
      </div>
    </div>
  )
}

export default NutritionToolkit
