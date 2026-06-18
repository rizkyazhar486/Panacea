import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore, uid } from '../lib/store'
import { Card, SectionTitle, Button, Badge, Field, inputClass } from '../components/ui'
import { IconStethoscope, IconCheck, IconChat, IconHospital, IconShield } from '../components/icons'
import { ConsultChat } from '../components/ConsultChat'
import { backendEnabled } from '../lib/api'
import type { PaymentMethod } from '../lib/types'

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '').slice(0, 24)
}

const AI_FEE = 13000 // Rp13.000 / ≈ $1 — wajib untuk konsultasi AI (triase)
const FEE = 35000 // sesi dokter manusia

const DOCTORS = [
  { name: 'dr. Rina Kusuma, Sp.PD-KGEH', specialty: 'Penyakit Dalam (Gastrohepatologi)', tag: 'lambung', rating: 4.9, online: true },
  { name: 'dr. Bagus Santoso, Sp.A', specialty: 'Anak', tag: 'anak', rating: 4.8, online: true },
  { name: 'dr. Hendra Wijaya, Sp.JP', specialty: 'Jantung & Pembuluh Darah', tag: 'jantung', rating: 4.7, online: false },
  { name: 'dr. Sari Melati, Sp.PD', specialty: 'Penyakit Dalam', tag: 'umum', rating: 4.6, online: true },
]

// Very simple AI triage: map complaint keywords to a specialty + surgery flag.
function triage(complaint: string): { tag: string; reason: string; surgery: boolean } {
  const c = complaint.toLowerCase()
  const has = (...k: string[]) => k.some((x) => c.includes(x))
  const surgery = has('operasi', 'bedah', 'usus buntu', 'apendisitis', 'hernia', 'tumor', 'batu', 'patah', 'benjolan')
  if (has('dada', 'jantung', 'berdebar', 'sesak')) return { tag: 'jantung', reason: 'Keluhan mengarah ke kardiovaskular', surgery }
  if (has('anak', 'bayi', 'balita', 'demam anak')) return { tag: 'anak', reason: 'Pasien anak', surgery }
  if (has('lambung', 'maag', 'mual', 'perut', 'hati', 'bab', 'diare')) return { tag: 'lambung', reason: 'Keluhan saluran cerna', surgery }
  return { tag: 'umum', reason: 'Keluhan umum penyakit dalam', surgery }
}

