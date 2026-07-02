import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Badge } from '../components/ui'
import { IconActivity, IconGauge, IconHeart, IconRun, IconTimer, IconChartUp } from '../components/icons'
import { useStore } from '../lib/store'

// ─────────────────────────────────────────────────────────────────────────────
// Lab Performa — data-driven calculators for the full strength/endurance/speed
// battery requested: RPE, thresholds (AT/MLSS/LT/VT/OBLA/RCP/CP/HHb/VLaMax),
// power (1RM/PPO/W-kg/TMW/FTP/MMP), speed/agility (MSS/ASR/accel/stride/
// reaction/Illinois/bleep), respiratory & environment (VE/VCO2/breathing/heat/
// hydration/altitude), load management (TSS/MAP/Karvonen/rep-max), and economy
// & durability. Every value is entered manually (from a watch, lab test, or
// field test) — this runs entirely offline, values persist per-metric in
// localStorage so nothing is lost between visits.
// ─────────────────────────────────────────────────────────────────────────────

type Tone = 'brand' | 'low' | 'critical' | 'neutral' | 'normal' | 'high'

function useMetricState(id: string, defaults: Record<string, number>) {
  const key = 'pm_lab_' + id
  const [vals, setVals] = useState<Record<string, number>>(() => {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(key) || '{}') } } catch { return defaults }
  })
  const set = (k: string, v: number) => setVals((old) => {
    const n = { ...old, [k]: v }
    try { localStorage.setItem(key, JSON.stringify(n)) } catch { /* ignore */ }
    return n
  })
  return [vals, set] as const
}

interface Inp { key: string; label: string; unit?: string; default?: number }
function MetricCard({ id, name, emoji, inputs, compute, unit, note, interpret }: {
  id: string; name: string; emoji: string; inputs: Inp[]
  compute: (v: Record<string, number>) => number | string
  unit?: string; note: string
  interpret?: (result: number | string, v: Record<string, number>) => { label: string; tone: Tone } | null
}) {
  const defaults = Object.fromEntries(inputs.map((i) => [i.key, i.default ?? 0]))
  const [vals, set] = useMetricState(id, defaults)
  const result = compute(vals)
  const interp = interpret ? interpret(result, vals) : null
  const display = typeof result === 'number' ? (Number.isFinite(result) ? result.toFixed(result % 1 === 0 ? 0 : 1) : '—') : result
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-extrabold">{emoji} {name}</div>
        {interp && <Badge tone={interp.tone}>{interp.label}</Badge>}
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {inputs.map((inp) => (
          <Field key={inp.key} label={inp.label + (inp.unit ? ` (${inp.unit})` : '')}>
            <input className={inputClass} type="number" step="any" value={vals[inp.key] || ''} placeholder="0"
              onChange={(e) => set(inp.key, +e.target.value)} />
          </Field>
        ))}
      </div>
      <div className="mt-2.5 rounded-xl bg-neutral-50 p-3">
        <div className="text-xl font-extrabold text-brand-dark">{display}<span className="ml-1 text-xs font-medium text-neutral-400">{unit}</span></div>
        <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">{note}</p>
      </div>
    </div>
  )
}

const TABS = [
  'Ambang & Metabolik', 'Kekuatan & Power', 'Kecepatan & Kelincahan', 'Tes Lapangan',
  'Respirasi & Lingkungan', 'Beban & Manajemen', 'Ekonomi & Ketahanan',
] as const
type Tab = typeof TABS[number]

export function PerformanceLab() {
  const [tab, setTab] = useState<Tab>('Ambang & Metabolik')
  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconGauge size={20} />} title="Lab Performa" subtitle="Baterai lengkap tes & kalkulator kekuatan, daya tahan & kecepatan — berbasis manual/lab" />
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
          Isi dari jam, alat lab (laktat, NIRS, power meter) atau tes lapangan. Semua tersimpan offline di perangkat Anda.
          Sebelum memulai program berat, selesaikan dulu <a href="#/assessment" className="font-bold text-brand-dark underline">Penilaian Awal</a> (pola gerak, nyeri, risiko cedera, asimetri).
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={'rounded-full px-3 py-1.5 text-[11px] font-bold transition ' + (tab === t ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500')}>{t}</button>
          ))}
        </div>
      </Card>

      {tab === 'Ambang & Metabolik' && <ThresholdTab />}
      {tab === 'Kekuatan & Power' && <PowerTab />}
      {tab === 'Kecepatan & Kelincahan' && <SpeedTab />}
      {tab === 'Tes Lapangan' && <FieldTestTab />}
      {tab === 'Respirasi & Lingkungan' && <RespiratoryTab />}
      {tab === 'Beban & Manajemen' && <LoadTab />}
      {tab === 'Ekonomi & Ketahanan' && <EconomyTab />}
    </div>
  )
}

