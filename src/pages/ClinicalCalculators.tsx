import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, SectionTitle, Badge, Field, inputClass } from '../components/ui'
import { IconStethoscope, IconShield, IconCheck, IconToken } from '../components/icons'
import { api, backendEnabled } from '../lib/api'

// Standard published clinical scoring tools — each formula/table matches the
// cited source exactly (see inline notes). These are decision-support aids,
// not a replacement for clinical judgment.

function SegButtons<T extends string | number>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { v: T; l: string }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={String(o.v)}
          onClick={() => onChange(o.v)}
          className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
            value === o.v ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  )
}

/* ══════════════════ APGAR ══════════════════ */
function ApgarCalc() {
  const criteria: { key: string; label: string; opts: { v: number; l: string }[] }[] = [
    { key: 'appearance', label: 'Appearance (warna kulit)', opts: [{ v: 0, l: 'Biru/pucat seluruh tubuh' }, { v: 1, l: 'Tubuh merah, ekstremitas biru' }, { v: 2, l: 'Merah muda seluruhnya' }] },
    { key: 'pulse', label: 'Pulse (denyut jantung)', opts: [{ v: 0, l: 'Tidak ada' }, { v: 1, l: '<100x/menit' }, { v: 2, l: '≥100x/menit' }] },
    { key: 'grimace', label: 'Grimace (respons refleks)', opts: [{ v: 0, l: 'Tidak ada respons' }, { v: 1, l: 'Meringis/grimace' }, { v: 2, l: 'Menangis/batuk/bersin kuat' }] },
    { key: 'activity', label: 'Activity (tonus otot)', opts: [{ v: 0, l: 'Lemas' }, { v: 1, l: 'Sedikit fleksi ekstremitas' }, { v: 2, l: 'Gerak aktif' }] },
    { key: 'respiration', label: 'Respiration (napas)', opts: [{ v: 0, l: 'Tidak ada' }, { v: 1, l: 'Lambat/tidak teratur' }, { v: 2, l: 'Menangis kuat' }] },
  ]
  const [v, setV] = useState<Record<string, number>>({ appearance: 2, pulse: 2, grimace: 2, activity: 2, respiration: 2 })
  const total = Object.values(v).reduce((a, b) => a + b, 0)
  const interp = total >= 7 ? { l: 'Normal', tone: 'normal' as const } : total >= 4 ? { l: 'Perlu bantuan', tone: 'low' as const } : { l: 'Depresi berat', tone: 'critical' as const }
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="APGAR Score" subtitle="Nilai pada menit ke-1 dan ke-5 setelah lahir (Apgar, 1953)" />
      <div className="space-y-3">
        {criteria.map((c) => (
          <Field key={c.key} label={c.label}>
            <SegButtons value={v[c.key]} onChange={(nv) => setV((s) => ({ ...s, [c.key]: nv }))} options={c.opts} />
          </Field>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-neutral-50 p-3">
        <div>
          <div className="text-2xl font-black text-ink">{total}<span className="text-sm font-semibold text-neutral-400">/10</span></div>
          <Badge tone={interp.tone}>{interp.l}</Badge>
        </div>
        <p className="max-w-[55%] text-right text-[10px] text-neutral-400">7-10 normal · 4-6 perlu bantuan · 0-3 resusitasi segera. Ulangi tiap 5 menit bila &lt;7.</p>
      </div>
    </Card>
  )
}

/* ══════════════════ GCS ══════════════════ */
function GcsCalc() {
  const eye = [{ v: 1, l: 'Tidak buka' }, { v: 2, l: 'Nyeri' }, { v: 3, l: 'Suara' }, { v: 4, l: 'Spontan' }]
  const verbal = [{ v: 1, l: 'Tidak ada' }, { v: 2, l: 'Suara tak jelas' }, { v: 3, l: 'Kata tak sesuai' }, { v: 4, l: 'Bingung' }, { v: 5, l: 'Orientasi baik' }]
  const motor = [{ v: 1, l: 'Tidak ada' }, { v: 2, l: 'Ekstensi (deserebrasi)' }, { v: 3, l: 'Fleksi (dekortikasi)' }, { v: 4, l: 'Menghindar nyeri' }, { v: 5, l: 'Lokalisasi nyeri' }, { v: 6, l: 'Mengikuti perintah' }]
  const [e, setE] = useState(4); const [v, setV] = useState(5); const [m, setM] = useState(6)
  const total = e + v + m
  const interp = total >= 13 ? { l: 'Cedera ringan', tone: 'normal' as const } : total >= 9 ? { l: 'Cedera sedang', tone: 'low' as const } : { l: 'Cedera berat — proteksi jalan napas', tone: 'critical' as const }
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Glasgow Coma Scale (GCS)" subtitle="Teasdale & Jennett, 1974" />
      <div className="space-y-3">
        <Field label="Eye Opening (E)"><SegButtons value={e} onChange={setE} options={eye} /></Field>
        <Field label="Verbal Response (V)"><SegButtons value={v} onChange={setV} options={verbal} /></Field>
        <Field label="Motor Response (M)"><SegButtons value={m} onChange={setM} options={motor} /></Field>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-neutral-50 p-3">
        <div>
          <div className="text-2xl font-black text-ink">E{e}V{v}M{m} = {total}<span className="text-sm font-semibold text-neutral-400">/15</span></div>
          <Badge tone={interp.tone}>{interp.l}</Badge>
        </div>
        <p className="max-w-[45%] text-right text-[10px] text-neutral-400">13-15 ringan · 9-12 sedang · ≤8 berat (indikasi intubasi proteksi jalan napas).</p>
      </div>
    </Card>
  )
}

/* ══════════════════ CURB-65 ══════════════════ */
function Curb65Calc() {
  const [confusion, setConfusion] = useState(false)
  const [urea, setUrea] = useState(false)
  const [rr, setRr] = useState(false)
  const [bp, setBp] = useState(false)
  const [age65, setAge65] = useState(false)
  const total = [confusion, urea, rr, bp, age65].filter(Boolean).length
  const interp = total <= 1
    ? { l: 'Risiko rendah', tone: 'normal' as const, note: 'Umumnya aman untuk rawat jalan.' }
    : total === 2
    ? { l: 'Risiko sedang', tone: 'low' as const, note: 'Pertimbangkan rawat inap singkat/pengawasan ketat.' }
    : { l: 'Risiko tinggi', tone: 'critical' as const, note: 'Rawat inap, pertimbangkan ICU bila skor 4-5.' }
  const Row = ({ label, sub, checked, onChange }: { label: string; sub: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-brand" />
      <div><div className="text-sm font-bold text-ink">{label}</div><div className="text-[11px] text-neutral-400">{sub}</div></div>
    </label>
  )
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="CURB-65" subtitle="Stratifikasi keparahan pneumonia komunitas (Lim et al. 2003, British Thoracic Society)" />
      <div className="space-y-2">
        <Row label="Confusion" sub="Kebingungan akut/disorientasi baru" checked={confusion} onChange={setConfusion} />
        <Row label="Urea" sub="BUN >19 mg/dL (urea >7 mmol/L)" checked={urea} onChange={setUrea} />
        <Row label="Respiratory rate" sub="Laju napas ≥30x/menit" checked={rr} onChange={setRr} />
        <Row label="Blood pressure" sub="Sistolik <90 atau diastolik ≤60 mmHg" checked={bp} onChange={setBp} />
        <Row label="Age ≥65" sub="Usia 65 tahun atau lebih" checked={age65} onChange={setAge65} />
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-black text-ink">{total}<span className="text-sm font-semibold text-neutral-400">/5</span></div>
          <Badge tone={interp.tone}>{interp.l}</Badge>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{interp.note}</p>
      </div>
    </Card>
  )
}

/* ══════════════════ BISHOP SCORE ══════════════════ */
function BishopCalc() {
  const dilationOpts = [{ v: 0, l: '0 cm' }, { v: 1, l: '1-2 cm' }, { v: 2, l: '3-4 cm' }, { v: 3, l: '≥5 cm' }]
  const effacementOpts = [{ v: 0, l: '0-30%' }, { v: 1, l: '40-50%' }, { v: 2, l: '60-70%' }, { v: 3, l: '≥80%' }]
  const stationOpts = [{ v: 0, l: '-3' }, { v: 1, l: '-2' }, { v: 2, l: '-1/0' }, { v: 3, l: '+1/+2' }]
  const consistencyOpts = [{ v: 0, l: 'Keras' }, { v: 1, l: 'Sedang' }, { v: 2, l: 'Lunak' }]
  const positionOpts = [{ v: 0, l: 'Posterior' }, { v: 1, l: 'Mid-posisi' }, { v: 2, l: 'Anterior' }]
  const [dilation, setDilation] = useState(0)
  const [effacement, setEffacement] = useState(0)
  const [station, setStation] = useState(0)
  const [consistency, setConsistency] = useState(0)
  const [position, setPosition] = useState(0)
  const total = dilation + effacement + station + consistency + position
  const interp = total >= 8
    ? { l: 'Matang', tone: 'normal' as const, note: 'Peluang induksi berhasil tinggi, mirip persalinan spontan.' }
    : total >= 6
    ? { l: 'Cukup matang', tone: 'low' as const, note: 'Induksi umumnya berhasil.' }
    : { l: 'Belum matang', tone: 'critical' as const, note: 'Pertimbangkan agen pematangan serviks (mis. prostaglandin) sebelum induksi.' }
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Bishop Score" subtitle="Kesiapan serviks untuk induksi persalinan (Bishop, 1964)" />
      <div className="space-y-3">
        <Field label="Dilatasi serviks"><SegButtons value={dilation} onChange={setDilation} options={dilationOpts} /></Field>
        <Field label="Effacement (penipisan)"><SegButtons value={effacement} onChange={setEffacement} options={effacementOpts} /></Field>
        <Field label="Station (penurunan kepala)"><SegButtons value={station} onChange={setStation} options={stationOpts} /></Field>
        <Field label="Konsistensi serviks"><SegButtons value={consistency} onChange={setConsistency} options={consistencyOpts} /></Field>
        <Field label="Posisi serviks"><SegButtons value={position} onChange={setPosition} options={positionOpts} /></Field>
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-black text-ink">{total}<span className="text-sm font-semibold text-neutral-400">/13</span></div>
          <Badge tone={interp.tone}>{interp.l}</Badge>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{interp.note}</p>
      </div>
    </Card>
  )
}

/* ══════════════════ CKD-EPI 2021 (race-free eGFR) ══════════════════ */
function CkdEpiCalc() {
  const [scr, setScr] = useState(0.9)
  const [age, setAge] = useState(45)
  const [sex, setSex] = useState<'M' | 'F'>('M')
  function egfr(): number {
    const k = sex === 'F' ? 0.7 : 0.9
    const a = sex === 'F' ? -0.241 : -0.302
    const sexMult = sex === 'F' ? 1.012 : 1
    const minTerm = Math.min(scr / k, 1) ** a
    const maxTerm = Math.max(scr / k, 1) ** -1.2
    return 142 * minTerm * maxTerm * (0.9938 ** age) * sexMult
  }
  const result = egfr()
  const stage = result >= 90 ? 'G1 — Normal/tinggi' : result >= 60 ? 'G2 — Penurunan ringan' : result >= 45 ? 'G3a — Penurunan ringan-sedang' : result >= 30 ? 'G3b — Penurunan sedang-berat' : result >= 15 ? 'G4 — Penurunan berat' : 'G5 — Gagal ginjal'
  const tone = result >= 60 ? 'normal' as const : result >= 30 ? 'low' as const : 'critical' as const
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="CKD-EPI 2021 (eGFR)" subtitle="Persamaan bebas-ras terbaru (Inker et al., NEJM 2021)" />
      <div className="grid grid-cols-3 gap-2">
        <Field label="Kreatinin (mg/dL)"><input className={inputClass} type="number" step="0.01" value={scr} onChange={(e) => setScr(+e.target.value)} /></Field>
        <Field label="Usia (tahun)"><input className={inputClass} type="number" value={age} onChange={(e) => setAge(+e.target.value)} /></Field>
        <Field label="Jenis Kelamin"><SegButtons value={sex} onChange={setSex} options={[{ v: 'M', l: 'Pria' }, { v: 'F', l: 'Wanita' }]} /></Field>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-neutral-50 p-3">
        <div>
          <div className="text-2xl font-black text-ink">{result.toFixed(0)}<span className="text-sm font-semibold text-neutral-400"> mL/min/1.73m²</span></div>
          <Badge tone={tone}>{stage}</Badge>
        </div>
        <p className="max-w-[40%] text-right text-[10px] text-neutral-400">Persamaan 2021 menghapus koefisien ras yang dipakai versi sebelumnya (CKD-EPI 2009/2012).</p>
      </div>
    </Card>
  )
}

/* ══════════════════ WHO GROWTH STANDARDS (z-score) ══════════════════ */
// WHO Child Growth Standards (2006), 0–60 months. Reference medians below are
// taken at standard checkpoint ages (0/6/12/24/36/48/60mo) with linear
// interpolation between them, and SD estimated from the WHO-published
// coefficient of variation at each checkpoint. This is a SIMPLIFIED estimator
// for screening/decision-support — for definitive clinical use, cross-check
// against the official WHO growth chart (percentile curves), which uses the
// full monthly-resolution LMS table this tool approximates.
const WHO_CHECKPOINTS_MO = [0, 6, 12, 24, 36, 48, 60]
const WHO_WEIGHT_M: Record<'M' | 'F', number[]> = {
  M: [3.3, 7.9, 9.6, 12.2, 14.3, 16.3, 18.3],
  F: [3.2, 7.3, 8.9, 11.5, 13.9, 16.1, 18.2],
}
const WHO_WEIGHT_SD: Record<'M' | 'F', number[]> = {
  M: [0.4, 0.9, 1.1, 1.5, 1.8, 2.1, 2.4],
  F: [0.4, 0.9, 1.1, 1.5, 1.9, 2.2, 2.6],
}
const WHO_HEIGHT_M: Record<'M' | 'F', number[]> = {
  M: [49.9, 67.6, 75.7, 87.1, 96.1, 103.3, 110.0],
  F: [49.1, 65.7, 74.0, 85.7, 95.1, 102.7, 109.4],
}
const WHO_HEIGHT_SD: Record<'M' | 'F', number[]> = {
  M: [1.9, 2.3, 2.6, 3.2, 3.6, 3.9, 4.2],
  F: [1.9, 2.3, 2.6, 3.2, 3.6, 4.0, 4.3],
}

function interp(ageMo: number, xs: number[], ys: number[]): number {
  const a = Math.max(xs[0], Math.min(xs[xs.length - 1], ageMo))
  for (let i = 0; i < xs.length - 1; i++) {
    if (a >= xs[i] && a <= xs[i + 1]) {
      const t = (a - xs[i]) / (xs[i + 1] - xs[i])
      return ys[i] + t * (ys[i + 1] - ys[i])
    }
  }
  return ys[ys.length - 1]
}

function zClass(z: number): { l: string; tone: 'normal' | 'low' | 'critical' } {
  if (z < -3) return { l: 'Sangat rendah (severely)', tone: 'critical' }
  if (z < -2) return { l: 'Rendah', tone: 'low' }
  if (z <= 2) return { l: 'Normal', tone: 'normal' }
  return { l: 'Tinggi', tone: 'low' }
}