export function Consult() {
  const { account, bookConsult, sendEmail } = useStore()
  const [pay, setPay] = useState<PaymentMethod>('QRIS')
  const [complaint, setComplaint] = useState('')
  const [result, setResult] = useState<ReturnType<typeof triage> | null>(null)
  const [done, setDone] = useState<string>('')
  const [chatRoom, setChatRoom] = useState<string>('')

  const recommended = useMemo(() => {
    if (!result) return DOCTORS
    return [...DOCTORS].sort((a, b) => (a.tag === result.tag ? -1 : 0) - (b.tag === result.tag ? -1 : 0))
  }, [result])

  function payAITriage() {
    if (!complaint.trim()) return
    const r = triage(complaint)
    const at = new Date().toISOString()
    // The mandatory AI consultation fee (revenue + unlocks human consult).
    bookConsult({ id: uid(), doctorName: 'AI Chatbot (Triase)', specialty: 'AI Triage', patientEmail: account?.email ?? '', at, feeIdr: AI_FEE, status: 'selesai' })
    sendEmail({
      id: uid(),
      to: account?.email ?? '',
      subject: 'Hasil Triase AI Panaceamed',
      body: `Berdasarkan keluhan Anda, AI merekomendasikan dokter ${DOCTORS.find((d) => d.tag === r.tag)?.specialty}. ${r.surgery ? 'Terindikasi kemungkinan tindakan bedah — pencarian rumah sakit diaktifkan.' : ''}`,
      at,
    })
    setResult(r)
  }

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

  const recDoctor = result ? DOCTORS.find((d) => d.tag === result.tag) : null

  return (
    <div className="space-y-6">
      {done && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl bg-ink px-4 py-2 text-sm text-white shadow-lg">
          ✓ Konsultasi dengan {done} terjadwal · info dikirim ke email
        </div>
      )}

      {/* Step 1 — mandatory AI triage gate */}
      {!result ? (
        <Card>
          <SectionTitle
            icon={<IconChat size={20} />}
            title="Langkah 1 — Konsultasi AI (wajib)"
            subtitle="Semua konsultasi ke dokter manusia melalui AI Chatbot. AI merekomendasikan dokter spesialis yang tepat."
          />
          <Field label="Ceritakan keluhan Anda">
            <textarea
              className={`${inputClass} min-h-[90px]`}
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              placeholder="mis. Nyeri ulu hati & mual sejak 3 hari, terutama setelah makan…"
            />
          </Field>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-neutral-500">Bayar:</span>
            {(['QRIS', 'Visa', 'Virtual Account'] as PaymentMethod[]).map((m) => (
              <button key={m} onClick={() => setPay(m)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${pay === m ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                {m}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-50 p-3">
            <div className="text-sm text-brand-dark">
              <b>Rp{AI_FEE.toLocaleString('id-ID')}</b> (≈ $1) untuk konsultasi AI — termasuk rujukan ke dokter spesialis terdaftar.
            </div>
            <Button onClick={payAITriage} disabled={!complaint.trim()}>
              <IconCheck size={16} /> Bayar & Mulai Triase AI
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-neutral-400">
            Butuh anamnesis lengkap dulu? Buka <Link to="/chatbot" className="font-semibold text-brand-dark">AI Chatbot</Link>.
          </p>
        </Card>
      ) : (
        <Card>
          <SectionTitle
            icon={<IconStethoscope size={20} />}
            title="Langkah 2 — Dokter Spesialis Rekomendasi AI"
            subtitle={`AI: ${result.reason}. Rekomendasi utama: ${recDoctor?.specialty}.`}
            right={<Button variant="ghost" onClick={() => { setResult(null); setComplaint('') }}>Ulangi triase</Button>}
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-neutral-500">Metode bayar sesi:</span>
            {(['QRIS', 'Visa', 'Virtual Account'] as PaymentMethod[]).map((m) => (
              <button key={m} onClick={() => setPay(m)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${pay === m ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                {m}
              </button>
            ))}
          </div>

          {result.surgery && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2 text-sm text-amber-800">
                <IconHospital size={18} className="mt-0.5 shrink-0" />
                <span>Keluhan Anda <b>terindikasi kemungkinan tindakan bedah</b>. Cari rumah sakit terdekat untuk rujukan operasi.</span>
              </div>
              <Link to="/hospitals">
                <Button variant="outline"><IconHospital size={16} /> Cari Rumah Sakit</Button>
              </Link>
            </div>
          )}
        </Card>
      )}

      {/* Step 2 — doctor list (only after AI triage) */}
      {result && (
        <div className="grid gap-4 md:grid-cols-2">
          {recommended.map((d) => {
            const isRec = d.tag === result.tag
            return (
              <Card key={d.name} className={`flex flex-col ${isRec ? 'ring-2 ring-brand' : ''}`}>
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-dark">
                    <IconStethoscope size={22} />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold leading-tight">{d.name}</h3>
                      {isRec && <Badge tone="brand">Rekomendasi AI</Badge>}
                    </div>
                    <p className="text-sm text-neutral-500">{d.specialty}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <Badge tone="brand">★ {d.rating}</Badge>
                      <Badge tone={d.online ? 'normal' : 'neutral'}>{d.online ? 'Online' : 'Offline'}</Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
                  <span className="text-lg font-extrabold">Rp{FEE.toLocaleString('id-ID')}<span className="text-xs font-medium text-neutral-400">/sesi</span></span>
                  <div className="flex gap-2">
                    {backendEnabled && (
                      <Button variant="outline" onClick={() => setChatRoom('consult-' + slug(d.name))} disabled={!d.online}>Chat</Button>
                    )}
                    <Button onClick={() => book(d.name, d.specialty)} disabled={!d.online}>
                      <IconCheck size={14} /> Booking & Bayar
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {backendEnabled && chatRoom && (
        <Card>
          <SectionTitle
            icon={<IconStethoscope size={20} />}
            title="Konsultasi Real-time"
            subtitle="Dokter & pasien yang membuka ruang yang sama akan terhubung langsung"
          />
          <ConsultChat room={chatRoom} name={account?.name ?? 'Pasien'} />
        </Card>
      )}

      <Card>
        <div className="mb-3 flex items-center gap-2 text-xs text-neutral-500">
          <IconShield size={14} className="text-brand" /> Alur: AI Chatbot → rekomendasi dokter → (bila perlu operasi) cari rumah sakit.
        </div>
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
