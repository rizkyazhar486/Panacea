import { useEffect, useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconHeart, IconActivity, IconChartUp } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Anti-Aging & Organ Function — quantitative/QC/safety layer for longevity.
// Distinct from Longevity (composite score/decades) and Body Composition
// (BMI/InBody). Here: per-organ biomarker panels with reference RANGES and a
// safety band (green in-range / amber borderline / red act-now), quantified
// SKIN aging metrics, and AESTHETIC body-composition targets with a safety
// floor (how lean is healthy, how fast to change). Manual, offline.
// ─────────────────────────────────────────────────────────────────────────────

type Band = 'ok' | 'warn' | 'bad' | 'na'
interface Marker {
  id: string; label: string; unit: string
  lo: number; hi: number          // healthy reference range
  warnLo?: number; warnHi?: number // borderline edges (outside = red)
  note: string
}
interface Panel { id: string; emoji: string; organ: string; blurb: string; markers: Marker[] }

// Reference ranges are general adult guidance for education — NOT diagnosis.
const PANELS: Panel[] = [
  {
    id: 'metabolic', emoji: '🩸', organ: 'Metabolic & Pancreas', blurb: 'Blood sugar & insulin control — the fastest driver of aging (glycation).',
    markers: [
      { id: 'glucose', label: 'Fasting blood glucose', unit: 'mg/dL', lo: 70, hi: 99, warnLo: 60, warnHi: 125, note: '100-125 prediabetes · ≥126 diabetes' },
      { id: 'hba1c', label: 'HbA1c', unit: '%', lo: 4.0, hi: 5.6, warnHi: 6.4, note: '5.7-6.4 prediabetes · ≥6.5 diabetes' },
      { id: 'trig', label: 'Triglycerides', unit: 'mg/dL', lo: 40, hi: 149, warnHi: 199, note: 'marker of insulin sensitivity' },
    ],
  },
  {
    id: 'cardio', emoji: '❤️', organ: 'Heart & Vessels', blurb: 'Atherosclerosis begins silently from a young age.',
    markers: [
      { id: 'ldl', label: 'LDL cholesterol', unit: 'mg/dL', lo: 40, hi: 99, warnHi: 159, note: '<100 optimal · ≥160 high' },
      { id: 'hdl', label: 'HDL cholesterol', unit: 'mg/dL', lo: 50, hi: 90, warnLo: 40, note: 'higher is more protective' },
      { id: 'sbp', label: 'Systolic blood pressure', unit: 'mmHg', lo: 90, hi: 119, warnHi: 139, note: '120-129 elevated · ≥140 hypertension' },
      { id: 'crp', label: 'hsCRP (inflammation)', unit: 'mg/L', lo: 0, hi: 1, warnHi: 3, note: '<1 low · >3 high cardiovascular risk' },
    ],
  },
  {
    id: 'liver', emoji: '🫗', organ: 'Liver', blurb: 'Detoxification & metabolism; fatty liver is increasingly common.',
    markers: [
      { id: 'alt', label: 'ALT (SGPT)', unit: 'U/L', lo: 7, hi: 40, warnHi: 55, note: 'elevated = stress/fatty liver' },
      { id: 'ast', label: 'AST (SGOT)', unit: 'U/L', lo: 8, hi: 40, warnHi: 55, note: '' },
      { id: 'ggt', label: 'GGT', unit: 'U/L', lo: 8, hi: 48, warnHi: 70, note: 'sensitive to alcohol & fatty liver' },
    ],
  },
  {
    id: 'kidney', emoji: '🫘', organ: 'Kidneys', blurb: 'Filtration function declines gradually with age.',
    markers: [
      { id: 'creat', label: 'Creatinine', unit: 'mg/dL', lo: 0.6, hi: 1.2, warnHi: 1.4, note: 'elevated = reduced filtration' },
      { id: 'egfr', label: 'eGFR', unit: 'mL/min', lo: 90, hi: 120, warnLo: 60, note: '<60 (3 mo) = chronic kidney disease' },
      { id: 'uricacid', label: 'Uric acid', unit: 'mg/dL', lo: 3.5, hi: 7.0, warnHi: 8.0, note: 'high → gout & cardiovascular risk' },
    ],
  },
  {
    id: 'hormone', emoji: '⚗️', organ: 'Hormones & Thyroid', blurb: 'Regulates metabolism, muscle, mood, libido.',
    markers: [
      { id: 'tsh', label: 'TSH (thyroid)', unit: 'mIU/L', lo: 0.4, hi: 4.0, warnHi: 6, note: 'high = hypothyroid' },
      { id: 'vitd', label: 'Vitamin D (25-OH)', unit: 'ng/mL', lo: 30, hi: 60, warnLo: 20, note: '<20 deficiency (immunity, bone, mood)' },
      { id: 'ferritin', label: 'Ferritin (iron stores)', unit: 'ng/mL', lo: 30, hi: 300, warnLo: 15, note: 'low = anemia/fatigue' },
    ],
  },
  {
    id: 'blood', emoji: '🔬', organ: 'Blood & Immunity', blurb: 'Oxygenation & the body\'s defenses.',
    markers: [
      { id: 'hb', label: 'Hemoglobin', unit: 'g/dL', lo: 13, hi: 17, warnLo: 11, note: 'low = anemia (♀ 12-15)' },
      { id: 'wbc', label: 'White blood cells', unit: '10³/µL', lo: 4, hi: 11, warnHi: 13, note: 'high = infection/inflammation' },
    ],
  },
]

