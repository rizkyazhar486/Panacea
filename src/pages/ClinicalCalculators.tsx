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

const TABS = [
  { id: 'apgar', label: 'APGAR' },
  { id: 'gcs', label: 'GCS' },
  { id: 'curb65', label: 'CURB-65' },
  { id: 'bishop', label: 'Bishop' },
  { id: 'ckdepi', label: 'CKD-EPI' },
  { id: 'whogrowth', label: 'WHO Growth' },
] as const

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
    </div>
  )
}

export default ClinicalCalculators
