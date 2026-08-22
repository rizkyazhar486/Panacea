import { useState } from 'react'
import { useStore, uid } from '../lib/store'
import { Card, SectionTitle, Button, Badge } from '../components/ui'
import { IconBook, IconSparkle, IconCheck, IconScissors } from '../components/icons'
import { generateEducation } from '../lib/ai'

export function PatientEducation() {
  const { state, account, activePatient, saveEducation, sendEmail } = useStore()
  const pid = account?.patientId ?? activePatient.id
  const patient = state.patients.find((p) => p.id === pid) ?? activePatient
  const record = state.records[pid]
  const sheet = state.education[pid]
  const [busy, setBusy] = useState(false)
  const diagnosis = record?.problems[0]?.title ?? patient.chronicConditions[0] ?? 'Kondisi kesehatan'

  async function gen() {
    setBusy(true)
    const vitals = state.vitals[pid] ?? []
    const s = await generateEducation(
      state.settings,
      { patient, latestVitals: vitals[vitals.length - 1], supportive: state.supportive[pid] ?? [] },
      diagnosis,
    )
    saveEducation(pid, s)
    sendEmail({
      id: uid(),
      to: account?.email ?? '',
      subject: `Edukasi kesehatan: ${diagnosis}`,
      body: `Ringkasan edukasi dan panduan menjaga kesehatan untuk ${diagnosis} kini tersedia di akun Anda dan telah dikirim ke surel ini.`,
      at: new Date().toISOString(),
    })
    setBusy(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        {/* TOMBOL TIDAK LAGI DIPAKSA SEBARIS DENGAN JUDUL.
            Pada 390 px, dua tombol di sebelah kanan menyisakan sekitar 150 px
            untuk judulnya: "My Health Education" pecah menjadi tiga baris dan
            subjudulnya menjadi kolom setipis satu kata. Judul mendapat seluruh
            lebar; tombolnya turun ke barisnya sendiri. */}
        <SectionTitle
          icon={<IconBook size={20} />}
          title="Edukasi Kesehatan Saya"
          subtitle="Tanda & gejala ringkas, diagnosis, dan cara menjaga kesehatan"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {sheet && <Button variant="outline" onClick={() => window.print()}><IconBook size={14} /> Unduh PDF</Button>}
          <Button onClick={gen} disabled={busy}>
            <IconSparkle size={16} /> {busy ? 'Menyusun…' : sheet ? 'Perbarui' : 'Susun edukasi'}
          </Button>
        </div>
        {!sheet ? (
          <p className="mt-3 text-sm text-neutral-500">
            Tekan <b>Susun edukasi</b> untuk menampilkan penjelasan <b>{diagnosis}</b> dan cara menjaga kesehatan Anda.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl bg-gradient-to-br from-[#00BF63] to-[#0b7a4b] p-6 text-white">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">Diagnosis</div>
              <h3 className="mt-1 text-2xl font-extrabold">{sheet.diagnosis}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/95">{sheet.ringkas}</p>
            </div>
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">Cara menjaga kesehatan Anda</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sheet.caraMenjaga.map((c, i) => (
                  <div key={i} className="rounded-2xl border border-neutral-100 p-4">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 font-extrabold text-brand-dark">{i + 1}</div>
                    <p className="mt-2 text-sm font-medium">{c}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border-2 border-accent/20 bg-red-50/40 p-4">
              <div className="mb-2 text-sm font-bold text-accent">Tanda bahaya — segera cari pertolongan</div>
              <div className="flex flex-wrap gap-2">
                {sheet.tandaBahaya.map((c, i) => (
                  <span key={i} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold ring-1 ring-accent/20">{c}</span>
                ))}
              </div>
            </div>
            <details className="rounded-2xl border border-neutral-100 p-4">
              <summary className="cursor-pointer text-sm font-bold text-neutral-700">Penjelasan mendalam</summary>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{sheet.mendalam}</p>
            </details>
          </div>
        )}
      </Card>

      {/* Surgery education + informed consent */}
      {record?.surgery?.recommended && <SurgeryEducation pid={pid} />}
    </div>
  )
}

function SurgeryEducation({ pid }: { pid: string }) {
  const { state, saveRecord, account, sendEmail } = useStore()
  const record = state.records[pid]!
  const s = record.surgery!

  function agree(stage: string) {
    const consent = s.consent.map((c) => (c.stage === stage ? { ...c, agreed: true, at: new Date().toISOString() } : c))
    saveRecord({ ...record, surgery: { ...s, consent }, updatedAt: new Date().toISOString() })
    sendEmail({
      id: uid(),
      to: account?.email ?? '',
      subject: `Persetujuan tindakan: ${stage}`,
      body: `Anda telah menyetujui tahap "${stage}" untuk tindakan ${s.procedure}. Penjadwalan akan dibantu admin.`,
      at: new Date().toISOString(),
    })
  }

  return (
    <Card className="border-2 border-brand/20">
      <SectionTitle icon={<IconScissors size={18} />} title={`Edukasi Operasi — ${s.procedure}`} subtitle={`Indikasi: ${s.indication}`} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Phase title="Sebelum operasi" text={s.pre} />
        <Phase title="Saat operasi" text={s.intra} />
        <Phase title="Sesudah operasi" text={s.post} />
      </div>
      <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
        <b>Keamanan & risiko:</b> {s.risks}
      </div>

      <div className="mt-4">
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">Persetujuan tindakan — bertahap</div>
        <div className="space-y-2">
          {s.consent.map((c) => (
            <div key={c.stage} className="flex items-center justify-between rounded-xl border border-neutral-100 px-3 py-2">
              <span className="text-sm font-medium">{c.stage}</span>
              {c.agreed ? (
                <Badge tone="brand"><IconCheck size={12} /> Disetujui</Badge>
              ) : (
                <Button variant="outline" onClick={() => agree(c.stage)}>Setujui</Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function Phase({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-neutral-100 p-3">
      <Badge tone="brand">{title}</Badge>
      <p className="mt-1.5 text-sm text-neutral-600">{text}</p>
    </div>
  )
}
