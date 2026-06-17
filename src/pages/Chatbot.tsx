import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, uid } from '../lib/store'
import { Card, Button, Badge } from '../components/ui'
import { IconSend, IconSparkle, IconChat } from '../components/icons'
import { LogoMark } from '../components/Logo'
import { sendChat, draftEMR, hasKey, type PatientContext } from '../lib/ai'
import type { ChatMessage, EMRRecord, PlanItem } from '../lib/types'

function ctxOf(store: ReturnType<typeof useStore>): PatientContext {
  const p = store.activePatient
  const vitals = store.state.vitals[p.id] ?? []
  return {
    patient: p,
    latestVitals: vitals[vitals.length - 1],
    supportive: store.state.supportive[p.id] ?? [],
  }
}

export function Chatbot() {
  const store = useStore()
  const { state, activePatient, setChat, saveRecord } = store
  const nav = useNavigate()
  const messages = state.chats[activePatient.id] ?? []
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    setError('')
    const userMsg: ChatMessage = { id: uid(), role: 'user', content: text, at: new Date().toISOString() }
    const next = [...messages, userMsg]
    setChat(activePatient.id, next)
    setInput('')
    setBusy(true)
    try {
      const reply = await sendChat(state.settings, next, ctxOf(store))
      setChat(activePatient.id, [
        ...next,
        { id: uid(), role: 'assistant', content: reply, at: new Date().toISOString() },
      ])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menghubungi AI.')
    } finally {
      setBusy(false)
    }
  }

  async function makeDraft() {
    if (drafting) return
    setError('')
    setDrafting(true)
    try {
      const d = await draftEMR(state.settings, messages, ctxOf(store))
      const now = new Date().toISOString()
      const plan: PlanItem[] = d.draftPlan.map((pi) => ({
        id: uid(),
        category: pi.category as PlanItem['category'],
        text: pi.text,
        source: 'AI',
        status: 'usulan',
      }))
      const existing = state.records[activePatient.id]
      const record: EMRRecord = {
        id: existing?.id ?? uid(),
        patientId: activePatient.id,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        anamnesis: {
          keluhanUtama: d.keluhanUtama,
          rps: d.rps,
          rpd: d.rpd,
          rpk: d.rpk,
          riwayatKehamilan: '',
          riwayatPengobatan: d.riwayatPengobatan,
          riwayatAlergi: d.riwayatAlergi,
          riwayatTumbuhKembang: '',
          riwayatNutrisi: d.riwayatNutrisi,
          riwayatImunisasi: '',
          riwayatSosialEkonomi: d.riwayatSosialEkonomi,
        },
        physicalExam: existing?.physicalExam ?? {
          general: '',
          vitalsNote: '',
          perSystem: d.suggestedExams.map((s) => `• [USULAN AI] ${s}`).join('\n'),
          doctorVerified: false,
        },
        problems: d.problems.map((pr) => ({ id: uid(), ...pr })),
        plan,
        references: d.references,
      }
      saveRecord(record)
      nav('/emr')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyusun draft.')
    } finally {
      setDrafting(false)
    }
  }

  const keyed = hasKey(state.settings)

  return (
    <div className="space-y-4">
      <Card pad={false} className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <IconChat className="text-brand" size={20} />
            <div>
              <div className="font-bold">Anamnesis Co-Physician</div>
              <div className="text-xs text-neutral-500">
                AI mewawancara pasien & merekomendasikan penunjang — diverifikasi dokter
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={keyed ? 'brand' : 'high'}>{keyed ? 'AI Live' : 'Mode Demo'}</Badge>
            <Button onClick={makeDraft} disabled={drafting || messages.length === 0}>
              <IconSparkle size={16} />
              {drafting ? 'Menyusun…' : 'Susun Draft AI-EMR'}
            </Button>
          </div>
        </div>

        <div ref={scrollRef} className="h-[52vh] space-y-4 overflow-y-auto px-5 py-5">
          {messages.length === 0 && <Welcome name={activePatient.name} keyed={keyed} />}
          {messages.map((m) => (
            <Bubble key={m.id} msg={m} />
          ))}
          {busy && (
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <LogoMark size={22} />
              <span className="vital-dot">AI sedang menganalisis…</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mx-5 mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-accent">{error}</div>
        )}

        <div className="flex items-end gap-2 border-t border-black/5 p-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            rows={1}
            placeholder="Tulis keluhan atau jawaban pasien… (Enter untuk kirim)"
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <Button onClick={send} disabled={busy || !input.trim()} className="h-[44px]">
            <IconSend size={16} /> Kirim
          </Button>
        </div>
      </Card>

      <p className="px-1 text-xs text-neutral-400">
        ⚕️ AI mendukung, bukan menggantikan, klinisi berlisensi. Pemeriksaan fisik & rencana final
        diisi dan diverifikasi oleh dokter pemeriksa pada modul AI-EMR.
      </p>
    </div>
  )
}

function Welcome({ name, keyed }: { name: string; keyed: boolean }) {
  const suggestions = [
    'Saya merasa nyeri dada sejak 2 hari',
    'Akhir-akhir ini sering pusing dan lemas',
    'Sesak napas saat aktivitas ringan',
  ]
  return (
    <div className="rise mx-auto max-w-lg rounded-2xl bg-brand-50/60 p-6 text-center">
      <LogoMark size={48} className="mx-auto" />
      <h3 className="mt-3 text-lg font-bold">Selamat datang / Welcome</h3>
      <p className="mt-1 text-sm text-neutral-600">
        Asisten klinis–longevity untuk <span className="font-semibold">{name}</span>. Mulai
        anamnesis dengan menulis keluhan utama pasien.
      </p>
      {!keyed && (
        <p className="mt-2 text-xs text-accent">
          Mode Demo aktif — tambahkan API key Anthropic di Pengaturan untuk respons AI penuh.
        </p>
      )}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {suggestions.map((s) => (
          <span key={s} className="rounded-full bg-white px-3 py-1 text-xs text-neutral-500 ring-1 ring-black/5">
            “{s}”
          </span>
        ))}
      </div>
    </div>
  )
}

function Bubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`rise flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50">
          <LogoMark size={20} />
        </span>
      )}
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'rounded-tr-sm bg-brand text-white'
            : 'rounded-tl-sm bg-neutral-100 text-ink'
        }`}
      >
        {msg.content}
      </div>
    </div>
  )
}