function bandOf(m: Marker, v: number): Band {
  if (!v) return 'na'
  if (v >= m.lo && v <= m.hi) return 'ok'
  const wLo = m.warnLo ?? m.lo, wHi = m.warnHi ?? m.hi
  if (v >= wLo && v <= wHi) return 'warn'
  return 'bad'
}
const BAND_COLOR: Record<Band, string> = { ok: '#00BF63', warn: '#f59e0b', bad: '#ef4444', na: '#d4d4d4' }
const BAND_LABEL: Record<Band, string> = { ok: 'Normal', warn: 'Borderline', bad: 'Needs attention', na: '—' }

// Range bar showing where the value sits across [display min..max].
function MarkerBar({ m, v }: { m: Marker; v: number }) {
  const band = bandOf(m, v)
  const dispMin = Math.min(m.warnLo ?? m.lo, m.lo) * 0.6
  const dispMax = Math.max(m.warnHi ?? m.hi, m.hi) * 1.25
  const pct = (x: number) => Math.max(0, Math.min(100, ((x - dispMin) / (dispMax - dispMin)) * 100))
  return (
    <div className="rounded-xl border border-neutral-100 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-bold">{m.label}</span>
        <span className="text-sm font-extrabold" style={{ color: BAND_COLOR[band] }}>
          {v || '—'}<span className="ml-0.5 text-[10px] font-medium text-neutral-400">{m.unit}</span>
        </span>
      </div>
      <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
        <div className="absolute inset-y-0 rounded-full bg-emerald-200" style={{ left: `${pct(m.lo)}%`, width: `${pct(m.hi) - pct(m.lo)}%` }} />
        {v > 0 && <div className="absolute top-1/2 h-3.5 w-1 -translate-y-1/2 rounded-full" style={{ left: `${pct(v)}%`, background: BAND_COLOR[band] }} />}
      </div>
      <div className="mt-1 flex justify-between text-[9px] text-neutral-400">
        <span>Normal {m.lo}-{m.hi} {m.unit}</span>
        <span className="font-bold" style={{ color: BAND_COLOR[band] }}>{BAND_LABEL[band]}</span>
      </div>
      {m.note && <div className="mt-0.5 text-[9px] text-neutral-400">{m.note}</div>}
    </div>
  )
}