/* ══════════════════ 1. AMBANG & METABOLIK ══════════════════ */
function ThresholdTab() {
  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconHeart size={20} />} title="Ambang & Metabolik" subtitle="RPE, AT, MLSS, LT/VT, OBLA, RCP, Critical Power, HHb, VLaMax" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <RpeCard />
        <MetricCard id="at" name="Ambang Anaerobik (AT)" emoji="⚡" unit="bpm"
          inputs={[{ key: 'hrmax', label: 'HRmax', default: 190 }]}
          compute={(v) => v.hrmax * 0.88}
          note="Estimasi HR di ambang anaerobik ≈ 85-90% HRmax (Meyer 2005). Titik lactate mulai naik tajam di atas baseline."
        />
        <MetricCard id="mlss" name="MLSS (Max Lactate Steady State)" emoji="🩸" unit="W/pace"
          inputs={[{ key: 'ftp', label: 'FTP / Power ambang', default: 200 }]}
          compute={(v) => v.ftp * 0.95}
          note="MLSS — intensitas tertinggi dengan laktat stabil (tidak terus naik). Umumnya ~95% dari FTP/power ambang."
        />
        <MetricCard id="rcp" name="Respiratory Compensation Point (RCP)" emoji="🫁" unit="bpm"
          inputs={[{ key: 'hrmax', label: 'HRmax', default: 190 }]}
          compute={(v) => v.hrmax * 0.92}
          note="RCP ≈ 90-95% HRmax — titik ventilasi naik tajam melebihi VCO2, biasanya berdekatan dengan LT2/VT2."
        />
        <MetricCard id="cp" name="Critical Power (2-titik)" emoji="🔋" unit="W"
          inputs={[{ key: 'p1', label: 'Power tes 1', unit: 'W', default: 320 }, { key: 't1', label: 'Waktu tes 1', unit: 'dtk', default: 180 },
            { key: 'p2', label: 'Power tes 2', unit: 'W', default: 250 }, { key: 't2', label: 'Waktu tes 2', unit: 'dtk', default: 720 }]}
          compute={(v) => { const cp = (v.p1 * v.t1 - v.p2 * v.t2) / (v.t1 - v.t2); return Number.isFinite(cp) ? cp : 0 }}
          note="Model 2-titik Monod-Scherrer: CP = (P1×t1 − P2×t2)/(t1−t2). W' (kapasitas anaerobik) = (P1−CP)×t1."
        />
        <VtLtCard />
        <MetricCard id="tte" name="Time to Exhaustion (TTE)" emoji="⏳" unit="menit"
          inputs={[{ key: 'p', label: 'Power target', unit: 'W', default: 280 }, { key: 'cp', label: 'Critical Power', unit: 'W', default: 250 }, { key: 'wprime', label: "W' kapasitas", unit: 'kJ', default: 20 }]}
          compute={(v) => v.p > v.cp ? (v.wprime * 1000) / (v.p - v.cp) / 60 : Infinity}
          note="TTE = W'/(P−CP). Prediksi berapa lama Anda bisa bertahan di atas Critical Power sebelum kelelahan."
        />
        <MetricCard id="hhb" name="HHb Breakpoint (manual dari NIRS)" emoji="🩻" unit="W/pace"
          inputs={[{ key: 'val', label: 'Power/pace saat breakpoint', default: 0 }]}
          compute={(v) => v.val}
          note="Titik deoksihemoglobin otot mulai naik tajam (dari alat NIRS lab) — biasanya berdekatan dengan RCP/VT2. Masukkan hasil tes lab Anda."
        />
        <MetricCard id="obla" name="OBLA (Onset Blood Lactate, 4mmol)" emoji="🧪" unit="W/pace"
          inputs={[{ key: 'val', label: 'Power/pace saat laktat 4mmol', default: 0 }]}
          compute={(v) => v.val}
          note="Referensi tetap 4 mmol/L laktat darah (protokol multi-stage + sampel darah). Masukkan hasil tes lab Anda."
        />
        <MetricCard id="vlamax" name="VLaMax (Daya Glikolitik)" emoji="🔥" unit="mmol/L/dtk"
          inputs={[{ key: 'larest', label: 'Laktat istirahat', unit: 'mmol', default: 1 }, { key: 'lapeak', label: 'Laktat puncak', unit: 'mmol', default: 8 }, { key: 'sprint', label: 'Durasi sprint', unit: 'dtk', default: 15 }]}
          compute={(v) => (v.lapeak - v.larest) / v.sprint}
          note="Estimasi sederhana dari sprint maksimal ~15 detik. VLaMax tinggi = dominan glikolitik (sprinter); rendah = dominan aerobik (endurance). Protokol lab penuh (mis. INSCYD) lebih presisi."
        />
        <LactateRecoveryCard />
      </div>
      <MetabolicMapCard />
    </Card>
  )
}

function RpeCard() {
  const [rpe, setRpe] = useState(5)
  const [dur, setDur] = useState(45)
  const load = rpe * dur
  const BORG = ['', 'Sangat sangat ringan', 'Sangat ringan', 'Ringan', 'Agak ringan', 'Sedang', 'Agak berat', 'Berat', 'Sangat berat', 'Sangat sangat berat', 'Maksimal']
  return (
    <div className="rounded-2xl border border-neutral-100 p-4 sm:col-span-2">
      <div className="text-sm font-extrabold">😤 RPE (Borg CR-10) & Training Load</div>
      <div className="mt-2 flex items-center gap-3">
        <input type="range" min={1} max={10} value={rpe} onChange={(e) => setRpe(+e.target.value)} className="flex-1" />
        <span className="w-10 text-center text-lg font-extrabold text-brand-dark">{rpe}</span>
      </div>
      <div className="mt-1 text-[11px] text-neutral-500">{BORG[rpe]}</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="Durasi (menit)"><input className={inputClass} type="number" value={dur} onChange={(e) => setDur(+e.target.value)} /></Field>
        <div className="rounded-xl bg-neutral-50 p-2.5">
          <div className="text-[9px] font-bold uppercase text-neutral-400">Training Load (sRPE)</div>
          <div className="text-lg font-extrabold text-brand-dark">{load}</div>
        </div>
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">Metode Foster: Beban = RPE × durasi. Basis Acute:Chronic Workload Ratio di halaman Atlet.</p>
    </div>
  )
}

function VtLtCard() {
  const [vo2, setVo2] = useState(41)
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">🌬️ Ventilatory & Lactate Threshold</div>
      <Field label="VO₂max (ml/kg/mnt)"><input className={inputClass} type="number" value={vo2} onChange={(e) => setVo2(+e.target.value)} /></Field>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">VT1/LT1</div><div className="text-base font-extrabold text-brand-dark">{(vo2 * 0.6).toFixed(1)}</div></div>
        <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">VT2/LT2</div><div className="text-base font-extrabold text-brand-dark">{(vo2 * 0.85).toFixed(1)}</div></div>
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">VT1/LT1 ≈ 55-65% VO₂max (mulai laktat naik ringan). VT2/LT2 ≈ 80-90% VO₂max (ambang anaerobik/RCP). Model dua-ambang Skinner & McLellan.</p>
    </div>
  )
}