function WhoGrowthCalc() {
  const [sex, setSex] = useState<'M' | 'F'>('M')
  const [ageMo, setAgeMo] = useState(12)
  const [weight, setWeight] = useState(9.6)
  const [height, setHeight] = useState(75.7)

  const wM = interp(ageMo, WHO_CHECKPOINTS_MO, WHO_WEIGHT_M[sex])
  const wSD = interp(ageMo, WHO_CHECKPOINTS_MO, WHO_WEIGHT_SD[sex])
  const hM = interp(ageMo, WHO_CHECKPOINTS_MO, WHO_HEIGHT_M[sex])
  const hSD = interp(ageMo, WHO_CHECKPOINTS_MO, WHO_HEIGHT_SD[sex])
  const waz = (weight - wM) / wSD
  const haz = (height - hM) / hSD
  const wazC = zClass(waz)
  const hazC = zClass(haz)

  // Masked malnutrition: height-for-age flags stunting (haz ≤ -2), but
  // weight-for-age still reads "normal" — because weight is being judged
  // against chronological age, not against the child's actual (shorter)
  // growth trajectory. A clinician glancing at weight-for-age alone would
  // miss the stunting entirely.
  const masked = haz <= -2 && waz > -2

  const chartData = WHO_CHECKPOINTS_MO.map((mo, i) => ({
    mo,
    beratMedian: WHO_WEIGHT_M[sex][i],
    tinggiMedian: WHO_HEIGHT_M[sex][i],
  }))

  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="WHO Growth Standards (Z-score)" subtitle="WHO Child Growth Standards 2006, 0–60 bulan — estimasi dari titik acuan bulan ke-0/6/12/24/36/48/60" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Field label="Jenis Kelamin"><SegButtons value={sex} onChange={setSex} options={[{ v: 'M', l: 'Laki-laki' }, { v: 'F', l: 'Perempuan' }]} /></Field>
        <Field label="Usia (bulan)"><input className={inputClass} type="number" min={0} max={60} value={ageMo} onChange={(e) => setAgeMo(+e.target.value)} /></Field>
        <Field label="Berat (kg)"><input className={inputClass} type="number" step="0.1" value={weight} onChange={(e) => setWeight(+e.target.value)} /></Field>
        <Field label="Panjang/Tinggi (cm)"><input className={inputClass} type="number" step="0.1" value={height} onChange={(e) => setHeight(+e.target.value)} /></Field>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-neutral-50 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Berat/Usia (WAZ)</div>
          <div className="mt-1 text-xl font-black text-ink">{waz >= 0 ? '+' : ''}{waz.toFixed(2)} SD</div>
          <Badge tone={wazC.tone}>{wazC.l}</Badge>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Tinggi/Usia (HAZ)</div>
          <div className="mt-1 text-xl font-black text-ink">{haz >= 0 ? '+' : ''}{haz.toFixed(2)} SD</div>
          <Badge tone={hazC.tone}>{hazC.l}</Badge>
        </div>
      </div>

      {masked && (
        <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3">
          <p className="text-xs font-black text-amber-800">⚠️ Kemungkinan stunting tersamar (masked malnutrition)</p>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-700">
            Tinggi/usia menunjukkan stunting (HAZ ≤ -2 SD), namun berat/usia tampak normal — ini menyesatkan bila hanya berat/usia yang dilihat, karena berat dinilai relatif terhadap usia kronologis, bukan terhadap lintasan tumbuh anak yang sebenarnya sudah tertekan. Pertimbangkan evaluasi gizi lebih lanjut meski berat/usia terlihat baik.
          </p>
        </div>
      )}

      <div className="mt-4 h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="mo" tick={{ fontSize: 10 }} label={{ value: 'Usia (bulan)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="beratMedian" name="Median Berat (kg)" stroke="#00BF63" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="tinggiMedian" name="Median Tinggi (cm)" stroke="#0B7A4B" strokeWidth={2} dot={false} strokeDasharray="4 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-neutral-400">
        Kurva menunjukkan median rujukan WHO (bukan data anak ini). Estimasi disederhanakan dari titik acuan standar — untuk keputusan klinis definitif, bandingkan dengan grafik pertumbuhan resmi WHO/KMS.
      </p>
    </Card>
  )
}

/* ══════════════════ NEW BALLARD SCORE + LUBCHENCO SOAP BUILDER ══════════════════ */
// New Ballard Score (Ballard et al., 1991) — 6 neuromuscular + 6 physical
// maturity criteria, summed to a total mapped to gestational age (weeks) via
// the standard published score-to-GA table. Combined here with a simplified
// Lubchenco-style birth-weight-for-gestational-age classification (SGA/AGA/
// LGA using approximate 10th/90th percentile bands) into an auto-drafted
// neonatal SOAP note — both are decision-support estimates, not a substitute
// for the official charts for edge-case/borderline values.
const BALLARD_SCORE_TO_GA: [number, number][] = [
  [-10, 20], [-5, 22], [0, 24], [5, 26], [10, 28], [15, 30], [20, 32],
  [25, 34], [30, 36], [35, 38], [40, 40], [45, 42], [50, 44],
]
function ballardScoreToGA(score: number): number {
  const pts = BALLARD_SCORE_TO_GA
  const s = Math.max(pts[0][0], Math.min(pts[pts.length - 1][0], score))
  for (let i = 0; i < pts.length - 1; i++) {
    if (s >= pts[i][0] && s <= pts[i + 1][0]) {
      const t = (s - pts[i][0]) / (pts[i + 1][0] - pts[i][0])
      return pts[i][1] + t * (pts[i + 1][1] - pts[i][1])
    }
  }
  return pts[pts.length - 1][1]
}

// Approximate 10th/90th percentile birth weight (grams) by gestational week —
// simplified Lubchenco/Fenton-style bands for SGA/AGA/LGA screening.
const LUBCHENCO_WEEKS = [24, 28, 32, 36, 40, 42]
const LUBCHENCO_P10 = [500, 750, 1300, 2100, 2800, 2900]
const LUBCHENCO_P90 = [850, 1450, 2400, 3400, 4000, 4200]
function lubchencoClass(gaWeeks: number, weightG: number): { l: string; tone: 'normal' | 'low' | 'critical' } {
  const p10 = interp(gaWeeks, LUBCHENCO_WEEKS, LUBCHENCO_P10)
  const p90 = interp(gaWeeks, LUBCHENCO_WEEKS, LUBCHENCO_P90)
  if (weightG < p10) return { l: 'SGA (Small for Gestational Age)', tone: 'critical' }
  if (weightG > p90) return { l: 'LGA (Large for Gestational Age)', tone: 'low' }
  return { l: 'AGA (Appropriate for Gestational Age)', tone: 'normal' }
}

const NEURO_CRITERIA: { key: string; label: string; opts: { v: number; l: string }[] }[] = [
  { key: 'posture', label: 'Posture', opts: [{ v: 0, l: 'Ekstensi penuh' }, { v: 1, l: 'Fleksi awal panggul/lutut' }, { v: 2, l: 'Fleksi sedang' }, { v: 3, l: 'Kaki fleksi-abduksi' }, { v: 4, l: 'Fleksi penuh (fetal)' }] },
  { key: 'squareWindow', label: 'Square Window (pergelangan tangan)', opts: [{ v: -1, l: '>90°' }, { v: 0, l: '90°' }, { v: 1, l: '60°' }, { v: 2, l: '45°' }, { v: 3, l: '30°' }, { v: 4, l: '0°' }] },
  { key: 'armRecoil', label: 'Arm Recoil', opts: [{ v: -1, l: '180° (tanpa recoil)' }, { v: 0, l: '140-180°' }, { v: 1, l: '110-140°' }, { v: 2, l: '90-110°' }, { v: 3, l: '<90°' }] },
  { key: 'poplitealAngle', label: 'Popliteal Angle', opts: [{ v: -1, l: '180°' }, { v: 0, l: '160°' }, { v: 1, l: '140°' }, { v: 2, l: '120°' }, { v: 3, l: '100°' }, { v: 4, l: '90°' }, { v: 5, l: '<90°' }] },
  { key: 'scarfSign', label: 'Scarf Sign', opts: [{ v: -1, l: 'Siku capai garis aksila lawan' }, { v: 0, l: 'Siku lewat garis tengah' }, { v: 1, l: 'Siku di garis tengah' }, { v: 2, l: 'Siku tak capai garis tengah' }, { v: 3, l: 'Siku di puting kontralateral' }, { v: 4, l: 'Siku tak capai puting' }] },
  { key: 'heelToEar', label: 'Heel to Ear', opts: [{ v: -1, l: 'Tumit capai telinga mudah' }, { v: 0, l: 'Tumit dekat telinga' }, { v: 1, l: 'Jarak sedang' }, { v: 2, l: 'Jarak menjauh' }, { v: 3, l: 'Jarak jauh' }, { v: 4, l: 'Tumit tak capai telinga' }] },
]
const PHYSICAL_CRITERIA: { key: string; label: string; opts: { v: number; l: string }[] }[] = [
  { key: 'skin', label: 'Kulit', opts: [{ v: -1, l: 'Lengket, transparan' }, { v: 0, l: 'Gelatinosa, merah, tembus pandang' }, { v: 1, l: 'Halus, pink, vena terlihat' }, { v: 2, l: 'Deskuamasi superfisial' }, { v: 3, l: 'Retak, area pucat' }, { v: 4, l: 'Retak dalam, tak ada vena' }, { v: 5, l: 'Kasar, keriput' }] },
  { key: 'lanugo', label: 'Lanugo', opts: [{ v: -1, l: 'Tidak ada' }, { v: 0, l: 'Jarang' }, { v: 1, l: 'Menipis' }, { v: 2, l: 'Area botak' }, { v: 3, l: 'Sebagian besar botak' }] },
  { key: 'plantar', label: 'Permukaan Plantar', opts: [{ v: -1, l: '<40mm, tanpa garis' }, { v: 0, l: '40-50mm' }, { v: 1, l: 'Garis merah samar' }, { v: 2, l: 'Garis transversal anterior' }, { v: 3, l: 'Garis 2/3 anterior' }, { v: 4, l: 'Garis di seluruh telapak' }] },
  { key: 'breast', label: 'Payudara', opts: [{ v: -1, l: 'Tak terpalpasi' }, { v: 0, l: 'Nyaris tak terpalpasi' }, { v: 1, l: 'Areola datar, tanpa bud' }, { v: 2, l: 'Areola berbintik, bud 1-2mm' }, { v: 3, l: 'Areola menonjol, bud 3-4mm' }, { v: 4, l: 'Areola penuh, bud 5-10mm' }] },
  { key: 'eyeEar', label: 'Mata/Telinga', opts: [{ v: -1, l: 'Kelopak menyatu longgar' }, { v: 0, l: 'Kelopak menyatu erat' }, { v: 1, l: 'Kelopak terbuka, pinna datar' }, { v: 2, l: 'Pinna sedikit melengkung' }, { v: 3, l: 'Pinna melengkung, lunak' }, { v: 4, l: 'Kartilago tebal, kaku' }] },
  { key: 'genitals', label: 'Genitalia', opts: [{ v: -1, l: 'Skrotum datar/labia rata' }, { v: 0, l: 'Skrotum kosong/labia menonjol' }, { v: 1, l: 'Testis turun sebagian' }, { v: 2, l: 'Testis di kanal atas/labia mayor besar' }, { v: 3, l: 'Testis turun, rugae sedang' }, { v: 4, l: 'Testis turun penuh, rugae dalam' }] },
]

function BallardSoapCalc() {
  const [neuro, setNeuro] = useState<Record<string, number>>({ posture: 2, squareWindow: 2, armRecoil: 1, poplitealAngle: 2, scarfSign: 1, heelToEar: 1 })
  const [phys, setPhys] = useState<Record<string, number>>({ skin: 2, lanugo: 1, plantar: 2, breast: 2, eyeEar: 2, genitals: 2 })
  const [apgar1, setApgar1] = useState(8)
  const [apgar5, setApgar5] = useState(9)
  const [birthWeightG, setBirthWeightG] = useState(3000)
  const [babyName, setBabyName] = useState('')
  const [sex, setSex] = useState<'M' | 'F'>('M')

  const total = Object.values(neuro).reduce((a, b) => a + b, 0) + Object.values(phys).reduce((a, b) => a + b, 0)
  const gaWeeks = ballardScoreToGA(total)
  const lub = lubchencoClass(gaWeeks, birthWeightG)

  const soapNote = `SOAP — Penilaian Neonatus${babyName ? ` (${babyName})` : ''}
Jenis Kelamin: ${sex === 'M' ? 'Laki-laki' : 'Perempuan'} · Berat Lahir: ${birthWeightG} g

S (Subjective): Bayi baru lahir, dilakukan penilaian maturitas & adaptasi segera pascalahir.

O (Objective):
- APGAR menit ke-1: ${apgar1}/10, menit ke-5: ${apgar5}/10
- New Ballard Score total: ${total} → estimasi usia gestasi ${gaWeeks.toFixed(1)} minggu
- Klasifikasi berat lahir terhadap usia gestasi (Lubchenco): ${lub.l}

A (Assessment):
- ${gaWeeks < 37 ? 'Prematur' : gaWeeks > 42 ? 'Post-term' : 'Aterm'} (estimasi Ballard ${gaWeeks.toFixed(1)} minggu)
- ${lub.l}
- APGAR 5 menit ${apgar5 >= 7 ? 'baik, adaptasi neonatal memadai' : apgar5 >= 4 ? 'perlu observasi ketat' : 'depresi berat, perlu resusitasi lanjutan & rujukan NICU'}

P (Plan):
- Rawat sesuai usia gestasi & klasifikasi berat lahir (rawat gabung bila stabil; observasi NICU bila prematur/SGA/APGAR rendah)
- Pemantauan suhu, glukosa darah, dan tanda vital berkala
- Inisiasi menyusu dini bila kondisi stabil
- Profilaksis vitamin K1 & salep mata sesuai protokol
- Skrining rutin (hipotiroid kongenital, dll.) sesuai jadwal`

  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Ballard Score + Lubchenco → SOAP" subtitle="New Ballard Score (1991) untuk usia gestasi, klasifikasi Lubchenco, dirangkum otomatis ke SOAP" />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Field label="Nama Bayi (opsional)"><input className={inputClass} value={babyName} onChange={(e) => setBabyName(e.target.value)} placeholder="—" /></Field>
        <Field label="Jenis Kelamin"><SegButtons value={sex} onChange={setSex} options={[{ v: 'M', l: 'Laki-laki' }, { v: 'F', l: 'Perempuan' }]} /></Field>
        <Field label="Berat Lahir (g)"><input className={inputClass} type="number" value={birthWeightG} onChange={(e) => setBirthWeightG(+e.target.value)} /></Field>
        <Field label="APGAR 1' / 5'">
          <div className="flex gap-1.5">
            <input className={inputClass} type="number" min={0} max={10} value={apgar1} onChange={(e) => setApgar1(+e.target.value)} />
            <input className={inputClass} type="number" min={0} max={10} value={apgar5} onChange={(e) => setApgar5(+e.target.value)} />
          </div>
        </Field>
      </div>

      <h4 className="mt-4 text-xs font-black uppercase tracking-wide text-neutral-500">Maturitas Neuromuskular</h4>
      <div className="mt-2 space-y-2.5">
        {NEURO_CRITERIA.map((c) => (
          <Field key={c.key} label={c.label}>
            <SegButtons value={neuro[c.key]} onChange={(v) => setNeuro((s) => ({ ...s, [c.key]: v }))} options={c.opts} />
          </Field>
        ))}
      </div>

      <h4 className="mt-4 text-xs font-black uppercase tracking-wide text-neutral-500">Maturitas Fisik</h4>
      <div className="mt-2 space-y-2.5">
        {PHYSICAL_CRITERIA.map((c) => (
          <Field key={c.key} label={c.label}>
            <SegButtons value={phys[c.key]} onChange={(v) => setPhys((s) => ({ ...s, [c.key]: v }))} options={c.opts} />
          </Field>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <div className="text-lg font-black text-ink">{total}</div>
          <div className="text-[10px] font-bold uppercase text-neutral-400">Skor Ballard</div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <div className="text-lg font-black text-ink">{gaWeeks.toFixed(1)} mgu</div>
          <div className="text-[10px] font-bold uppercase text-neutral-400">Usia Gestasi</div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <Badge tone={lub.tone}>{lub.l.split(' ')[0]}</Badge>
          <div className="mt-1 text-[9px] font-bold uppercase text-neutral-400">Lubchenco</div>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="mb-2 text-xs font-black uppercase tracking-wide text-neutral-500">Draf SOAP (otomatis)</h4>
        <pre className="whitespace-pre-wrap rounded-xl bg-neutral-900 p-3 text-[11px] leading-relaxed text-neutral-100">{soapNote}</pre>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-neutral-400">
        Estimasi usia gestasi & klasifikasi Lubchenco disederhanakan dari titik acuan standar — verifikasi terhadap tabel/chart resmi untuk kasus borderline. Draf SOAP wajib ditinjau & dilengkapi dokter sebelum masuk rekam medis resmi.
      </p>
    </Card>
  )
}

/* ══════════════════ qSOFA ══════════════════ */
function QsofaCalc() {
  const [rr22, setRr22] = useState(false)
  const [alteredMental, setAlteredMental] = useState(false)
  const [sbp100, setSbp100] = useState(false)
  const total = [rr22, alteredMental, sbp100].filter(Boolean).length
  const interp = total >= 2
    ? { l: 'Risiko tinggi', tone: 'critical' as const, note: 'Curiga sepsis — evaluasi SOFA lengkap, kultur & tatalaksana sepsis segera.' }
    : { l: 'Risiko rendah', tone: 'normal' as const, note: 'qSOFA tidak dirancang untuk skrining awal di luar ICU secara tunggal — tetap gunakan penilaian klinis.' }
  const Row = ({ label, sub, checked, onChange }: { label: string; sub: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-brand" />
      <div><div className="text-sm font-bold text-ink">{label}</div><div className="text-[11px] text-neutral-400">{sub}</div></div>
    </label>
  )
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="qSOFA" subtitle="Quick SOFA — skrining cepat disfungsi organ terkait infeksi (Sepsis-3, 2016)" />
      <div className="space-y-2">
        <Row label="Laju napas ≥22x/menit" sub="Takipnea" checked={rr22} onChange={setRr22} />
        <Row label="Perubahan status mental" sub="GCS <15 / kebingungan akut" checked={alteredMental} onChange={setAlteredMental} />
        <Row label="Tekanan darah sistolik ≤100 mmHg" sub="Hipotensi" checked={sbp100} onChange={setSbp100} />
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-black text-ink">{total}<span className="text-sm font-semibold text-neutral-400">/3</span></div>
          <Badge tone={interp.tone}>{interp.l}</Badge>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{interp.note}</p>
      </div>
    </Card>
  )
}

/* ══════════════════ HOLLIDAY-SEGAR MAINTENANCE FLUID ══════════════════ */
function HollidaySegarCalc() {
  const [weight, setWeight] = useState(20)
  function mlPerDay(w: number): number {
    if (w <= 10) return w * 100
    if (w <= 20) return 1000 + (w - 10) * 50
    return 1500 + (w - 20) * 20
  }
  const daily = mlPerDay(weight)
  const hourly = daily / 24
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Holliday-Segar (Cairan Rumatan)" subtitle="Formula 4-2-1 klasik (Holliday & Segar, 1957)" />
      <Field label="Berat Badan (kg)"><input className={inputClass} type="number" step="0.1" value={weight} onChange={(e) => setWeight(+e.target.value)} /></Field>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <div className="text-xl font-black text-ink">{daily.toFixed(0)}</div>
          <div className="text-[10px] font-bold uppercase text-neutral-400">mL / 24 jam</div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <div className="text-xl font-black text-ink">{hourly.toFixed(1)}</div>
          <div className="text-[10px] font-bold uppercase text-neutral-400">mL / jam (tetesan rumatan)</div>
        </div>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">10kg pertama: 100 mL/kg · 10kg kedua: +50 mL/kg · setiap kg di atas 20: +20 mL/kg. Sesuaikan dengan status hidrasi, demam, dan kondisi klinis.</p>
    </Card>
  )
}

/* ══════════════════ PARKLAND FORMULA (BURN RESUSCITATION) ══════════════════ */
function ParklandCalc() {
  const [weight, setWeight] = useState(70)
  const [tbsa, setTbsa] = useState(20)
  const total24h = 4 * weight * tbsa
  const first8h = total24h / 2
  const first8hRate = first8h / 8
  const next16hRate = (total24h - first8h) / 16
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Parkland Formula" subtitle="Resusitasi cairan luka bakar ≥20% TBSA (Baxter, 1968)" />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Berat Badan (kg)"><input className={inputClass} type="number" value={weight} onChange={(e) => setWeight(+e.target.value)} /></Field>
        <Field label="% TBSA (luas luka bakar)"><input className={inputClass} type="number" min={0} max={100} value={tbsa} onChange={(e) => setTbsa(+e.target.value)} /></Field>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <div className="text-lg font-black text-ink">{total24h.toFixed(0)}</div>
          <div className="text-[9px] font-bold uppercase text-neutral-400">mL Total 24 jam</div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <div className="text-lg font-black text-ink">{first8hRate.toFixed(0)}</div>
          <div className="text-[9px] font-bold uppercase text-neutral-400">mL/jam (8 jam pertama)</div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <div className="text-lg font-black text-ink">{next16hRate.toFixed(0)}</div>
          <div className="text-[9px] font-bold uppercase text-neutral-400">mL/jam (16 jam berikut)</div>
        </div>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">Total = 4 mL × berat(kg) × %TBSA, cairan kristaloid (RL). Separuh diberikan dalam 8 jam pertama SEJAK WAKTU CEDERA (bukan sejak tiba di RS), separuh sisanya dalam 16 jam berikutnya. Sesuaikan dengan output urin (target ~0.5 mL/kg/jam dewasa).</p>
    </Card>
  )
}

