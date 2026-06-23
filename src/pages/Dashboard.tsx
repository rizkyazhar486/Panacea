import { useState, useEffect } from 'react'
import { useStore, uid } from '../lib/store'
import { Card, SectionTitle, Badge, Button, Field, inputClass } from '../components/ui'
import { IconHeart, IconShield, IconPlus, IconSparkle } from '../components/icons'
import { computeBmi, ageFromDob } from '../lib/anthro'
import { GrowthChart } from '../components/GrowthChart'
import type { VitalSign } from '../lib/types'

/* ═══════════════════════════════════════════
   LOCAL TYPES — agar tidak depend pada type yang mungkin belum diekspos
   ═══════════════════════════════════════════ */

interface SupportiveResult {
  id: string
  takenAt: string
  category: string
  name: string
  value: string
  unit: string
  reference?: string
  flag?: 'normal' | 'high' | 'low' | 'critical'
}

/* ═══════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════ */

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function computeLongevity(
  p: { chronicConditions: string[]; riskFlags: string[] },
  latest: VitalSign | undefined,
  supportive: SupportiveResult[],
): { score: number; band: string } {
  let score = 100
  score -= p.chronicConditions.length * 8
  score -= p.riskFlags.includes('elderly') ? 6 : 0
  score -= p.riskFlags.includes('immunocompromised') ? 8 : 0
  if (latest) {
    if (latest.systolic >= 140) score -= 8
    if (latest.spo2 < 95) score -= 8
    if (latest.glucose && latest.glucose >= 200) score -= 6
  }
  score -= supportive.filter((s) => s.flag === 'high' || s.flag === 'critical').length * 3
  score = Math.max(20, Math.min(100, score))
  const band = score >= 80 ? 'Optimal' : score >= 60 ? 'Perlu perhatian' : 'Prioritas tinggi'
  return { score, band }
}

/* ═══════════════════════════════════════════
   ANIMATED LONGEVITY RING
   ═══════════════════════════════════════════ */

function LongevityRing({ score, band }: { score: number; band: string }) {
  const [animated, setAnimated] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 200)
    return () => clearTimeout(t)
  }, [score])

  const r = 48
  const c = 2 * Math.PI * r
  const offset = c - (animated / 100) * c
  const color = score >= 80 ? '#00BF63' : score >= 60 ? '#f59e0b' : '#FF3131'
  const glow = score >= 80
    ? '0 0 24px rgba(0,191,99,0.3)'
    : score >= 60
      ? '0 0 24px rgba(245,158,11,0.3)'
      : '0 0 24px rgba(255,49,49,0.3)'

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Longevity Score: ${score} — ${band}`}
    >
      <svg width="112" height="112" className="-rotate-90" style={{ filter: `drop-shadow(${glow})` }}>
        <circle cx="56" cy="56" r={r} fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="9" />
        <circle
          cx="56"
          cy="56"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.6s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className="text-[28px] font-black leading-none tabular-nums"
          style={{ color }}
        >
          {animated}
        </span>
        <span className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.18em] text-neutral-400">
          {band}
        </span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   AREA SPARKLINE
   ═══════════════════════════════════════════ */

function Spark({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null
  const w = 72
  const h = 26
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - ((v - min) / span) * (h - 4) - 2
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  const gradId = `spk-${color.replace('#', '')}`
  return (
    <svg width={w} height={h} className="overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${gradId})`} />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={w} cy={h - ((values[values.length - 1] - min) / span) * (h - 4) - 2} r="2.5" fill={color} />
    </svg>
  )
}

/* ═══════════════════════════════════════════
   BMI VISUAL GAUGE
   ═══════════════════════════════════════════ */

