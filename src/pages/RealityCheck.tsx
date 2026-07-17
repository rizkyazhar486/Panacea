import { useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconActivity, IconChartUp, IconHeart } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Habit Reality Check — pure, shareable "wow" calculators that turn everyday
// habits into concrete numbers: what smoking really costs (money + time), how
// much sugar a favourite drink actually contains (in teaspoons), and where
// alcohol sits against low-risk guidelines. All client-side arithmetic, no
// personal data leaves the device. Designed to be screenshot-worthy.
// ─────────────────────────────────────────────────────────────────────────────

const rupiah = (n: number) => 'Rp' + Math.round(n).toLocaleString('id-ID')

// ── Smoking cost ─────────────────────────────────────────────────────────────
function SmokingCard() {
  const [perDay, setPerDay] = useState(12)
  const [pricePack, setPricePack] = useState(35000)
  const [perPack, setPerPack] = useState(20)
  const [years, setYears] = useState(10)

  const d = useMemo(() => {
    const costPerDay = (perDay / perPack) * pricePack
    const costYear = costPerDay * 365
    const costTotal = costYear * years
    // ~11 minutes of life per cigarette (widely cited estimate).
    const minutesLost = perDay * 11 * 365 * years
    const daysLost = minutesLost / 60 / 24
    // What the money could buy (illustrative, Indonesia-ish price points).
    const baliTrips = costTotal / 4_000_000
    const iphones = costTotal / 18_000_000
    return { costPerDay, costYear, costTotal, daysLost, baliTrips, iphones }
  }, [perDay, pricePack, perPack, years])

  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconActivity size={20} />} title="🚬 Smoking, in real numbers" subtitle="What a daily habit costs in money and time" />
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Cigarettes / day"><input className={inputClass} type="number" value={perDay || ''} onChange={(e) => setPerDay(+e.target.value)} /></Field>
        <Field label="Price / pack"><input className={inputClass} type="number" value={pricePack || ''} onChange={(e) => setPricePack(+e.target.value)} /></Field>
        <Field label="Cigs / pack"><input className={inputClass} type="number" value={perPack || ''} onChange={(e) => setPerPack(+e.target.value)} /></Field>
        <Field label="Over (years)"><input className={inputClass} type="number" value={years || ''} onChange={(e) => setYears(+e.target.value)} /></Field>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-rose-50 p-3 text-center dark:bg-rose-500/10">
          <div className="text-[10px] font-bold uppercase text-neutral-400">Total spent</div>
          <div className="text-xl font-black text-rose-600">{rupiah(d.costTotal)}</div>
        </div>
        <div className="rounded-xl bg-rose-50 p-3 text-center dark:bg-rose-500/10">
          <div className="text-[10px] font-bold uppercase text-neutral-400">Est. life lost</div>
          <div className="text-xl font-black text-rose-600">{Math.round(d.daysLost)} days</div>
        </div>
        <div className="rounded-xl bg-brand-50 p-3 text-center dark:bg-white/5">
          <div className="text-[10px] font-bold uppercase text-neutral-400">Per year</div>
          <div className="text-xl font-black text-brand-dark">{rupiah(d.costYear)}</div>
        </div>
      </div>
      <p className="mt-3 rounded-xl bg-neutral-50 p-3 text-[12px] leading-relaxed text-neutral-600 dark:bg-white/5 dark:text-neutral-300">
        That money could instead be ≈ <b>{d.baliTrips.toFixed(1)} trips to Bali</b> or <b>{d.iphones.toFixed(1)} new phones</b>. The life-lost figure uses the widely-cited ~11 minutes per cigarette estimate — quitting starts reversing risk within weeks.
      </p>
    </Card>
  )
}

// ── Sugar visualizer ─────────────────────────────────────────────────────────
const DRINKS = [
  { name: 'Sweet iced tea (500ml)', g: 45 },
  { name: 'Cola (330ml can)', g: 35 },
  { name: 'Bubble tea (large)', g: 60 },
  { name: 'Bottled orange juice (300ml)', g: 30 },
  { name: 'Energy drink (250ml)', g: 27 },
  { name: 'Café caramel latte (grande)', g: 44 },
  { name: 'Custom', g: 0 },
]
const TSP_G = 4 // ~4 g sugar per teaspoon
const WHO_FREE_SUGAR_G = 25 // WHO ideal daily free-sugar limit (~6 tsp)