/* ══════════════════ NAEGELE'S RULE + USIA GESTASI ══════════════════ */
function NaegeleCalc() {
  const [lmp, setLmp] = useState('')
  const [cycleLen, setCycleLen] = useState(28)
  let edd: Date | null = null
  let gaWeeks = 0
  let gaDays = 0
  if (lmp) {
    const lmpDate = new Date(lmp)
    const cycleAdj = cycleLen - 28
    edd = new Date(lmpDate)
    edd.setDate(edd.getDate() + 280 + cycleAdj)
    const diffDays = Math.floor((Date.now() - lmpDate.getTime()) / 86400000) + cycleAdj
    gaWeeks = Math.floor(diffDays / 7)
    gaDays = diffDays % 7
  }
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Naegele's Rule" subtitle="Taksiran hari lahir (EDD) & usia gestasi dari HPHT" />
      <div className="grid grid-cols-2 gap-2">
        <Field label="HPHT (hari pertama haid terakhir)"><input className={inputClass} type="date" value={lmp} onChange={(e) => setLmp(e.target.value)} /></Field>
        <Field label="Panjang Siklus Haid (hari)"><input className={inputClass} type="number" value={cycleLen} onChange={(e) => setCycleLen(+e.target.value)} /></Field>
      </div>
      {edd && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-neutral-50 p-3 text-center">
            <div className="text-base font-black text-ink">{edd.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div className="text-[10px] font-bold uppercase text-neutral-400">Taksiran Persalinan (EDD)</div>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3 text-center">
            <div className="text-base font-black text-ink">{gaWeeks}mgu {gaDays}hr</div>
            <div className="text-[10px] font-bold uppercase text-neutral-400">Usia Gestasi Saat Ini</div>
          </div>
        </div>
      )}
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">Naegele's Rule: EDD = HPHT + 280 hari (disesuaikan bila siklus haid bukan 28 hari). Konfirmasi dengan USG trimester pertama bila memungkinkan — lebih akurat dari HPHT saja, terutama pada siklus tidak teratur.</p>
    </Card>
  )
}

/* ══════════════════ MAP (MEAN ARTERIAL PRESSURE) ══════════════════ */
function MapCalc() {
  const [sys, setSys] = useState(120)
  const [dia, setDia] = useState(80)
  const map = (sys + 2 * dia) / 3
  const interp = map < 60
    ? { l: 'Sangat rendah', tone: 'critical' as const, note: 'Perfusi organ berisiko terganggu — evaluasi syok/hipoperfusi.' }
    : map <= 100
    ? { l: 'Normal', tone: 'normal' as const, note: 'Umumnya cukup untuk perfusi organ (target MAP ≥65 pada syok septik).' }
    : { l: 'Tinggi', tone: 'low' as const, note: 'Evaluasi hipertensi / krisis hipertensi bila sangat tinggi.' }
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Mean Arterial Pressure (MAP)" subtitle="Tekanan perfusi rata-rata organ" />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Sistolik (mmHg)"><input className={inputClass} type="number" value={sys} onChange={(e) => setSys(+e.target.value)} /></Field>
        <Field label="Diastolik (mmHg)"><input className={inputClass} type="number" value={dia} onChange={(e) => setDia(+e.target.value)} /></Field>
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-black text-ink">{map.toFixed(0)}<span className="text-sm font-semibold text-neutral-400"> mmHg</span></div>
          <Badge tone={interp.tone}>{interp.l}</Badge>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{interp.note}</p>
      </div>
      <p className="mt-3 text-[10px] text-neutral-400">MAP = (Sistolik + 2×Diastolik) / 3.</p>
    </Card>
  )
}

/* ══════════════════ ALVARADO SCORE (APENDISITIS) ══════════════════ */
function AlvaradoCalc() {
  const criteria = [
    { key: 'migratoryPain', label: 'Nyeri berpindah ke kanan bawah', pts: 1 },
    { key: 'anorexia', label: 'Anoreksia', pts: 1 },
    { key: 'nauseaVomit', label: 'Mual/muntah', pts: 1 },
    { key: 'rlqTender', label: 'Nyeri tekan kuadran kanan bawah', pts: 2 },
    { key: 'rebound', label: 'Nyeri lepas (rebound tenderness)', pts: 1 },
    { key: 'fever', label: 'Demam ≥37.3°C', pts: 1 },
    { key: 'leukocytosis', label: 'Leukositosis >10.000', pts: 2 },
    { key: 'shiftLeft', label: 'Neutrofil shift kiri (>75%)', pts: 1 },
  ]
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const total = criteria.reduce((sum, c) => sum + (checked[c.key] ? c.pts : 0), 0)
  const interp = total <= 4
    ? { l: 'Kemungkinan rendah', tone: 'normal' as const, note: 'Apendisitis kurang mungkin — pertimbangkan observasi/diagnosis banding lain.' }
    : total <= 6
    ? { l: 'Kemungkinan sedang', tone: 'low' as const, note: 'Pertimbangkan pencitraan lanjut (USG/CT) untuk konfirmasi.' }
    : { l: 'Kemungkinan tinggi', tone: 'critical' as const, note: 'Pertimbangkan konsultasi bedah untuk apendektomi.' }
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Alvarado Score" subtitle="Skor klinis kecurigaan apendisitis akut (Alvarado, 1986)" />
      <div className="space-y-2">
        {criteria.map((c) => (
          <label key={c.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50">
            <input type="checkbox" checked={!!checked[c.key]} onChange={(e) => setChecked((s) => ({ ...s, [c.key]: e.target.checked }))} className="h-5 w-5 accent-brand" />
            <div className="flex-1 text-sm font-bold text-ink">{c.label}</div>
            <span className="text-xs font-black text-neutral-400">+{c.pts}</span>
          </label>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-black text-ink">{total}<span className="text-sm font-semibold text-neutral-400">/10</span></div>
          <Badge tone={interp.tone}>{interp.l}</Badge>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{interp.note}</p>
      </div>
    </Card>
  )
}

const TABS = [
  { id: 'apgar', label: 'APGAR' },
  { id: 'gcs', label: 'GCS' },
  { id: 'curb65', label: 'CURB-65' },
  { id: 'bishop', label: 'Bishop' },
  { id: 'ckdepi', label: 'CKD-EPI' },
  { id: 'whogrowth', label: 'WHO Growth' },
  { id: 'ballard', label: 'Ballard+SOAP' },
  { id: 'qsofa', label: 'qSOFA' },
  { id: 'hollidaysegar', label: 'Cairan Rumatan' },
  { id: 'parkland', label: 'Parkland' },
  { id: 'naegele', label: 'Naegele' },
  { id: 'map', label: 'MAP' },
  { id: 'alvarado', label: 'Alvarado' },
  { id: 'centor', label: 'Centor/McIsaac' },
  { id: 'nacorr', label: 'Koreksi Na⁺' },
  { id: 'broca', label: 'Broca IBW' },
  { id: 'midparental', label: 'Mid-Parental' },
  { id: 'fletcher', label: 'Fletcher Index' },
  { id: 'nose', label: 'NOSE' },
  { id: 'rsi', label: 'RSI' },
  { id: 'abcd2', label: 'ABCD²' },
  { id: 'four', label: 'FOUR Score' },
  { id: 'mcdonald', label: 'McDonald' },
  { id: 'paradise', label: 'Paradise' },
  { id: 'nihss', label: 'NIHSS' },
  { id: 'fluidbalance', label: 'Balans Cairan' },
  { id: 'pedsdose', label: 'Dosis Anak' },
  { id: 'vbac', label: 'VBAC Flamm-Geiger' },
  { id: 'denver', label: 'Denver II (Simplified)' },
  { id: 'atls', label: 'ATLS Primary Survey' },
  { id: 'abg', label: 'Analisis Gas Darah' },
  { id: 'burn', label: 'Kalkulator Luka Bakar' },
  { id: 'cranial', label: 'Saraf Kranial + Meningeal' },
  { id: 'competencies', label: 'Tracker Kompetensi' },
] as const

/* ══════════════════ CENTOR / McISAAC (STREP PHARYNGITIS) ══════════════════ */
function CentorCalc() {
  const [fever, setFever] = useState(false)
  const [noCough, setNoCough] = useState(false)
  const [tenderNodes, setTenderNodes] = useState(false)
  const [exudate, setExudate] = useState(false)
  const [age, setAge] = useState(30)
  const ageAdj = age < 15 ? 1 : age >= 45 ? -1 : 0
  const total = [fever, noCough, tenderNodes, exudate].filter(Boolean).length + ageAdj
  const interp = total <= 0
    ? { l: 'Risiko sangat rendah (1-2.5%)', tone: 'normal' as const, note: 'Tidak perlu swab/antibiotik empiris.' }
    : total === 1
    ? { l: 'Risiko rendah (5-10%)', tone: 'normal' as const, note: 'Umumnya tidak perlu antibiotik.' }
    : total === 2
    ? { l: 'Risiko sedang (11-17%)', tone: 'low' as const, note: 'Pertimbangkan rapid strep test/kultur sebelum antibiotik.' }
    : total === 3
    ? { l: 'Risiko tinggi (28-35%)', tone: 'low' as const, note: 'Uji strep dianjurkan; terapi bila positif.' }
    : { l: 'Risiko sangat tinggi (51-53%)', tone: 'critical' as const, note: 'Pertimbangkan antibiotik empiris (mis. penisilin) atau uji cepat dulu sesuai kebijakan lokal.' }
  const Row = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-brand" />
      <div className="text-sm font-bold text-ink">{label}</div>
    </label>
  )
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Centor / McIsaac Score" subtitle="Kemungkinan faringitis streptokokus (Centor 1981, modifikasi McIsaac 1998)" />
      <div className="space-y-2">
        <Row label="Demam >38°C" checked={fever} onChange={setFever} />
        <Row label="Tanpa batuk" checked={noCough} onChange={setNoCough} />
        <Row label="Limfadenopati servikal anterior nyeri tekan" checked={tenderNodes} onChange={setTenderNodes} />
        <Row label="Eksudat/pembengkakan tonsil" checked={exudate} onChange={setExudate} />
        <Field label="Usia (tahun)"><input className={inputClass} type="number" value={age} onChange={(e) => setAge(+e.target.value)} /></Field>
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-black text-ink">{total}</div>
          <Badge tone={interp.tone}>{interp.l}</Badge>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{interp.note}</p>
      </div>
      <p className="mt-3 text-[10px] text-neutral-400">Modifikasi McIsaac: usia &lt;15th (+1), 15-44th (+0), ≥45th (-1).</p>
    </Card>
  )
}

/* ══════════════════ KOREKSI NATRIUM (HIPERGLIKEMIA) ══════════════════ */
function NaCorrectionCalc() {
  const [measuredNa, setMeasuredNa] = useState(130)
  const [glucose, setGlucose] = useState(400)
  // Katz correction: +1.6 mEq/L Na per 100 mg/dL glucose above 100 mg/dL
  const correctedNa = measuredNa + 1.6 * Math.max(0, (glucose - 100) / 100)
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Koreksi Natrium (Hiperglikemia)" subtitle="Formula Katz (1973) — natrium sejati saat glukosa tinggi" />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Natrium Terukur (mEq/L)"><input className={inputClass} type="number" value={measuredNa} onChange={(e) => setMeasuredNa(+e.target.value)} /></Field>
        <Field label="Glukosa Darah (mg/dL)"><input className={inputClass} type="number" value={glucose} onChange={(e) => setGlucose(+e.target.value)} /></Field>
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3 text-center">
        <div className="text-2xl font-black text-ink">{correctedNa.toFixed(1)} <span className="text-sm font-semibold text-neutral-400">mEq/L</span></div>
        <div className="mt-1 text-[10px] font-bold uppercase text-neutral-400">Natrium Terkoreksi</div>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">Na Terkoreksi = Na Terukur + 1.6 × [(Glukosa − 100) / 100]. Hiperglikemia menarik air keluar sel, mengencerkan natrium serum secara faktisial — koreksi ini mengungkap status natrium sebenarnya, penting sebelum menyimpulkan hiponatremia pada DKA/HHS.</p>
    </Card>
  )
}

