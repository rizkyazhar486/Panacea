import { useEffect, useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconStethoscope } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Data Lab Advanced — seven small real local-data-processing tools in one
// page: a blood-panel linear-regression trend forecaster, a glucose-
// variability calculator (CGM-style), the published PhenoAge biological-age
// formula, an omega-6:3 ratio calculator, a Shannon Diversity Index on your
// tracked plants (reuses Nutrition Toolkit's weekly plant list), a
// multi-supplement pharmacokinetic curve, and a client-side AES-GCM
// encrypted journal vault. Pure client-side math + Web Crypto API, no
// external API, no data ever leaves the browser.
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'blood-trend' | 'glucose' | 'phenoage' | 'omega' | 'microbiome' | 'supplements' | 'vault'

function linreg(xs: number[], ys: number[]): { slope: number; intercept: number } {
  const n = xs.length
  const sumX = xs.reduce((a, b) => a + b, 0), sumY = ys.reduce((a, b) => a + b, 0)
  const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0)
  const sumX2 = xs.reduce((a, x) => a + x * x, 0)
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  return { slope, intercept }
}

function BloodTrendForecaster() {
  const [values, setValues] = useState(['90', '92', '95', '', ''])
  const points = values.map((v, i) => ({ year: i, val: Number(v) })).filter((p) => p.val > 0 && values[p.year] !== '')
  const reg = points.length >= 2 ? linreg(points.map((p) => p.year), points.map((p) => p.val)) : null
  const projected = reg ? Array.from({ length: 5 }, (_, i) => Math.round((reg.slope * (values.length + i) + reg.intercept) * 10) / 10) : []

  return (
    <Card className="!p-5">
      <p className="text-[13px] text-neutral-500">Enter your last few years of a biomarker (e.g. fasting glucose, mg/dL) — a linear regression projects the trend forward 5 years if nothing changes.</p>
      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {values.map((v, i) => (
          <Field key={i} label={`Yr ${i + 1}`}>
            <input className={inputClass} type="number" value={v} onChange={(e) => setValues((vs) => vs.map((x, j) => (j === i ? e.target.value : x)))} />
          </Field>
        ))}
      </div>
      {reg && (
        <div className="mt-3 rounded-xl bg-brand/10 p-3">
          <div className="text-[12px] font-bold text-neutral-500">Projected next 5 years</div>
          <div className="mt-1 flex flex-wrap gap-2">
            {projected.map((p, i) => <Badge key={i} tone={reg.slope > 0 ? 'low' : 'brand'}>Yr+{i + 1}: {p}</Badge>)}
          </div>
          <p className="mt-2 text-[11px] text-neutral-500">Trend: {reg.slope > 0 ? '+' : ''}{(reg.slope).toFixed(2)}/year — a simple straight-line projection, not a physiological model; real biomarkers rarely move perfectly linearly.</p>
        </div>
      )}
    </Card>
  )
}

function GlucoseVariability() {
  const [text, setText] = useState('')
  const values = useMemo(() => text.split(/[,\s]+/).map(Number).filter((n) => !isNaN(n) && n > 0), [text])
  const stats = useMemo(() => {
    if (values.length < 3) return null
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
    const sd = Math.sqrt(variance)
    const cv = (sd / mean) * 100
    return { mean: Math.round(mean), sd: Math.round(sd * 10) / 10, cv: Math.round(cv * 10) / 10, n: values.length }
  }, [values])
  return (
    <Card className="!p-5">
      <p className="text-[13px] text-neutral-500">Paste a series of glucose readings (from a CGM export, comma or space separated, mg/dL) to calculate glucose variability.</p>
      <textarea className={`${inputClass} mt-2 min-h-24`} placeholder="90, 105, 88, 140, 95, 102…" value={text} onChange={(e) => setText(e.target.value)} />
      {stats && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-brand/10 p-3"><div className="text-lg font-black text-brand-dark">{stats.mean}</div><div className="text-[10px] text-neutral-500">Mean (mg/dL)</div></div>
          <div className="rounded-xl bg-brand/10 p-3"><div className="text-lg font-black text-brand-dark">{stats.sd}</div><div className="text-[10px] text-neutral-500">SD</div></div>
          <div className="rounded-xl bg-brand/10 p-3">
            <div className="text-lg font-black text-brand-dark">{stats.cv}%</div>
            <div className="text-[10px] text-neutral-500">CV</div>
            <Badge tone={stats.cv < 36 ? 'brand' : 'low'}>{stats.cv < 36 ? 'Typical' : 'High variability'}</Badge>
          </div>
        </div>
      )}
      <p className="mt-2 text-[11px] text-neutral-400">Coefficient of variation (CV) &lt;36% is the commonly-cited threshold for "stable" glucose in CGM research (Monnier et al.) — not a diagnostic cutoff.</p>
    </Card>
  )
}

