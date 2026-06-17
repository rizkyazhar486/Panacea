import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { Card, SectionTitle, Badge, Button } from '../components/ui'
import { IconEMR, IconCheck, IconSparkle, IconShield } from '../components/icons'
import type { Anamnesis, EMRRecord, PhysicalExam } from '../lib/types'

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

export function EMR() {
  const { state, activePatient, saveRecord } = useStore()
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
          <div className="flex items-center gap-2">
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
              <div className="mb-2 flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-brand text-xs font-bold text-white">
                  {i + 1}
                </span>
                <h4 className="font-bold">{pr.title}</h4>
              </div>
              <p className="mb-2 text-sm">
                <span className="font-semibold text-neutral-500">Basis: </span>
                {pr.basis}
              </p>
              <p className="rounded-lg bg-neutral-50 p-3 text-sm leading-relaxed text-neutral-700">
                {pr.assessment}
              </p>
            </div>
          ))}
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
