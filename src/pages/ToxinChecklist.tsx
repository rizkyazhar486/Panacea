import { useEffect, useMemo, useState } from 'react'
import { Card, SectionTitle, inputClass } from '../components/ui'
import { IconLeaf } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Environment & Toxin Checklist — a consolidated set of daily-life exposure
// checklists and reference guides (plastics, cleaning products, EMF, natural
// light, water quality, endocrine disruptors) that don't each warrant their
// own page. Pure static content + a couple of daily checkboxes, localStorage-
// persisted, no external API.
// ─────────────────────────────────────────────────────────────────────────────

const DAILY_HABITS = [
  { id: 'plastic', label: 'Used glass/stainless steel instead of plastic for food & drink' },
  { id: 'shoes', label: 'Left shoes at the door (keeps outdoor residues out of the home)' },
  { id: 'light', label: 'Spent 15+ minutes in natural daylight' },
  { id: 'dry-brush', label: 'Dry-brushed before showering (lymphatic support)' },
]
const HABIT_KEY = 'pmd_toxin_habits_v1'

const SWAPS = [
  { from: 'Bleach-based cleaners', to: 'White vinegar + baking soda for most surfaces' },
  { from: 'Air fresheners / scented candles', to: 'Ventilation + essential-oil diffuser (in moderation)' },
  { from: 'Non-stick (PTFE) pans at high heat', to: 'Stainless steel or cast iron' },
  { from: 'Plastic food storage in the microwave', to: 'Glass or ceramic containers' },
  { from: 'Fragranced fabric softener', to: 'Wool dryer balls or fragrance-free options' },
  { from: 'Antibacterial soap (triclosan)', to: 'Plain soap and water — equally effective for most home use' },
]

const EMF_TIPS = [
  'Keep the phone off the nightstand, or use airplane mode overnight',
  'Turn off Wi-Fi router at night if convenient (also supports better sleep hygiene)',
  "Use speaker/headphones instead of holding the phone to your head for long calls",
  'Keep laptops off your lap during extended use (also a comfort/heat issue)',
]

const MICROWAVE_TIPS = [
  'Use glass or ceramic marked "microwave safe" rather than generic plastic containers',
  'Avoid microwaving plastic wrap directly touching food — use a paper towel or vented lid instead',
  "Let food rest a moment after microwaving before eating — heat isn't always even",
]

const AIR_TIPS = [
  'Place air purifiers away from walls, at breathing height, in the room you spend the most time in',
  'Bedroom placement matters most — you spend 6-9 hours there',
  'Change/clean filters on the schedule the manufacturer recommends — a clogged filter does little',
  'Open windows briefly daily when outdoor air quality allows, to dilute indoor VOCs',
]

const DISRUPTORS = [
  { name: 'BPA', where: 'Some plastic food containers, can linings', note: 'Look for "BPA-free" labeling, though alternatives like BPS have similar concerns — reducing plastic contact overall matters more than any single chemical.' },
  { name: 'Phthalates', where: 'Fragranced products, some plastics, vinyl', note: 'Often hidden under "fragrance" on ingredient lists — fragrance-free options reduce exposure.' },
  { name: 'Parabens', where: 'Some cosmetics and personal care products', note: 'Look for "paraben-free" labeling on lotions, shampoos, and makeup.' },
  { name: 'Triclosan', where: 'Some antibacterial soaps and toothpaste', note: 'Plain soap and water is equally effective for routine handwashing.' },
  { name: 'PFAS ("forever chemicals")', where: 'Some non-stick cookware, water-resistant fabrics, fast-food packaging', note: 'Cast iron/stainless cookware and avoiding heavily-coated packaging reduces exposure.' },
]

function DailyHabits() {
  const today = new Date().toISOString().slice(0, 10)
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    try { const s = JSON.parse(localStorage.getItem(HABIT_KEY) || '{}'); return s.day === today ? s.items : {} } catch { return {} }
  })
  useEffect(() => { try { localStorage.setItem(HABIT_KEY, JSON.stringify({ day: today, items: done })) } catch { /* ignore */ } }, [done, today])
  return (
    <Card className="!p-5">
      <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Today's habits</div>
      <div className="mt-2 space-y-1.5">
        {DAILY_HABITS.map((h) => (
          <label key={h.id} className="flex items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2.5 dark:bg-white/5">
            <input type="checkbox" checked={!!done[h.id]} onChange={(e) => setDone((d) => ({ ...d, [h.id]: e.target.checked }))} className="h-4 w-4 accent-brand" />
            <span className={`text-[13px] font-semibold ${done[h.id] ? 'text-neutral-400 line-through' : 'text-ink dark:text-white'}`}>{h.label}</span>
          </label>
        ))}
      </div>
    </Card>
  )
}

export function ToxinChecklist() {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const filteredDisruptors = useMemo(() => DISRUPTORS.filter((d) => !q || (d.name + d.where + d.note).toLowerCase().includes(q)), [q])

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconLeaf size={20} />} title="Environment & Toxin Checklist" subtitle="Everyday exposure reduction, in one place" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          None of this is about fear — total avoidance of every trace exposure isn't realistic or
          necessary. These are the highest-leverage, lowest-effort swaps worth knowing about.
        </p>
      </Card>

      <DailyHabits />

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">🧴 Non-toxic cleaning swaps</div>
        <div className="mt-2 space-y-2">
          {SWAPS.map((s) => (
            <div key={s.from} className="rounded-xl bg-neutral-50 p-3 text-[13px] dark:bg-white/5">
              <span className="text-neutral-400 line-through">{s.from}</span> → <span className="font-bold text-brand-dark">{s.to}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">🔍 Search: endocrine disruptors</div>
        <input className={`${inputClass} mt-2`} placeholder="Search a chemical name…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="mt-3 space-y-2">
          {filteredDisruptors.map((d) => (
            <div key={d.name} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
              <div className="text-[13px] font-bold text-ink dark:text-white">{d.name}</div>
              <div className="text-[11px] text-neutral-400">Found in: {d.where}</div>
              <p className="mt-1 text-[12px] leading-relaxed text-neutral-500">{d.note}</p>
            </div>
          ))}
          {filteredDisruptors.length === 0 && <p className="text-center text-[12px] text-neutral-400">No match for "{query}".</p>}
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">📶 Reducing EMF exposure at night</div>
        <ul className="mt-2 list-inside list-disc space-y-1 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          {EMF_TIPS.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">🍽️ Microwave safety</div>
        <ul className="mt-2 list-inside list-disc space-y-1 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          {MICROWAVE_TIPS.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-400">💨 Air purifier placement</div>
        <ul className="mt-2 list-inside list-disc space-y-1 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          {AIR_TIPS.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        General household-exposure guidance, not a certified environmental health assessment. Water
        filtration needs vary by local water quality — check your municipal water report for
        what's actually in your specific supply.
      </div>
    </div>
  )
}

export default ToxinChecklist