/* ══════════════════ BROCA'S FORMULA (IDEAL BODY WEIGHT) ══════════════════ */
function BrocaCalc() {
  const [height, setHeight] = useState(165)
  const [sex, setSex] = useState<'M' | 'F'>('M')
  const base = height - 100
  const ibw = sex === 'M' ? base - base * 0.1 : base - base * 0.15
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Broca's Formula (Berat Badan Ideal)" subtitle="Broca Index, dimodifikasi untuk jenis kelamin" />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Tinggi Badan (cm)"><input className={inputClass} type="number" value={height} onChange={(e) => setHeight(+e.target.value)} /></Field>
        <Field label="Jenis Kelamin"><SegButtons value={sex} onChange={setSex} options={[{ v: 'M', l: 'Pria' }, { v: 'F', l: 'Wanita' }]} /></Field>
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3 text-center">
        <div className="text-2xl font-black text-ink">{ibw.toFixed(1)} <span className="text-sm font-semibold text-neutral-400">kg</span></div>
        <div className="mt-1 text-[10px] font-bold uppercase text-neutral-400">Berat Badan Ideal (Broca)</div>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">Pria: (TB − 100) − 10%. Wanita: (TB − 100) − 15%. Perkiraan sederhana — untuk kebutuhan klinis presisi lebih tinggi (mis. dosis obat), pertimbangkan rumus Devine/Robinson.</p>
    </Card>
  )
}

/* ══════════════════ MID-PARENTAL HEIGHT ══════════════════ */
function MidParentalCalc() {
  const [fatherCm, setFatherCm] = useState(170)
  const [motherCm, setMotherCm] = useState(158)
  const [childSex, setChildSex] = useState<'M' | 'F'>('M')
  const mph = childSex === 'M' ? (fatherCm + motherCm + 13) / 2 : (fatherCm + motherCm - 13) / 2
  const rangeLo = mph - 8.5
  const rangeHi = mph + 8.5
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Mid-Parental Height" subtitle="Prediksi target tinggi dewasa anak dari tinggi orang tua" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Field label="Tinggi Ayah (cm)"><input className={inputClass} type="number" value={fatherCm} onChange={(e) => setFatherCm(+e.target.value)} /></Field>
        <Field label="Tinggi Ibu (cm)"><input className={inputClass} type="number" value={motherCm} onChange={(e) => setMotherCm(+e.target.value)} /></Field>
        <Field label="Jenis Kelamin Anak"><SegButtons value={childSex} onChange={setChildSex} options={[{ v: 'M', l: 'Laki-laki' }, { v: 'F', l: 'Perempuan' }]} /></Field>
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3 text-center">
        <div className="text-2xl font-black text-ink">{mph.toFixed(1)} cm</div>
        <div className="mt-1 text-[10px] font-bold uppercase text-neutral-400">Target Tinggi (rentang ±8.5cm: {rangeLo.toFixed(0)}–{rangeHi.toFixed(0)} cm)</div>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">Laki-laki: (TB Ayah + TB Ibu + 13) / 2. Perempuan: (TB Ayah + TB Ibu − 13) / 2. Rentang ±8.5cm mencakup ~90% target genetik — penyimpangan jauh dari rentang ini pada anak layak dievaluasi endokrin/gizi.</p>
    </Card>
  )
}

/* ══════════════════ FLETCHER INDEX (HEARING LOSS) ══════════════════ */
function FletcherCalc() {
  const [t500, setT500] = useState(20)
  const [t1000, setT1000] = useState(20)
  const [t2000, setT2000] = useState(20)
  const index = (t500 + t1000 + t2000) / 3
  const cls = index < 26
    ? { l: 'Normal', tone: 'normal' as const }
    : index < 41
    ? { l: 'Tuli ringan', tone: 'low' as const }
    : index < 56
    ? { l: 'Tuli sedang', tone: 'low' as const }
    : index < 71
    ? { l: 'Tuli sedang-berat', tone: 'critical' as const }
    : index < 91
    ? { l: 'Tuli berat', tone: 'critical' as const }
    : { l: 'Tuli sangat berat (total)', tone: 'critical' as const }
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Fletcher Index" subtitle="Rata-rata ambang nada murni 500/1000/2000 Hz — klasifikasi derajat tuli" />
      <div className="grid grid-cols-3 gap-2">
        <Field label="500 Hz (dB)"><input className={inputClass} type="number" value={t500} onChange={(e) => setT500(+e.target.value)} /></Field>
        <Field label="1000 Hz (dB)"><input className={inputClass} type="number" value={t1000} onChange={(e) => setT1000(+e.target.value)} /></Field>
        <Field label="2000 Hz (dB)"><input className={inputClass} type="number" value={t2000} onChange={(e) => setT2000(+e.target.value)} /></Field>
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-black text-ink">{index.toFixed(1)} dB</div>
          <Badge tone={cls.tone}>{cls.l}</Badge>
        </div>
      </div>
      <p className="mt-3 text-[10px] text-neutral-400">Fletcher Index = rata-rata ambang 500+1000+2000 Hz. &lt;26dB normal · 26-40 ringan · 41-55 sedang · 56-70 sedang-berat · 71-90 berat · &gt;90 sangat berat.</p>
    </Card>
  )
}

/* ══════════════════ NOSE SCORE ══════════════════ */
function NoseCalc() {
  const items = [
    'Kongesti/tersumbat hidung',
    'Obstruksi/sumbatan hidung',
    'Kesulitan bernapas lewat hidung',
    'Kesulitan tidur',
    'Tidak cukup udara lewat hidung saat aktivitas',
  ]
  const opts = [{ v: 0, l: 'Tidak ada' }, { v: 1, l: 'Ringan' }, { v: 2, l: 'Sedang' }, { v: 3, l: 'Berat' }, { v: 4, l: 'Sangat berat' }]
  const [vals, setVals] = useState<number[]>([0, 0, 0, 0, 0])
  const total = vals.reduce((a, b) => a + b, 0) * 5 // 0-100 scale
  const cls = total <= 25 ? { l: 'Ringan', tone: 'normal' as const } : total <= 50 ? { l: 'Sedang', tone: 'low' as const } : total <= 75 ? { l: 'Berat', tone: 'critical' as const } : { l: 'Sangat berat', tone: 'critical' as const }
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="NOSE Score" subtitle="Nasal Obstruction Symptom Evaluation — kualitas hidup obstruksi hidung" />
      <div className="space-y-3">
        {items.map((label, i) => (
          <Field key={label} label={label}>
            <SegButtons value={vals[i]} onChange={(v) => setVals((s) => s.map((x, j) => (j === i ? v : x)))} options={opts} />
          </Field>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-black text-ink">{total}<span className="text-sm font-semibold text-neutral-400">/100</span></div>
          <Badge tone={cls.tone}>{cls.l}</Badge>
        </div>
      </div>
      <p className="mt-3 text-[10px] text-neutral-400">Total = jumlah 5 item (0-4 masing-masing) × 5, skala 0-100.</p>
    </Card>
  )
}

/* ══════════════════ REFLUX SYMPTOM INDEX (RSI) ══════════════════ */
function RsiCalc() {
  const items = [
    'Suara serak/gangguan suara',
    'Sering berdehem',
    'Lendir berlebih di tenggorokan/tetesan pascanasal',
    'Kesulitan menelan makanan/cairan/pil',
    'Batuk setelah makan/berbaring',
    'Kesulitan bernapas/tersedak',
    'Batuk yang mengganggu',
    'Sensasi ganjalan di tenggorokan',
    'Nyeri ulu hati, dada, atau rasa asam naik',
  ]
  const [vals, setVals] = useState<number[]>(Array(9).fill(0))
  const total = vals.reduce((a, b) => a + b, 0)
  const abnormal = total > 13
  const opts = [0, 1, 2, 3, 4, 5].map((v) => ({ v, l: String(v) }))
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Reflux Symptom Index (RSI)" subtitle="Belafsky et al., 2002 — skrining refluks laringofaringeal" />
      <div className="space-y-3">
        {items.map((label, i) => (
          <Field key={label} label={label}>
            <SegButtons value={vals[i]} onChange={(v) => setVals((s) => s.map((x, j) => (j === i ? v : x)))} options={opts} />
          </Field>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-black text-ink">{total}<span className="text-sm font-semibold text-neutral-400">/45</span></div>
          <Badge tone={abnormal ? 'critical' : 'normal'}>{abnormal ? 'Abnormal' : 'Normal'}</Badge>
        </div>
        <p className="mt-2 text-[11px] text-neutral-500">Skala 0 (tidak ada masalah) - 5 (bermasalah berat) per item. Skor &gt;13 dianggap abnormal, sugestif refluks laringofaringeal.</p>
      </div>
    </Card>
  )
}

/* ══════════════════ ABCD² SCORE (TIA STROKE RISK) ══════════════════ */
function Abcd2Calc() {
  const [age60, setAge60] = useState(false)
  const [bp140, setBp140] = useState(false)
  const [clinical, setClinical] = useState<'none' | 'speech' | 'weakness'>('none')
  const [duration, setDuration] = useState<'lt10' | '10to59' | 'ge60'>('lt10')
  const [diabetes, setDiabetes] = useState(false)
  const clinicalPts = clinical === 'weakness' ? 2 : clinical === 'speech' ? 1 : 0
  const durationPts = duration === 'ge60' ? 2 : duration === '10to59' ? 1 : 0
  const total = (age60 ? 1 : 0) + (bp140 ? 1 : 0) + clinicalPts + durationPts + (diabetes ? 1 : 0)
  const interp = total <= 3
    ? { l: 'Risiko rendah', tone: 'normal' as const, note: 'Risiko stroke 2 hari ~1%. Evaluasi rawat jalan mungkin sesuai bila fasilitas follow-up cepat tersedia.' }
    : total <= 5
    ? { l: 'Risiko sedang', tone: 'low' as const, note: 'Risiko stroke 2 hari ~4.1%. Pertimbangkan observasi/rawat inap.' }
    : { l: 'Risiko tinggi', tone: 'critical' as const, note: 'Risiko stroke 2 hari ~8.1%. Rawat inap & evaluasi mendesak dianjurkan.' }
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="ABCD² Score" subtitle="Prediksi risiko stroke pasca-TIA (Johnston et al., 2007)" />
      <div className="space-y-3">
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50">
          <input type="checkbox" checked={age60} onChange={(e) => setAge60(e.target.checked)} className="h-5 w-5 accent-brand" />
          <div className="text-sm font-bold text-ink">Usia ≥60 tahun (+1)</div>
        </label>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50">
          <input type="checkbox" checked={bp140} onChange={(e) => setBp140(e.target.checked)} className="h-5 w-5 accent-brand" />
          <div className="text-sm font-bold text-ink">TD ≥140/90 mmHg saat penilaian (+1)</div>
        </label>
        <Field label="Gambaran Klinis"><SegButtons value={clinical} onChange={setClinical} options={[{ v: 'none', l: 'Lainnya (0)' }, { v: 'speech', l: 'Gangguan bicara tanpa kelemahan (+1)' }, { v: 'weakness', l: 'Kelemahan unilateral (+2)' }]} /></Field>
        <Field label="Durasi Gejala"><SegButtons value={duration} onChange={setDuration} options={[{ v: 'lt10', l: '<10 menit (0)' }, { v: '10to59', l: '10-59 menit (+1)' }, { v: 'ge60', l: '≥60 menit (+2)' }]} /></Field>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50">
          <input type="checkbox" checked={diabetes} onChange={(e) => setDiabetes(e.target.checked)} className="h-5 w-5 accent-brand" />
          <div className="text-sm font-bold text-ink">Diabetes (+1)</div>
        </label>
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-black text-ink">{total}<span className="text-sm font-semibold text-neutral-400">/7</span></div>
          <Badge tone={interp.tone}>{interp.l}</Badge>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{interp.note}</p>
      </div>
    </Card>
  )
}

/* ══════════════════ FOUR SCORE (COMA SCALE) ══════════════════ */
function FourScoreCalc() {
  const eye = [{ v: 0, l: 'Tak buka mata' }, { v: 1, l: 'Buka bila nyeri' }, { v: 2, l: 'Buka bila suara keras' }, { v: 3, l: 'Buka spontan, tak mengikuti' }, { v: 4, l: 'Buka spontan, mengikuti/berkedip diperintah' }]
  const motor = [{ v: 0, l: 'Tak respons/status mioklonik' }, { v: 1, l: 'Postur ekstensi' }, { v: 2, l: 'Postur fleksi' }, { v: 3, l: 'Lokalisasi nyeri' }, { v: 4, l: 'Ikuti perintah (jempol/kepal/salam)' }]
  const brainstem = [{ v: 0, l: 'Tak ada refleks pupil/kornea/batuk' }, { v: 1, l: 'Pupil & kornea tak ada' }, { v: 2, l: 'Salah satu pupil lebar & tetap' }, { v: 3, l: 'Satu refleks pupil/kornea tak ada' }, { v: 4, l: 'Refleks pupil & kornea ada' }]
  const respiration = [{ v: 0, l: 'Apnea / sinkron ventilator' }, { v: 1, l: 'Napas di atas laju ventilator' }, { v: 2, l: 'Tak teratur' }, { v: 3, l: 'Pola Cheyne-Stokes' }, { v: 4, l: 'Teratur, tak terintubasi' }]
  const [e, setE] = useState(4); const [m, setM] = useState(4); const [b, setB] = useState(4); const [r, setR] = useState(4)
  const total = e + m + b + r
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="FOUR Score" subtitle="Full Outline of UnResponsiveness (Wijdicks et al., 2005) — alternatif GCS, menilai batang otak & pola napas" />
      <div className="space-y-3">
        <Field label="Eye Response (E)"><SegButtons value={e} onChange={setE} options={eye} /></Field>
        <Field label="Motor Response (M)"><SegButtons value={m} onChange={setM} options={motor} /></Field>
        <Field label="Brainstem Reflexes (B)"><SegButtons value={b} onChange={setB} options={brainstem} /></Field>
        <Field label="Respiration (R)"><SegButtons value={r} onChange={setR} options={respiration} /></Field>
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3 text-center">
        <div className="text-2xl font-black text-ink">E{e}M{m}B{b}R{r} = {total}<span className="text-sm font-semibold text-neutral-400">/16</span></div>
        <p className="mt-2 text-[11px] text-neutral-500">Skor lebih rendah → kesadaran lebih terganggu. Unggul dari GCS untuk menilai pasien terintubasi (menilai napas, bukan verbal) dan mendeteksi tanda batang otak/locked-in.</p>
      </div>
    </Card>
  )
}

/* ══════════════════ MCDONALD'S RULE (FUNDAL HEIGHT) ══════════════════ */
function McDonaldCalc() {
  const [fundalCm, setFundalCm] = useState(28)
  const gaWeeksEst = fundalCm // McDonald's rule: fundal height (cm) ≈ GA (weeks), valid ~20-36 weeks
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="McDonald's Rule" subtitle="Estimasi usia gestasi dari tinggi fundus uteri (20-36 minggu)" />
      <Field label="Tinggi Fundus Uteri (cm, simfisis-fundus)"><input className={inputClass} type="number" value={fundalCm} onChange={(e) => setFundalCm(+e.target.value)} /></Field>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3 text-center">
        <div className="text-2xl font-black text-ink">≈ {gaWeeksEst} <span className="text-sm font-semibold text-neutral-400">minggu</span></div>
        <div className="mt-1 text-[10px] font-bold uppercase text-neutral-400">Estimasi Usia Gestasi</div>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">McDonald's Rule: TFU (cm) ≈ usia gestasi (minggu) antara 20-36 minggu kehamilan tunggal dengan pertumbuhan janin normal. Deviasi &gt;3cm dari usia gestasi sebenarnya (dari HPHT/USG) perlu evaluasi lanjut (oligo/polihidramnion, IUGR, makrosomia, kehamilan ganda).</p>
    </Card>
  )
}

/* ══════════════════ PARADISE CRITERIA (TONSILEKTOMI) ══════════════════ */
function ParadiseCalc() {
  const [y1, setY1] = useState(0)
  const [y2, setY2] = useState(0)
  const [y3, setY3] = useState(0)
  const [documented, setDocumented] = useState(false)
  const meets = documented && (y1 >= 7 || (y1 >= 5 && y2 >= 5) || (y1 >= 3 && y2 >= 3 && y3 >= 3))
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Paradise Criteria" subtitle="Indikasi tonsilektomi pada faringitis/tonsilitis berulang (Paradise et al., 1984)" />
      <div className="grid grid-cols-3 gap-2">
        <Field label="Episode Tahun Ini"><input className={inputClass} type="number" value={y1} onChange={(e) => setY1(+e.target.value)} /></Field>
        <Field label="Episode Tahun Lalu"><input className={inputClass} type="number" value={y2} onChange={(e) => setY2(+e.target.value)} /></Field>
        <Field label="Episode 2 Tahun Lalu"><input className={inputClass} type="number" value={y3} onChange={(e) => setY3(+e.target.value)} /></Field>
      </div>
      <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50">
        <input type="checkbox" checked={documented} onChange={(e) => setDocumented(e.target.checked)} className="h-5 w-5 accent-brand" />
        <div className="text-sm font-bold text-ink">Setiap episode terdokumentasi baik (demam &gt;38.3°C, eksudat tonsil, limfadenopati servikal nyeri, atau kultur streptokokus positif)</div>
      </label>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <Badge tone={meets ? 'critical' : 'normal'}>{meets ? 'Memenuhi kriteria Paradise' : 'Belum memenuhi kriteria'}</Badge>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">Kriteria: ≥7 episode dalam 1 tahun, ATAU ≥5/tahun selama 2 tahun berturut, ATAU ≥3/tahun selama 3 tahun berturut — dengan setiap episode terdokumentasi baik. Ini adalah salah satu indikasi, keputusan tonsilektomi tetap individual bersama dokter THT.</p>
      </div>
    </Card>
  )
}

