import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, SectionTitle, Badge, Field, inputClass } from '../components/ui'
import { IconStethoscope } from '../components/icons'

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

export function ClinicalCalculators() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('apgar')
  return (
    <div className="mx-auto max-w-xl space-y-4 p-4">
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
    </div>
  )
}

export default ClinicalCalculators