// ── Skin aging (quantified) ──────────────────────────────────────────────────
interface SkinData { spfDays: number; hydrationGlasses: number; sleepH: number; smoke: boolean; sugarHigh: boolean; retinoid: boolean; antioxidant: boolean; type: number }
const SKIN_DEF: SkinData = { spfDays: 3, hydrationGlasses: 6, sleepH: 7, smoke: false, sugarHigh: false, retinoid: false, antioxidant: false, type: 3 }
function skinScore(s: SkinData): number {
  let sc = 40
  sc += (s.spfDays / 7) * 22       // UV = ~80% of extrinsic aging
  sc += Math.min(1, s.hydrationGlasses / 8) * 8
  sc += Math.max(0, 1 - Math.abs(s.sleepH - 7.75) / 3) * 10
  if (s.retinoid) sc += 8
  if (s.antioxidant) sc += 6
  if (s.smoke) sc -= 18
  if (s.sugarHigh) sc -= 8         // glycation → collagen cross-linking
  return Math.round(Math.max(5, Math.min(100, sc)))
}

// ── Aesthetic body-composition targets WITH a safety floor ───────────────────
function aestheticBodyFat(g: 'M' | 'F') {
  return g === 'M'
    ? { essential: 3, athletic: [6, 13], fit: [14, 17], healthy: [18, 24], floor: 5 }
    : { essential: 12, athletic: [14, 20], fit: [21, 24], healthy: [25, 31], floor: 12 }
}