function PhenoAgeCalc() {
  const [f, setF] = useState({ albumin: 45, creatinine: 80, glucose: 5.0, crp: 1, lymphPct: 30, mcv: 90, rdw: 13, alkPhos: 70, wbc: 6, age: 35 })
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: Number(e.target.value) || 0 }))

  const phenoAge = useMemo(() => {
    const xb = -19.907 - 0.0336 * f.albumin + 0.0095 * f.creatinine + 0.1953 * f.glucose
      + 0.0954 * Math.log(Math.max(f.crp, 0.01)) - 0.0120 * f.lymphPct + 0.0268 * f.mcv
      + 0.3306 * f.rdw + 0.00188 * f.alkPhos + 0.0554 * f.wbc - 0.0804 * f.age
    const M = 1 - Math.exp(-Math.exp(xb) * (Math.exp(0.0076927 * 120) - 1) / 0.0076927)
    const clampedM = Math.min(0.9999, Math.max(0.0001, M))
    const age = 141.50225 + Math.log(-0.00553 * Math.log(1 - clampedM)) / 0.09165
    return Math.round(age * 10) / 10
  }, [f])

  return (
    <Card className="!p-5">
      <p className="text-[13px] text-neutral-500">The published PhenoAge formula (Levine et al. 2018) from 9 standard blood markers + chronological age. Enter values from a recent panel (defaults shown are roughly typical/healthy).</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Field label="Albumin (g/L)"><input className={inputClass} type="number" value={f.albumin} onChange={set('albumin')} /></Field>
        <Field label="Creatinine (µmol/L)"><input className={inputClass} type="number" value={f.creatinine} onChange={set('creatinine')} /></Field>
        <Field label="Glucose (mmol/L)"><input className={inputClass} type="number" step="0.1" value={f.glucose} onChange={set('glucose')} /></Field>
        <Field label="CRP (mg/L)"><input className={inputClass} type="number" step="0.1" value={f.crp} onChange={set('crp')} /></Field>
        <Field label="Lymphocyte %"><input className={inputClass} type="number" value={f.lymphPct} onChange={set('lymphPct')} /></Field>
        <Field label="MCV (fL)"><input className={inputClass} type="number" value={f.mcv} onChange={set('mcv')} /></Field>
        <Field label="RDW (%)"><input className={inputClass} type="number" step="0.1" value={f.rdw} onChange={set('rdw')} /></Field>
        <Field label="Alk. Phosphatase (U/L)"><input className={inputClass} type="number" value={f.alkPhos} onChange={set('alkPhos')} /></Field>
        <Field label="WBC (1000/µL)"><input className={inputClass} type="number" step="0.1" value={f.wbc} onChange={set('wbc')} /></Field>
        <Field label="Chronological age"><input className={inputClass} type="number" value={f.age} onChange={set('age')} /></Field>
      </div>
      <div className="mt-3 rounded-xl bg-brand/10 p-4 text-center">
        <div className="text-3xl font-black text-brand-dark">{phenoAge}</div>
        <div className="text-[11px] text-neutral-500">PhenoAge (vs. chronological age {f.age})</div>
      </div>
      <p className="mt-2 text-[11px] text-neutral-400">Levine ME et al., Aging (Albany NY) 2018 — "An epigenetic biomarker of aging for lifespan and healthspan." Our best-effort implementation of the published coefficients; not a substitute for validated clinical labs, and worth cross-checking against another PhenoAge calculator.</p>
    </Card>
  )
}

