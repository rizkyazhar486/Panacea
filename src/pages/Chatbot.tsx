import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, uid } from '../lib/store'
import { Card, Button, Badge } from '../components/ui'
import { IconSend, IconSparkle, IconChat } from '../components/icons'
import { LogoMark } from '../components/Logo'
import { sendChat, draftEMR, aiAvailable, type PatientContext } from '../lib/ai'
import { api, backendEnabled } from '../lib/api'
import { compressImage, readAsDataUrl } from '../lib/upload'
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

// Auto-Objective: pull measurable facts from the conversation + latest vitals.
// Subjective is captured by the AI draft (anamnesis); these objective lines
// (numbers with units) are routed into the Objective automatically.
function autoObjective(messages: ChatMessage[], latest?: PatientContext['latestVitals']): string {
  const lines: string[] = []
  if (latest) {
    lines.push(
      `[Auto-vital] TD ${latest.systolic}/${latest.diastolic} mmHg · Nadi ${latest.heartRate}x/mnt · RR ${latest.respRate}x/mnt · Suhu ${latest.tempC}°C · SpO₂ ${latest.spo2}%` +
        (latest.glucose ? ` · GDS ${latest.glucose} mg/dL` : ''),
    )
  }
  const re = /[^.!?\n]*\b(\d{2,3}\/\d{2,3}|\d+(?:[.,]\d+)?\s?(?:mmhg|mg\/dl|°c|celsius|kg|cm|%|x\/menit|bpm|mmol))\b[^.!?\n]*/gi
  const seen = new Set<string>()
  for (const m of messages) {
    if (m.role !== 'user') continue
    const found = m.content.match(re)
    if (found) found.forEach((f) => seen.add(f.trim()))
  }
  seen.forEach((l) => lines.push(`[Auto-Objektif] ${l}`))
  return lines.join('\n')
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
  const [consulting, setConsulting] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceOut, setVoiceOut] = useState(false)
  const recogRef = useRef<any>(null)

  // Speak text aloud (Bahasa Indonesia) when voice output is on.
  function speak(text: string) {
    if (!voiceOut || typeof window === 'undefined' || !window.speechSynthesis) return
    const clean = text.replace(/[*_#>`~]/g, '')
    const u = new SpeechSynthesisUtterance(clean)
    u.lang = 'id-ID'
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  }

  // Toggle voice input (speech-to-text) using the browser's Web Speech API.
  function toggleMic() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setError('Browser ini belum mendukung input suara. Coba Chrome.'); return }
    if (listening) { recogRef.current?.stop(); return }
    const r = new SR()
    r.lang = 'id-ID'
    r.interimResults = false
    r.continuous = false
    r.onresult = (e: any) => setInput((prev) => (prev ? prev + ' ' : '') + e.results[0][0].transcript)
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    recogRef.current = r
    setListening(true)
    r.start()
  }
  const [price, setPrice] = useState(5)
  const [topup, setTopup] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy, consulting])

  useEffect(() => {
    if (backendEnabled) api.health().then((h) => h.aiConsultPnc && setPrice(h.aiConsultPnc)).catch(() => {})
  }, [])

  // Vision: analyze a supportive-exam image (EKG/CT/MRI/X-ray) → into the chat,
  // which the doctor's "Susun Draft AI-EMR" then folds into Objective/Assessment.
  async function analyzeImage(file?: File) {
    if (!file) return
    setAnalyzing(true)
    setError('')
    try {
      const dataUrl = await readAsDataUrl(await compressImage(file, 1280, 0.85))
      setChat(activePatient.id, [...messages, { id: uid(), role: 'user', content: `🩻 Mengunggah citra pemeriksaan penunjang: ${file.name}`, at: new Date().toISOString() }])
      const r = await api.aiVision(dataUrl, 'Analisis citra pemeriksaan penunjang ini untuk rekam medis pasien.')
      setChat(activePatient.id, (state.chats[activePatient.id] ?? messages).concat({ id: uid(), role: 'assistant', content: `🩻 **Analisis Penunjang (untuk Objective AI-EMR)**\n\n${r.text}`, at: new Date().toISOString() }))
    } catch {
      setError('Gagal menganalisis citra. Pastikan file gambar valid & coba lagi.')
    } finally {
      setAnalyzing(false)
    }
  }

  // Premium deep consultation — charges PNC server-side, appends a structured report.
  async function deepConsult() {
    if (messages.length === 0) return
    setConsulting(true)
    setError('')
    setTopup(false)
    try {
      const r = await api.aiConsult(messages.map((m) => ({ role: m.role, content: m.content })))
      store.syncWalletBalance(r.balance)
      setChat(activePatient.id, [
        ...messages,
        { id: uid(), role: 'assistant', content: `🩺 **Konsultasi AI Mendalam** _(−${r.charged} PNC · sisa ${r.balance})_\n\n${r.text}`, at: new Date().toISOString() },
      ])
    } catch (e) {
      if (String(e instanceof Error ? e.message : e).includes('insufficient_balance')) setTopup(true)
      else setError('Gagal menjalankan konsultasi mendalam.')
    } finally {
      setConsulting(false)
    }
  }

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
      speak(reply)
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
          vitalsNote: autoObjective(messages, ctxOf(store).latestVitals),
          perSystem: d.suggestedExams.map((s) => `• [USULAN AI] ${s}`).join('\n'),
          doctorVerified: false,
        },
        problems: d.problems.map((pr) => ({ id: uid(), ...pr })),
        plan,
        prognosis: d.prognosis,
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

  const keyed = aiAvailable(state.settings)

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] leading-snug text-amber-800">
        <span className="mt-0.5 shrink-0">⚕️</span>
        <span>
          <b>Penting:</b> AI ini bersifat <b>edukatif &amp; pendukung</b>, bukan pengganti dokter. Tidak memberikan diagnosis final.
          Untuk keadaan darurat (nyeri dada hebat, sesak berat, penurunan kesadaran), segera gunakan <b>Darurat SOS</b> atau hubungi faskes terdekat.
        </span>
      </div>
      {topup && (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm">
          <span className="text-accent">Saldo PNC tidak cukup untuk Konsultasi Mendalam ({price} PNC).</span>
          <Button onClick={() => nav('/billing')} className="!px-4 !py-1.5 text-xs">Top up PNC</Button>
        </div>
      )}
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
            <Badge tone={keyed ? 'brand' : 'high'}>{keyed ? 'AI Aktif' : 'AI Terbatas'}</Badge>
            {backendEnabled && (
              <Button variant="outline" onClick={deepConsult} disabled={consulting || messages.length === 0}>
                <IconSparkle size={16} />
                {consulting ? 'Menganalisis…' : `Konsultasi Mendalam · ${price} PNC`}
              </Button>
            )}
            {store.account?.role === 'dokter' ? (
              <Button onClick={makeDraft} disabled={drafting || messages.length === 0}>
                <IconSparkle size={16} />
                {drafting ? 'Menyusun…' : 'Susun Draft AI-EMR (SOAP)'}
              </Button>
            ) : (
              <Badge tone="neutral">Anamnesis diteruskan ke dokter (AI-EMR)</Badge>
            )}
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

        {backendEnabled && (
          <div className="border-t border-black/5 px-3 pt-3">
            <label
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); analyzeImage(e.dataTransfer.files?.[0]) }}
              className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-4 py-4 text-center transition ${
                dragging ? 'border-brand bg-brand-50' : 'border-brand/30 bg-brand-50/40 hover:bg-brand-50'
              }`}
            >
              <span className="text-xl">{analyzing ? '🔬' : '🩻'}</span>
              <span className="text-xs font-bold text-brand-dark">
                {analyzing ? 'Menganalisis citra…' : 'Seret & lepas, atau klik untuk unggah Penunjang'}
              </span>
              <span className="text-[11px] text-neutral-400">EKG · CT · MRI · X-ray · USG · foto lab → masuk Objective AI-EMR</span>
              <input type="file" accept="image/*" className="hidden" disabled={analyzing} onChange={(e) => analyzeImage(e.target.files?.[0])} />
            </label>
          </div>
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
            placeholder="Tulis atau tekan 🎤 untuk bicara… (Enter untuk kirim)"
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <button
            onClick={toggleMic}
            title="Bicara (suara ke teks)"
            aria-label="Input suara"
            className={`grid h-[44px] w-[44px] shrink-0 place-items-center rounded-xl border transition ${listening ? 'animate-pulse border-accent bg-accent text-white' : 'border-neutral-200 bg-white text-neutral-500 hover:text-brand-dark'}`}
          >
            🎤
          </button>
          <button
            onClick={() => { setVoiceOut((v) => { if (v) window.speechSynthesis?.cancel(); return !v }) }}
            title={voiceOut ? 'Matikan suara jawaban' : 'Aktifkan suara jawaban'}
            aria-label="Suara jawaban"
            className={`grid h-[44px] w-[44px] shrink-0 place-items-center rounded-xl border transition ${voiceOut ? 'border-brand bg-brand-50 text-brand-dark' : 'border-neutral-200 bg-white text-neutral-500 hover:text-brand-dark'}`}
          >
            {voiceOut ? '🔊' : '🔈'}
          </button>
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
          AI terbatas — sambungkan server (atau tambah API key pribadi di Pengaturan) untuk respons AI penuh.
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
