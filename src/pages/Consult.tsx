import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore, uid } from '../lib/store'
import { Card, SectionTitle, Button, Badge, Field, inputClass } from '../components/ui'
import { IconStethoscope, IconCheck, IconChat, IconHospital, IconShield, IconSearch } from '../components/icons'
import { ConsultChat } from '../components/ConsultChat'
import { Carousel } from '../components/Carousel'
import { backendEnabled } from '../lib/api'
import { MANUAL_BANK } from '../lib/payment'

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '').slice(0, 24)
}

const AI_FEE = 35000 // Rp35,000 — AI consultation (triage + specialist referral)
const FEE = 90000 // Rp90,000 — human doctor session (telemedicine)

// Real, verified doctors are onboarded here later — no dummy/example entries.
// The roster is populated from STR-verified physician accounts.
type Doctor = { name: string; specialty: string; tag: string; rating: number; online: boolean }
const DOCTORS: Doctor[] = []

// Human-readable specialty per triage tag (used in emails/recommendations).
const SPECIALTY_LABEL: Record<string, string> = {
  jantung: 'Cardiologist (Sp.JP)',
  anak: 'Pediatrician (Sp.A)',
  lambung: 'Internal Medicine Specialist (Sp.PD)',
  umum: 'General Practitioner / Internal Medicine',
}

// Very simple AI triage: map complaint keywords to a specialty + surgery flag.
function triage(complaint: string): { tag: string; reason: string; surgery: boolean } {
  const c = complaint.toLowerCase()
  const has = (...k: string[]) => k.some((x) => c.includes(x))
  const surgery = has('operasi', 'bedah', 'usus buntu', 'apendisitis', 'hernia', 'tumor', 'batu', 'patah', 'benjolan')
  if (has('dada', 'jantung', 'berdebar', 'sesak')) return { tag: 'jantung', reason: 'Symptoms suggest a cardiovascular issue', surgery }
  if (has('anak', 'bayi', 'balita', 'demam anak')) return { tag: 'anak', reason: 'Pediatric patient', surgery }
  if (has('lambung', 'maag', 'mual', 'perut', 'hati', 'bab', 'diare')) return { tag: 'lambung', reason: 'Digestive symptoms', surgery }
  return { tag: 'umum', reason: 'General internal medicine complaint', surgery }
}