function OmegaRatio() {
  const [o6, setO6] = useState(12000)
  const [o3, setO3] = useState(1500)
  const ratio = o6 / Math.max(o3, 1)
  const band = ratio <= 4 ? ['Favorable', 'brand'] : ratio <= 10 ? ['Moderate', 'low'] : ['High (pro-inflammatory tilt)', 'critical']
  return (
    <Card className="!p-5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Omega-6 intake (mg/day, est.)"><input className={inputClass} type="number" value={o6} onChange={(e) => setO6(Number(e.target.value) || 0)} /></Field>
        <Field label="Omega-3 intake (mg/day, est.)"><input className={inputClass} type="number" value={o3} onChange={(e) => setO3(Number(e.target.value) || 0)} /></Field>
      </div>
      <div className="mt-3 rounded-xl bg-brand/10 p-4 text-center">
        <div className="text-2xl font-black text-brand-dark">{ratio.toFixed(1)} : 1</div>
        <Badge tone={band[1] as 'brand' | 'low' | 'critical'}>{band[0]}</Badge>
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
        Western diets often run 15:1-20:1 omega-6:3; ancestral/traditional diets are estimated closer to
        1:1-4:1. Lower ratios are theorized to favor a less pro-inflammatory eicosanoid balance — an
        active research area, not a settled clinical target.
      </p>
    </Card>
  )
}

const PLANTS_KEY = 'pmd_plant_diversity_v1'
function MicrobiomeDiversity() {
  const [plants, setPlants] = useState<string[]>([])
  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem(PLANTS_KEY) || '{}'); setPlants(s.list || []) } catch { /* ignore */ }
  }, [])
  // Shannon Diversity Index treating each unique plant as equally weighted
  // (we don't track quantity eaten) — H = -sum(p_i * ln(p_i)), p_i = 1/n each.
  const shannon = useMemo(() => {
    const n = plants.length
    if (n === 0) return 0
    const p = 1 / n
    return -(n * (p * Math.log(p)))
  }, [plants])
  const maxShannon = plants.length > 0 ? Math.log(plants.length) : 0

  return (
    <Card className="!p-5">
      <p className="text-[13px] text-neutral-500">Pulls from your Plant Diversity list in the Nutrition Longevity Toolkit this week and calculates a real Shannon Diversity Index (a standard ecological evenness/richness metric, applied here to your diet).</p>
      <div className="mt-3 rounded-xl bg-brand/10 p-4 text-center">
        <div className="text-2xl font-black text-brand-dark">{shannon.toFixed(2)}</div>
        <div className="text-[11px] text-neutral-500">Shannon Index · {plants.length} unique plants logged this week</div>
      </div>
      {plants.length === 0 && <p className="mt-2 text-center text-[12px] text-neutral-400">Nothing logged yet — add plants in the Nutrition Longevity Toolkit's "Plant Diversity" tab first.</p>}
      <p className="mt-2 text-[11px] text-neutral-400">Higher richness (more unique plants) drives a higher index — a proxy some microbiome researchers use for dietary fiber/polyphenol diversity, not a direct measurement of your actual gut microbiome (which requires stool sequencing).</p>
    </Card>
  )
}

