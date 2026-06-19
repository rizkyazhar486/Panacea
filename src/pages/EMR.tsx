import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { Card, SectionTitle, Badge, Button } from '../components/ui'
import { IconEMR, IconCheck, IconSparkle, IconShield, IconBook } from '../components/icons'
import { BodyDiagram, type SystemFinding } from '../components/BodyDiagram'
import { generateEducation } from '../lib/ai'
import type { Anamnesis, EMRRecord, PhysicalExam } from '../lib/types'

const BODY_SYSTEMS: { key: string; label: string; x: number; y: number; kw: string[] }[] = [
  { key: 'mata', label: 'Mata', x: 60, y: 9, kw: ['mata', 'pupil', 'konjungtiva', 'sklera', 'visus', 'vod', 'vos'] },
  { key: 'tht', label: 'THT', x: 38, y: 10, kw: ['telinga', 'hidung', 'tenggorok', 'faring', 'tonsil', 'mukosa', 'nasofaring'] },
  { key: 'kepala', label: 'Kepala', x: 50, y: 5, kw: ['kepala', 'normosefali', 'wajah', 'facies'] },
  { key: 'leher', label: 'Leher', x: 50, y: 17, kw: ['leher', 'kgb', 'trakea', 'tiroid', 'jvp'] },
  { key: 'paru', label: 'Paru', x: 37, y: 32, kw: ['paru', 'vesikuler', 'ronki', 'rhonki', 'wheezing', 'fremitus', 'sonor'] },
  { key: 'jantung', label: 'Jantung', x: 61, y: 34, kw: ['jantung', 'cardio', 'iktus', 'ictus', 's1s2', 'murmur', 'gallop'] },
  { key: 'abdomen', label: 'Abdomen', x: 50, y: 47, kw: ['abdomen', 'bising usus', 'hepatomegali', 'splenomegali', 'nyeri tekan', 'supel'] },
  { key: 'kulit', label: 'Kulit', x: 28, y: 58, kw: ['kulit', 'spider nevi', 'eritema', 'pucat', 'sianosis'] },
  { key: 'ekstremitas', label: 'Ekstremitas', x: 72, y: 82, kw: ['ekstremitas', 'akral', 'crt', 'edema'] },
]

const ABNORMAL_HINTS = ['(+)', 'menurun', 'prolaps', 'massa', 'pembesaran', 'deviasi', 'ikterik', 'edema (+)', 'anemis (+)', 'ronki (+', 'wheezing (+', 'murmur (+', 'asites']