/* ══════════════════ NIHSS (NIH STROKE SCALE) ══════════════════ */
function NihssCalc() {
  const items: { key: string; label: string; opts: { v: number; l: string }[] }[] = [
    { key: 'loc', label: '1a. Tingkat Kesadaran', opts: [{ v: 0, l: 'Sadar penuh' }, { v: 1, l: 'Somnolen' }, { v: 2, l: 'Stupor' }, { v: 3, l: 'Koma' }] },
    { key: 'locQ', label: '1b. Pertanyaan LOC (bulan, usia)', opts: [{ v: 0, l: 'Keduanya benar' }, { v: 1, l: 'Satu benar' }, { v: 2, l: 'Tak satupun benar' }] },
    { key: 'locC', label: '1c. Perintah LOC (buka/tutup mata, kepal)', opts: [{ v: 0, l: 'Keduanya benar' }, { v: 1, l: 'Satu benar' }, { v: 2, l: 'Tak satupun benar' }] },
    { key: 'gaze', label: '2. Gaze (Pandangan)', opts: [{ v: 0, l: 'Normal' }, { v: 1, l: 'Paresis parsial' }, { v: 2, l: 'Deviasi paksa' }] },
    { key: 'visual', label: '3. Lapang Pandang', opts: [{ v: 0, l: 'Tak ada gangguan' }, { v: 1, l: 'Hemianopia parsial' }, { v: 2, l: 'Hemianopia komplet' }, { v: 3, l: 'Hemianopia bilateral/buta' }] },
    { key: 'facial', label: '4. Paresis Wajah', opts: [{ v: 0, l: 'Normal' }, { v: 1, l: 'Paresis ringan' }, { v: 2, l: 'Paresis parsial' }, { v: 3, l: 'Paralisis komplet' }] },
    { key: 'motorArmL', label: '5a. Motorik Lengan Kiri', opts: [{ v: 0, l: 'Tak ada drift' }, { v: 1, l: 'Drift' }, { v: 2, l: 'Ada upaya melawan gravitasi' }, { v: 3, l: 'Tak ada upaya melawan gravitasi' }, { v: 4, l: 'Tak ada gerakan' }] },
    { key: 'motorArmR', label: '5b. Motorik Lengan Kanan', opts: [{ v: 0, l: 'Tak ada drift' }, { v: 1, l: 'Drift' }, { v: 2, l: 'Ada upaya melawan gravitasi' }, { v: 3, l: 'Tak ada upaya melawan gravitasi' }, { v: 4, l: 'Tak ada gerakan' }] },
    { key: 'motorLegL', label: '6a. Motorik Tungkai Kiri', opts: [{ v: 0, l: 'Tak ada drift' }, { v: 1, l: 'Drift' }, { v: 2, l: 'Ada upaya melawan gravitasi' }, { v: 3, l: 'Tak ada upaya melawan gravitasi' }, { v: 4, l: 'Tak ada gerakan' }] },
    { key: 'motorLegR', label: '6b. Motorik Tungkai Kanan', opts: [{ v: 0, l: 'Tak ada drift' }, { v: 1, l: 'Drift' }, { v: 2, l: 'Ada upaya melawan gravitasi' }, { v: 3, l: 'Tak ada upaya melawan gravitasi' }, { v: 4, l: 'Tak ada gerakan' }] },
    { key: 'ataxia', label: '7. Ataksia Anggota Gerak', opts: [{ v: 0, l: 'Tak ada' }, { v: 1, l: 'Satu anggota gerak' }, { v: 2, l: 'Dua anggota gerak' }] },
    { key: 'sensory', label: '8. Sensorik', opts: [{ v: 0, l: 'Normal' }, { v: 1, l: 'Defisit ringan-sedang' }, { v: 2, l: 'Defisit berat/hilang total' }] },
    { key: 'language', label: '9. Bahasa Terbaik', opts: [{ v: 0, l: 'Tak ada afasia' }, { v: 1, l: 'Afasia ringan-sedang' }, { v: 2, l: 'Afasia berat' }, { v: 3, l: 'Bisu/afasia global' }] },
    { key: 'dysarthria', label: '10. Disartria', opts: [{ v: 0, l: 'Normal' }, { v: 1, l: 'Ringan-sedang' }, { v: 2, l: 'Berat/anartria' }] },
    { key: 'extinction', label: '11. Ekstingsi/Inatensi (Neglect)', opts: [{ v: 0, l: 'Tak ada' }, { v: 1, l: 'Inatensi parsial' }, { v: 2, l: 'Inatensi berat/hemi-inatensi' }] },
  ]
  const [vals, setVals] = useState<Record<string, number>>(Object.fromEntries(items.map((i) => [i.key, 0])))
  const total = Object.values(vals).reduce((a, b) => a + b, 0)
  const interp = total === 0
    ? { l: 'Tanpa gejala stroke', tone: 'normal' as const }
    : total <= 4
    ? { l: 'Stroke ringan', tone: 'normal' as const }
    : total <= 15
    ? { l: 'Stroke sedang', tone: 'low' as const }
    : total <= 20
    ? { l: 'Stroke sedang-berat', tone: 'critical' as const }
    : { l: 'Stroke berat', tone: 'critical' as const }
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="NIH Stroke Scale (NIHSS)" subtitle="Penilaian keparahan stroke iskemik akut, 15 item, 0-42" />
      <div className="space-y-3">
        {items.map((it) => (
          <Field key={it.key} label={it.label}>
            <SegButtons value={vals[it.key]} onChange={(v) => setVals((s) => ({ ...s, [it.key]: v }))} options={it.opts} />
          </Field>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-black text-ink">{total}<span className="text-sm font-semibold text-neutral-400">/42</span></div>
          <Badge tone={interp.tone}>{interp.l}</Badge>
        </div>
      </div>
    </Card>
  )
}

/* ══════════════════ BALANS CAIRAN (FLUID BALANCE) ══════════════════ */
function FluidBalanceCalc() {
  const [oralIn, setOralIn] = useState(0)
  const [ivIn, setIvIn] = useState(0)
  const [otherIn, setOtherIn] = useState(0)
  const [urineOut, setUrineOut] = useState(0)
  const [drainOut, setDrainOut] = useState(0)
  const [insensible, setInsensible] = useState(500)
  const [otherOut, setOtherOut] = useState(0)
  const totalIn = oralIn + ivIn + otherIn
  const totalOut = urineOut + drainOut + insensible + otherOut
  const balance = totalIn - totalOut
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Balans Cairan (24 jam)" subtitle="Total intake vs output — pemantauan status cairan" />
      <h4 className="text-xs font-black uppercase tracking-wide text-neutral-500">Intake (mL)</h4>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Field label="Oral/Enteral"><input className={inputClass} type="number" value={oralIn} onChange={(e) => setOralIn(+e.target.value)} /></Field>
        <Field label="IV/Infus"><input className={inputClass} type="number" value={ivIn} onChange={(e) => setIvIn(+e.target.value)} /></Field>
        <Field label="Lainnya"><input className={inputClass} type="number" value={otherIn} onChange={(e) => setOtherIn(+e.target.value)} /></Field>
      </div>
      <h4 className="mt-4 text-xs font-black uppercase tracking-wide text-neutral-500">Output (mL)</h4>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Field label="Urin"><input className={inputClass} type="number" value={urineOut} onChange={(e) => setUrineOut(+e.target.value)} /></Field>
        <Field label="Drain/NGT"><input className={inputClass} type="number" value={drainOut} onChange={(e) => setDrainOut(+e.target.value)} /></Field>
        <Field label="Insensible Loss"><input className={inputClass} type="number" value={insensible} onChange={(e) => setInsensible(+e.target.value)} /></Field>
        <Field label="Lainnya"><input className={inputClass} type="number" value={otherOut} onChange={(e) => setOtherOut(+e.target.value)} /></Field>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-neutral-50 p-3 text-center"><div className="text-lg font-black text-ink">{totalIn}</div><div className="text-[9px] font-bold uppercase text-neutral-400">Total Intake</div></div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center"><div className="text-lg font-black text-ink">{totalOut}</div><div className="text-[9px] font-bold uppercase text-neutral-400">Total Output</div></div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center"><div className={`text-lg font-black ${balance >= 0 ? 'text-brand-dark' : 'text-red-600'}`}>{balance >= 0 ? '+' : ''}{balance}</div><div className="text-[9px] font-bold uppercase text-neutral-400">Balans (mL)</div></div>
      </div>
      <p className="mt-3 text-[10px] text-neutral-400">Insensible loss dewasa perkiraan ~500-800 mL/hari (naik bila demam/takipnea). Balans positif besar berkepanjangan → risiko overload; balans negatif → risiko dehidrasi/hipoperfusi.</p>
    </Card>
  )
}

/* ══════════════════ DOSIS OBAT ANAK (LIQUID/PUYER) ══════════════════ */
function PedsDoseCalc() {
  const [weight, setWeight] = useState(15)
  const [doseMgKg, setDoseMgKg] = useState(10)
  const [freqPerDay, setFreqPerDay] = useState(3)
  const [concMgMl, setConcMgMl] = useState(125 / 5) // e.g. amoxicillin syrup 125mg/5mL

  const totalDailyMg = weight * doseMgKg
  const perDoseMg = totalDailyMg / freqPerDay
  const perDoseMl = perDoseMg / concMgMl

  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Kalkulator Dosis Obat Anak" subtitle="Dosis cair (sirup) & puyer berdasarkan berat badan" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Field label="Berat Badan (kg)"><input className={inputClass} type="number" value={weight} onChange={(e) => setWeight(+e.target.value)} /></Field>
        <Field label="Dosis (mg/kg/hari)"><input className={inputClass} type="number" value={doseMgKg} onChange={(e) => setDoseMgKg(+e.target.value)} /></Field>
        <Field label="Frekuensi (kali/hari)"><input className={inputClass} type="number" value={freqPerDay} onChange={(e) => setFreqPerDay(+e.target.value)} /></Field>
        <Field label="Konsentrasi Sirup (mg/mL)"><input className={inputClass} type="number" step="0.1" value={concMgMl} onChange={(e) => setConcMgMl(+e.target.value)} /></Field>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-neutral-50 p-3 text-center"><div className="text-lg font-black text-ink">{totalDailyMg.toFixed(0)}</div><div className="text-[9px] font-bold uppercase text-neutral-400">mg/hari Total</div></div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center"><div className="text-lg font-black text-ink">{perDoseMg.toFixed(1)}</div><div className="text-[9px] font-bold uppercase text-neutral-400">mg/dosis</div></div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center"><div className="text-lg font-black text-ink">{perDoseMl.toFixed(2)}</div><div className="text-[9px] font-bold uppercase text-neutral-400">mL/dosis (sirup)</div></div>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">Total mg/hari = BB × dosis(mg/kg/hari). mg/dosis = total ÷ frekuensi. mL/dosis = mg/dosis ÷ konsentrasi sirup. Untuk puyer: bagi mg/dosis ke jumlah bungkus sesuai frekuensi peresepan. SELALU verifikasi terhadap dosis maksimal dewasa & formularium — kalkulator ini tidak menggantikan penilaian klinis & pustaka obat resmi.</p>
    </Card>
  )
}

/* ══════════════════ VBAC — FLAMM-GEIGER SCORE ══════════════════ */
function VbacCalc() {
  const [ageU40, setAgeU40] = useState(true)
  const [vagHx, setVagHx] = useState<'none' | 'before' | 'vbac'>('none')
  const [nonDystociaIndication, setNonDystociaIndication] = useState(false)
  const [effacement, setEffacement] = useState<'lt25' | '25to75' | 'ge75'>('25to75')
  const [dilation4, setDilation4] = useState(false)

  const agePts = ageU40 ? 2 : 0
  const vagHxPts = vagHx === 'vbac' ? 4 : vagHx === 'before' ? 2 : 0
  const indicationPts = nonDystociaIndication ? 1 : 0
  const effacementPts = effacement === 'ge75' ? 2 : effacement === '25to75' ? 1 : 0
  const dilationPts = dilation4 ? 1 : 0
  const total = agePts + vagHxPts + indicationPts + effacementPts + dilationPts

  const successPct = total <= 2 ? '~49%' : total <= 4 ? '~60%' : total <= 6 ? '~75%' : total <= 8 ? '~85%' : '~95%'

  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="VBAC — Flamm-Geiger Score" subtitle="Prediksi keberhasilan persalinan pervaginam pasca-SC (Flamm & Geiger, 1997)" />
      <div className="space-y-3">
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50">
          <input type="checkbox" checked={ageU40} onChange={(e) => setAgeU40(e.target.checked)} className="h-5 w-5 accent-brand" />
          <div className="text-sm font-bold text-ink">Usia &lt;40 tahun (+2)</div>
        </label>
        <Field label="Riwayat Persalinan Pervaginam">
          <SegButtons value={vagHx} onChange={setVagHx} options={[{ v: 'none', l: 'Tidak ada (0)' }, { v: 'before', l: 'Sebelum SC saja (+2)' }, { v: 'vbac', l: 'Pasca-SC/VBAC sebelumnya (+4)' }]} />
        </Field>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50">
          <input type="checkbox" checked={nonDystociaIndication} onChange={(e) => setNonDystociaIndication(e.target.checked)} className="h-5 w-5 accent-brand" />
          <div className="text-sm font-bold text-ink">Indikasi SC sebelumnya BUKAN distosia/kegagalan kemajuan persalinan (+1)</div>
        </label>
        <Field label="Effacement Serviks Saat Masuk">
          <SegButtons value={effacement} onChange={setEffacement} options={[{ v: 'lt25', l: '<25% (0)' }, { v: '25to75', l: '25-75% (+1)' }, { v: 'ge75', l: '≥75% (+2)' }]} />
        </Field>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50">
          <input type="checkbox" checked={dilation4} onChange={(e) => setDilation4(e.target.checked)} className="h-5 w-5 accent-brand" />
          <div className="text-sm font-bold text-ink">Dilatasi serviks ≥4cm saat masuk (+1)</div>
        </label>
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-black text-ink">{total}<span className="text-sm font-semibold text-neutral-400">/10</span></div>
          <Badge tone={total >= 7 ? 'normal' : total >= 4 ? 'low' : 'critical'}>Estimasi keberhasilan {successPct}</Badge>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">Skor lebih tinggi → prediksi keberhasilan VBAC lebih tinggi. Model prediksi ini adalah salah satu alat bantu keputusan — keputusan trial of labor after cesarean (TOLAC) tetap individual bersama obgyn, mempertimbangkan fasilitas emergensi SC tersedia.</p>
      </div>
    </Card>
  )
}