export function Consult() {
  const { account, bookConsult, sendEmail, addOrder } = useStore()
  const pay = 'Transfer Bank' as const
  const [complaint, setComplaint] = useState('')
  const [result, setResult] = useState<ReturnType<typeof triage> | null>(null)
  const [done, setDone] = useState<string>('')
  const [chatRoom, setChatRoom] = useState<string>('')
  const [docQuery, setDocQuery] = useState('')

  const recommended = useMemo(() => {
    if (!result) return DOCTORS
    return [...DOCTORS].sort((a, b) => (a.tag === result.tag ? -1 : 0) - (b.tag === result.tag ? -1 : 0))
  }, [result])

  function payAITriage() {
    if (!complaint.trim()) return
    const r = triage(complaint)
    const at = new Date().toISOString()
    // The mandatory AI consultation fee (revenue + unlocks human consult).
    bookConsult({ id: uid(), doctorName: 'AI Chatbot (Triage)', specialty: 'AI Triage', patientEmail: account?.email ?? '', at, feeIdr: AI_FEE, status: 'selesai' })
    addOrder({ id: uid(), category: 'Konsultasi', title: 'AI Consultation (Triage)', detail: r.reason, amountIdr: AI_FEE, status: 'Selesai', at })
    sendEmail({
      id: uid(),
      to: account?.email ?? '',
      subject: 'Your Panaceamed AI Triage Result',
      body: `Based on your symptoms, our AI recommends ${SPECIALTY_LABEL[r.tag] ?? 'a general practitioner'}. ${r.surgery ? 'Possible surgical intervention indicated — hospital search enabled.' : ''}`,
      at,
    })
    setResult(r)
  }

  function book(name: string, specialty: string) {
    const at = new Date().toISOString()
    bookConsult({ id: uid(), doctorName: name, specialty, patientEmail: account?.email ?? '', at, feeIdr: FEE, status: 'terjadwal' })
    addOrder({ id: uid(), category: 'Konsultasi', title: `Consultation with ${name}`, detail: specialty, amountIdr: FEE, status: 'Selesai', at })
    sendEmail({
      id: uid(),
      to: account?.email ?? '',
      subject: `Consultation scheduled with ${name}`,
      body: `Your consultation session (Rp${FEE.toLocaleString('id-ID')}, paid via ${pay}) has been scheduled. The session link will be sent before the appointment.`,
      at,
    })
    setDone(name)
    setTimeout(() => setDone(''), 3000)
  }

  const recSpecialty = result ? (SPECIALTY_LABEL[result.tag] ?? 'General Practitioner') : ''

  return (
    <div className="space-y-6">
      {done && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl bg-ink px-4 py-2 text-sm text-white shadow-lg">
          ✓ Consultation with {done} scheduled · details sent to your email
        </div>
      )}

      {/* Step 1 — mandatory AI triage gate */}
      {!result ? (
        <Card>
          <SectionTitle
            icon={<IconChat size={20} />}
            title="Step 1 — AI Consultation (required)"
            subtitle="Every consultation with a human doctor starts with our AI Chatbot. The AI will recommend the right specialist."
          />
          <Field label="Describe your symptoms">
            <textarea
              className={`${inputClass} min-h-[90px]`}
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              placeholder="e.g. Stomach pain & nausea for 3 days, especially after eating…"
            />
          </Field>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-neutral-500">Pay via:</span>
            <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-dark">
              Transfer {MANUAL_BANK.bank} · {MANUAL_BANK.number} a.n. {MANUAL_BANK.holder}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-50 p-3">
            <div className="text-sm text-brand-dark">
              <b>Rp{AI_FEE.toLocaleString('id-ID')}</b> for the AI consultation — includes referral to a registered specialist.
            </div>
            <Button onClick={payAITriage} disabled={!complaint.trim()}>
              <IconCheck size={16} /> Pay & Start AI Triage
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-neutral-400">
            Need a full assessment first? Open the <Link to="/chatbot" className="font-semibold text-brand-dark">AI Chatbot</Link>.
          </p>
        </Card>
      ) : (
        <Card>
          <SectionTitle
            icon={<IconStethoscope size={20} />}
            title="Step 2 — AI-Recommended Specialist"
            subtitle={`AI: ${result.reason}. Top recommendation: ${recSpecialty}.`}
            right={<Button variant="ghost" onClick={() => { setResult(null); setComplaint('') }}>Redo triage</Button>}
          />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-neutral-500">Session payment method:</span>
            <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-dark">
              Transfer {MANUAL_BANK.bank} · {MANUAL_BANK.number} a.n. {MANUAL_BANK.holder}
            </span>
          </div>

          {result.surgery && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2 text-sm text-amber-800">
                <IconHospital size={18} className="mt-0.5 shrink-0" />
                <span>Your symptoms <b>may indicate a need for surgery</b>. Find a nearby hospital for a surgical referral.</span>
              </div>
              <Link to="/hospitals">
                <Button variant="outline"><IconHospital size={16} /> Nearby Hospitals</Button>
              </Link>
            </div>
          )}
        </Card>
      )}

      {/* Step 2 — doctor list (only after AI triage) */}
      {result && recommended.length === 0 && (
        <Card className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-dark">
            <IconStethoscope size={28} />
          </span>
          <h3 className="mt-3 text-lg font-bold">Real doctors are currently being onboarded</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
            The AI recommends <b>{recSpecialty}</b>. A list of verified doctors (with active medical licenses) will
            appear here once they join. In the meantime, use the AI Chatbot for a full assessment or
            find a nearby healthcare facility for immediate care.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link to="/chatbot"><Button variant="outline"><IconChat size={16} /> Continue to AI Chatbot</Button></Link>
            <Link to="/hospitals"><Button><IconHospital size={16} /> Nearby Hospitals</Button></Link>
          </div>
        </Card>
      )}
      {result && recommended.length > 0 && (
        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-black/5">
          <IconSearch size={18} className="text-neutral-400" />
          <input value={docQuery} onChange={(e) => setDocQuery(e.target.value)} placeholder="Search for a doctor or specialty…" className="w-full bg-transparent text-sm outline-none" />
        </div>
      )}
      {result && recommended.length > 0 && (
        <Carousel itemClass="w-72">
          {recommended.filter((d) => { const x = docQuery.trim().toLowerCase(); return !x || d.name.toLowerCase().includes(x) || d.specialty.toLowerCase().includes(x) }).map((d) => {
            const isRec = d.tag === result.tag
            return (
              <Card key={d.name} hover className={`flex h-full flex-col ${isRec ? 'ring-2 ring-brand' : ''}`}>
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-dark">
                    <IconStethoscope size={22} />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold leading-tight">{d.name}</h3>
                      {isRec && <Badge tone="brand">AI Recommended</Badge>}
                    </div>
                    <p className="text-sm text-neutral-500">{d.specialty}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <Badge tone="brand">★ {d.rating}</Badge>
                      <Badge tone={d.online ? 'normal' : 'neutral'}>{d.online ? 'Online' : 'Offline'}</Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
                  <span className="text-lg font-extrabold">Rp{FEE.toLocaleString('id-ID')}<span className="text-xs font-medium text-neutral-400">/session</span></span>
                  <div className="flex gap-2">
                    {backendEnabled && (
                      <Button variant="outline" onClick={() => setChatRoom('consult-' + slug(d.name))} disabled={!d.online}>Chat</Button>
                    )}
                    <Button onClick={() => book(d.name, d.specialty)} disabled={!d.online}>
                      <IconCheck size={14} /> Book & Pay
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </Carousel>
      )}

      {backendEnabled && chatRoom && (
        <Card>
          <SectionTitle
            icon={<IconStethoscope size={20} />}
            title="Real-time Consultation"
            subtitle="Doctors and patients who open the same room will be connected instantly"
          />
          <ConsultChat room={chatRoom} name={account?.name ?? 'Patient'} />
        </Card>
      )}

      <Card>
        <div className="mb-3 flex items-center gap-2 text-xs text-neutral-500">
          <IconShield size={14} className="text-brand" /> Flow: AI Chatbot → doctor recommendation → (if surgery is needed) find a hospital.
        </div>
        <SectionTitle title="My Sessions" />
        <Sessions />
      </Card>
    </div>
  )
}

function Sessions() {
  const { state } = useStore()
  if (state.consults.length === 0) return <p className="text-sm text-neutral-400">No consultation sessions yet.</p>
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
