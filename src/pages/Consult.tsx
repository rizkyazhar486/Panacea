import { useState } from 'react'
import { useStore, uid } from '../lib/store'
import { Card, SectionTitle, Button, Badge } from '../components/ui'
import { IconStethoscope, IconCheck } from '../components/icons'
import type { PaymentMethod } from '../lib/types'

const FEE = 35000

const DOCTORS = [
  { name: 'dr. Rina Kusuma, Sp.PD-KGEH', specialty: 'Penyakit Dalam (Gastrohepatologi)', rating: 4.9, online: true },
  { name: 'dr. Bagus Santoso, Sp.A', specialty: 'Anak', rating: 4.8, online: true },
  { name: 'dr. Hendra Wijaya, Sp.JP', specialty: 'Jantung & Pembuluh Darah', rating: 4.7, online: false },
  { name: 'dr. Sari Melati, Sp.PD', specialty: 'Penyakit Dalam', rating: 4.6, online: true },
]

export function Consult() {
  const { account, bookConsult, sendEmail } = useStore()
  const [pay, setPay] = useState<PaymentMethod>('QRIS')
  const [done, setDone] = useState<string>('')

  function book(name: string, specialty: string) {
    const at = new Date().toISOString()
    bookConsult({ id: uid(), doctorName: name, specialty, patientEmail: account?.email ?? '', at, feeIdr: FEE, status: 'terjadwal' })
    sendEmail({
      id: uid(),
      to: account?.email ?? '',
      subject: `Konsultasi terjadwal dengan ${name}`,
      body: `Sesi konsultasi (Rp${FEE.toLocaleString('id-ID')}, dibayar via ${pay}) telah dijadwalkan. Tautan sesi akan dikirim sebelum jadwal.`,
      at,
    })
    setDone(name)
    setTimeout(() => setDone(''), 3000)
  }

  return (
    <div className="space-y-6">
      {done && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl bg-ink px-4 py-2 text-sm text-white shadow-lg">
          ✓ Konsultasi dengan {done} terjadwal · info dikirim ke email
        </div>
      )}
      <Card>
        <SectionTitle
          icon={<IconStethoscope size={20} />}
          title="Konsultasi Dokter"
          subtitle="Dokter direkomendasikan AI-Chatbot · Rp35.000 / sesi (per jam)"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-neutral-500">Metode bayar:</span>
          {(['QRIS', 'Visa', 'Virtual Account'] as PaymentMethod[]).map((m) => (
            <button
              key={m}
              onClick={() => setPay(m)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${pay === m ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {DOCTORS.map((d) => (
          <Card key={d.name} className="flex flex-col">
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-dark">
                <IconStethoscope size={22} />
              </span>
              <div className="flex-1">
                <h3 className="font-bold leading-tight">{d.name}</h3>
                <p className="text-sm text-neutral-500">{d.specialty}</p>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <Badge tone="brand">★ {d.rating}</Badge>
                  <Badge tone={d.online ? 'normal' : 'neutral'}>{d.online ? 'Online' : 'Offline'}</Badge>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
              <span className="text-lg font-extrabold">Rp{FEE.toLocaleString('id-ID')}<span className="text-xs font-medium text-neutral-400">/sesi</span></span>
              <Button onClick={() => book(d.name, d.specialty)} disabled={!d.online}>
                <IconCheck size={14} /> Booking & Bayar
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <SectionTitle title="Sesi Saya" />
        <Sessions />
      </Card>
    </div>
  )
}

function Sessions() {
  const { state } = useStore()
  if (state.consults.length === 0) return <p className="text-sm text-neutral-400">Belum ada sesi konsultasi.</p>
  return (
    <div className="space-y-2">
      {state.consults.map((c) => (
        <div key={c.id} className="flex items-center justify-between rounded-xl border border-neutral-100 px-3 py-2 text-sm">
          <span className="font-medium">{c.doctorName}</span>
          <span className="flex items-center gap-2 text-xs text-neutral-500">
            {new Date(c.at).toLocaleString('id-ID')}
            <Badge tone="brand">Rp{c.feeIdr.toLocaleString('id-ID')}</Badge>
          </span>
        </div>
      ))}
    </div>
  )
}