/* ══════════════════ DENVER II — SIMPLIFIED DEVELOPMENTAL SCREEN ══════════════════ */
// The full Denver II uses ~125 items with age-bar percentile plotting and
// standardized test materials. This is a SIMPLIFIED screening aid: a curated
// set of representative milestones per domain at standard checkpoint ages,
// not the full standardized instrument — for a definitive assessment, use
// the official Denver II kit/form administered per its manual.
interface Milestone { ageMo: number; label: string }
const DENVER_DOMAINS: { key: string; label: string; milestones: Milestone[] }[] = [
  { key: 'personal', label: 'Personal-Sosial', milestones: [
    { ageMo: 2, label: 'Senyum sosial (merespons wajah)' },
    { ageMo: 6, label: 'Makan sendiri (finger food)' },
    { ageMo: 9, label: 'Bermain ciluk-ba' },
    { ageMo: 12, label: 'Melambai dadah-dadah' },
    { ageMo: 18, label: 'Makan pakai sendok sendiri' },
    { ageMo: 24, label: 'Bermain paralel (berdampingan)' },
    { ageMo: 36, label: 'Bermain bergiliran dengan anak lain' },
    { ageMo: 48, label: 'Berpakaian sendiri sebagian' },
    { ageMo: 60, label: 'Memiliki teman bermain pilihan' },
  ] },
  { key: 'fineMotor', label: 'Motorik Halus-Adaptif', milestones: [
    { ageMo: 2, label: 'Tangan terbuka, refleks menggenggam menghilang' },
    { ageMo: 4, label: 'Meraih objek dengan sengaja' },
    { ageMo: 6, label: 'Memindahkan objek antar tangan' },
    { ageMo: 9, label: 'Jepitan jari-jempol (pincer grasp)' },
    { ageMo: 12, label: 'Mencoret dengan krayon' },
    { ageMo: 18, label: 'Menyusun 2-4 balok' },
    { ageMo: 24, label: 'Menyusun 6 balok / meniru garis' },
    { ageMo: 36, label: 'Meniru bentuk lingkaran' },
    { ageMo: 48, label: 'Menggambar orang 3 bagian' },
    { ageMo: 60, label: 'Menggambar orang 6 bagian / menulis nama' },
  ] },
  { key: 'language', label: 'Bahasa', milestones: [
    { ageMo: 2, label: 'Bersuara (cooing)' },
    { ageMo: 6, label: 'Mengoceh (babbling) tanpa makna spesifik' },
    { ageMo: 9, label: 'Memahami kata "tidak"' },
    { ageMo: 12, label: 'Mengucap 1 kata bermakna' },
    { ageMo: 18, label: 'Mengucap 3-6 kata' },
    { ageMo: 24, label: 'Menggabung 2 kata' },
    { ageMo: 36, label: 'Kalimat 3 kata, dipahami ~75% oleh orang asing' },
    { ageMo: 48, label: 'Bertanya "mengapa", mulai bercerita' },
    { ageMo: 60, label: 'Mengenal ≥4 warna, menghitung hingga 10' },
  ] },
  { key: 'grossMotor', label: 'Motorik Kasar', milestones: [
    { ageMo: 2, label: 'Mengangkat kepala saat tengkurap' },
    { ageMo: 4, label: 'Berguling' },
    { ageMo: 6, label: 'Duduk tanpa topangan' },
    { ageMo: 9, label: 'Merangkak / berdiri berpegangan' },
    { ageMo: 12, label: 'Berjalan dituntun / berdiri sendiri' },
    { ageMo: 18, label: 'Berjalan mundur' },
    { ageMo: 24, label: 'Berlari / naik tangga berpegangan' },
    { ageMo: 36, label: 'Mengayuh sepeda roda tiga' },
    { ageMo: 48, label: 'Melompat dengan satu kaki' },
    { ageMo: 60, label: 'Melompat bergantian kaki' },
  ] },
]