function SugarCard() {
  const [sel, setSel] = useState(0)
  const [custom, setCustom] = useState(40)
  const grams = DRINKS[sel].name === 'Custom' ? custom : DRINKS[sel].g
  const tsp = grams / TSP_G
  const pctWho = (grams / WHO_FREE_SUGAR_G) * 100
  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconChartUp size={20} />} title="🥤 Sugar shock" subtitle="How much sugar your drink really has — in teaspoons" />
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Drink">
          <select className={inputClass} value={sel} onChange={(e) => setSel(+e.target.value)}>
            {DRINKS.map((dr, i) => <option key={dr.name} value={i}>{dr.name}</option>)}
          </select>
        </Field>
        {DRINKS[sel].name === 'Custom' && (
          <Field label="Sugar (grams)"><input className={inputClass} type="number" value={custom || ''} onChange={(e) => setCustom(+e.target.value)} /></Field>
        )}
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="text-center">
          <div className="text-4xl font-black text-amber-600">{tsp.toFixed(1)}</div>
          <div className="text-[10px] font-bold uppercase text-neutral-400">teaspoons</div>
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap gap-0.5 text-2xl leading-none">
            {Array.from({ length: Math.min(30, Math.round(tsp)) }).map((_, i) => <span key={i}>🥄</span>)}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[10px] font-bold uppercase text-neutral-400">
          <span>vs WHO daily ideal ({WHO_FREE_SUGAR_G}g)</span><span>{Math.round(pctWho)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, pctWho)}%`, background: pctWho > 100 ? '#ef4444' : pctWho > 60 ? '#f59e0b' : '#00BF63' }} />
        </div>
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400">
        {grams} g of sugar = {tsp.toFixed(1)} teaspoons. The WHO's ideal free-sugar limit is about 25 g (≈6 tsp) for a whole day — one sweet drink can blow past it.
      </p>
    </Card>
  )
}

// ── Alcohol ──────────────────────────────────────────────────────────────────
// A "standard drink" ≈ 10 g pure alcohol (WHO). Low-risk guidance ≈ ≤14
// standard drinks/week and alcohol-free days.
function AlcoholCard() {
  const [drinksWeek, setDrinksWeek] = useState(6)
  const unitsYear = drinksWeek * 52
  const gramsYear = unitsYear * 10
  const overGuideline = drinksWeek > 14
  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconHeart size={20} />} title="🍺 Alcohol check" subtitle="Where your weekly intake sits vs low-risk guidance" />
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label="Standard drinks / week"><input className={inputClass} type="number" value={drinksWeek || ''} onChange={(e) => setDrinksWeek(+e.target.value)} /></Field>
        <div className="flex items-end"><Badge tone={overGuideline ? 'critical' : drinksWeek > 7 ? 'low' : 'brand'}>{overGuideline ? 'Above low-risk' : drinksWeek > 7 ? 'Moderate' : 'Low-risk range'}</Badge></div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-neutral-50 p-3 text-center dark:bg-white/5">
          <div className="text-[10px] font-bold uppercase text-neutral-400">Drinks / year</div>
          <div className="text-xl font-black text-ink dark:text-white">{unitsYear}</div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center dark:bg-white/5">
          <div className="text-[10px] font-bold uppercase text-neutral-400">Pure alcohol / year</div>
          <div className="text-xl font-black text-ink dark:text-white">{(gramsYear / 1000).toFixed(1)} kg</div>
        </div>
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400">
        A standard drink ≈ 10 g pure alcohol. Common low-risk guidance is ≤14 standard drinks/week with alcohol-free days — and current evidence finds no amount is truly "health-promoting." Less is better.
      </p>
    </Card>
  )
}

export function RealityCheck() {
  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconChartUp size={20} />} title="Habit Reality Check" subtitle="Turn everyday habits into concrete numbers — money, teaspoons, and time" />
        <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          Small daily habits add up in ways that are easy to underestimate. These quick calculators make the real cost visible. Everything is computed on your device — nothing is stored or sent anywhere.
        </p>
      </Card>
      <SmokingCard />
      <SugarCard />
      <AlcoholCard />
      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Educational estimates using standard public-health figures (WHO sugar & alcohol guidance, the widely-cited ~11-minutes-per-cigarette estimate). Not medical advice. For help quitting smoking or alcohol, talk to a clinician — support genuinely works.
      </div>
    </div>
  )
}

export default RealityCheck