function BmiGauge({ bmi, kesan, tone }: { bmi: number; kesan: string; tone: string }) {
  const pct = Math.max(0, Math.min(100, ((bmi - 15) / 25) * 100))
  const color =
    tone === 'high' || tone === 'critical' ? '#FF3131' : tone === 'low' ? '#f59e0b' : '#00BF63'

  return (
    <div className="w-full space-y-3">
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-neutral-100">
        <div className="absolute inset-y-0 left-0 w-[30%] bg-blue-100/60" />
        <div className="absolute inset-y-0 left-[30%] w-[20%] bg-green-100/60" />
        <div className="absolute inset-y-0 left-[50%] w-[20%] bg-amber-100/60" />
        <div className="absolute inset-y-0 left-[70%] w-[30%] bg-red-100/60" />
        <div
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-out"
          style={{ left: `calc(${pct}% - 6px)` }}
        >
          <div
            className="h-5 w-3 rounded-full border-2 border-white shadow-md"
            style={{ background: color }}
          />
        </div>
      </div>
      <div className="flex justify-between text-[9px] font-semibold text-neutral-300">
        <span>Under</span>
        <span>Normal</span>
        <span>Over</span>
        <span>Obese</span>
      </div>
      <div className="text-center">
        <span className="text-3xl font-black tabular-nums" style={{ color }}>
          {bmi}
        </span>
        <span className="ml-1 text-xs text-neutral-400">kg/m²</span>
      </div>
      <div className="text-center">
        <Badge tone={tone as 'normal' | 'high' | 'low' | 'critical'}>{kesan}</Badge>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   VITAL FEED CARD
   ═══════════════════════════════════════════ */

function VitalCard({
  label,
  value,
  unit,
  series,
  tone,
}: {
  label: string
  value: string
  unit: string
  series: number[]
  tone: 'normal' | 'high'
}) {
  const accent = tone === 'high' ? '#FF3131' : '#00BF63'
  const bg = tone === 'high' ? 'rgba(255,49,49,0.03)' : 'rgba(0,191,99,0.03)'
  const border = tone === 'high' ? 'rgba(255,49,49,0.1)' : 'rgba(0,191,99,0.08)'

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
      style={{ background: bg, borderColor: border }}
      role="status"
      aria-label={`${label}: ${value} ${unit}`}
    >
      <div
        className="absolute left-0 top-0 h-full w-[3px] transition-all duration-300 group-hover:w-[5px]"
        style={{ background: `linear-gradient(180deg, ${accent}, ${accent}66)` }}
      />
      <div className="flex items-start justify-between pl-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-[5px] w-[5px] rounded-full"
              style={{ background: accent, boxShadow: `0 0 6px ${accent}66` }}
            />
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
              {label}
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span
              className="text-[26px] font-black leading-none tabular-nums"
              style={{ color: tone === 'high' ? '#FF3131' : '#171717' }}
            >
              {value}
            </span>
            <span className="text-[10px] font-medium text-neutral-400">{unit}</span>
          </div>
        </div>
        <div className="mt-1 opacity-70 transition-opacity group-hover:opacity-100">
          <Spark values={series} color={accent} />
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   SUPPORTIVE RESULT CARD
   ═══════════════════════════════════════════ */

function SupportiveCard({ r }: { r: SupportiveResult }) {
  const palette: Record<string, { bg: string; dot: string }> = {
    normal: { bg: 'rgba(0,191,99,0.04)', dot: '#00BF63' },
    high: { bg: 'rgba(255,49,49,0.04)', dot: '#FF3131' },
    low: { bg: 'rgba(245,158,11,0.04)', dot: '#f59e0b' },
    critical: { bg: 'rgba(255,49,49,0.08)', dot: '#FF3131' },
  }
  const s = palette[r.flag ?? 'normal']
  const flagLabel =
    r.flag === 'high'
      ? 'Tinggi'
      : r.flag === 'low'
        ? 'Rendah'
        : r.flag === 'critical'
          ? 'Kritis'
          : 'Normal'

  return (
    <div
      className="group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200 hover:shadow-sm"
      style={{ background: s.bg, borderColor: `${s.dot}12` }}
    >
      <span
        className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full"
        style={{ background: s.dot, boxShadow: `0 0 8px ${s.dot}44` }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{r.name}</span>
          <Badge tone={r.flag ?? 'normal'}>{flagLabel}</Badge>
          <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-500">
            {r.category}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-400">
          <span className="font-bold" style={{ color: s.dot }}>
            {r.value} {r.unit}
          </span>
          <span>Rujukan: {r.reference || '—'}</span>
        </div>
      </div>
      <span className="shrink-0 text-[10px] tabular-nums text-neutral-300">
        {fmt(r.takenAt)}
      </span>
    </div>
  )
}

/* ═══════════════════════════════════════════
   ADD PATIENT FORM
   ═══════════════════════════════════════════ */

function AddPatientForm({ onAdd }: { onAdd: (p: import('../lib/types').Patient) => void }) {
  const [f, setF] = useState({
    name: '',
    sex: 'L',
    age: '40',
    heightCm: '165',
    weightKg: '60',
    bloodType: '',
    conditions: '',
    allergies: '',
  })
  const colors = ['#00BF63', '#0B7A4B', '#3b82f6', '#8b5cf6', '#FF3131', '#f59e0b']

  function submit() {
    if (!f.name.trim()) return
    const year = new Date().getFullYear() - (Number(f.age) || 30)
    onAdd({
      id: uid(),
      name: f.name.trim(),
      sex: f.sex as 'L' | 'P',
      dob: `${year}-01-01`,
      mrn: 'PMD-' + uid().slice(0, 6).toUpperCase(),
      heightCm: Number(f.heightCm) || 165,
      weightKg: Number(f.weightKg) || 60,
      bloodType: f.bloodType.trim() || undefined,
      allergies: f.allergies
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
      chronicConditions: f.conditions
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      riskFlags: [],
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
    })
    setF({
      name: '',
      sex: 'L',
      age: '40',
      heightCm: '165',
      weightKg: '60',
      bloodType: '',
      conditions: '',
      allergies: '',
    })
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Nama">
        <input
          className={inputClass}
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
          placeholder="Nama pasien"
          autoFocus
        />
      </Field>
      <Field label="Jenis Kelamin">
        <select
          className={inputClass}
          value={f.sex}
          onChange={(e) => setF({ ...f, sex: e.target.value })}
        >
          <option value="L">Laki-laki</option>
          <option value="P">Perempuan</option>
        </select>
      </Field>
      <Field label="Umur">
        <input
          className={inputClass}
          type="number"
          value={f.age}
          onChange={(e) => setF({ ...f, age: e.target.value })}
        />
      </Field>
      <Field label="Gol. Darah">
        <input
          className={inputClass}
          value={f.bloodType}
          onChange={(e) => setF({ ...f, bloodType: e.target.value })}
          placeholder="O+"
        />
      </Field>
      <Field label="Tinggi (cm)">
        <input
          className={inputClass}
          type="number"
          value={f.heightCm}
          onChange={(e) => setF({ ...f, heightCm: e.target.value })}
        />
      </Field>
      <Field label="Berat (kg)">
        <input
          className={inputClass}
          type="number"
          value={f.weightKg}
          onChange={(e) => setF({ ...f, weightKg: e.target.value })}
        />
      </Field>
      <Field label="Penyakit Kronis">
        <input
          className={inputClass}
          value={f.conditions}
          onChange={(e) => setF({ ...f, conditions: e.target.value })}
          placeholder="pisah koma"
        />
      </Field>
      <Field label="Alergi">
        <input
          className={inputClass}
          value={f.allergies}
          onChange={(e) => setF({ ...f, allergies: e.target.value })}
          placeholder="pisah koma"
        />
      </Field>
      <div className="flex items-end sm:col-span-2 lg:col-span-4">
        <Button onClick={submit} disabled={!f.name.trim()}>
          <IconPlus size={16} /> Simpan Pasien
        </Button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   ADD VITAL FORM
   ═══════════════════════════════════════════ */

function AddVital({ onAdd }: { onAdd: (v: VitalSign) => void }) {
  const [f, setF] = useState({
    sys: 120,
    dia: 80,
    hr: 78,
    rr: 16,
    temp: 36.6,
    spo2: 98,
    glu: '',
  })

  const fields: [string, string][] = [
    ['sys', 'Sistolik'],
    ['dia', 'Diastolik'],
    ['hr', 'Nadi'],
    ['rr', 'RR'],
    ['temp', 'Suhu'],
    ['spo2', 'SpO₂'],
    ['glu', 'GDS'],
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {fields.map(([k, label]) => (
        <Field key={k} label={label}>
          <input
            className={inputClass}
            type="number"
            value={f[k as keyof typeof f]}
            onChange={(e) => setF({ ...f, [k]: e.target.value })}
          />
        </Field>
      ))}
      <div className="flex items-end">
        <Button
          onClick={() =>
            onAdd({
              id: uid(),
              takenAt: new Date().toISOString(),
              systolic: Number(f.sys),
              diastolic: Number(f.dia),
              heartRate: Number(f.hr),
              respRate: Number(f.rr),
              tempC: Number(f.temp),
              spo2: Number(f.spo2),
              glucose: f.glu ? Number(f.glu) : undefined,
            })
          }
        >
          Simpan
        </Button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════ */

export function Dashboard() {
  const { state, activePatient, addVital, addPatient } = useStore()
  const p = activePatient
  const vitals: VitalSign[] = state.vitals[p.id] ?? []
  const supportive: SupportiveResult[] = (state.supportive[p.id] ?? []) as SupportiveResult[]
  const latest = vitals[vitals.length - 1]
  const anthro = computeBmi(p.weightKg, p.heightCm)
  const [showAdd, setShowAdd] = useState(false)
  const [showAddPatient, setShowAddPatient] = useState(false)

  const longevity = computeLongevity(p, latest, supportive)
  const hasPatient = p.id !== 'none'

  /* ── Empty State ── */
  if (!hasPatient) {
    return (
      <div className="mx-auto max-w-xl space-y-10 py-16">
        <div className="text-center">
          <div
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-[22px]"
            style={{
              background: 'linear-gradient(135deg, #00BF63, #0B7A4B)',
              boxShadow: '0 12px 40px rgba(0,191,99,0.3)',
            }}
          >
            <IconHeart size={34} className="text-white" />
          </div>
          <h2 className="mt-7 text-2xl font-black tracking-tight">
            Mulai Perjalanan Longevity
          </h2>
          <p className="mx-auto mt-2.5 max-w-sm text-sm leading-relaxed text-neutral-500">
            Tambahkan pasien pertama untuk memantau tanda vital, antropometri, dan data klinis
            — semua terintegrasi mendukung umur panjang berkualitas.
          </p>
        </div>
        <Card className="overflow-hidden">
          <div className="border-b border-neutral-100 px-5 py-3">
            <SectionTitle icon={<IconPlus size={18} />} title="Pasien Baru" />
          </div>
          <div className="p-5">
            <AddPatientForm onAdd={(np) => addPatient(np)} />
          </div>
        </Card>
      </div>
    )
  }

  /* ── Main Layout ── */
  return (
    <div className="space-y-5">
      {/* ── Story-like Quick Actions ── */}
      <div
        className="flex items-center gap-2.5 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <button
          onClick={() => setShowAddPatient((s) => !s)}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-neutral-200 px-4 py-2 text-[11px] font-semibold text-neutral-500 transition-all duration-200 hover:border-[#00BF63] hover:text-[#00BF63] hover:bg-[rgba(0,191,99,0.05)] active:scale-[0.97]"
        >
          <IconPlus size={13} /> Pasien Baru
        </button>
        <button
          onClick={() => setShowAdd((s) => !s)}
          className="flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-bold text-white transition-all duration-200 hover:shadow-lg active:scale-[0.97]"
          style={{
            background: 'linear-gradient(135deg, #00BF63, #0B7A4B)',
            boxShadow: '0 4px 16px rgba(0,191,99,0.3)',
          }}
        >
          <IconHeart size={13} /> Catat Vital
        </button>
        {vitals.length > 0 && (
          <span className="shrink-0 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-300">
            {vitals.length} pencatatan
          </span>
        )}
      </div>

      {/* ── Add Patient Drawer ── */}
      {showAddPatient && (
        <Card className="overflow-hidden">
          <div className="border-b border-neutral-100 px-5 py-3">
            <SectionTitle icon={<IconPlus size={18} />} title="Tambah Pasien" />
          </div>
          <div className="p-5">
            <AddPatientForm
              onAdd={(np) => {
                addPatient(np)
                setShowAddPatient(false)
              }}
            />
          </div>
        </Card>
      )}

      {/* ── Patient Profile Hero ── */}
      <Card className="overflow-hidden">
        <div className="relative">
          <div
            className="h-28"
            style={{
              background: `linear-gradient(135deg, ${p.avatarColor}18, ${p.avatarColor}08 60%, transparent)`,
            }}
          />
          <div className="relative -mt-12 px-5 pb-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <span
                  className="grid h-24 w-24 shrink-0 place-items-center rounded-[18px] text-2xl font-black text-white transition-transform duration-300 hover:scale-[1.04]"
                  style={{
                    background: `linear-gradient(145deg, ${p.avatarColor}, ${p.avatarColor}bb)`,
                    boxShadow: `0 8px 24px ${p.avatarColor}44`,
                  }}
                >
                  {p.name
                    .replace(/^[^ ]+ /, '')
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <div className="pb-1">
                  <h2 className="text-[22px] font-black leading-tight tracking-tight">
                    {p.name}
                  </h2>
                  <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-neutral-500">
                    <span>{p.sex === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                    <span className="text-neutral-200">·</span>
                    <span>{ageFromDob(p.dob)} tahun</span>
                    {p.bloodType && (
                      <>
                        <span className="text-neutral-200">·</span>
                        <span className="font-semibold text-neutral-600">
                          Gol. {p.bloodType}
                        </span>
                      </>
                    )}
                    <span className="text-neutral-200">·</span>
                    <span className="font-mono text-xs text-neutral-400">{p.mrn}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1 sm:pb-1">
                <LongevityRing score={longevity.score} band={longevity.band} />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                  Longevity Score
                </span>
              </div>
            </div>

            {/* Condition / Allergy Tags */}
            <div className="mt-5 flex flex-wrap gap-1.5">
              {p.chronicConditions.length === 0 && p.allergies.length === 0 ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold"
                  style={{ background: 'rgba(0,191,99,0.06)', color: '#0B7A4B' }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00BF63]" />
                  Tidak ada kondisi kronis / alergi tercatat
                </span>
              ) : (
                <>
                  {p.chronicConditions.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold"
                      style={{ background: 'rgba(255,49,49,0.05)', color: '#FF3131' }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: '#FF3131' }}
                      />
                      {c}
                    </span>
                  ))}
                  {p.allergies.map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold"
                      style={{ background: 'rgba(245,158,11,0.06)', color: '#b45309' }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      Alergi: {a}
                    </span>
                  ))}
                </>
              )}
            </div>

            <p className="mt-4 flex items-center gap-1.5 text-[10px] text-neutral-400">
              <IconShield size={11} className="text-[#00BF63]" /> Data kesehatan bersifat
              rahasia — hanya dibagikan atas izin pasien.
            </p>
          </div>
        </div>
      </Card>

      {/* ── Add Vital Collapsible ── */}
      {showAdd && (
        <Card className="overflow-hidden" style={{ borderColor: 'rgba(0,191,99,0.2)' }}>
          <div
            className="border-b px-5 py-3"
            style={{ borderColor: 'rgba(0,191,99,0.1)', background: 'rgba(0,191,99,0.02)' }}
          >
            <SectionTitle icon={<IconHeart size={18} />} title="Catat Tanda Vital Baru" />
          </div>
          <div className="p-5">
            <AddVital
              onAdd={(v) => {
                addVital(p.id, v)
                setShowAdd(false)
              }}
            />
          </div>
        </Card>
      )}

      {/* ── Vitals Feed Grid ── */}
      <Card className="overflow-hidden">
        <div className="border-b border-neutral-100 px-5 py-4">
          <SectionTitle
            icon={<IconHeart size={20} />}
            title="Tanda Vital"
            subtitle="Pemantauan kontinu — dukungan longevity"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 p-5 lg:grid-cols-3">
          <VitalCard
            label="Tekanan Darah"
            value={latest ? `${latest.systolic}/${latest.diastolic}` : '—'}
            unit="mmHg"
            series={vitals.map((v) => v.systolic)}
            tone={latest && latest.systolic >= 140 ? 'high' : 'normal'}
          />
          <VitalCard
            label="Nadi"
            value={latest ? `${latest.heartRate}` : '—'}
            unit="x/min"
            series={vitals.map((v) => v.heartRate)}
            tone={
              latest && (latest.heartRate > 100 || latest.heartRate < 60) ? 'high' : 'normal'
            }
          />
          <VitalCard
            label="Laju Napas"
            value={latest ? `${latest.respRate}` : '—'}
            unit="x/min"
            series={vitals.map((v) => v.respRate)}
            tone={latest && latest.respRate > 20 ? 'high' : 'normal'}
          />
          <VitalCard
            label="Suhu"
            value={latest ? `${latest.tempC}` : '—'}
            unit="°C"
            series={vitals.map((v) => v.tempC)}
            tone={latest && latest.tempC >= 37.5 ? 'high' : 'normal'}
          />
          <VitalCard
            label="SpO₂"
            value={latest ? `${latest.spo2}` : '—'}
            unit="%"
            series={vitals.map((v) => v.spo2)}
            tone={latest && latest.spo2 < 95 ? 'high' : 'normal'}
          />
          <VitalCard
            label="Gula Darah"
            value={latest?.glucose ? `${latest.glucose}` : '—'}
            unit="mg/dL"
            series={vitals.map((v) => v.glucose ?? 0).filter(Boolean)}
            tone={latest?.glucose && latest.glucose >= 200 ? 'high' : 'normal'}
          />
        </div>
        {latest && (
          <div className="border-t border-neutral-50 px-5 py-2.5">
            <p className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <span className="inline-block h-[6px] w-[6px] rounded-full bg-[#00BF63] animate-pulse" />
              Terakhir diperbarui {fmt(latest.takenAt)}
            </p>
          </div>
        )}
      </Card>

      {/* ── Anthropometry + BMI Gauge ── */}
      <Card className="overflow-hidden">
        <div className="border-b border-neutral-100 px-5 py-4">
          <SectionTitle
            icon={<IconSparkle size={18} />}
            title="Antropometri"
            subtitle="Asia-Pacific cut-off"
          />
        </div>
        <div className="grid gap-8 p-5 lg:grid-cols-2">
          <div className="space-y-3">
            <div
              className="flex items-center justify-between rounded-xl px-4 py-3.5"
              style={{ background: 'rgba(0,0,0,0.02)' }}
            >
              <span className="text-sm text-neutral-500">Tinggi Badan</span>
              <span className="text-lg font-bold tabular-nums">
                {p.heightCm}{' '}
                <span className="text-xs font-normal text-neutral-400">cm</span>
              </span>
            </div>
            <div
              className="flex items-center justify-between rounded-xl px-4 py-3.5"
              style={{ background: 'rgba(0,0,0,0.02)' }}
            >
              <span className="text-sm text-neutral-500">Berat Badan</span>
              <span className="text-lg font-bold tabular-nums">
                {p.weightKg}{' '}
                <span className="text-xs font-normal text-neutral-400">kg</span>
              </span>
            </div>
            <div
              className="mt-4 rounded-xl p-4"
              style={{
                background: 'rgba(0,191,99,0.03)',
                border: '1px solid rgba(0,191,99,0.08)',
              }}
            >
              <p className="text-[11px] leading-relaxed text-neutral-500">
                <IconSparkle size={11} className="mr-1 inline text-[#00BF63]" />
                Z-score WHO/CDC penuh (BB/U, TB/U, BB/TB) dihitung AI saat workup di AI-EMR.
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-full">
              <BmiGauge bmi={anthro.bmi} kesan={anthro.kesan} tone={anthro.tone} />
            </div>
          </div>
        </div>
      </Card>

      {/* ── Growth Chart ── */}
      <Card className="overflow-hidden">
        <div className="border-b border-neutral-100 px-5 py-4">
          <SectionTitle
            icon={<IconSparkle size={18} />}
            title="Grafik Tumbuh Kembang & BMI"
            subtitle={
              ageFromDob(p.dob) <= 19
                ? 'Kurva pertumbuhan anak/remaja (WHO/CDC) — BB/U · TB/U · IMT/U'
                : 'Klasifikasi IMT dewasa (Asia-Pasifik)'
            }
          />
        </div>
        <div className="p-5">
          <GrowthChart patient={p} ageYears={ageFromDob(p.dob)} />
        </div>
      </Card>

      {/* ── Supportive Results — Card Stream ── */}
      <Card className="overflow-hidden">
        <div className="border-b border-neutral-100 px-5 py-4">
          <SectionTitle
            icon={<IconShield size={20} />}
            title="Pemeriksaan Penunjang"
            subtitle="Lab · EKG · Radiologi — suportif longevity"
          />
        </div>
        <div className="space-y-2 p-5">
          {supportive.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(0,0,0,0.03)' }}
              >
                <IconShield size={22} className="text-neutral-300" />
              </div>
              <p className="text-sm text-neutral-400">
                Belum ada hasil pemeriksaan penunjang.
              </p>
            </div>
          ) : (
            supportive.map((r) => <SupportiveCard key={r.id} r={r} />)
          )}
        </div>
      </Card>
    </div>
  )
}