function LactateRecoveryCard() {
  const [peak, setPeak] = useState(8)
  const [active, setActive] = useState(true)
  const [min, setMin] = useState(15)
  const halfLife = active ? 15 : 25
  const remaining = peak * Math.pow(0.5, min / halfLife)
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">📉 Akumulasi & Pemulihan Laktat</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="Laktat puncak (mmol)"><input className={inputClass} type="number" value={peak} onChange={(e) => setPeak(+e.target.value)} /></Field>
        <Field label="Menit setelah puncak"><input className={inputClass} type="number" value={min} onChange={(e) => setMin(+e.target.value)} /></Field>
      </div>
      <div className="mt-2 flex gap-1.5">
        <button onClick={() => setActive(true)} className={'flex-1 rounded-xl py-1.5 text-[11px] font-bold ' + (active ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500')}>Pemulihan Aktif</button>
        <button onClick={() => setActive(false)} className={'flex-1 rounded-xl py-1.5 text-[11px] font-bold ' + (!active ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500')}>Pemulihan Pasif</button>
      </div>
      <div className="mt-2 rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">Estimasi Laktat Tersisa</div><div className="text-lg font-extrabold text-brand-dark">{remaining.toFixed(1)} mmol</div></div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">Waktu paruh laktat ≈15 menit (pemulihan aktif/jogging ringan) vs ≈25 menit (pasif/diam). Model peluruhan eksponensial.</p>
    </div>
  )
}

// Illustrative fat/CHO oxidation & lactate curve across zones — mirrors the
// classic "Metabolic Map" shape (fat peaks mid-intensity, then shuts off;
// lactate rises steeply near threshold).
function MetabolicMapCard() {
  const zones = [1, 2, 3, 4, 5, 6]
  const pts = zones.map((z) => {
    const hrPct = 45 + z * 9 // Z1≈54% .. Z6≈99%
    const fat = Math.max(0, 70 - Math.abs(hrPct - 58) * 1.7)
    const cho = 100 - fat
    const lac = 0.8 + Math.pow(hrPct / 100, 6) * 9
    return { z, hrPct, fat, cho, lac }
  })
  const W = 320, H = 140, pad = 24
  const x = (i: number) => pad + (i / (zones.length - 1)) * (W - pad * 2)
  const yPct = (v: number) => H - pad - (v / 100) * (H - pad * 2)
  const yLac = (v: number) => H - pad - (v / 10) * (H - pad * 2)
  const path = (get: (p: typeof pts[number]) => number) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${get(p).toFixed(1)}`).join(' ')
  return (
    <div className="mt-3 rounded-2xl bg-ink p-4 text-white">
      <div className="text-sm font-extrabold">🗺️ The Metabolic Map — Respons Terhadap Latihan</div>
      <p className="text-[10px] text-white/50">Ilustrasi oksidasi lemak/karbohidrat & laktat per zona (bukan hasil tes langsung Anda)</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full">
        <path d={path((p) => yPct(p.fat))} fill="none" stroke="#f59e0b" strokeWidth="2" />
        <path d={path((p) => yPct(p.cho))} fill="none" stroke="#ef4444" strokeWidth="2" />
        <path d={path((p) => yLac(p.lac))} fill="none" stroke="#38bdf8" strokeWidth="2" />
        {pts.map((p, i) => <text key={p.z} x={x(i)} y={H - 6} fontSize="8" fill="rgba(255,255,255,0.5)" textAnchor="middle">Z{p.z}</text>)}
      </svg>
      <div className="mt-1 flex flex-wrap gap-3 text-[10px]">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />Oksidasi Lemak %</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />Oksidasi Karbo %</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-400" />Laktat (mmol)</span>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-white/70">Puncak "Fat Max" biasa di Z2 (±60% HRmax) — kunci latihan basis untuk lemak sebagai bahan bakar. Di atas Z4, pembakaran lemak nyaris berhenti ("No Fat Burning") dan tubuh beralih total ke karbohidrat + laktat menumpuk cepat.</p>
    </div>
  )
}

/* ══════════════════ 2. KEKUATAN & POWER ══════════════════ */
function PowerTab() {
  const [ex, setEx] = useState('Back Squat')
  const [w, setW] = useState(60)
  const [reps, setReps] = useState(5)
  const epley = w * (1 + reps / 30)
  const brzycki = reps < 37 ? w / (1.0278 - 0.0278 * reps) : 0
  const oneRm = (epley + brzycki) / 2
  const pctUsed = oneRm > 0 ? (w / oneRm) * 100 : 0
  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconActivity size={20} />} title="Kekuatan & Power" subtitle="1RM, PPO, rasio power/berat, total kerja mekanik, FTP, MMP" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-neutral-100 p-4 sm:col-span-2">
          <div className="text-sm font-extrabold">🏋️ 1 Rep Max (1RM) & Submaximal Rep Test</div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Field label="Gerakan">
              <select className={inputClass} value={ex} onChange={(e) => setEx(e.target.value)}>
                {['Back Squat', 'Bench Press', 'Deadlift', 'Overhead Press'].map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Beban (kg)"><input className={inputClass} type="number" value={w} onChange={(e) => setW(+e.target.value)} /></Field>
            <Field label="Repetisi"><input className={inputClass} type="number" value={reps} onChange={(e) => setReps(+e.target.value)} /></Field>
            <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">1RM ({ex})</div><div className="text-lg font-extrabold text-brand-dark">{oneRm.toFixed(0)} kg</div></div>
          </div>
          <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">Rata-rata Epley (w×(1+reps/30)) & Brzycki (w/(1.0278−0.0278×reps)). Beban ini ≈{pctUsed.toFixed(0)}% dari 1RM Anda — tes submaksimal aman tanpa perlu angkat sampai gagal total.</p>
        </div>

        <MetricCard id="ppo" name="Peak Power Output (Sayers, lompatan)" emoji="💥" unit="Watt"
          inputs={[{ key: 'jump', label: 'Tinggi lompatan', unit: 'cm', default: 40 }, { key: 'mass', label: 'Berat badan', unit: 'kg', default: 65 }]}
          compute={(v) => 51.9 * v.jump + 48.9 * v.mass - 2007}
          note="Formula Sayers (1999) dari Countermovement Jump: PPO = 51.9×tinggi(cm) + 48.9×massa(kg) − 2007."
        />
        <MetricCard id="pbw" name="Power-to-Body-Weight Ratio" emoji="⚖️" unit="W/kg"
          inputs={[{ key: 'power', label: 'Power', unit: 'W', default: 250 }, { key: 'mass', label: 'Berat badan', unit: 'kg', default: 65 }]}
          compute={(v) => v.power / v.mass}
          interpret={(r) => { const n = r as number; return { label: n >= 5 ? 'Kelas Balap/Elit' : n >= 4 ? 'Sangat Baik' : n >= 3 ? 'Baik' : n >= 2 ? 'Rekreasi' : 'Pemula', tone: n >= 4 ? 'brand' : n >= 2.5 ? 'low' : 'neutral' } }}
          note="Benchmark umum FTP/kg bersepeda: <2 pemula, 2-3 rekreasi, 3-4 baik, 4-5 sangat baik, 5-6 kelas balap, 6+ dunia."
        />
        <MetricCard id="tmw" name="Total Mechanical Work / Workload" emoji="🔧" unit="kJ"
          inputs={[{ key: 'power', label: 'Power rata-rata', unit: 'W', default: 200 }, { key: 'time', label: 'Durasi', unit: 'menit', default: 60 }]}
          compute={(v) => (v.power * v.time * 60) / 1000}
          note="Kerja (kJ) = Power(W) × waktu(dtk) ÷ 1000. Ukuran total 'kerja' mekanik satu sesi — mendekati kkal terbakar dari sumber otot."
        />
        <MetricCard id="ftp" name="Functional Threshold Power (FTP)" emoji="🚴" unit="Watt"
          inputs={[{ key: 'p20', label: 'Power tes 20 menit', unit: 'W', default: 260 }]}
          compute={(v) => v.p20 * 0.95}
          note="FTP ≈ 95% dari power rata-rata tes time-trial 20 menit (Allen & Coggan). Proksi praktis untuk ambang laktat bersepeda."
        />
        <MetricCard id="mmp" name="Mean Max Power (titik tunggal)" emoji="📊" unit="W"
          inputs={[{ key: 'dur', label: 'Durasi', unit: 'dtk', default: 300 }, { key: 'power', label: 'Power terbaik di durasi ini', unit: 'W', default: 280 }]}
          compute={(v) => v.power}
          note="Catat titik terbaik kurva power-durasi Anda (mis. 5s, 1mnt, 5mnt, 20mnt) untuk membangun profil Mean Max Power dari waktu ke waktu."
        />
      </div>
    </Card>
  )
}

/* ══════════════════ 3. KECEPATAN & KELINCAHAN ══════════════════ */
function SpeedTab() {
  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconRun size={20} />} title="Kecepatan & Kelincahan" subtitle="MSS, ASR, akselerasi, stride rate, reaksi & Illinois Agility" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <MetricCard id="mss" name="Maximal Sprinting Speed (MSS)" emoji="🚀" unit="km/j"
          inputs={[{ key: 'val', label: 'Top speed terukur (GPS/gate)', unit: 'km/j', default: 28 }]}
          compute={(v) => v.val}
          note="Kecepatan sprint maksimal terukur. Konteks tim/lari cepat: rekreasi <24, terlatih 24-28, elit 28-35+ km/j."
        />
        <MetricCard id="asr" name="Anaerobic Speed Reserve (ASR)" emoji="➕" unit="km/j"
          inputs={[{ key: 'mss', label: 'MSS', unit: 'km/j', default: 28 }, { key: 'vvo2', label: 'vVO₂max', unit: 'km/j', default: 18 }]}
          compute={(v) => v.mss - v.vvo2}
          note="ASR = MSS − kecepatan di VO₂max. Kapasitas anaerobik-kecepatan murni, penting untuk sprint berulang & olahraga tim."
        />
        <MetricCard id="accel" name="Akselerasi (sprint pendek)" emoji="⚡" unit="m/dtk²"
          inputs={[{ key: 'dist', label: 'Jarak', unit: 'm', default: 20 }, { key: 'time', label: 'Waktu', unit: 'dtk', default: 3.2 }]}
          compute={(v) => (2 * v.dist) / (v.time * v.time)}
          note="Dari diam (s=½at²): a = 2×jarak ÷ waktu². Dites via 10-30m sprint dari start diam."
        />
        <MetricCard id="stride" name="Stride Rate (Cadence)" emoji="👟" unit="langkah/mnt"
          inputs={[{ key: 'steps', label: 'Jumlah langkah', default: 170 }, { key: 'time', label: 'Waktu', unit: 'dtk', default: 60 }]}
          compute={(v) => (v.steps / v.time) * 60}
          interpret={(r) => { const n = r as number; return { label: n >= 170 ? 'Optimal' : n >= 160 ? 'Cukup' : 'Rendah', tone: n >= 170 ? 'brand' : 'low' } }}
          note="Target cadence lari umum 170-190 langkah/menit — cadence lebih tinggi umumnya menurunkan impact/cedera."
        />
        <ReactionTimeCard />
        <IllinoisCard />
      </div>
    </Card>
  )
}

function ReactionTimeCard() {
  const [state, setState] = useState<'idle' | 'waiting' | 'go' | 'early'>('idle')
  const [trials, setTrials] = useState<number[]>([])
  const tRef = useRef(0)
  const timerRef = useRef<number | null>(null)
  function start() {
    setState('waiting')
    const delay = 1000 + Math.random() * 3000
    timerRef.current = window.setTimeout(() => { tRef.current = performance.now(); setState('go') }, delay)
  }
  function click() {
    if (state === 'waiting') { if (timerRef.current) clearTimeout(timerRef.current); setState('early'); return }
    if (state === 'go') { const rt = performance.now() - tRef.current; setTrials((t) => [...t.slice(-4), rt]); setState('idle') }
  }
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])
  const avg = trials.length ? trials.reduce((a, b) => a + b, 0) / trials.length : 0
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">⏱️ Tes Waktu Reaksi</div>
      <button onClick={state === 'idle' ? start : click}
        className={'mt-2 flex h-24 w-full items-center justify-center rounded-xl text-sm font-black text-white transition ' +
          (state === 'waiting' ? 'bg-rose-500' : state === 'go' ? 'bg-brand' : state === 'early' ? 'bg-amber-500' : 'bg-neutral-800')}>
        {state === 'idle' ? 'Tekan untuk mulai' : state === 'waiting' ? 'Tunggu warna hijau…' : state === 'go' ? 'TEKAN SEKARANG!' : 'Terlalu cepat — coba lagi'}
      </button>
      <div className="mt-2 rounded-xl bg-neutral-50 p-2.5">
        <div className="text-[9px] font-bold uppercase text-neutral-400">Rata-rata ({trials.length} percobaan)</div>
        <div className="text-lg font-extrabold text-brand-dark">{avg > 0 ? avg.toFixed(0) : '—'} ms</div>
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">Rata-rata orang dewasa ≈200-250ms; atlet elit bisa &lt;180ms. Ulangi 5× untuk hasil stabil.</p>
    </div>
  )
}

function IllinoisCard() {
  const [t, setT] = useState(17)
  const [g, setG] = useState<'M' | 'F'>('M')
  const bands = g === 'M'
    ? [[15.2, 'Sangat Baik'], [16.1, 'Baik'], [18.1, 'Rata-rata'], [19.3, 'Cukup'], [999, 'Kurang']] as const
    : [[17.0, 'Sangat Baik'], [17.9, 'Baik'], [21.7, 'Rata-rata'], [23.0, 'Cukup'], [999, 'Kurang']] as const
  const label = bands.find(([max]) => t <= max)?.[1] ?? 'Kurang'
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">🔀 Illinois Agility Test</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="Waktu (detik)"><input className={inputClass} type="number" step="0.1" value={t} onChange={(e) => setT(+e.target.value)} /></Field>
        <Field label="Jenis Kelamin">
          <select className={inputClass} value={g} onChange={(e) => setG(e.target.value as 'M' | 'F')}><option value="M">Laki-laki</option><option value="F">Perempuan</option></select>
        </Field>
      </div>
      <div className="mt-2"><Badge tone={label === 'Sangat Baik' || label === 'Baik' ? 'brand' : label === 'Rata-rata' ? 'low' : 'critical'}>{label}</Badge></div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">Lintasan cone 10m standar mengukur kelincahan multi-arah — penting untuk olahraga tim/beladiri.</p>
    </div>
  )
}

/* ══════════════════ 4. TES LAPANGAN ══════════════════ */
function FieldTestTab() {
  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconTimer size={20} />} title="Tes Lapangan" subtitle="Vertical jump, broad jump, handgrip, multi-stage fitness test (bleep)" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <MetricCard id="vjump" name="Vertical Jump" emoji="⬆️" unit="cm"
          inputs={[{ key: 'cm', label: 'Tinggi lompatan', unit: 'cm', default: 40 }]}
          compute={(v) => v.cm}
          interpret={(r) => { const n = r as number; return { label: n >= 65 ? 'Elit' : n >= 55 ? 'Sangat Baik' : n >= 45 ? 'Baik' : n >= 35 ? 'Rata-rata' : 'Di Bawah Rata-rata', tone: n >= 55 ? 'brand' : n >= 40 ? 'low' : 'neutral' } }}
          note="Countermovement jump — proksi power tungkai eksplosif. Elit atlet lompat/lari sprint umumnya &gt;60cm."
        />
        <MetricCard id="bjump" name="Standing Broad Jump" emoji="🦘" unit="cm"
          inputs={[{ key: 'cm', label: 'Jarak lompatan', unit: 'cm', default: 200 }]}
          compute={(v) => v.cm}
          interpret={(r) => { const n = r as number; return { label: n >= 250 ? 'Elit' : n >= 220 ? 'Baik' : n >= 180 ? 'Rata-rata' : 'Di Bawah Rata-rata', tone: n >= 220 ? 'brand' : n >= 180 ? 'low' : 'neutral' } }}
          note="Power horizontal tungkai — berkorelasi dengan performa sprint & perubahan arah."
        />
        <GripCard />
        <BleepTestCard />
      </div>
    </Card>
  )
}

function GripCard() {
  const [r, setR] = useState(38)
  const [l, setL] = useState(36)
  const [bw, setBw] = useState(65)
  const avg = (r + l) / 2
  const asym = Math.max(r, l) > 0 ? (Math.abs(r - l) / Math.max(r, l)) * 100 : 0
  const ratio = avg / bw
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">✊ Handgrip Dynamometer</div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Field label="Kanan (kg)"><input className={inputClass} type="number" value={r} onChange={(e) => setR(+e.target.value)} /></Field>
        <Field label="Kiri (kg)"><input className={inputClass} type="number" value={l} onChange={(e) => setL(+e.target.value)} /></Field>
        <Field label="Berat (kg)"><input className={inputClass} type="number" value={bw} onChange={(e) => setBw(+e.target.value)} /></Field>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">Rata-rata</div><div className="text-lg font-extrabold text-brand-dark">{avg.toFixed(1)} kg</div></div>
        <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">Rasio / Berat</div><div className="text-lg font-extrabold text-brand-dark">{ratio.toFixed(2)}</div></div>
      </div>
      {asym > 10 && <div className="mt-2"><Badge tone="critical">⚠️ Asimetri {asym.toFixed(0)}% — lebih dari 10%</Badge></div>}
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">Grip strength adalah salah satu prediktor mortalitas terkuat (studi PURE). Asimetri kanan-kiri &gt;10% menandakan potensi ketidakseimbangan yang perlu dikoreksi.</p>
    </div>
  )
}

function BleepTestCard() {
  const [level, setLevel] = useState(8)
  const speed = 8 + (level - 1) * 0.5
  const vo2 = 5.857 * speed - 19.458
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">🔔 Multi-Stage Fitness Test (Bleep)</div>
      <Field label="Level tercapai (1-21)"><input className={inputClass} type="number" min={1} max={21} value={level} onChange={(e) => setLevel(+e.target.value)} /></Field>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">Kecepatan Akhir</div><div className="text-lg font-extrabold text-brand-dark">{speed.toFixed(1)} km/j</div></div>
        <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">Estimasi VO₂max</div><div className="text-lg font-extrabold text-brand-dark">{vo2.toFixed(1)}</div></div>
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">Formula Léger & Gadoury (1989): VO₂max = 5.857×kecepatan(km/j) − 19.458. Estimasi lapangan, bukan pengganti tes lab.</p>
    </div>
  )
}

/* ══════════════════ 5. RESPIRASI & LINGKUNGAN ══════════════════ */
function RespiratoryTab() {
  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconChartUp size={20} />} title="Respirasi & Lingkungan" subtitle="Ventilasi, panas, hidrasi, adaptasi vs aklimatisasi ketinggian" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <VentilationCard />
        <MetricCard id="tidal" name="Laju Napas & Tidal Volume" emoji="🫁" unit="mL"
          inputs={[{ key: 'rr', label: 'Laju napas', unit: '/mnt', default: 40 }, { key: 've', label: 'Minute Ventilation', unit: 'L/mnt', default: 100 }]}
          compute={(v) => (v.ve * 1000) / v.rr}
          note="Tidal Volume ≈ Minute Ventilation(mL) ÷ laju napas. Laju napas istirahat normal 12-20/mnt, saat maksimal bisa &gt;50/mnt."
        />
        <HydrationCard />
        <HeatStrainCard />
        <AltitudeCard />
        <IfCard />
      </div>
    </Card>
  )
}

function VentilationCard() {
  const [ve, setVe] = useState(100)
  const [vo2, setVo2] = useState(3.2)
  const [vco2, setVco2] = useState(3.4)
  const veVo2 = ve / vo2
  const veVco2 = ve / vco2
  const rer = vco2 / vo2
  return (
    <div className="rounded-2xl border border-neutral-100 p-4 sm:col-span-2">
      <div className="text-sm font-extrabold">💨 Ventilatory Equivalent (VE/VO₂, VE/VCO₂) & RER</div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Field label="VE (L/mnt)"><input className={inputClass} type="number" value={ve} onChange={(e) => setVe(+e.target.value)} /></Field>
        <Field label="VO₂ (L/mnt)"><input className={inputClass} type="number" step="0.1" value={vo2} onChange={(e) => setVo2(+e.target.value)} /></Field>
        <Field label="VCO₂ (L/mnt)"><input className={inputClass} type="number" step="0.1" value={vco2} onChange={(e) => setVco2(+e.target.value)} /></Field>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">VE/VO₂</div><div className="text-base font-extrabold text-brand-dark">{veVo2.toFixed(1)}</div></div>
        <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">VE/VCO₂</div><div className="text-base font-extrabold text-brand-dark">{veVco2.toFixed(1)}</div></div>
        <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">RER</div><div className="text-base font-extrabold text-brand-dark">{rer.toFixed(2)}</div></div>
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">VE/VO₂ naik tajam tanpa VE/VCO₂ naik = VT1. Keduanya naik bersamaan = VT2/RCP. RER &gt;1.0 menandakan kontribusi anaerobik/hiperventilasi meningkat.</p>
    </div>
  )
}

function HydrationCard() {
  const [pre, setPre] = useState(65)
  const [post, setPost] = useState(64)
  const [fluid, setFluid] = useState(0.5)
  const [hrs, setHrs] = useState(1)
  const rate = (pre - post + fluid) / hrs
  const lossPct = ((pre - post) / pre) * 100
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">💧 Laju Keringat & Hidrasi</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="Berat sebelum (kg)"><input className={inputClass} type="number" step="0.1" value={pre} onChange={(e) => setPre(+e.target.value)} /></Field>
        <Field label="Berat sesudah (kg)"><input className={inputClass} type="number" step="0.1" value={post} onChange={(e) => setPost(+e.target.value)} /></Field>
        <Field label="Cairan diminum (L)"><input className={inputClass} type="number" step="0.1" value={fluid} onChange={(e) => setFluid(+e.target.value)} /></Field>
        <Field label="Durasi (jam)"><input className={inputClass} type="number" step="0.1" value={hrs} onChange={(e) => setHrs(+e.target.value)} /></Field>
      </div>
      <div className="mt-2 rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">Laju Keringat</div><div className="text-lg font-extrabold text-brand-dark">{rate.toFixed(2)} L/jam</div></div>
      {lossPct > 2 && <div className="mt-2"><Badge tone="critical">⚠️ Kehilangan berat {lossPct.toFixed(1)}% — dehidrasi signifikan</Badge></div>}
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">Kehilangan &gt;2% berat badan menurunkan performa & meningkatkan risiko heat illness. 1L cairan ≈ 1kg.</p>
    </div>
  )
}

function HeatStrainCard() {
  const [temp, setTemp] = useState(30)
  const [hum, setHum] = useState(70)
  const risk = temp >= 32 || (temp >= 28 && hum >= 70) ? { l: 'Risiko Tinggi', tone: 'critical' as const }
    : temp >= 24 ? { l: 'Risiko Sedang', tone: 'low' as const } : { l: 'Risiko Rendah', tone: 'brand' as const }
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">🌡️ Heat Strain</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="Suhu (°C)"><input className={inputClass} type="number" value={temp} onChange={(e) => setTemp(+e.target.value)} /></Field>
        <Field label="Kelembapan (%)"><input className={inputClass} type="number" value={hum} onChange={(e) => setHum(+e.target.value)} /></Field>
      </div>
      <div className="mt-2"><Badge tone={risk.tone}>{risk.l}</Badge></div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">Estimasi sederhana ala WBGT. Suhu &gt;32°C atau (&gt;28°C + kelembapan &gt;70%) — turunkan intensitas, tambah hidrasi & aklimatisasi.</p>
    </div>
  )
}

function AltitudeCard() {
  const [alt, setAlt] = useState(2000)
  const [days, setDays] = useState(5)
  const neededDays = Math.max(7, (alt / 1000) * 7)
  const pct = Math.min(100, (days / neededDays) * 100)
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">⛰️ Adaptasi vs Aklimatisasi Ketinggian</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="Ketinggian (m)"><input className={inputClass} type="number" value={alt} onChange={(e) => setAlt(+e.target.value)} /></Field>
        <Field label="Hari di ketinggian"><input className={inputClass} type="number" value={days} onChange={(e) => setDays(+e.target.value)} /></Field>
      </div>
      <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-neutral-100"><div className="absolute inset-y-0 left-0 rounded-full bg-brand" style={{ width: `${pct}%` }} /></div>
      <div className="mt-1 text-[11px] font-bold text-brand-dark">{pct.toFixed(0)}% aklimatisasi (estimasi ~{neededDays.toFixed(0)} hari untuk penuh)</div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">
        <b>Aklimatisasi</b> = penyesuaian fisiologis individu jangka pendek (hari-minggu): naik produksi sel darah merah, ventilasi. <b>Adaptasi</b> = perubahan genetik/populasi jangka panjang (generasi) pada penduduk dataran tinggi.
      </p>
    </div>
  )
}

function IfCard() {
  const [start, setStart] = useState('12:00')
  const [end, setEnd] = useState('20:00')
  const toH = (s: string) => { const [h, m] = s.split(':').map(Number); return h + m / 60 }
  const window = (toH(end) - toH(start) + 24) % 24
  const fasting = 24 - window
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">⏳ Intermittent Fasting & Waktu Latihan</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="Jendela makan mulai"><input className={inputClass} type="time" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
        <Field label="Jendela makan selesai"><input className={inputClass} type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">Jendela Makan</div><div className="text-base font-extrabold text-brand-dark">{window.toFixed(1)} jam</div></div>
        <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">Puasa</div><div className="text-base font-extrabold text-brand-dark">{fasting.toFixed(1)} jam</div></div>
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">Sesi Zone 2/ringan aman dilakukan dalam keadaan puasa (fat-adapted). Sesi intensitas tinggi/kekuatan sebaiknya dijadwalkan di dalam jendela makan agar glikogen cukup.</p>
    </div>
  )
}

/* ══════════════════ 6. BEBAN & MANAJEMEN ══════════════════ */
function LoadTab() {
  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconGauge size={20} />} title="Beban & Manajemen" subtitle="TSS, MAP, zona HR Karvonen, rep-max, kerja & fatigue" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <TssCard />
        <MetricCard id="map" name="Mean Arterial Pressure (MAP)" emoji="🩺" unit="mmHg"
          inputs={[{ key: 'sbp', label: 'Sistolik', unit: 'mmHg', default: 120 }, { key: 'dbp', label: 'Diastolik', unit: 'mmHg', default: 80 }]}
          compute={(v) => v.dbp + (v.sbp - v.dbp) / 3}
          interpret={(r) => { const n = r as number; return { label: n >= 70 && n <= 100 ? 'Optimal' : n > 100 ? 'Tinggi' : 'Rendah', tone: n >= 70 && n <= 100 ? 'brand' : 'critical' } }}
          note="MAP = DBP + ⅓(SBP−DBP). Rentang optimal ≈70-100 mmHg — perfusi organ yang memadai."
        />
        <KarvonenCard />
        <HrMaxCard />
        <TrainingLoadRecapCard />
      </div>
    </Card>
  )
}

function TssCard() {
  const [dur, setDur] = useState(60)
  const [np, setNp] = useState(220)
  const [ftp, setFtp] = useState(250)
  const ifactor = np / ftp
  const tss = (dur * 60 * np * ifactor) / (ftp * 3600) * 100
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">📐 Training Stress Score (TSS)</div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Field label="Durasi (mnt)"><input className={inputClass} type="number" value={dur} onChange={(e) => setDur(+e.target.value)} /></Field>
        <Field label="NP (W)"><input className={inputClass} type="number" value={np} onChange={(e) => setNp(+e.target.value)} /></Field>
        <Field label="FTP (W)"><input className={inputClass} type="number" value={ftp} onChange={(e) => setFtp(+e.target.value)} /></Field>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">Intensity Factor</div><div className="text-base font-extrabold text-brand-dark">{ifactor.toFixed(2)}</div></div>
        <div className="rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">TSS</div><div className="text-base font-extrabold text-brand-dark">{tss.toFixed(0)}</div></div>
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">TSS = (durasi × NP × IF)/(FTP × 3600) × 100. 100 TSS ≈ 1 jam all-out di FTP. &gt;150/sesi = beban berat, butuh pemulihan ekstra.</p>
    </div>
  )
}

function KarvonenCard() {
  const [hrmax, setHrmax] = useState(190)
  const [hrrest, setHrrest] = useState(60)
  const [lo, setLo] = useState(60)
  const [hi, setHi] = useState(70)
  const target = (pct: number) => Math.round((hrmax - hrrest) * (pct / 100) + hrrest)
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">🎯 Zona HR Latihan (Karvonen)</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="HRmax"><input className={inputClass} type="number" value={hrmax} onChange={(e) => setHrmax(+e.target.value)} /></Field>
        <Field label="HR Istirahat"><input className={inputClass} type="number" value={hrrest} onChange={(e) => setHrrest(+e.target.value)} /></Field>
        <Field label="Intensitas rendah (%)"><input className={inputClass} type="number" value={lo} onChange={(e) => setLo(+e.target.value)} /></Field>
        <Field label="Intensitas tinggi (%)"><input className={inputClass} type="number" value={hi} onChange={(e) => setHi(+e.target.value)} /></Field>
      </div>
      <div className="mt-2 rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">Target HR Range</div><div className="text-lg font-extrabold text-brand-dark">{target(lo)}–{target(hi)} bpm</div></div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">Karvonen: Target = (HRmax−HRrest)×%intensitas + HRrest. Lebih personal daripada %HRmax saja karena memperhitungkan HR Cadangan.</p>
    </div>
  )
}

function HrMaxCard() {
  const [age, setAge] = useState(26)
  const [g, setG] = useState<'M' | 'F'>('M')
  const classic = 220 - age
  const tanaka = 208 - 0.7 * age
  const gulati = 206 - 0.88 * age
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">❤️ Estimasi HRmax</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="Usia"><input className={inputClass} type="number" value={age} onChange={(e) => setAge(+e.target.value)} /></Field>
        <Field label="Jenis Kelamin"><select className={inputClass} value={g} onChange={(e) => setG(e.target.value as 'M' | 'F')}><option value="M">Laki-laki</option><option value="F">Perempuan</option></select></Field>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-neutral-50 p-2"><div className="text-[8px] font-bold text-neutral-400">220-usia</div><div className="text-base font-extrabold text-brand-dark">{classic}</div></div>
        <div className="rounded-xl bg-neutral-50 p-2"><div className="text-[8px] font-bold text-neutral-400">Tanaka</div><div className="text-base font-extrabold text-brand-dark">{tanaka.toFixed(0)}</div></div>
        {g === 'F' && <div className="rounded-xl bg-neutral-50 p-2"><div className="text-[8px] font-bold text-neutral-400">Gulati (F)</div><div className="text-base font-extrabold text-brand-dark">{gulati.toFixed(0)}</div></div>}
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">Tanaka (208−0.7×usia) umumnya lebih akurat dari 220-usia. Gulati (206−0.88×usia) khusus divalidasi untuk perempuan.</p>
    </div>
  )
}

// Read-only recap pulling the same acuteLoad/chronicLoad the Athlete page
// already collects — keeps ATL/CTL/TSB consistent across pages without a
// second editable copy of the same data.
function TrainingLoadRecapCard() {
  const data = useMemo(() => { try { return JSON.parse(localStorage.getItem('pm_athlete_profile') || '{}') } catch { return {} } }, [])
  const acute = data.acuteLoad || 0, chronic = data.chronicLoad || 0
  const acwr = chronic > 0 ? acute / chronic : 0
  const ctl = chronic / 7, atl = acute / 7, tsb = ctl - atl
  return (
    <div className="rounded-2xl border border-neutral-100 p-4 sm:col-span-2">
      <div className="text-sm font-extrabold">📋 Ringkasan Beban (dari halaman Atlet)</div>
      <div className="mt-2 grid grid-cols-4 gap-2 text-center">
        <div className="rounded-xl bg-neutral-50 p-2"><div className="text-[8px] font-bold text-neutral-400">ACWR</div><div className="text-base font-extrabold text-brand-dark">{acwr > 0 ? acwr.toFixed(2) : '—'}</div></div>
        <div className="rounded-xl bg-neutral-50 p-2"><div className="text-[8px] font-bold text-neutral-400">CTL (Fitness)</div><div className="text-base font-extrabold text-brand-dark">{chronic > 0 ? ctl.toFixed(0) : '—'}</div></div>
        <div className="rounded-xl bg-neutral-50 p-2"><div className="text-[8px] font-bold text-neutral-400">ATL (Fatigue)</div><div className="text-base font-extrabold text-brand-dark">{acute > 0 ? atl.toFixed(0) : '—'}</div></div>
        <div className="rounded-xl bg-neutral-50 p-2"><div className="text-[8px] font-bold text-neutral-400">TSB (Form)</div><div className="text-base font-extrabold text-brand-dark">{chronic > 0 ? tsb.toFixed(0) : '—'}</div></div>
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">Data ini diedit dari <a href="#/athlete" className="font-bold text-brand-dark underline">halaman Atlet</a> — ditampilkan di sini agar semua metrik beban terlihat dalam satu Lab.</p>
    </div>
  )
}

/* ══════════════════ 7. EKONOMI & KETAHANAN ══════════════════ */
function EconomyTab() {
  const { state } = useStore()
  const last = state.gpsActivities?.[state.gpsActivities.length - 1]
  return (
    <Card className="!p-5">
      <SectionTitle icon={<IconRun size={20} />} title="Ekonomi & Ketahanan" subtitle="Running/cycling economy, durability, ringkasan GPS" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <MetricCard id="re" name="Running Economy" emoji="🏃" unit="mL/kg/km"
          inputs={[{ key: 'vo2', label: 'VO₂ submaksimal', unit: 'ml/kg/mnt', default: 40 }, { key: 'speed', label: 'Kecepatan', unit: 'km/j', default: 12 }]}
          compute={(v) => (v.vo2 * 60) / v.speed}
          interpret={(r) => { const n = r as number; return { label: n <= 170 ? 'Sangat Ekonomis' : n <= 200 ? 'Baik' : 'Bisa Diperbaiki', tone: n <= 190 ? 'brand' : 'low' } }}
          note="Semakin rendah = semakin hemat oksigen pada kecepatan sama. Pelari maraton elit ≈150-170 mL/kg/km."
        />
        <MetricCard id="ge" name="Cycling Gross Efficiency" emoji="🚴" unit="%"
          inputs={[{ key: 'power', label: 'Power output', unit: 'W', default: 200 }, { key: 'vo2', label: 'VO₂', unit: 'L/mnt', default: 2.8 }]}
          compute={(v) => (v.power / (v.vo2 * 348.3)) * 100}
          note="GE% = Power(W) ÷ (VO₂(L/mnt) × 348.3W) × 100 — perkiraan dari setara energi O₂ ≈20.9kJ/L. Pesepeda terlatih ≈20-23%."
        />
        <DurabilityCard />
        <div className="rounded-2xl border border-neutral-100 p-4">
          <div className="text-sm font-extrabold">📍 Ringkasan Aktivitas GPS Terakhir</div>
          {last ? (
            <div className="mt-2 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-neutral-50 p-2"><div className="text-[8px] font-bold text-neutral-400">Jarak</div><div className="text-base font-extrabold text-brand-dark">{last.distKm.toFixed(2)} km</div></div>
              <div className="rounded-xl bg-neutral-50 p-2"><div className="text-[8px] font-bold text-neutral-400">Avg Speed</div><div className="text-base font-extrabold text-brand-dark">{last.avgSpeedKmh.toFixed(1)} km/j</div></div>
            </div>
          ) : <p className="mt-2 text-[11px] text-neutral-400">Belum ada aktivitas GPS tercatat.</p>}
          <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">Elevasi & medan (datar/bergelombang/berbukit) tampil langsung saat merekam di GPS Tracker (Beranda).</p>
        </div>
      </div>
    </Card>
  )
}

function DurabilityCard() {
  const [first, setFirst] = useState(300)
  const [last, setLast] = useState(270)
  const decay = ((first - last) / first) * 100
  return (
    <div className="rounded-2xl border border-neutral-100 p-4">
      <div className="text-sm font-extrabold">🛡️ Durability (Penurunan Performa)</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="Power/kecepatan segmen awal"><input className={inputClass} type="number" value={first} onChange={(e) => setFirst(+e.target.value)} /></Field>
        <Field label="Power/kecepatan segmen akhir"><input className={inputClass} type="number" value={last} onChange={(e) => setLast(+e.target.value)} /></Field>
      </div>
      <div className="mt-2 rounded-xl bg-neutral-50 p-2.5"><div className="text-[9px] font-bold uppercase text-neutral-400">Penurunan</div><div className="text-lg font-extrabold text-brand-dark">{decay.toFixed(1)}%</div></div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-500">Gunakan satuan di mana angka lebih tinggi = lebih baik (power/kecepatan, bukan pace). Durability rendah (&lt;5% penurunan) menandakan daya tahan sangat baik pada sesi panjang.</p>
    </div>
  )
}

export default PerformanceLab
