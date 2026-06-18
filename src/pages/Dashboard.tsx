import { useState } from 'react'
import { useStore, uid } from '../lib/store'
import { Card, SectionTitle, Badge, Button, Field, inputClass } from '../components/ui'
import { IconHeart, IconShield, IconPlus, IconSparkle } from '../components/icons'
import { computeBmi, ageFromDob } from '../lib/anthro'
import { GrowthChart } from '../components/GrowthChart'
import type { VitalSign } from '../lib/types'

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Tiny inline sparkline for a vital series.
function Spark({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null
  const w = 120
  const h = 34
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - ((v - min) / span) * (h - 6) - 3
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={w}
        cy={h - ((values[values.length - 1] - min) / span) * (h - 6) - 3}
        r="3"
        fill={color}
      />
    </svg>
  )
}

export function Dashboard() {
  const { state, activePatient, addVital, addPatient } = useStore()
  const p = activePatient
  const vitals = state.vitals[p.id] ?? []
  const supportive = state.supportive[p.id] ?? []
  const latest = vitals[vitals.length - 1]
  const anthro = computeBmi(p.weightKg, p.heightCm)
  const [showAdd, setShowAdd] = useState(false)
  const [showAddPatient, setShowAddPatient] = useState(false)

  const longevity = computeLongevity(p, latest, supportive)
  const hasPatient = p.id !== 'none'

  if (!hasPatient) {
    return (
      <div className="space-y-6">
        <Card className="text-center">
          <IconHeart size={32} className="mx-auto text-brand" />
          <h2 className="mt-2 text-xl font-bold">Belum ada pasien</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
            Tambahkan pasien pertama Anda untuk mulai mencatat tanda vital, antropometri & data klinis.
          </p>
        </Card>
        <Card>
          <SectionTitle icon={<IconPlus size={18} />} title="Tambah Pasien" />
          <AddPatientForm onAdd={(np) => addPatient(np)} />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setShowAddPatient((s) => !s)}>
          <IconPlus size={16} /> Tambah Pasien
        </Button>
      </div>
      {showAddPatient && (
        <Card>
          <SectionTitle icon={<IconPlus size={18} />} title="Tambah Pasien" />
          <AddPatientForm onAdd={(np) => { addPatient(np); setShowAddPatient(false) }} />
        </Card>
      )}
      {/* Patient identity — continuous */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-xl font-extrabold text-white"
              style={{ background: p.avatarColor }}
            >
              {p.name.replace(/^[^ ]+ /, '').slice(0, 2).toUpperCase()}
            </span>
            <div>
              <h2 className="text-xl font-extrabold leading-tight">{p.name}</h2>
              <p className="text-sm text-neutral-500">
                {p.sex === 'L' ? 'Laki-laki' : 'Perempuan'} · {ageFromDob(p.dob)} tahun · MRN {p.mrn}
                {p.bloodType ? ` · Gol. ${p.bloodType}` : ''}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.chronicConditions.map((c) => (
                  <Badge key={c} tone="high">
                    {c}
                  </Badge>
                ))}
                {p.allergies.map((a) => (
                  <Badge key={a} tone="critical">
                    Alergi: {a}
                  </Badge>
                ))}
              </div>
              <p className="mt-2 flex items-center gap-1 text-[11px] text-neutral-400">
                <IconShield size={12} className="text-brand" /> Data kesehatan bersifat rahasia —
                hanya dibagikan atas izin pasien.
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-brand-50 px-4 py-3 text-right">
            <div className="flex items-center justify-end gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-dark">
              <IconShield size={14} /> Longevity Score
            </div>
            <div className="text-3xl font-extrabold text-brand-dark">{longevity.score}</div>
            <div className="text-xs text-neutral-500">{longevity.band}</div>
          </div>
        </div>
      </Card>

      {/* Vitals + anthropometry */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle
            icon={<IconHeart size={20} />}
            title="Tanda Vital — Pemantauan Kontinu"
            subtitle="Terintegrasi dengan identitas pasien sebagai dukungan longevity"
            right={
              <Button variant="outline" onClick={() => setShowAdd((s) => !s)}>
                <IconPlus size={16} /> Catat Vital
              </Button>
            }
          />

          {showAdd && <AddVital onAdd={(v) => { addVital(p.id, v); setShowAdd(false) }} />}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <VitalTile
              label="Tekanan Darah"
              value={latest ? `${latest.systolic}/${latest.diastolic}` : '—'}
              unit="mmHg"
              series={vitals.map((v) => v.systolic)}
              tone={latest && latest.systolic >= 140 ? 'high' : 'normal'}
            />
            <VitalTile
              label="Nadi"
              value={latest ? `${latest.heartRate}` : '—'}
              unit="x/min"
              series={vitals.map((v) => v.heartRate)}
              tone={latest && (latest.heartRate > 100 || latest.heartRate < 60) ? 'high' : 'normal'}
            />
            <VitalTile
              label="Laju Napas"
              value={latest ? `${latest.respRate}` : '—'}
              unit="x/min"
              series={vitals.map((v) => v.respRate)}
              tone={latest && latest.respRate > 20 ? 'high' : 'normal'}
            />
            <VitalTile
              label="Suhu"
              value={latest ? `${latest.tempC}` : '—'}
              unit="°C"
              series={vitals.map((v) => v.tempC)}
              tone={latest && latest.tempC >= 37.5 ? 'high' : 'normal'}
            />
            <VitalTile
              label="SpO₂"
              value={latest ? `${latest.spo2}` : '—'}
              unit="%"
              series={vitals.map((v) => v.spo2)}
              tone={latest && latest.spo2 < 95 ? 'high' : 'normal'}
            />
            <VitalTile
              label="Gula Darah"
              value={latest?.glucose ? `${latest.glucose}` : '—'}
              unit="mg/dL"
              series={vitals.map((v) => v.glucose ?? 0).filter(Boolean)}
              tone={latest?.glucose && latest.glucose >= 200 ? 'high' : 'normal'}
            />
          </div>
          {latest && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-neutral-400">
              <span className="vital-dot inline-block h-2 w-2 rounded-full bg-brand" />
              Pembaruan terakhir {fmt(latest.takenAt)} · {vitals.length} pencatatan tersimpan
            </p>
          )}
        </Card>

        <Card>
          <SectionTitle icon={<IconSparkle size={18} />} title="Antropometri" subtitle="Asia-Pacific cut-off" />
          <div className="space-y-3">
            <Row label="Tinggi Badan" value={`${p.heightCm} cm`} />
            <Row label="Berat Badan" value={`${p.weightKg} kg`} />
            <Row label="IMT (BMI)" value={`${anthro.bmi} kg/m²`} />
            <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
              <span className="text-sm text-neutral-500">Kesan</span>
              <Badge tone={anthro.tone}>{anthro.kesan}</Badge>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-neutral-400">
            Z-score WHO/CDC penuh (BB/U, TB/U, BB/TB) dihitung AI saat workup di AI-EMR.
          </p>
        </Card>
      </div>

      {/* Growth & BMI charts */}
      <Card>
        <SectionTitle
          icon={<IconSparkle size={18} />}
          title="Grafik Tumbuh Kembang & BMI"
          subtitle={
            ageFromDob(p.dob) <= 19
              ? 'Kurva pertumbuhan anak/remaja (WHO/CDC) — BB/U · TB/U · IMT/U'
              : 'Klasifikasi IMT dewasa (Asia-Pasifik)'
          }
        />
        <GrowthChart patient={p} ageYears={ageFromDob(p.dob)} />
      </Card>

      {/* Supportive results */}
      <Card>
        <SectionTitle
          icon={<IconShield size={20} />}
          title="Pemeriksaan Penunjang — Suportif Longevity"
          subtitle="Lab · EKG · Radiologi yang menyertai identitas pasien"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-neutral-400">
                <th className="pb-2 pr-4 font-semibold">Tanggal</th>
                <th className="pb-2 pr-4 font-semibold">Kategori</th>
                <th className="pb-2 pr-4 font-semibold">Pemeriksaan</th>
                <th className="pb-2 pr-4 font-semibold">Hasil</th>
                <th className="pb-2 pr-4 font-semibold">Rujukan</th>
                <th className="pb-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {supportive.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-neutral-400">
                    Belum ada hasil penunjang.
                  </td>
                </tr>
              )}
              {supportive.map((r) => (
                <tr key={r.id} className="border-t border-neutral-100">
                  <td className="py-2.5 pr-4 text-neutral-500">{fmt(r.takenAt)}</td>
                  <td className="py-2.5 pr-4">
                    <Badge tone="brand">{r.category}</Badge>
                  </td>
                  <td className="py-2.5 pr-4 font-medium">{r.name}</td>
                  <td className="py-2.5 pr-4 font-semibold">
                    {r.value} {r.unit}
                  </td>
                  <td className="py-2.5 pr-4 text-neutral-400">{r.reference || '—'}</td>
                  <td className="py-2.5">
                    <Badge tone={r.flag ?? 'normal'}>
                      {r.flag === 'high'
                        ? 'Tinggi'
                        : r.flag === 'low'
                          ? 'Rendah'
                          : r.flag === 'critical'
                            ? 'Kritis'
                            : 'Normal'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function VitalTile({
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
  return (
    <div
      className={`rounded-xl border p-3 ${
        tone === 'high' ? 'border-red-200 bg-red-50/60' : 'border-neutral-100 bg-neutral-50/60'
      }`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{label}</div>
      <div className="flex items-end justify-between">
        <div>
          <span className={`text-2xl font-extrabold ${tone === 'high' ? 'text-accent' : 'text-ink'}`}>
            {value}
          </span>
          <span className="ml-1 text-xs text-neutral-400">{unit}</span>
        </div>
        <Spark values={series} color={tone === 'high' ? '#FF3131' : '#00BF63'} />
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

function AddPatientForm({ onAdd }: { onAdd: (p: import('../lib/types').Patient) => void }) {
  const [f, setF] = useState({ name: '', sex: 'L', age: '40', heightCm: '165', weightKg: '60', bloodType: '', conditions: '', allergies: '' })
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
      allergies: f.allergies.split(',').map((a) => a.trim()).filter(Boolean),
      chronicConditions: f.conditions.split(',').map((c) => c.trim()).filter(Boolean),
      riskFlags: [],
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
    })
    setF({ name: '', sex: 'L', age: '40', heightCm: '165', weightKg: '60', bloodType: '', conditions: '', allergies: '' })
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Nama"><input className={inputClass} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Nama pasien" /></Field>
      <Field label="Jenis Kelamin">
        <select className={inputClass} value={f.sex} onChange={(e) => setF({ ...f, sex: e.target.value })}>
          <option value="L">Laki-laki</option>
          <option value="P">Perempuan</option>
        </select>
      </Field>
      <Field label="Umur"><input className={inputClass} type="number" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} /></Field>
      <Field label="Gol. Darah"><input className={inputClass} value={f.bloodType} onChange={(e) => setF({ ...f, bloodType: e.target.value })} placeholder="O+" /></Field>
      <Field label="Tinggi (cm)"><input className={inputClass} type="number" value={f.heightCm} onChange={(e) => setF({ ...f, heightCm: e.target.value })} /></Field>
      <Field label="Berat (kg)"><input className={inputClass} type="number" value={f.weightKg} onChange={(e) => setF({ ...f, weightKg: e.target.value })} /></Field>
      <Field label="Penyakit Kronis"><input className={inputClass} value={f.conditions} onChange={(e) => setF({ ...f, conditions: e.target.value })} placeholder="pisah koma" /></Field>
      <Field label="Alergi"><input className={inputClass} value={f.allergies} onChange={(e) => setF({ ...f, allergies: e.target.value })} placeholder="pisah koma" /></Field>
      <div className="flex items-end sm:col-span-2 lg:col-span-4">
        <Button onClick={submit} disabled={!f.name.trim()}><IconPlus size={16} /> Simpan Pasien</Button>
      </div>
    </div>
  )
}

function AddVital({ onAdd }: { onAdd: (v: VitalSign) => void }) {
  const [f, setF] = useState({ sys: 120, dia: 80, hr: 78, rr: 16, temp: 36.6, spo2: 98, glu: '' })
  return (
    <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-neutral-50 p-3 sm:grid-cols-4">
      {(
        [
          ['sys', 'Sistolik'],
          ['dia', 'Diastolik'],
          ['hr', 'Nadi'],
          ['rr', 'RR'],
          ['temp', 'Suhu'],
          ['spo2', 'SpO₂'],
          ['glu', 'GDS'],
        ] as const
      ).map(([k, label]) => (
        <Field key={k} label={label}>
          <input
            className={inputClass}
            type="number"
            value={(f as Record<string, number | string>)[k]}
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

function computeLongevity(
  p: ReturnType<typeof useStore>['activePatient'],
  latest: VitalSign | undefined,
  supportive: ReturnType<typeof useStore>['state']['supportive'][string],
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