interface Supp { name: string; doseMg: number; timeHour: number; halfLifeH: number; stimulant: boolean }
function SupplementCombiner() {
  const [supps, setSupps] = useState<Supp[]>([{ name: 'Caffeine', doseMg: 200, timeHour: 8, halfLifeH: 5, stimulant: true }])
  const [name, setName] = useState('')
  const [dose, setDose] = useState(100)
  const [time, setTime] = useState(8)
  const [halfLife, setHalfLife] = useState(5)
  const [stimulant, setStimulant] = useState(false)

  const add = () => { if (!name.trim()) return; setSupps((s) => [...s, { name: name.trim(), doseMg: dose, timeHour: time, halfLifeH: halfLife, stimulant }]); setName('') }
  const remove = (i: number) => setSupps((s) => s.filter((_, x) => x !== i))

  const curve = useMemo(() => {
    return Array.from({ length: 25 }, (_, h) => {
      let total = 0
      for (const s of supps) {
        if (h < s.timeHour) continue
        const elapsed = h - s.timeHour
        total += s.doseMg * Math.pow(0.5, elapsed / s.halfLifeH)
      }
      return total
    })
  }, [supps])
  const maxVal = Math.max(...curve, 1)
  const stimulantHours = supps.filter((s) => s.stimulant).map((s) => s.timeHour)
  const overlapWarning = stimulantHours.length >= 2 && Math.max(...stimulantHours) - Math.min(...stimulantHours) < 6

  return (
    <Card className="!p-5">
      <p className="text-[13px] text-neutral-500">Model each supplement/medication's approximate blood-concentration curve over 24h using its dose and half-life.</p>
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        <input className={inputClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputClass} type="number" placeholder="mg" value={dose} onChange={(e) => setDose(Number(e.target.value) || 0)} />
        <input className={inputClass} type="number" placeholder="hr taken" value={time} onChange={(e) => setTime(Number(e.target.value) || 0)} />
        <input className={inputClass} type="number" placeholder="half-life h" value={halfLife} onChange={(e) => setHalfLife(Number(e.target.value) || 1)} />
      </div>
      <label className="mt-1.5 flex items-center gap-2 text-[12px] text-neutral-500">
        <input type="checkbox" checked={stimulant} onChange={(e) => setStimulant(e.target.checked)} className="h-4 w-4 accent-brand" /> This is a stimulant
      </label>
      <button onClick={add} className="mt-2 w-full rounded-xl bg-brand py-2 text-sm font-bold text-white">Add</button>

      <svg viewBox="0 0 300 100" className="mt-4 w-full">
        <polyline fill="none" stroke="#00BF63" strokeWidth="2" points={curve.map((v, h) => `${h * 12},${100 - (v / maxVal) * 90}`).join(' ')} />
      </svg>
      <p className="text-center text-[11px] text-neutral-400">24-hour combined concentration curve (relative units)</p>

      {overlapWarning && <div className="mt-2 rounded-xl bg-amber-50 p-3 text-[12px] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">⚠️ Multiple stimulants taken within 6 hours of each other — overlapping peaks may compound effects.</div>}

      <div className="mt-3 space-y-1.5">
        {supps.map((s, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 text-[12px] dark:bg-white/5">
            <span>{s.name} · {s.doseMg}mg @ hr{s.timeHour} · t½{s.halfLifeH}h {s.stimulant && '⚡'}</span>
            <button onClick={() => remove(i)} className="text-red-500">✕</button>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-neutral-400">A simplified single-compartment exponential-decay model — real pharmacokinetics involve absorption phases, metabolism (CYP450), and individual variation this doesn't capture. Not medical advice; check real interactions with a pharmacist.</p>
    </Card>
  )
}

const VAULT_KEY = 'pmd_encrypted_vault_v1'
async function deriveKey(passphrase: string, salt: BufferSource): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}
function buf2b64(buf: ArrayBufferLike): string { return btoa(String.fromCharCode(...new Uint8Array(buf))) }
function b642buf(b64: string): ArrayBuffer { return new Uint8Array([...atob(b64)].map((c) => c.charCodeAt(0))).buffer as ArrayBuffer }

function EncryptedVault() {
  const [passphrase, setPassphrase] = useState('')
  const [text, setText] = useState('')
  const [status, setStatus] = useState('')
  const [decrypted, setDecrypted] = useState<string | null>(null)

  const encrypt = async () => {
    if (!passphrase || !text.trim()) { setStatus('Enter a passphrase and some text.'); return }
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const key = await deriveKey(passphrase, salt)
    const enc = new TextEncoder()
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text))
    const payload = { salt: buf2b64(salt.buffer), iv: buf2b64(iv.buffer), data: buf2b64(cipher) }
    try { localStorage.setItem(VAULT_KEY, JSON.stringify(payload)) } catch { /* ignore */ }
    setStatus('Encrypted and saved locally.')
    setText(''); setDecrypted(null)
  }

  const decrypt = async () => {
    setStatus(''); setDecrypted(null)
    try {
      const raw = localStorage.getItem(VAULT_KEY)
      if (!raw) { setStatus('Nothing saved yet.'); return }
      const payload = JSON.parse(raw)
      const salt = b642buf(payload.salt), iv = b642buf(payload.iv), data = b642buf(payload.data)
      const key = await deriveKey(passphrase, salt)
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
      setDecrypted(new TextDecoder().decode(plain))
    } catch {
      setStatus('Wrong passphrase, or no valid entry saved.')
    }
  }

  return (
    <Card className="!p-5">
      <p className="text-[13px] text-neutral-500">A real AES-256-GCM encrypted note, key-derived from your passphrase via PBKDF2 (Web Crypto API) — the plaintext is never stored, only the ciphertext. <b>There is no password recovery</b> — if you forget the passphrase, the entry is unrecoverable, by design.</p>
      <Field label="Passphrase"><input className={`${inputClass} mt-1`} type="password" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} /></Field>
      <Field label="Note to encrypt"><textarea className={`${inputClass} mt-1 min-h-20`} value={text} onChange={(e) => setText(e.target.value)} /></Field>
      <div className="mt-2 flex gap-2">
        <button onClick={encrypt} className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-bold text-white">Encrypt & save</button>
        <button onClick={decrypt} className="flex-1 rounded-xl bg-neutral-100 py-2.5 text-sm font-bold text-neutral-600 dark:bg-white/10">Decrypt saved</button>
      </div>
      {status && <p className="mt-2 text-[12px] text-neutral-500">{status}</p>}
      {decrypted !== null && <div className="mt-2 rounded-xl bg-brand/10 p-3 text-[13px] whitespace-pre-wrap">{decrypted}</div>}
    </Card>
  )
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'blood-trend', label: 'Blood Panel Forecaster' },
  { id: 'glucose', label: 'Glucose Variability' },
  { id: 'phenoage', label: 'PhenoAge' },
  { id: 'omega', label: 'Omega-6:3 Ratio' },
  { id: 'microbiome', label: 'Microbiome Diversity' },
  { id: 'supplements', label: 'Supplement Curves' },
  { id: 'vault', label: 'Encrypted Vault' },
]

export function DataLabAdvanced() {
  const [tab, setTab] = useState<Tab>('blood-trend')
  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconStethoscope size={20} />} title="Data Lab Advanced" subtitle="Seven real local data-processing tools — nothing leaves your browser" />
        <div className="mt-3 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${tab === t.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{t.label}</button>
          ))}
        </div>
      </Card>

      {tab === 'blood-trend' && <BloodTrendForecaster />}
      {tab === 'glucose' && <GlucoseVariability />}
      {tab === 'phenoage' && <PhenoAgeCalc />}
      {tab === 'omega' && <OmegaRatio />}
      {tab === 'microbiome' && <MicrobiomeDiversity />}
      {tab === 'supplements' && <SupplementCombiner />}
      {tab === 'vault' && <EncryptedVault />}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        All computation happens locally in your browser — no file, blood value, or note here is ever
        sent to a server. Educational tools, not diagnostic or medical devices.
      </div>
    </div>
  )
}

export default DataLabAdvanced