function LabPanel({ results }: { results: import('../lib/types').SupportiveResult[] }) {
  const labs = results.filter((r) => r.category === 'Lab')
  if (labs.length === 0) return null
  const pos: Record<string, number> = { low: 18, normal: 50, high: 80, critical: 94 }
  const col: Record<string, string> = { low: '#f59e0b', normal: '#00BF63', high: '#FF3131', critical: '#FF3131' }
  return (
    <div className="mb-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Panel Lab — nilai vs rentang rujukan</div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {labs.map((r) => {
          const f = r.flag ?? 'normal'
          return (
            <div key={r.id} className="rounded-xl border border-neutral-100 p-2.5">
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="font-semibold">{r.name}</span>
                <span className="font-bold" style={{ color: col[f] }}>{r.value} {r.unit}</span>
              </div>
              <div className="relative h-2 rounded-full bg-gradient-to-r from-amber-200 via-brand-100 to-red-200">
                <div className="absolute top-1/2 h-3.5 w-1 -translate-y-1/2 rounded-full" style={{ left: `${pos[f]}%`, background: col[f] }} />
              </div>
              <div className="mt-1 text-[10px] text-neutral-400">Rujukan: {r.reference || '—'}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function supportiveDefaults(weightKg: number) {
  const w = weightKg || 60
  const maint = w > 20 ? 1500 + 20 * (w - 20) : w > 10 ? 1000 + 50 * (w - 10) : 100 * w
  return {
    resusitasi: 'Nilai ABC; kristaloid (RL/NaCl 0.9%) sesuai status; target MAP ≥65 mmHg.',
    balansCairan: `Rumatan ±${Math.round(maint)} mL/24 jam (${Math.round(maint / 24)} mL/jam, Holliday-Segar); sesuaikan defisit/loss.`,
    kebutuhanKalori: `${Math.round(w * 25)}–${Math.round(w * 30)} kkal/hari (25–30 kkal/kg).`,
    urineOutput: `> ${(0.5 * w).toFixed(1)} mL/jam (0,5 mL/kg/jam).`,
  }
}

function buildFindings(perSystem: string): SystemFinding[] {
  const lines = perSystem.split('\n').filter(Boolean)
  return BODY_SYSTEMS.map((sys) => {
    const matched = lines.filter((l) => sys.kw.some((k) => l.toLowerCase().includes(k)))
    if (matched.length === 0) return { ...sys, status: 'unchecked' as const }
    const note = matched.join(' ')
    const low = note.toLowerCase()
    const abnormal = ABNORMAL_HINTS.some((h) => low.includes(h))
    return { ...sys, status: abnormal ? ('abnormal' as const) : ('normal' as const), note }
  })
}

const ANAMNESIS_FIELDS: { key: keyof Anamnesis; label: string }[] = [
  { key: 'keluhanUtama', label: 'Keluhan Utama' },
  { key: 'rps', label: 'Riwayat Penyakit Sekarang (SOCRATES)' },
  { key: 'rpd', label: 'Riwayat Penyakit Dahulu' },
  { key: 'rpk', label: 'Riwayat Penyakit Keluarga' },
  { key: 'riwayatKehamilan', label: 'Riwayat Kehamilan & Persalinan' },
  { key: 'riwayatPengobatan', label: 'Riwayat Pengobatan' },
  { key: 'riwayatAlergi', label: 'Riwayat Alergi' },
  { key: 'riwayatTumbuhKembang', label: 'Riwayat Tumbuh Kembang' },
  { key: 'riwayatNutrisi', label: 'Riwayat Nutrisi' },
  { key: 'riwayatImunisasi', label: 'Riwayat Imunisasi' },
  { key: 'riwayatSosialEkonomi', label: 'Riwayat Sosial-Ekonomi & Lingkungan' },
]

function StrGate({ onVerify, str }: { onVerify: () => void; str?: string }) {
  return (
    <div className="mx-auto max-w-lg">
      <Card className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 text-amber-700"><IconShield size={30} /></span>
        <h2 className="mt-4 text-xl font-extrabold">STR sedang diverifikasi</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Akses <b>AI-EMR</b> hanya untuk klinisi dengan <b>STR/SIP terverifikasi</b> (sesuai UU Kesehatan &amp; Permenkes Telemedicine).
          Nomor STR Anda{str ? <> (<b>{str}</b>)</> : ''} telah kami terima dan sedang ditinjau tim verifikasi.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" /> Status: Menunggu verifikasi
        </div>
        <div className="mt-5 rounded-xl bg-neutral-50 p-3 text-left text-[12px] text-neutral-500">
          Verifikasi dilakukan oleh tim Panaceamed terhadap data KKI/STR. Setelah disetujui, AI-EMR terbuka otomatis.
        </div>
        <Button variant="outline" className="mt-4" onClick={onVerify}>
          <IconCheck size={16} /> Verifikasi STR (Admin/Owner)
        </Button>
      </Card>
    </div>
  )
}

export function EMR() {
  const store = useStore()
  const { state, activePatient, saveRecord } = store
  const acc = state.account
  // STR gate — AI-EMR is restricted to clinicians with a verified STR/SIP.
  if (acc?.role === 'dokter' && acc.strStatus !== 'verified' && !acc.isOwner) {
    return <StrGate onVerify={store.verifyStr} str={acc.str} />
  }
  const record = state.records[activePatient.id]
  const [draft, setDraft] = useState<EMRRecord | null>(record ?? null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setDraft(state.records[activePatient.id] ?? null)
    setDirty(false)
  }, [activePatient.id, state.records])

  if (!draft) return <EmptyEMR />

  function patch(fn: (r: EMRRecord) => EMRRecord) {
    setDraft((d) => (d ? fn(d) : d))
    setDirty(true)
  }

  function setAnamnesis(key: keyof Anamnesis, value: string) {
    patch((r) => ({ ...r, anamnesis: { ...r.anamnesis, [key]: value }, updatedAt: new Date().toISOString() }))
  }
  function setExam(key: keyof PhysicalExam, value: string | boolean) {
    patch((r) => ({ ...r, physicalExam: { ...r.physicalExam, [key]: value }, updatedAt: new Date().toISOString() }))
  }

  function save() {
    if (draft) {
      saveRecord({ ...draft, updatedAt: new Date().toISOString() })
      setDirty(false)
    }
  }

  function sign() {
    if (!draft) return
    const signed = {
      ...draft,
      physicalExam: { ...draft.physicalExam, doctorVerified: true, verifiedBy: state.settings.doctorName },
      signedBy: state.settings.doctorName,
      signedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setDraft(signed)
    saveRecord(signed)
    setDirty(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle
            icon={<IconEMR size={20} />}
            title="AI-EMR · Rekam Medis Elektronik"
            subtitle={`Pasien: ${activePatient.name} · diperbarui ${new Date(draft.updatedAt).toLocaleString('id-ID')}`}
          />
          <div className="flex items-center gap-2 print:hidden">
            {draft.signedBy ? (
              <Badge tone="brand">
                <IconCheck size={13} /> Ditandatangani {draft.signedBy}
              </Badge>
            ) : (
              <Badge tone="high">Menunggu verifikasi dokter</Badge>
            )}
            <Button variant="outline" onClick={save} disabled={!dirty}>
              {dirty ? 'Simpan Perubahan' : 'Tersimpan'}
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <IconBook size={14} /> Cetak / PDF
            </Button>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-brand-50/70 px-3 py-2 text-xs text-brand-dark">
          <IconSparkle size={14} />
          Bagian bertanda <b>USULAN AI</b> wajib diverifikasi & dilengkapi dokter sebelum
          ditandatangani.
        </div>
      </Card>

      {/* S — Subjective */}
      <Card>
        <SectionTitle title="S · Subjective — Anamnesis" subtitle="Disusun AI, dapat diedit dokter" />
        <div className="grid gap-4 md:grid-cols-2">
          {ANAMNESIS_FIELDS.map((f) => (
            <div key={f.key} className={f.key === 'rps' ? 'md:col-span-2' : ''}>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {f.label}
              </label>
              <textarea
                value={draft.anamnesis[f.key]}
                onChange={(e) => setAnamnesis(f.key, e.target.value)}
                rows={f.key === 'rps' ? 4 : 2}
                placeholder="—"
                className="w-full resize-y rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* O — Objective */}
      <Card>
        <SectionTitle
          title="O · Objective — Pemeriksaan Fisik"
          subtitle="Diisi & diverifikasi oleh dokter pemeriksa"
          right={
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={draft.physicalExam.doctorVerified}
                onChange={(e) => setExam('doctorVerified', e.target.checked)}
                className="h-4 w-4 accent-[#00BF63]"
              />
              <IconShield size={16} className="text-brand" />
              Pemeriksaan fisik diverifikasi
            </label>
          }
        />
        <div className="mb-4 rounded-2xl border border-neutral-100 bg-white p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Peta Sistem — ringkasan visual temuan
          </div>
          <BodyDiagram findings={buildFindings(draft.physicalExam.perSystem)} />
        </div>

        <div className="grid gap-4">
          <ExamField
            label="Keadaan Umum & Kesadaran"
            value={draft.physicalExam.general}
            onChange={(v) => setExam('general', v)}
            rows={2}
          />
          <ExamField
            label="Tanda Vital (catatan klinis)"
            value={draft.physicalExam.vitalsNote}
            onChange={(v) => setExam('vitalsNote', v)}
            rows={2}
          />
          <ExamField
            label="Pemeriksaan Per-Sistem (usulan penunjang dari AI di bawah — lengkapi temuan)"
            value={draft.physicalExam.perSystem}
            onChange={(v) => setExam('perSystem', v)}
            rows={6}
          />
        </div>
      </Card>

      {/* Penunjang & Suportif */}
      <Card>
        <SectionTitle
          title="Penunjang & Terapi Suportif"
          subtitle="Interpretasi Lab/EKG · resusitasi, balans cairan, kebutuhan kalori, urine output"
        />
        <LabPanel results={state.supportive[activePatient.id] ?? []} />
        <div className="mb-4">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Interpretasi Temuan Lab & Hasil EKG
          </label>
          <textarea
            value={draft.labEkgInterpretation ?? ''}
            onChange={(e) =>
              patch((r) => ({ ...r, labEkgInterpretation: e.target.value, updatedAt: new Date().toISOString() }))
            }
            rows={4}
            placeholder="mis. HbA1c 8.2% (DM tak terkontrol); EKG: LVH, sinus rhythm…"
            className="w-full resize-y rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ['resusitasi', 'Resusitasi'],
              ['balansCairan', 'Balans Cairan'],
              ['kebutuhanKalori', 'Kebutuhan Kalori'],
              ['urineOutput', 'Target Urine Output'],
            ] as const
          ).map(([k, label]) => (
            <div key={k}>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</label>
              <input
                value={(draft.supportive ?? supportiveDefaults(activePatient.weightKg))[k]}
                onChange={(e) =>
                  patch((r) => ({
                    ...r,
                    supportive: { ...(r.supportive ?? supportiveDefaults(activePatient.weightKg)), [k]: e.target.value },
                    updatedAt: new Date().toISOString(),
                  }))
                }
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-neutral-400">
          Default dihitung dari berat badan (kalori 25–30 kkal/kg; urine 0.5 mL/kg/jam; cairan rumatan
          Holliday-Segar) — dokter dapat menyesuaikan.
        </p>
      </Card>

      {/* A — Assessment */}
      <Card>
        <SectionTitle
          title="A · Assessment — Daftar Masalah & Pengkajian"
          subtitle="Reasoning AI: basis temuan + narasi “Dipikirkan …”"
        />
        <div className="space-y-4">
          {draft.problems.length === 0 && <p className="text-sm text-neutral-400">Belum ada masalah.</p>}
          {draft.problems.map((pr, i) => (
            <div key={pr.id} className="rounded-xl border border-neutral-100 p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-brand text-xs font-bold text-white">
                  {i + 1}
                </span>
                <h4 className="font-bold">{pr.title}</h4>
                {typeof pr.probability === 'number' && (
                  <span className="ml-auto flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-neutral-400">Probabilitas</span>
                    <span className="h-1.5 w-20 overflow-hidden rounded-full bg-neutral-100">
                      <span
                        className="block h-full rounded-full bg-brand"
                        style={{ width: `${Math.max(0, Math.min(100, pr.probability))}%` }}
                      />
                    </span>
                    <span className="text-xs font-bold text-brand-dark">{pr.probability}%</span>
                  </span>
                )}
              </div>
              <p className="mb-2 text-sm">
                <span className="font-semibold text-neutral-500">Basis: </span>
                {pr.basis}
              </p>
              <p className="rounded-lg bg-neutral-50 p-3 text-sm leading-relaxed text-neutral-700">
                {pr.assessment}
              </p>
              {pr.differentials && pr.differentials.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    Diagnosis Banding
                  </div>
                  <ul className="mt-1 space-y-1 text-sm">
                    {pr.differentials.map((d, j) => (
                      <li key={j} className="flex gap-2 text-neutral-600">
                        <span className="text-brand">↔</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
          {draft.prognosis && (
            <div className="rounded-xl border-2 border-brand/15 bg-brand-50/40 p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-brand-dark">Prognosis</div>
              <p className="text-sm leading-relaxed text-neutral-700">{draft.prognosis}</p>
            </div>
          )}
        </div>
      </Card>

      {/* P — Plan summary */}
      <Card>
        <SectionTitle
          title="P · Plan — Ringkasan"
          subtitle="Detail verifikasi rencana pada modul Planning"
          right={
            <Link to="/planning">
              <Button variant="outline">Buka Planning →</Button>
            </Link>
          }
        />
        <ul className="space-y-1.5 text-sm">
          {draft.plan.map((pi) => (
            <li key={pi.id} className="flex items-center gap-2">
              <Badge tone={pi.status === 'diverifikasi' ? 'brand' : pi.status === 'ditolak' ? 'critical' : 'high'}>
                {pi.category}
              </Badge>
              <span className={pi.status === 'ditolak' ? 'text-neutral-400 line-through' : ''}>{pi.text}</span>
            </li>
          ))}
        </ul>
        {draft.references.length > 0 && (
          <div className="mt-4 border-t border-neutral-100 pt-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Referensi (Vancouver)
            </div>
            <ol className="list-decimal space-y-1 pl-5 text-xs text-neutral-500">
              {draft.references.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ol>
          </div>
        )}
      </Card>

      {/* Patient education */}
      <EducationCard diagnosis={draft.problems[0]?.title ?? draft.anamnesis.keluhanUtama} />

      {/* Sign-off */}
      <Card className="border-2 border-brand/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold">Tanda Tangan Dokter Pemeriksa</h3>
            <p className="text-sm text-neutral-500">
              Dengan menandatangani, dokter memverifikasi seluruh isi rekam medis ini.
            </p>
          </div>
          <Button onClick={sign} disabled={Boolean(draft.signedBy) && !dirty}>
            <IconCheck size={16} />
            {draft.signedBy ? 'Tandatangani Ulang' : `Tandatangani sebagai ${state.settings.doctorName}`}
          </Button>
        </div>
        {draft.signedAt && (
          <p className="mt-2 text-xs text-brand-dark">
            ✓ Disahkan {state.settings.doctorName} pada {new Date(draft.signedAt).toLocaleString('id-ID')}
          </p>
        )}
      </Card>
    </div>
  )
}

function ExamField({
  label,
  value,
  onChange,
  rows,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  rows: number
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder="Isi temuan pemeriksaan fisik…"
        className="w-full resize-y rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </div>
  )
}

function EducationCard({ diagnosis }: { diagnosis: string }) {
  const { state, activePatient, saveEducation } = useStore()
  const sheet = state.education[activePatient.id]
  const [busy, setBusy] = useState(false)
  const subscribed = state.subscription.plan !== 'none'

  async function gen() {
    setBusy(true)
    const vitals = state.vitals[activePatient.id] ?? []
    const s = await generateEducation(
      state.settings,
      {
        patient: activePatient,
        latestVitals: vitals[vitals.length - 1],
        supportive: state.supportive[activePatient.id] ?? [],
      },
      diagnosis,
    )
    saveEducation(activePatient.id, s)
    setBusy(false)
  }

  return (
    <Card>
      <SectionTitle
        icon={<IconBook size={18} />}
        title="Edukasi Pasien — Singkat & Mendalam"
        subtitle="Agar pasien memahami penyakitnya dan cara menjaga kesehatannya"
        right={
          <Button onClick={gen} disabled={busy}>
            <IconSparkle size={16} /> {busy ? 'Menyusun…' : sheet ? 'Buat Ulang' : 'Buat Edukasi Pasien'}
          </Button>
        }
      />
      {!subscribed && (
        <div className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Fitur edukasi otomatis termasuk dalam langganan. Anda tetap dapat mencobanya di sini.
        </div>
      )}
      {!sheet ? (
        <p className="text-sm text-neutral-400">
          Belum ada lembar edukasi. Tekan tombol di atas untuk membuat edukasi pasien tentang{' '}
          <b>{diagnosis || 'diagnosis'}</b>.
        </p>
      ) : (
        <EducationDeck sheet={sheet} />
      )}
    </Card>
  )
}

// Presentation-style education deck — few words, high impact (international slide feel).
function EducationDeck({ sheet }: { sheet: import('../lib/types').EducationSheet }) {
  return (
    <div className="space-y-4">
      {/* Hero slide */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#00BF63] to-[#0b7a4b] p-6 text-white">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">Edukasi Pasien</div>
        <h3 className="mt-1 text-2xl font-extrabold leading-tight">{sheet.diagnosis}</h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/90">{sheet.ringkas}</p>
      </div>

      {/* Key actions — 1·2·3 cards */}
      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-400">
          Langkah Menjaga Kesehatan
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sheet.caraMenjaga.slice(0, 6).map((c, i) => (
            <div key={i} className="rounded-2xl border border-neutral-100 p-4">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-base font-extrabold text-brand-dark">
                {i + 1}
              </div>
              <p className="mt-2 text-sm font-medium leading-snug">{c}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Red flags strip */}
      <div className="rounded-2xl border-2 border-accent/20 bg-red-50/40 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-accent">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-white">!</span>
          Tanda Bahaya — Segera ke Faskes
        </div>
        <div className="flex flex-wrap gap-2">
          {sheet.tandaBahaya.map((c, i) => (
            <span key={i} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 ring-1 ring-accent/20">
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Deep-dive, collapsed by default */}
      <details className="rounded-2xl border border-neutral-100 p-4">
        <summary className="cursor-pointer text-sm font-bold text-neutral-700">
          Penjelasan mendalam (opsional)
        </summary>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">{sheet.mendalam}</p>
      </details>

      <p className="text-[11px] text-neutral-400">
        Dibuat {new Date(sheet.generatedAt).toLocaleString('id-ID')} · AI mendukung, verifikasi klinisi.
      </p>
    </div>
  )
}

function EmptyEMR() {
  return (
    <Card className="mx-auto max-w-md text-center">
      <IconEMR size={40} className="mx-auto text-brand" />
      <h3 className="mt-3 text-lg font-bold">Belum ada rekam medis</h3>
      <p className="mt-1 text-sm text-neutral-500">
        Mulai anamnesis di <b>AI Chatbot</b>, lalu tekan <b>“Susun Draft AI-EMR”</b> untuk membuat
        rekam medis yang dapat diverifikasi dokter.
      </p>
      <Link to="/chatbot" className="mt-4 inline-block">
        <Button>Buka AI Chatbot</Button>
      </Link>
    </Card>
  )
}