function DenverCalc() {
  const [ageMo, setAgeMo] = useState(12)
  const [results, setResults] = useState<Record<string, 'pass' | 'fail' | 'na'>>({})

  const domainFlags = DENVER_DOMAINS.map((d) => {
    const applicable = d.milestones.filter((m) => m.ageMo <= ageMo)
    // "Caution/delay" — a milestone expected well below the child's current
    // age (>=6 months behind) marked as failed.
    const delayed = applicable.filter((m) => {
      const key = `${d.key}-${m.ageMo}`
      return results[key] === 'fail' && ageMo - m.ageMo >= 6
    })
    return { domain: d, applicable, delayed }
  })
  const anyDelay = domainFlags.some((f) => f.delayed.length > 0)

  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Denver II (Simplified)" subtitle="Skrining perkembangan disederhanakan — milestone representatif per domain, bukan instrumen Denver II lengkap" />
      <Field label="Usia Anak (bulan)"><input className={inputClass} type="number" min={0} max={72} value={ageMo} onChange={(e) => setAgeMo(+e.target.value)} /></Field>

      {domainFlags.map(({ domain, applicable }) => (
        <div key={domain.key} className="mt-4">
          <h4 className="text-xs font-black uppercase tracking-wide text-neutral-500">{domain.label}</h4>
          <div className="mt-2 space-y-1.5">
            {applicable.length === 0 && <p className="text-[11px] text-neutral-400">Belum ada milestone acuan pada usia ini.</p>}
            {applicable.map((m) => {
              const key = `${domain.key}-${m.ageMo}`
              const v = results[key] ?? 'na'
              return (
                <div key={key} className="flex items-center justify-between gap-2 rounded-xl border border-neutral-100 p-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-bold text-ink">{m.label}</div>
                    <div className="text-[9px] font-bold uppercase text-neutral-400">Biasanya tercapai ~{m.ageMo} bulan</div>
                  </div>
                  <SegButtons value={v} onChange={(nv) => setResults((s) => ({ ...s, [key]: nv }))} options={[{ v: 'pass', l: 'Bisa' }, { v: 'fail', l: 'Belum' }, { v: 'na', l: '—' }]} />
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {anyDelay && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3">
          <p className="text-xs font-black text-amber-800">⚠️ Pertimbangkan evaluasi tumbuh kembang lanjutan</p>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-700">Ada milestone yang biasanya tercapai jauh di bawah usia anak saat ini (≥6 bulan lebih awal) namun belum tercapai. Ini pola skrining sederhana — rujuk ke dokter anak/tumbuh kembang untuk evaluasi Denver II lengkap atau instrumen skrining terstandardisasi lain (mis. KPSP, M-CHAT bila relevan).</p>
        </div>
      )}
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">Ini BUKAN instrumen Denver II resmi (yang memakai ~125 item dengan bar persentil usia & materi tes terstandardisasi) — alat ini adalah skrining awal sederhana berbasis milestone representatif untuk kewaspadaan, bukan diagnosis keterlambatan perkembangan.</p>
    </Card>
  )
}

/* ══════════════════ ATLS PRIMARY SURVEY (ABCDE) ══════════════════ */
// A guided trauma primary-survey checklist per ATLS (Advanced Trauma Life
// Support) sequence — every item marked "abnormal" surfaces as a critical
// finding needing immediate action, in the order ATLS prioritizes them
// (airway before breathing before circulation, etc.) regardless of entry
// order, since that ordering is the entire point of the primary survey.
interface AtlsItem { key: string; label: string; critIfAbnormal: string }
const ATLS_SECTIONS: { key: string; letter: string; label: string; items: AtlsItem[] }[] = [
  { key: 'airway', letter: 'A', label: 'Airway & Kontrol Servikal', items: [
    { key: 'airwayPatent', label: 'Jalan napas paten (bicara jelas, tanpa stridor/gurgling)', critIfAbnormal: 'Jalan napas tidak paten — bebaskan jalan napas segera (jaw thrust/chin lift, suction, airway definitif bila perlu) SEBELUM lanjut ke langkah berikutnya.' },
    { key: 'cSpine', label: 'Tulang servikal terimobilisasi (collar/manual inline stabilization)', critIfAbnormal: 'C-spine belum terproteksi — asumsikan cedera servikal pada semua trauma tumpul mekanisme signifikan hingga terbukti sebaliknya.' },
  ] },
  { key: 'breathing', letter: 'B', label: 'Breathing & Ventilasi', items: [
    { key: 'rrNormal', label: 'Laju napas normal (12-20x/menit) & simetris', critIfAbnormal: 'Laju napas abnormal — curigai tension pneumotoraks, hematotoraks, flail chest, atau cedera paru.' },
    { key: 'breathSounds', label: 'Suara napas terdengar bilateral & simetris', critIfAbnormal: 'Suara napas asimetris/hilang sebelah — pertimbangkan needle/finger thoracostomy segera bila curiga tension pneumotoraks.' },
    { key: 'spo2', label: 'SpO2 ≥94% udara ruangan/dengan oksigen suplemen sesuai', critIfAbnormal: 'Hipoksemia — berikan oksigen aliran tinggi, cari & atasi penyebab (pneumotoraks, aspirasi, dll).' },
  ] },
  { key: 'circulation', letter: 'C', label: 'Circulation & Kontrol Perdarahan', items: [
    { key: 'pulse', label: 'Nadi teraba kuat, laju & irama normal', critIfAbnormal: 'Nadi lemah/cepat/tak teraba — curigai syok hemoragik, mulai resusitasi cairan/darah & cari sumber perdarahan.' },
    { key: 'hemorrhage', label: 'Tidak ada perdarahan eksternal aktif tak terkontrol', critIfAbnormal: 'Perdarahan eksternal aktif — kontrol segera (tekanan langsung, tourniquet bila ekstremitas) sebelum lanjut survei.' },
    { key: 'ivAccess', label: 'Akses IV besar (≥2 jalur) terpasang', critIfAbnormal: 'Akses IV belum adekuat — pasang 2 jalur IV besar (atau IO bila sulit) untuk resusitasi cairan/produk darah.' },
  ] },
  { key: 'disability', letter: 'D', label: 'Disability (Status Neurologis)', items: [
    { key: 'gcsNormal', label: 'GCS ≥13 atau sesuai baseline pasien', critIfAbnormal: 'GCS menurun — evaluasi penyebab (cedera kepala, hipoksia, syok, intoksikasi), pertimbangkan proteksi jalan napas bila GCS ≤8.' },
    { key: 'pupilsNormal', label: 'Pupil isokor & reaktif terhadap cahaya', critIfAbnormal: 'Pupil anisokor/tidak reaktif — curigai lesi massa intrakranial/herniasi, perlu pencitraan & konsultasi bedah saraf segera.' },
  ] },
  { key: 'exposure', letter: 'E', label: 'Exposure & Kontrol Lingkungan', items: [
    { key: 'exposed', label: 'Pasien terpapar penuh (buka baju) untuk pemeriksaan menyeluruh termasuk log-roll punggung' },
    { key: 'normothermic', label: 'Suhu tubuh terjaga normal (selimut hangat, cairan hangat) — cegah hipotermia' },
  ].map((i) => ({ ...i, critIfAbnormal: i.key === 'exposed' ? 'Pemeriksaan belum menyeluruh — cedera tersembunyi (punggung, lipatan kulit, perineum) mudah terlewat bila tidak log-roll & inspeksi penuh.' : 'Risiko hipotermia — bagian dari "lethal triad" (hipotermia, asidosis, koagulopati) yang memperburuk prognosis trauma berat.' })) },
]

function AtlsCalc() {
  const [status, setStatus] = useState<Record<string, 'ok' | 'abnormal' | 'unassessed'>>({})
  const criticalFindings = ATLS_SECTIONS.flatMap((s) =>
    s.items.filter((i) => status[i.key] === 'abnormal').map((i) => ({ letter: s.letter, ...i }))
  )
  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="ATLS Primary Survey (ABCDE)" subtitle="Survei primer trauma sistematis — urutan prioritas menentukan tindakan, bukan sekadar checklist" />

      {criticalFindings.length > 0 && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3">
          <p className="text-xs font-black text-red-800">🚨 Temuan Kritis — tangani sesuai urutan A→E</p>
          <div className="mt-2 space-y-2">
            {criticalFindings.map((f) => (
              <div key={f.key} className="text-[11px] leading-relaxed text-red-700"><b>{f.letter}:</b> {f.critIfAbnormal}</div>
            ))}
          </div>
        </div>
      )}

      {ATLS_SECTIONS.map((section) => (
        <div key={section.key} className="mt-4 first:mt-0">
          <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-neutral-500">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-50 text-[11px] font-black text-brand-dark">{section.letter}</span>
            {section.label}
          </h4>
          <div className="mt-2 space-y-2">
            {section.items.map((item) => {
              const v = status[item.key] ?? 'unassessed'
              return (
                <div key={item.key} className="flex items-center justify-between gap-2 rounded-xl border border-neutral-100 p-2.5">
                  <div className="min-w-0 flex-1 text-[12px] font-bold text-ink">{item.label}</div>
                  <SegButtons value={v} onChange={(nv) => setStatus((s) => ({ ...s, [item.key]: nv }))} options={[{ v: 'ok', l: 'Normal' }, { v: 'abnormal', l: 'Abnormal' }, { v: 'unassessed', l: '—' }]} />
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <p className="mt-4 text-[10px] leading-relaxed text-neutral-400">Prinsip ATLS: tangani setiap masalah SAAT ditemukan, dalam urutan A→B→C→D→E, sebelum lanjut ke langkah berikutnya — jangan menunda tindakan Airway demi menyelesaikan penilaian Circulation. Alat ini adalah bantuan checklist, bukan pengganti pelatihan ATLS resmi & penilaian klinis langsung di lapangan.</p>
    </Card>
  )
}

/* ══════════════════ BLOOD GAS DECISION TREE (ANALISIS GAS DARAH) ══════════════════ */
// Systematic ABG interpretation: primary disorder -> compensation adequacy
// (Winter's formula & expected-compensation rules) -> anion gap -> delta
// ratio for mixed disorders — the standard stepwise approach taught for
// blood gas interpretation, not a simplification of a single named score.
function AbgCalc() {
  const [ph, setPh] = useState(7.32)
  const [paco2, setPaco2] = useState(30)
  const [hco3, setHco3] = useState(15)
  const [na, setNa] = useState(140)
  const [cl, setCl] = useState(104)
  const [albumin, setAlbumin] = useState(4.0)

  const acidemia = ph < 7.35
  const alkalemia = ph > 7.45
  const phNormal = !acidemia && !alkalemia

  let primary = 'Tidak dapat ditentukan'
  if (acidemia) primary = hco3 < 22 ? 'Asidosis Metabolik' : paco2 > 45 ? 'Asidosis Respiratorik' : 'Asidemia campuran/tak jelas'
  else if (alkalemia) primary = hco3 > 26 ? 'Alkalosis Metabolik' : paco2 < 35 ? 'Alkalosis Respiratorik' : 'Alkalemia campuran/tak jelas'
  else primary = (paco2 > 45 || paco2 < 35 || hco3 > 26 || hco3 < 22) ? 'pH normal namun PaCO2/HCO3 abnormal — kemungkinan gangguan campuran (kompensasi penuh)' : 'Normal'

  // Winter's formula for expected PaCO2 in metabolic acidosis
  const winterExpected = 1.5 * hco3 + 8
  const winterLo = winterExpected - 2
  const winterHi = winterExpected + 2

  let compensationNote = ''
  if (primary === 'Asidosis Metabolik') {
    if (paco2 < winterLo) compensationNote = `PaCO2 (${paco2}) lebih rendah dari perkiraan Winter (${winterLo.toFixed(1)}-${winterHi.toFixed(1)}) — curigai alkalosis respiratorik konkomitan.`
    else if (paco2 > winterHi) compensationNote = `PaCO2 (${paco2}) lebih tinggi dari perkiraan Winter (${winterLo.toFixed(1)}-${winterHi.toFixed(1)}) — curigai asidosis respiratorik konkomitan.`
    else compensationNote = `Kompensasi respiratorik sesuai (perkiraan Winter ${winterLo.toFixed(1)}-${winterHi.toFixed(1)}).`
  }

  const anionGap = na - (cl + hco3)
  const correctedAG = anionGap + 2.5 * (4 - albumin) // correct for hypoalbuminemia
  const agHigh = correctedAG > 12

  let deltaRatioNote = ''
  if (primary === 'Asidosis Metabolik' && agHigh) {
    const deltaRatio = (correctedAG - 12) / (24 - hco3)
    deltaRatioNote = deltaRatio < 0.4
      ? `Delta rasio ${deltaRatio.toFixed(2)} (<0.4) — curigai asidosis non-gap konkomitan (hiperkloremik).`
      : deltaRatio <= 2
      ? `Delta rasio ${deltaRatio.toFixed(2)} (0.4-2) — konsisten asidosis gap tinggi murni.`
      : `Delta rasio ${deltaRatio.toFixed(2)} (>2) — curigai alkalosis metabolik atau asidosis respiratorik kronis konkomitan.`
  }

  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Analisis Gas Darah (ABG)" subtitle="Pendekatan sistematis: gangguan primer → kompensasi → anion gap → delta rasio" />
      <div className="grid grid-cols-3 gap-2">
        <Field label="pH"><input className={inputClass} type="number" step="0.01" value={ph} onChange={(e) => setPh(+e.target.value)} /></Field>
        <Field label="PaCO2 (mmHg)"><input className={inputClass} type="number" value={paco2} onChange={(e) => setPaco2(+e.target.value)} /></Field>
        <Field label="HCO3 (mEq/L)"><input className={inputClass} type="number" value={hco3} onChange={(e) => setHco3(+e.target.value)} /></Field>
        <Field label="Na (mEq/L)"><input className={inputClass} type="number" value={na} onChange={(e) => setNa(+e.target.value)} /></Field>
        <Field label="Cl (mEq/L)"><input className={inputClass} type="number" value={cl} onChange={(e) => setCl(+e.target.value)} /></Field>
        <Field label="Albumin (g/dL)"><input className={inputClass} type="number" step="0.1" value={albumin} onChange={(e) => setAlbumin(+e.target.value)} /></Field>
      </div>

      <div className="mt-4 rounded-xl bg-neutral-50 p-3">
        <div className="text-[10px] font-bold uppercase text-neutral-400">Langkah 1 — Status pH</div>
        <Badge tone={phNormal ? 'normal' : 'critical'}>{acidemia ? 'Asidemia' : alkalemia ? 'Alkalemia' : 'pH Normal'}</Badge>
      </div>
      <div className="mt-2 rounded-xl bg-neutral-50 p-3">
        <div className="text-[10px] font-bold uppercase text-neutral-400">Langkah 2 — Gangguan Primer</div>
        <div className="mt-1 text-sm font-black text-ink">{primary}</div>
      </div>
      {compensationNote && (
        <div className="mt-2 rounded-xl bg-neutral-50 p-3">
          <div className="text-[10px] font-bold uppercase text-neutral-400">Langkah 3 — Kecukupan Kompensasi (Formula Winter)</div>
          <p className="mt-1 text-[12px] font-semibold text-ink">{compensationNote}</p>
        </div>
      )}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <div className="text-lg font-black text-ink">{correctedAG.toFixed(1)}</div>
          <div className="text-[9px] font-bold uppercase text-neutral-400">Anion Gap (terkoreksi albumin)</div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center">
          <Badge tone={agHigh ? 'critical' : 'normal'}>{agHigh ? 'Gap Tinggi' : 'Gap Normal'}</Badge>
          <div className="mt-1 text-[9px] font-bold uppercase text-neutral-400">Klasifikasi AG</div>
        </div>
      </div>
      {deltaRatioNote && (
        <div className="mt-2 rounded-xl bg-neutral-50 p-3">
          <div className="text-[10px] font-bold uppercase text-neutral-400">Langkah 4 — Delta Rasio (deteksi gangguan campuran)</div>
          <p className="mt-1 text-[12px] font-semibold text-ink">{deltaRatioNote}</p>
        </div>
      )}
      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">AG tinggi (MUDPILES: metanol, uremia, DKA, propilen glikol/paraldehid, isoniazid/iron, laktat, etilen glikol, salisilat). AG normal/hiperkloremik: diare, RTA, asetazolamid, dilusi salin. Anion gap terkoreksi = AG + 2.5×(4 − albumin g/dL). Alat bantu interpretasi — selalu integrasikan dengan konteks klinis penuh.</p>
    </Card>
  )
}

/* ══════════════════ ADVANCED BURN CALCULATOR (DRAW-MODE + PARKLAND) ══════════════════ */
// Last of the "bigger build" items: an interactive body-diagram (front/back,
// click-to-toggle regions) applying the Rule of Nines (adult), summing %TBSA
// live, feeding directly into the Parkland formula, with a print/PDF export
// via the browser's native print dialog (no extra dependency needed for a
// clean printable summary).
interface BurnRegion { key: string; label: string; pct: number; x: number; y: number; w: number; h: number; rx?: number }
const BURN_FRONT: BurnRegion[] = [
  { key: 'headF', label: 'Kepala (depan)', pct: 4.5, x: 78, y: 8, w: 44, h: 42, rx: 18 },
  { key: 'armLF', label: 'Lengan Kiri (depan)', pct: 4.5, x: 26, y: 54, w: 28, h: 100, rx: 8 },
  { key: 'armRF', label: 'Lengan Kanan (depan)', pct: 4.5, x: 146, y: 54, w: 28, h: 100, rx: 8 },
  { key: 'trunkF', label: 'Batang Tubuh (depan)', pct: 18, x: 64, y: 54, w: 72, h: 108, rx: 6 },
  { key: 'perineum', label: 'Perineum', pct: 1, x: 92, y: 158, w: 16, h: 12 },
  { key: 'legLF', label: 'Tungkai Kiri (depan)', pct: 9, x: 64, y: 168, w: 34, h: 160, rx: 8 },
  { key: 'legRF', label: 'Tungkai Kanan (depan)', pct: 9, x: 102, y: 168, w: 34, h: 160, rx: 8 },
]
const BURN_BACK: BurnRegion[] = [
  { key: 'headB', label: 'Kepala (belakang)', pct: 4.5, x: 78, y: 8, w: 44, h: 42, rx: 18 },
  { key: 'armLB', label: 'Lengan Kiri (belakang)', pct: 4.5, x: 26, y: 54, w: 28, h: 100, rx: 8 },
  { key: 'armRB', label: 'Lengan Kanan (belakang)', pct: 4.5, x: 146, y: 54, w: 28, h: 100, rx: 8 },
  { key: 'trunkB', label: 'Batang Tubuh (belakang)', pct: 18, x: 64, y: 54, w: 72, h: 108, rx: 6 },
  { key: 'legLB', label: 'Tungkai Kiri (belakang)', pct: 9, x: 64, y: 168, w: 34, h: 160, rx: 8 },
  { key: 'legRB', label: 'Tungkai Kanan (belakang)', pct: 9, x: 102, y: 168, w: 34, h: 160, rx: 8 },
]

function BurnCalc() {
  const [view, setView] = useState<'front' | 'back'>('front')
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [weight, setWeight] = useState(70)

  const allRegions = [...BURN_FRONT, ...BURN_BACK]
  const tbsa = allRegions.filter((r) => selected[r.key]).reduce((sum, r) => sum + r.pct, 0)
  const total24h = 4 * weight * tbsa
  const first8hRate = total24h / 2 / 8
  const next16hRate = (total24h - total24h / 2) / 16

  const regions = view === 'front' ? BURN_FRONT : BURN_BACK

  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Kalkulator Luka Bakar Lanjutan" subtitle="Rule of Nines (draw-mode) + Parkland Formula, dapat dicetak/disimpan PDF" />

      <div className="flex gap-2">
        <button onClick={() => setView('front')} className={`flex-1 rounded-full py-2 text-xs font-bold ${view === 'front' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>Tampak Depan</button>
        <button onClick={() => setView('back')} className={`flex-1 rounded-full py-2 text-xs font-bold ${view === 'back' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}>Tampak Belakang</button>
      </div>

      <div className="mt-3 flex justify-center">
        <svg viewBox="0 0 200 340" width="200" height="340">
          {regions.map((r) => (
            <rect
              key={r.key}
              x={r.x} y={r.y} width={r.w} height={r.h} rx={r.rx ?? 4}
              className="cursor-pointer transition-colors"
              fill={selected[r.key] ? '#ef4444' : '#e5e7eb'}
              stroke="#fff" strokeWidth={2}
              onClick={() => setSelected((s) => ({ ...s, [r.key]: !s[r.key] }))}
            />
          ))}
        </svg>
      </div>
      <p className="text-center text-[10px] text-neutral-400">Ketuk area tubuh untuk menandai luka bakar (merah = terpilih)</p>

      <div className="mt-3 space-y-1">
        {regions.map((r) => (
          <label key={r.key} className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 hover:bg-neutral-50">
            <span className="flex items-center gap-2 text-[12px] font-semibold text-ink">
              <input type="checkbox" checked={!!selected[r.key]} onChange={() => setSelected((s) => ({ ...s, [r.key]: !s[r.key] }))} className="h-4 w-4 accent-red-500" />
              {r.label}
            </span>
            <span className="text-[11px] font-black text-neutral-400">{r.pct}%</span>
          </label>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-neutral-50 p-3 text-center">
        <div className="text-2xl font-black text-ink">{tbsa.toFixed(1)}% <span className="text-sm font-semibold text-neutral-400">TBSA</span></div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Field label="Berat Badan (kg)"><input className={inputClass} type="number" value={weight} onChange={(e) => setWeight(+e.target.value)} /></Field>
      </div>

      {tbsa >= 20 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-neutral-50 p-3 text-center">
            <div className="text-lg font-black text-ink">{total24h.toFixed(0)}</div>
            <div className="text-[9px] font-bold uppercase text-neutral-400">mL Total 24 jam (Parkland)</div>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3 text-center">
            <div className="text-lg font-black text-ink">{first8hRate.toFixed(0)}</div>
            <div className="text-[9px] font-bold uppercase text-neutral-400">mL/jam (8 jam pertama)</div>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3 text-center">
            <div className="text-lg font-black text-ink">{next16hRate.toFixed(0)}</div>
            <div className="text-[9px] font-bold uppercase text-neutral-400">mL/jam (16 jam berikut)</div>
          </div>
        </div>
      )}
      {tbsa > 0 && tbsa < 20 && (
        <p className="mt-3 text-[11px] text-neutral-500">Parkland formula umumnya diterapkan pada luka bakar ≥20% TBSA. Untuk luas lebih kecil, tatalaksana cairan disesuaikan kebutuhan klinis individual.</p>
      )}

      <button onClick={() => window.print()} className="liquid-glass-btn liquid-glass-btn--outline mt-4 w-full rounded-full py-2.5 text-xs font-bold text-brand-dark">🖨️ Cetak / Simpan sebagai PDF</button>

      <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">Rule of Nines adalah estimasi dewasa standar (persentase berbeda pada anak — kepala proporsional lebih besar). Total = 4 mL × berat(kg) × %TBSA (kristaloid RL), separuh dalam 8 jam pertama SEJAK WAKTU CEDERA, sisanya 16 jam berikutnya, disesuaikan output urin.</p>
    </Card>
  )
}

/* ══════════════════ CRANIAL NERVE + MENINGEAL EXAM AUTOFORMAT ══════════════════ */
// Last of the "bigger build" items: a structured 12-cranial-nerve + meningeal
// sign exam that auto-formats into a ready-to-paste neuro exam note — each
// nerve carries an icon glyph as a lightweight visual cue (this is a coded
// checklist, not an illustrated anatomy atlas) and a curated set of common
// normal/abnormal findings rather than free text, for speed and consistency.
interface CnOption { v: string; l: string }
const CRANIAL_NERVES: { key: string; numeral: string; name: string; icon: string; opts: CnOption[] }[] = [
  { key: 'cn1', numeral: 'I', name: 'Olfaktorius', icon: '👃', opts: [{ v: 'normal', l: 'Normosmia' }, { v: 'abn', l: 'Anosmia/hiposmia' }, { v: 'na', l: 'Tak dinilai' }] },
  { key: 'cn2', numeral: 'II', name: 'Optikus', icon: '👁️', opts: [{ v: 'normal', l: 'Visus & lapang pandang normal' }, { v: 'abn', l: 'Penurunan visus/defek lapang pandang' }, { v: 'na', l: 'Tak dinilai' }] },
  { key: 'cn34_6', numeral: 'III/IV/VI', name: 'Okulomotor, Troklear, Abdusen', icon: '👀', opts: [{ v: 'normal', l: 'Gerak bola mata penuh, pupil isokor reaktif' }, { v: 'abn', l: 'Ptosis/diplopia/paresis gerak mata/pupil anisokor' }, { v: 'na', l: 'Tak dinilai' }] },
  { key: 'cn5', numeral: 'V', name: 'Trigeminus', icon: '😐', opts: [{ v: 'normal', l: 'Sensasi wajah & refleks kornea normal, otot mengunyah kuat' }, { v: 'abn', l: 'Baal wajah/refleks kornea menurun/kelemahan mengunyah' }, { v: 'na', l: 'Tak dinilai' }] },
  { key: 'cn7', numeral: 'VII', name: 'Fasialis', icon: '😊', opts: [{ v: 'normal', l: 'Simetris, dapat mengerutkan dahi & menutup mata kuat' }, { v: 'abnCentral', l: 'Paresis sentral (dahi terhindar)' }, { v: 'abnPeripheral', l: 'Paresis perifer (dahi ikut terkena)' }, { v: 'na', l: 'Tak dinilai' }] },
  { key: 'cn8', numeral: 'VIII', name: 'Vestibulokoklearis', icon: '👂', opts: [{ v: 'normal', l: 'Pendengaran normal, tanpa vertigo/nistagmus' }, { v: 'abn', l: 'Penurunan pendengaran/vertigo/nistagmus' }, { v: 'na', l: 'Tak dinilai' }] },
  { key: 'cn9_10', numeral: 'IX/X', name: 'Glosofaringeus, Vagus', icon: '👄', opts: [{ v: 'normal', l: 'Refleks muntah baik, palatum simetris terangkat, suara jernih' }, { v: 'abn', l: 'Disfagia/suara serak/deviasi palatum/refleks muntah menurun' }, { v: 'na', l: 'Tak dinilai' }] },
  { key: 'cn11', numeral: 'XI', name: 'Aksesorius', icon: '💪', opts: [{ v: 'normal', l: 'Kekuatan m. trapezius & sternokleidomastoid normal' }, { v: 'abn', l: 'Kelemahan angkat bahu/menoleh melawan tahanan' }, { v: 'na', l: 'Tak dinilai' }] },
  { key: 'cn12', numeral: 'XII', name: 'Hipoglosus', icon: '👅', opts: [{ v: 'normal', l: 'Lidah simetris di garis tengah, tanpa atrofi/fasikulasi' }, { v: 'abn', l: 'Deviasi lidah/atrofi/fasikulasi' }, { v: 'na', l: 'Tak dinilai' }] },
]
const MENINGEAL_SIGNS: { key: string; label: string }[] = [
  { key: 'nuchal', label: 'Kaku kuduk (nuchal rigidity)' },
  { key: 'kernig', label: 'Kernig sign' },
  { key: 'brudzinski', label: 'Brudzinski sign' },
]

function CranialNerveCalc() {
  const [cn, setCn] = useState<Record<string, string>>(Object.fromEntries(CRANIAL_NERVES.map((n) => [n.key, 'normal'])))
  const [meningeal, setMeningeal] = useState<Record<string, boolean>>({})

  const meningealPositive = MENINGEAL_SIGNS.filter((m) => meningeal[m.key])
  const anyCnAbnormal = CRANIAL_NERVES.some((n) => cn[n.key]?.startsWith('abn'))

  const noteLines = CRANIAL_NERVES.map((n) => {
    const opt = n.opts.find((o) => o.v === cn[n.key])
    return `- N. ${n.numeral} (${n.name}): ${opt?.l ?? '—'}`
  })
  const meningealLine = MENINGEAL_SIGNS.map((m) => `${m.label}: ${meningeal[m.key] ? 'Positif' : 'Negatif'}`).join(' · ')

  const formattedNote = `PEMERIKSAAN SARAF KRANIAL & TANDA MENINGEAL
${noteLines.join('\n')}

Tanda Rangsang Meningeal: ${meningealLine}
${meningealPositive.length > 0 ? '⚠️ Tanda meningeal POSITIF — pertimbangkan meningitis/perdarahan subarakhnoid, evaluasi lanjut (pungsi lumbal bila tak ada kontraindikasi, pencitraan bila indikasi).' : ''}`

  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Saraf Kranial + Tanda Meningeal" subtitle="Pemeriksaan 12 saraf kranial & tanda rangsang meningeal, dirangkum otomatis ke format catatan" />

      <div className="space-y-2.5">
        {CRANIAL_NERVES.map((n) => (
          <div key={n.key} className="rounded-xl border border-neutral-100 p-3">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-lg">{n.icon}</span>
              <span className="text-[12px] font-black text-ink">N. {n.numeral}</span>
              <span className="text-[11px] text-neutral-400">{n.name}</span>
            </div>
            <SegButtons value={cn[n.key]} onChange={(v) => setCn((s) => ({ ...s, [n.key]: v }))} options={n.opts} />
          </div>
        ))}
      </div>

      <h4 className="mt-4 text-xs font-black uppercase tracking-wide text-neutral-500">Tanda Rangsang Meningeal</h4>
      <div className="mt-2 space-y-2">
        {MENINGEAL_SIGNS.map((m) => (
          <label key={m.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-100 p-3 hover:bg-neutral-50">
            <input type="checkbox" checked={!!meningeal[m.key]} onChange={(e) => setMeningeal((s) => ({ ...s, [m.key]: e.target.checked }))} className="h-5 w-5 accent-red-500" />
            <div className="text-sm font-bold text-ink">{m.label}</div>
          </label>
        ))}
      </div>

      {(meningealPositive.length > 0 || anyCnAbnormal) && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3">
          <p className="text-xs font-black text-amber-800">⚠️ Temuan abnormal terdeteksi</p>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-700">
            {meningealPositive.length > 0 && 'Tanda meningeal positif — pertimbangkan meningitis/perdarahan subarakhnoid. '}
            {anyCnAbnormal && 'Ada defisit saraf kranial — korelasikan dengan lokalisasi lesi (batang otak, basis kranii, atau perifer) dan pertimbangkan pencitraan.'}
          </p>
        </div>
      )}

      <div className="mt-4">
        <h4 className="mb-2 text-xs font-black uppercase tracking-wide text-neutral-500">Catatan Otomatis</h4>
        <pre className="whitespace-pre-wrap rounded-xl bg-neutral-900 p-3 text-[11px] leading-relaxed text-neutral-100">{formattedNote}</pre>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-neutral-400">Draf catatan otomatis wajib ditinjau & dilengkapi dokter sebelum masuk rekam medis resmi. Paresis fasialis sentral vs perifer dibedakan dari keterlibatan dahi (dahi terhindar = sentral, karena persarafan dahi bilateral dari korteks; dahi ikut lumpuh = perifer/Bell's palsy).</p>
    </Card>
  )
}

/* ══════════════════ COMPETENCY TRACKER (SKDI) ══════════════════ */
// Sixth and last of the "bigger build" items. Indonesian medical education
// is set NATIONALLY under SKDI (Standar Kompetensi Dokter Indonesia, KKI/
// AIPKI) — individual universities (UI, Unair, UGM, UNS, Unpad, Unhas, etc.)
// implement the same core national competency areas rather than each having
// a wholly distinct competency list, so this tracks against the real SKDI
// 7-area framework with a university/specialty tag for personalization,
// rather than fabricating school-specific curriculum content that can't be
// verified.
const UNIVERSITIES = ['UI', 'Unair', 'UGM', 'UNS', 'Unpad', 'Unhas'] as const
const SPECIALTIES = ['Kedokteran Umum', 'Penyakit Dalam', 'Bedah', 'Anak', 'Obstetri & Ginekologi', 'Saraf', 'Jantung', 'Anestesi', 'Radiologi', 'Patologi Klinik'] as const

interface SkdiArea { key: string; area: string; title: string; items: string[] }
const SKDI_AREAS: SkdiArea[] = [
  { key: 'area1', area: 'Area 1', title: 'Profesionalitas yang Luhur', items: [
    'Menunjukkan perilaku profesional & etika kedokteran', 'Bermoral & beretika dalam praktik', 'Sadar & taat hukum kedokteran',
  ] },
  { key: 'area2', area: 'Area 2', title: 'Mawas Diri & Pengembangan Diri', items: [
    'Menerapkan mawas diri (refleksi praktik)', 'Mempraktikkan belajar sepanjang hayat', 'Mengembangkan pengetahuan baru',
  ] },
  { key: 'area3', area: 'Area 3', title: 'Komunikasi Efektif', items: [
    'Berkomunikasi dengan pasien & keluarga', 'Berkomunikasi dengan sejawat & profesi lain', 'Berkomunikasi dengan masyarakat',
  ] },
  { key: 'area4', area: 'Area 4', title: 'Pengelolaan Informasi', items: [
    'Mengakses & menilai informasi/data kesehatan secara kritis', 'Memanfaatkan teknologi informasi kesehatan', 'Menyampaikan informasi ilmiah',
  ] },
  { key: 'area5', area: 'Area 5', title: 'Landasan Ilmiah Ilmu Kedokteran', items: [
    'Menerapkan ilmu biomedik', 'Menerapkan ilmu klinik', 'Menerapkan prinsip evidence-based medicine',
  ] },
  { key: 'area6', area: 'Area 6', title: 'Keterampilan Klinis', items: [
    'Anamnesis & pemeriksaan fisik lengkap', 'Melakukan prosedur klinis & kegawatdaruratan', 'Interpretasi pemeriksaan penunjang', 'Menyusun & melaksanakan rencana tatalaksana',
  ] },
  { key: 'area7', area: 'Area 7', title: 'Pengelolaan Masalah Kesehatan', items: [
    'Mengelola masalah kesehatan individu & keluarga', 'Mengelola masalah kesehatan masyarakat/komunitas', 'Menerapkan prinsip keselamatan pasien',
  ] },
]

type CompStatus = 'belum' | 'proses' | 'tercapai'
const COMP_KEY = 'pmd_competency_tracker_v1'

function loadCompProgress(): Record<string, CompStatus> {
  try { return JSON.parse(localStorage.getItem(COMP_KEY) || '{}') } catch { return {} }
}

function CompetencyTracker() {
  const [university, setUniversity] = useState<(typeof UNIVERSITIES)[number]>('UI')
  const [specialty, setSpecialty] = useState<(typeof SPECIALTIES)[number]>('Kedokteran Umum')
  const [progress, setProgress] = useState<Record<string, CompStatus>>(loadCompProgress)

  function setStatus(itemKey: string, v: CompStatus) {
    setProgress((s) => {
      const next = { ...s, [itemKey]: v }
      try { localStorage.setItem(COMP_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

  const allItems = SKDI_AREAS.flatMap((a) => a.items.map((_, i) => `${university}-${specialty}-${a.key}-${i}`))
  const tercapaiCount = allItems.filter((k) => progress[k] === 'tercapai').length
  const overallPct = Math.round((tercapaiCount / allItems.length) * 100)

  return (
    <Card>
      <SectionTitle icon={<IconStethoscope size={18} />} title="Tracker Kompetensi (SKDI)" subtitle="7 Area Kompetensi Dokter Indonesia (KKI/AIPKI) — standar nasional, berlaku di seluruh institusi pendidikan kedokteran" />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Institusi">
          <select className={inputClass} value={university} onChange={(e) => setUniversity(e.target.value as (typeof UNIVERSITIES)[number])}>
            {UNIVERSITIES.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </Field>
        <Field label="Program/Spesialisasi">
          <select className={inputClass} value={specialty} onChange={(e) => setSpecialty(e.target.value as (typeof SPECIALTIES)[number])}>
            {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      <div className="mt-4 rounded-xl bg-neutral-50 p-3 text-center">
        <div className="text-2xl font-black text-ink">{overallPct}%</div>
        <div className="text-[10px] font-bold uppercase text-neutral-400">Progres Keseluruhan — {tercapaiCount}/{allItems.length} kompetensi tercapai</div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-200">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${overallPct}%` }} />
        </div>
      </div>

      {SKDI_AREAS.map((area) => {
        const keys = area.items.map((_, i) => `${university}-${specialty}-${area.key}-${i}`)
        const done = keys.filter((k) => progress[k] === 'tercapai').length
        return (
          <div key={area.key} className="mt-4">
            <h4 className="flex items-center justify-between text-xs font-black uppercase tracking-wide text-neutral-500">
              <span>{area.area} — {area.title}</span>
              <span className="text-neutral-400">{done}/{area.items.length}</span>
            </h4>
            <div className="mt-2 space-y-1.5">
              {area.items.map((item, i) => {
                const key = `${university}-${specialty}-${area.key}-${i}`
                const v = progress[key] ?? 'belum'
                return (
                  <div key={key} className="flex items-center justify-between gap-2 rounded-xl border border-neutral-100 p-2.5">
                    <div className="min-w-0 flex-1 text-[12px] font-semibold text-ink">{item}</div>
                    <SegButtons value={v} onChange={(nv) => setStatus(key, nv)} options={[{ v: 'belum', l: 'Belum' }, { v: 'proses', l: 'Proses' }, { v: 'tercapai', l: 'Tercapai' }]} />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <p className="mt-4 text-[10px] leading-relaxed text-neutral-400">Kerangka 7 Area Kompetensi mengikuti SKDI (Standar Kompetensi Dokter Indonesia, ditetapkan KKI berbasis AIPKI) — berlaku sebagai standar nasional yang diimplementasikan seluruh institusi pendidikan kedokteran, bukan daftar unik per kampus. Sub-kompetensi di atas adalah ringkasan representatif; rujuk dokumen SKDI resmi & buku log institusi untuk daftar lengkap & terverifikasi. Progres tersimpan di perangkat ini.</p>
    </Card>
  )
}

// ── Paywall: free for the first 50 registered accounts, then a one-time
// unlock via 500 PNC from wallet balance or a direct Rp500.000 charge. ──
type CalcAccess = { unlocked: boolean; free: boolean; limit: number; slotsLeft: number; pricePnc: number; priceIdr: number }

function ClinicalCalcPaywall({ access, onUnlocked }: { access: CalcAccess; onUnlocked: () => void }) {
  const [busy, setBusy] = useState<'pnc' | 'idr' | null>(null)
  const [err, setErr] = useState('')

  async function payWithPnc() {
    setBusy('pnc'); setErr('')
    try {
      const r = await api.unlockClinicalCalcPnc()
      if (r.unlocked) onUnlocked()
    } catch (e) {
      setErr(/insufficient_balance/i.test(String((e as Error).message)) ? `Saldo PNC Anda tidak cukup (butuh ${access.pricePnc} PNC). Isi saldo dulu di Billing.` : 'Gagal membuka akses. Coba lagi.')
    } finally {
      setBusy(null)
    }
  }

  async function payWithIdr() {
    setBusy('idr'); setErr('')
    try {
      const r = await api.createPayment(0, 'QRIS', 'clinical_calc_unlock')
      if (!r.live) {
        // Sandbox/dev mode — no live payment gateway configured, simulate settlement.
        await api.confirmPayment(r.orderId)
        onUnlocked()
      } else if (r.redirectUrl) {
        window.location.href = r.redirectUrl
      }
    } catch {
      setErr('Gagal memulai pembayaran. Coba lagi.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card>
      <SectionTitle icon={<IconShield size={20} />} title="Buka Kalkulator Klinis" subtitle="34 skor & alat bantu keputusan klinis standar internasional" />
      <div className="mt-3 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600">
        🎉 Kalkulator Klinis <b>gratis</b> untuk {access.limit} pendaftar akun Panaceamed.id pertama — kuota itu sudah penuh. Buka akses seumur akun dengan salah satu metode di bawah.
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          onClick={payWithPnc}
          disabled={busy !== null}
          className="flex flex-col items-start gap-1 rounded-2xl border border-brand/30 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
        >
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-dark"><IconToken size={14} /> Bayar dari saldo</span>
          <span className="text-xl font-black text-ink">{access.pricePnc} PNC</span>
          <span className="text-[11px] text-neutral-500">{busy === 'pnc' ? 'Memproses…' : 'Langsung terpotong dari saldo PanaceaToken Anda'}</span>
        </button>
        <button
          onClick={payWithIdr}
          disabled={busy !== null}
          className="flex flex-col items-start gap-1 rounded-2xl border border-black/10 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
        >
          <span className="text-xs font-bold uppercase tracking-wide text-neutral-500">QRIS / VA / Kartu</span>
          <span className="text-xl font-black text-ink">Rp{access.priceIdr.toLocaleString('id-ID')}</span>
          <span className="text-[11px] text-neutral-500">{busy === 'idr' ? 'Memproses…' : 'Pembayaran satu kali, akses seumur akun'}</span>
        </button>
      </div>
      {err && <p className="mt-3 text-xs font-semibold text-rose-600">{err}</p>}
    </Card>
  )
}

export function ClinicalCalculators() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('apgar')
  const [access, setAccess] = useState<CalcAccess | null>(null)

  useEffect(() => {
    if (!backendEnabled) { setAccess({ unlocked: true, free: true, limit: 50, slotsLeft: 0, pricePnc: 500, priceIdr: 500000 }); return }
    api.getClinicalCalcAccess().then(setAccess).catch(() => setAccess({ unlocked: true, free: true, limit: 50, slotsLeft: 0, pricePnc: 500, priceIdr: 500000 }))
  }, [])

  if (access && !access.unlocked) {
    return (
      <div className="mx-auto max-w-xl space-y-4 p-4">
        <SectionTitle icon={<IconStethoscope size={20} />} title="Kalkulator Klinis" subtitle="Skor & alat bantu keputusan klinis standar internasional" />
        <ClinicalCalcPaywall access={access} onUnlocked={() => setAccess({ ...access, unlocked: true })} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-4 p-4">
      {access?.free && (
        <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-[11px] font-semibold text-brand-dark">
          <IconCheck size={14} /> Anda termasuk {access.limit} pendaftar pertama — akses gratis selamanya.
        </div>
      )}
      <SectionTitle icon={<IconStethoscope size={20} />} title="Kalkulator Klinis" subtitle="Skor & alat bantu keputusan klinis standar internasional" />
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${tab === t.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'apgar' && <ApgarCalc />}
      {tab === 'gcs' && <GcsCalc />}
      {tab === 'curb65' && <Curb65Calc />}
      {tab === 'bishop' && <BishopCalc />}
      {tab === 'ckdepi' && <CkdEpiCalc />}
      {tab === 'whogrowth' && <WhoGrowthCalc />}
      {tab === 'ballard' && <BallardSoapCalc />}
      {tab === 'qsofa' && <QsofaCalc />}
      {tab === 'hollidaysegar' && <HollidaySegarCalc />}
      {tab === 'parkland' && <ParklandCalc />}
      {tab === 'naegele' && <NaegeleCalc />}
      {tab === 'map' && <MapCalc />}
      {tab === 'alvarado' && <AlvaradoCalc />}
      {tab === 'centor' && <CentorCalc />}
      {tab === 'nacorr' && <NaCorrectionCalc />}
      {tab === 'broca' && <BrocaCalc />}
      {tab === 'midparental' && <MidParentalCalc />}
      {tab === 'fletcher' && <FletcherCalc />}
      {tab === 'nose' && <NoseCalc />}
      {tab === 'rsi' && <RsiCalc />}
      {tab === 'abcd2' && <Abcd2Calc />}
      {tab === 'four' && <FourScoreCalc />}
      {tab === 'mcdonald' && <McDonaldCalc />}
      {tab === 'paradise' && <ParadiseCalc />}
      {tab === 'nihss' && <NihssCalc />}
      {tab === 'fluidbalance' && <FluidBalanceCalc />}
      {tab === 'pedsdose' && <PedsDoseCalc />}
      {tab === 'vbac' && <VbacCalc />}
      {tab === 'denver' && <DenverCalc />}
      {tab === 'atls' && <AtlsCalc />}
      {tab === 'abg' && <AbgCalc />}
      {tab === 'burn' && <BurnCalc />}
      {tab === 'cranial' && <CranialNerveCalc />}
      {tab === 'competencies' && <CompetencyTracker />}
    </div>
  )
}

export default ClinicalCalculators