export function OrganVitality() {
  const [tab, setTab] = useState<'organ' | 'kulit' | 'estetika'>('organ')
  const [labs, setLabs] = useState<Record<string, number>>(() => { try { return JSON.parse(localStorage.getItem('pmd_organ_labs') || '{}') } catch { return {} } })
  useEffect(() => { try { localStorage.setItem('pmd_organ_labs', JSON.stringify(labs)) } catch { /* ignore */ } }, [labs])

  const [skin, setSkin] = useState<SkinData>(() => { try { return { ...SKIN_DEF, ...JSON.parse(localStorage.getItem('pmd_skin') || '{}') } } catch { return SKIN_DEF } })
  useEffect(() => { try { localStorage.setItem('pmd_skin', JSON.stringify(skin)) } catch { /* ignore */ } }, [skin])

  // Aesthetic tab pulls from Komposisi Tubuh if present.
  const bc = useMemo(() => { try { return JSON.parse(localStorage.getItem('pm_bodycomp_v1') || '{}') } catch { return {} } }, [])
  const g: 'M' | 'F' = bc.g === 'F' ? 'F' : 'M'
  const [pbf, setPbf] = useState<number>(bc.bfm && bc.w ? +((bc.bfm / bc.w) * 100).toFixed(1) : 20)

  // Overall organ-panel summary.
  const allMarkers = PANELS.flatMap((p) => p.markers)
  const filled = allMarkers.filter((m) => labs[m.id] > 0)
  const flags = filled.map((m) => bandOf(m, labs[m.id]))
  const bad = flags.filter((f) => f === 'bad').length
  const warn = flags.filter((f) => f === 'warn').length

  const sScore = skinScore(skin)
  const skinBioAge = Math.round((100 - sScore) * 0.25) // extra "skin years" heuristic
  const bf = aestheticBodyFat(g)
  const pbfBand: Band = pbf < bf.floor ? 'bad' : pbf <= bf.fit[1] ? 'ok' : pbf <= bf.healthy[1] ? 'warn' : 'bad'

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Anti-Aging & Organ Function" subtitle="The numbers, safe ranges & quality control behind healthy aging — not just wellness" />
        <div className="mt-3 flex gap-1.5">
          {([['organ', '🫀 Organ Panel'], ['kulit', '✨ Skin'], ['estetika', '💪 Safe Aesthetics']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={'flex-1 rounded-xl py-2 text-xs font-bold transition ' + (tab === k ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500')}>{l}</button>
          ))}
        </div>
        {tab === 'organ' && filled.length > 0 && (
          <div className="mt-3 flex items-center justify-around rounded-2xl bg-neutral-50 p-3 text-center">
            <div><div className="text-xl font-extrabold text-brand-dark">{filled.length}</div><div className="text-[9px] uppercase text-neutral-400">filled</div></div>
            <div><div className="text-xl font-extrabold text-amber-600">{warn}</div><div className="text-[9px] uppercase text-neutral-400">borderline</div></div>
            <div><div className="text-xl font-extrabold text-rose-500">{bad}</div><div className="text-[9px] uppercase text-neutral-400">needs attention</div></div>
          </div>
        )}
      </Card>

      {/* ORGAN PANELS */}
      {tab === 'organ' && (
        <>
          {PANELS.map((p) => (
            <Card key={p.id} className="!p-5">
              <SectionTitle icon={<span className="text-lg">{p.emoji}</span>} title={p.organ} subtitle={p.blurb} />
              <div className="mt-2 grid grid-cols-2 gap-2">
                {p.markers.map((m) => (
                  <Field key={m.id} label={`${m.label} (${m.unit})`}>
                    <input className={inputClass} type="number" step="any" value={labs[m.id] || ''} placeholder={`${m.lo}-${m.hi}`}
                      onChange={(e) => setLabs((l) => ({ ...l, [m.id]: +e.target.value }))} />
                  </Field>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {p.markers.filter((m) => labs[m.id] > 0).map((m) => <MarkerBar key={m.id} m={m} v={labs[m.id]} />)}
              </div>
            </Card>
          ))}
          <div className="rounded-2xl bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800">
            ⚠️ <b>Quality control & safety:</b> the ranges above are general adult educational guidance — different labs have their own reference ranges, and values must be interpreted alongside symptoms & history. A <b>red</b> value means discuss it with a doctor, don't self-diagnose. The <a href="#/chatbot" className="font-bold underline">AI Consultation</a> feature helps you prepare questions for your doctor.
          </div>
        </>
      )}

      {/* SKIN */}
      {tab === 'kulit' && (
        <Card className="!p-5">
          <SectionTitle icon={<span className="text-lg">✨</span>} title="Skin Aging (Quantified)" subtitle="UV ≈ 80% of extrinsic skin aging — measurable & preventable" />
          <div className="mt-2 flex items-center justify-around rounded-2xl bg-ink p-4 text-white">
            <div className="text-center">
              <div className="text-4xl font-extrabold" style={{ color: sScore >= 75 ? '#00BF63' : sScore >= 50 ? '#f59e0b' : '#ef4444' }}>{sScore}</div>
              <div className="text-[9px] uppercase tracking-widest text-white/50">Skin Score</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-amber-300">+{skinBioAge}</div>
              <div className="text-[9px] uppercase tracking-widest text-white/50">Estimated extra "skin age"</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <Field label="SPF days/week"><input className={inputClass} type="number" max={7} value={skin.spfDays} onChange={(e) => setSkin((s) => ({ ...s, spfDays: +e.target.value }))} /></Field>
            <Field label="Glasses of water/day"><input className={inputClass} type="number" value={skin.hydrationGlasses} onChange={(e) => setSkin((s) => ({ ...s, hydrationGlasses: +e.target.value }))} /></Field>
            <Field label="Sleep (hours)"><input className={inputClass} type="number" step={0.1} value={skin.sleepH} onChange={(e) => setSkin((s) => ({ ...s, sleepH: +e.target.value }))} /></Field>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {([['retinoid', '🧴 Regular retinoid', false], ['antioxidant', '🍊 Antioxidant/Vit C', false], ['smoke', '🚬 Smoking', true], ['sugarHigh', '🍰 High sugar (glycation)', true]] as const).map(([k, l, bad]) => (
              <button key={k} onClick={() => setSkin((s) => ({ ...s, [k]: !s[k] }))}
                className={'rounded-full px-3 py-1.5 text-[11px] font-bold ' + (skin[k] ? (bad ? 'bg-rose-500 text-white' : 'bg-brand text-white') : 'bg-neutral-100 text-neutral-500')}>{l}</button>
            ))}
          </div>
          <ul className="mt-3 space-y-1 text-[11px] leading-relaxed text-neutral-500">
            <li>• <b>Daily SPF</b> is the most proven skin anti-aging intervention (prevents photoaging & skin cancer).</li>
            <li>• <b>Glycation</b>: high blood sugar binds to collagen (AGEs) → stiff, dull skin — so blood sugar control is skincare.</li>
            <li>• <b>Sleep & hydration</b>: collagen repair happens during deep sleep; dehydration accentuates fine lines.</li>
            <li>• <b>Smoking</b>: constricts skin's microvessels, dramatically accelerating wrinkles.</li>
          </ul>
        </Card>
      )}

      {/* AESTHETIC + SAFETY */}
      {tab === 'estetika' && (
        <Card className="!p-5">
          <SectionTitle icon={<IconActivity size={20} />} title="Body Composition Aesthetics — with a Safety Floor" subtitle="Optimal shape without sacrificing hormones, immunity & organs" />
          <div className="mt-2 grid grid-cols-2 gap-3">
            <Field label="Sex">
              <select className={inputClass} value={g} disabled><option>{g === 'M' ? 'Male' : 'Female'}</option></select>
            </Field>
            <Field label="% Body fat"><input className={inputClass} type="number" step={0.1} value={pbf} onChange={(e) => setPbf(+e.target.value)} /></Field>
          </div>
          <div className="mt-3 rounded-2xl p-3 text-center" style={{ background: `${BAND_COLOR[pbfBand]}14`, border: `1px solid ${BAND_COLOR[pbfBand]}30` }}>
            <div className="text-sm font-extrabold" style={{ color: BAND_COLOR[pbfBand] }}>
              {pbf < bf.floor ? '⚠️ Below safe floor' : pbf <= bf.fit[1] ? 'Athletic/fit zone' : pbf <= bf.healthy[1] ? 'Healthy' : 'Above healthy range'}
            </div>
            <p className="mt-1 text-[11px] text-neutral-500">
              {pbf < bf.floor
                ? `Below ${bf.floor}% (${g === 'F' ? 'female' : 'male'}) disrupts hormones${g === 'F' ? ' & the menstrual cycle' : ' (testosterone drops)'}, immunity, & body temperature regulation. Extreme "shredded" aesthetics aren't sustainable.`
                : 'Appearance targets that stay within a range that protects hormone & immune function.'}
            </p>
          </div>
          <div className="mt-3 space-y-1.5 text-[11px] text-neutral-600">
            <div className="flex justify-between rounded-lg bg-neutral-50 px-3 py-1.5"><span>Essential (minimum physiological floor)</span><b>{bf.essential}%</b></div>
            <div className="flex justify-between rounded-lg bg-neutral-50 px-3 py-1.5"><span>Athletic</span><b>{bf.athletic[0]}-{bf.athletic[1]}%</b></div>
            <div className="flex justify-between rounded-lg bg-neutral-50 px-3 py-1.5"><span>Fit / visible definition</span><b>{bf.fit[0]}-{bf.fit[1]}%</b></div>
            <div className="flex justify-between rounded-lg bg-neutral-50 px-3 py-1.5"><span>Healthy</span><b>{bf.healthy[0]}-{bf.healthy[1]}%</b></div>
          </div>
          <div className="mt-3 rounded-xl border border-neutral-100 p-3 text-[11px] leading-relaxed text-neutral-500">
            <b className="text-ink">Safe rate of change (quality control):</b> a deficit/surplus of ≤0.5-1% of body weight per week.
            Cutting faster = muscle loss & adaptive metabolism; bulking faster = excess fat gain.
            Keep protein ≥1.6 g/kg + resistance training so what you lose is fat, not muscle.
            Track execution in <a href="#/body" className="font-bold text-brand-dark underline">Body Composition</a> & <a href="#/training-plan" className="font-bold text-brand-dark underline">AI Program</a>.
          </div>
        </Card>
      )}

      <div className="rounded-2xl border border-brand/20 bg-brand-50 p-4 text-center text-[11px] leading-relaxed text-brand-dark">
        This is the <b>clinical-quantitative</b> layer of longevity: the <a href="#/longevity" className="font-bold underline">Longevity Hub</a> scores & projects decades,
        this page breaks down the <b>organ numbers, skin & safe aesthetics</b>. All values are educational — not a diagnosis. Data is stored on your device.
      </div>
    </div>
  )
}

export default OrganVitality
