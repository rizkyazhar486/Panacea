import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, uid } from '../lib/store'
import { Card, Button, Badge } from './ui'
import { IconSend, IconSparkle, IconChat } from './icons'
import { LogoMark } from './components/Logo'
import { sendChat, draftEMR, aiAvailable, type PatientContext } from '../lib/ai'
import { api, backendEnabled } from '../lib/api'
import { compressImage, readAsDataUrl } from '../lib/upload'
import type { ChatMessage, EMRRecord, PlanItem } from '../lib/types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/* ═══════════════════════════════════════════
   TYPES & HELPERS — Chat History (localStorage)
   ═══════════════════════════════════════════ */
interface ChatSession { id: string; title: string; messages: ChatMessage[]; createdAt: string }

function getHistory(pid: string): ChatSession[] {
  try { const r = localStorage.getItem(`panacea_hist_${pid}`); return r ? JSON.parse(r) : [] } catch { return [] }
}
function saveHistory(pid: string, s: ChatSession[]) {
  localStorage.setItem(`panacea_hist_${pid}`, JSON.stringify(s))
}
function makeTitle(msgs: ChatMessage[]): string {
  const f = msgs.find(m => m.role === 'user')
  return f ? (f.content.length > 50 ? f.content.slice(0, 50) + '…' : f.content) : 'Percakapan baru'
}
function groupByDate(sessions: ChatSession[]) {
  const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(), yesterday = today - 864e5
  const g: { label: string; items: ChatSession[] }[] = []
  const t = sessions.filter(s => new Date(s.createdAt).getTime() >= today)
  const y = sessions.filter(s => { const d = new Date(s.createdAt).getTime(); return d >= yesterday && d < today })
  const o = sessions.filter(s => new Date(s.createdAt).getTime() < yesterday)
  if (t.length) g.push({ label: 'Hari ini', items: t })
  if (y.length) g.push({ label: 'Kemarin', items: y })
  if (o.length) g.push({ label: 'Lebih lama', items: o })
  return g
}

/* ═══════════════════════════════════════════
   EXISTING HELPERS
   ═══════════════════════════════════════════ */
function ctxOf(store: ReturnType<typeof useStore>): PatientContext {
  const p = store.activePatient
  const vitals = store.state.vitals[p.id] ?? []
  return { patient: p, latestVitals: vitals[vitals.length - 1], supportive: store.state.supportive[p.id] ?? [] }
}

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

/* ═══════════════════════════════════════════
   SUGGESTED REPLIES
   ═══════════════════════════════════════════ */
const QUICK_REPLIES = [
  'Jelaskan lebih detail',
  'Berikan alternatif tata laksana',
  'Pemeriksaan penunjang apa yang disarankan?',
  'Apa red flag yang perlu diwaspadai?',
]

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
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
  const scrollRef = useRef<HTMLDivElement>(null)

  /* ── New state for features ── */
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<ChatSession[]>([])
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'up' | 'down'>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [price, setPrice] = useState(5)
  const [topup, setTopup] = useState(false)

  /* ── Load history on mount ── */
  useEffect(() => { setHistory(getHistory(activePatient.id)) }, [activePatient.id])

  /* ── Auto-scroll ── */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy, consulting])

  useEffect(() => {
    if (backendEnabled) api.health().then((h) => h.aiConsultPnc && setPrice(h.aiConsultPnc)).catch(() => {})
  }, [])

  /* ── Scroll detection ── */
  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120)
  }

  /* ── Speak ── */
  function speak(text: string) {
    if (!voiceOut || typeof window === 'undefined' || !window.speechSynthesis) return
    const clean = text.replace(/[*_#>`~]/g, '')
    const u = new SpeechSynthesisUtterance(clean)
    u.lang = 'id-ID'
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  }

  /* ── Mic ── */
  function toggleMic() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setError('Browser ini belum mendukung input suara. Coba Chrome.'); return }
    if (listening) { recogRef.current?.stop(); return }
    const r = new SR()
    r.lang = 'id-ID'; r.interimResults = false; r.continuous = false
    r.onresult = (e: any) => setInput((prev) => (prev ? prev + ' ' : '') + e.results[0][0].transcript)
    r.onend = () => setListening(false); r.onerror = () => setListening(false)
    recogRef.current = r; setListening(true); r.start()
  }

  /* ── Vision ── */
  async function analyzeImage(file?: File) {
    if (!file) return
    setAnalyzing(true); setError('')
    try {
      const dataUrl = await readAsDataUrl(await compressImage(file, 1280, 0.85))
      setChat(activePatient.id, [...messages, { id: uid(), role: 'user', content: `🩻 Mengunggah citra pemeriksaan penunjang: ${file.name}`, at: new Date().toISOString() }])
      const r = await api.aiVision(dataUrl, 'Analisis citra pemeriksaan penunjang ini untuk rekam medis pasien.')
      setChat(activePatient.id, (state.chats[activePatient.id] ?? messages).concat({ id: uid(), role: 'assistant', content: `🩻 **Analisis Penunjang (untuk Objective AI-EMR)**\n\n${r.text}`, at: new Date().toISOString() }))
    } catch { setError('Gagal menganalisis citra. Pastikan file gambar valid & coba lagi.') } finally { setAnalyzing(false) }
  }

  /* ── Deep consult ── */
  async function deepConsult() {
    if (messages.length === 0) return
    setConsulting(true); setError(''); setTopup(false)
    try {
      const r = await api.aiConsult(messages.map((m) => ({ role: m.role, content: m.content })))
      store.syncWalletBalance(r.balance)
      setChat(activePatient.id, [...messages, { id: uid(), role: 'assistant', content: `🩺 **Konsultasi AI Mendalam** _(−${r.charged} PNC · sisa ${r.balance})_\n\n${r.text}`, at: new Date().toISOString() }])
    } catch (e) {
      if (String(e instanceof Error ? e.message : e).includes('insufficient_balance')) setTopup(true)
      else setError('Gagal menjalankan konsultasi mendalam.')
    } finally { setConsulting(false) }
  }

  /* ── Send ── */
  async function send() {
    const text = input.trim()
    if (!text || busy) return
    setError('')
    const userMsg: ChatMessage = { id: uid(), role: 'user', content: text, at: new Date().toISOString() }
    const next = [...messages, userMsg]
    setChat(activePatient.id, next); setInput(''); setBusy(true)
    try {
      const reply = await sendChat(state.settings, next, ctxOf(store))
      setChat(activePatient.id, [...next, { id: uid(), role: 'assistant', content: reply, at: new Date().toISOString() }])
      speak(reply)
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal menghubungi AI.') } finally { setBusy(false) }
  }

  /* ── Regenerate ── */
  async function regenerate() {
    if (busy) return
    const lastAiIdx = [...messages].reverse().findIndex(m => m.role === 'assistant')
    if (lastAiIdx === -1) return
    const cutAt = messages.length - 1 - lastAiIdx
    const context = messages.slice(0, cutAt)
    setChat(activePatient.id, context); setBusy(true); setError('')
    try {
      const reply = await sendChat(state.settings, context, ctxOf(store))
      setChat(activePatient.id, [...context, { id: uid(), role: 'assistant', content: reply, at: new Date().toISOString() }])
      speak(reply)
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal menghubungi AI.') } finally { setBusy(false) }
  }

  /* ── Draft EMR ── */
  async function makeDraft() {
    if (drafting) return
    setError(''); setDrafting(true)
    try {
      const d = await draftEMR(state.settings, messages, ctxOf(store))
      const now = new Date().toISOString()
      const plan: PlanItem[] = d.draftPlan.map((pi) => ({ id: uid(), category: pi.category as PlanItem['category'], text: pi.text, source: 'AI', status: 'usulan' }))
      const existing = state.records[activePatient.id]
      const record: EMRRecord = {
        id: existing?.id ?? uid(), patientId: activePatient.id, createdAt: existing?.createdAt ?? now, updatedAt: now,
        anamnesis: { keluhanUtama: d.keluhanUtama, rps: d.rps, rpd: d.rpd, rpk: d.rpk, riwayatKehamilan: '', riwayatPengobatan: d.riwayatPengobatan, riwayatAlergi: d.riwayatAlergi, riwayatTumbuhKembang: '', riwayatNutrisi: d.riwayatNutrisi, riwayatImunisasi: '', riwayatSosialEkonomi: d.riwayatSosialEkonomi },
        physicalExam: existing?.physicalExam ?? { general: '', vitalsNote: autoObjective(messages, ctxOf(store).latestVitals), perSystem: d.suggestedExams.map((s) => `• [USULAN AI] ${s}`).join('\n'), doctorVerified: false },
        problems: d.problems.map((pr) => ({ id: uid(), ...pr })), plan, prognosis: d.prognosis, references: d.references,
      }
      saveRecord(record); nav('/emr')
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal menyusun draft.') } finally { setDrafting(false) }
  }

  /* ═══ NEW FEATURES ═══ */

  /* ── Copy ── */
  function copyText(text: string, msgId: string) {
    const clean = text.replace(/[*_#>`~]/g, '')
    if (navigator.clipboard) { navigator.clipboard.writeText(clean) }
    else { const ta = document.createElement('textarea'); ta.value = clean; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta) }
    setCopiedId(msgId); setTimeout(() => setCopiedId(null), 2000)
  }

  /* ── Feedback ── */
  function toggleFeedback(msgId: string, type: 'up' | 'down') {
    setFeedbackMap(prev => prev[msgId] === type ? { ...prev, [msgId]: undefined as any } : { ...prev, [msgId]: type })
  }

  /* ── Export ── */
  function exportChat() {
    if (messages.length === 0) return
    let text = `Chat Anamnesis — ${activePatient.name}\nTanggal: ${new Date().toLocaleDateString('id-ID')}\n${'═'.repeat(50)}\n\n`
    for (const m of messages) {
      const t = m.at ? new Date(m.at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''
      text += `[${t}] ${m.role === 'user' ? '👤 Pasien' : '🤖 AI'}:\n${m.content.replace(/[*_#>`~]/g, '')}\n\n`
    }
    const blob = new Blob([text], { type: 'text/plain' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `chat-${activePatient.name}-${new Date().toISOString().slice(0, 10)}.txt`; a.click()
  }

  /* ── New Chat ── */
  function startNewChat() {
    if (messages.length === 0) return
    const session: ChatSession = { id: uid(), title: makeTitle(messages), messages, createdAt: new Date().toISOString() }
    const updated = [session, ...getHistory(activePatient.id)]
    saveHistory(activePatient.id, updated); setHistory(updated)
    setChat(activePatient.id, []); setShowHistory(false)
  }

  /* ── Load Session ── */
  function loadSession(session: ChatSession) {
    setChat(activePatient.id, session.messages); setShowHistory(false)
  }

  /* ── Delete Session ── */
  function deleteSession(sid: string, e: React.MouseEvent) {
    e.stopPropagation()
    const updated = getHistory(activePatient.id).filter(s => s.id !== sid)
    saveHistory(activePatient.id, updated); setHistory(updated)
  }

  /* ── Quick reply ── */
  function useQuickReply(text: string) { setInput(text) }

  const keyed = aiAvailable(state.settings)
  const lastMsgIsAi = messages.length > 0 && messages[messages.length - 1].role === 'assistant'

  /* ═══════════════════════════════════════════
     JSX
     ═══════════════════════════════════════════ */
  return (
    <div className="space-y-4">
      {/* ── Warning ── */}
      <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] leading-snug text-amber-800">
        <span className="mt-0.5 shrink-0">⚕️</span>
        <span><b>Penting:</b> AI ini bersifat <b>edukatif &amp; pendukung</b>, bukan pengganti dokter. Tidak memberikan diagnosis final. Untuk keadaan darurat, segera gunakan <b>Darurat SOS</b> atau hubungi faskes terdekat.</span>
      </div>

      {topup && (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm">
          <span className="text-accent">Saldo PNC tidak cukup ({price} PNC).</span>
          <Button onClick={() => nav('/billing')} className="!px-4 !py-1.5 text-xs">Top up PNC</Button>
        </div>
      )}

      <Card pad={false} className="overflow-hidden">
        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 px-5 py-3">
          <div className="flex items-center gap-2.5">
            {/* History button */}
            <button onClick={() => setShowHistory(true)} title="Riwayat chat" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-neutral-200 text-neutral-500 transition hover:border-brand hover:text-brand-dark">📜</button>
            <IconChat className="text-brand" size={20} />
            <div>
              <div className="font-bold">Anamnesis Co-Physician</div>
              <div className="text-xs text-neutral-500">AI mewawancara pasien & merekomendasikan penunjang</div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone={keyed ? 'brand' : 'high'}>{keyed ? 'AI Aktif' : 'AI Terbatas'}</Badge>
            {/* New chat */}
            <Button variant="outline" onClick={startNewChat} disabled={messages.length === 0} title="Simpan & mulai chat baru">➕ Chat Baru</Button>
            {/* Export */}
            <Button variant="outline" onClick={exportChat} disabled={messages.length === 0} title="Download percakapan">📥 Export</Button>
            {backendEnabled && (
              <Button variant="outline" onClick={deepConsult} disabled={consulting || messages.length === 0}>
                <IconSparkle size={16} />{consulting ? 'Menganalisis…' : `${price} PNC`}
              </Button>
            )}
            {store.account?.role === 'dokter' ? (
              <Button onClick={makeDraft} disabled={drafting || messages.length === 0}>
                <IconSparkle size={16} />{drafting ? 'Menyusun…' : 'Susun Draft AI-EMR'}
              </Button>
            ) : (
              <Badge tone="neutral">Diteruskan ke dokter</Badge>
            )}
          </div>
        </div>

        {/* ── Messages ── */}
        <div className="relative">
          <div ref={scrollRef} onScroll={handleScroll} className="h-[52vh] space-y-4 overflow-y-auto px-5 py-5">
            {messages.length === 0 && <Welcome name={activePatient.name} keyed={keyed} />}
            {messages.map((m, idx) => {
              const isLastAi = m.role === 'assistant' && !messages.slice(idx + 1).some(mm => mm.role === 'assistant')
              return (
                <Bubble
                  key={m.id} msg={m}
                  isLastAi={isLastAi}
                  copiedId={copiedId}
                  feedback={feedbackMap[m.id]}
                  onCopy={copyText}
                  onFeedback={toggleFeedback}
                  onRegenerate={regenerate}
                />
              )
            })}
            {busy && (
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <LogoMark size={22} /><span className="vital-dot">AI sedang menganalisis…</span>
              </div>
            )}
          </div>

          {/* ── Scroll to bottom ── */}
          {showScrollBtn && (
            <button
              onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })}
              className="absolute bottom-3 right-5 z-10 grid h-9 w-9 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-lg transition hover:bg-brand hover:text-white"
              title="Ke bawah"
            >↓</button>
          )}
        </div>

        {/* ── Suggested replies ── */}
        {lastMsgIsAi && !busy && (
          <div className="flex flex-wrap gap-2 border-t border-black/5 px-5 pt-3">
            {QUICK_REPLIES.map(q => (
              <button
                key={q} onClick={() => useQuickReply(q)}
                className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] text-neutral-500 transition hover:border-brand hover:text-brand-dark"
              >{q}</button>
            ))}
          </div>
        )}

        {error && <div className="mx-5 mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-accent">{error}</div>}

        {/* ── Image upload ── */}
        {backendEnabled && (
          <div className="border-t border-black/5 px-3 pt-3">
            <label
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); analyzeImage(e.dataTransfer.files?.[0]) }}
              className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-4 py-3 text-center transition ${dragging ? 'border-brand bg-brand-50' : 'border-brand/30 bg-brand-50/40 hover:bg-brand-50'}`}
            >
              <span className="text-lg">{analyzing ? '🔬' : '🩻'}</span>
              <span className="text-[11px] font-bold text-brand-dark">{analyzing ? 'Menganalisis…' : 'Seret/ klik untuk unggah Penunjang'}</span>
              <input type="file" accept="image/*" className="hidden" disabled={analyzing} onChange={(e) => analyzeImage(e.target.files?.[0])} />
            </label>
          </div>
        )}

        {/* ── Input ── */}
        <div className="flex items-end gap-2 border-t border-black/5 p-3">
          <textarea
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            rows={1} placeholder="Tulis atau tekan 🎤 untuk bicara… (Enter kirim)"
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <button onClick={toggleMic} title="Input suara" aria-label="Input suara"
            className={`grid h-[44px] w-[44px] shrink-0 place-items-center rounded-xl border transition ${listening ? 'animate-pulse border-accent bg-accent text-white' : 'border-neutral-200 bg-white text-neutral-500 hover:text-brand-dark'}`}
          >🎤</button>
          <button onClick={() => { setVoiceOut(v => { if (v) window.speechSynthesis?.cancel(); return !v }) }} title={voiceOut ? 'Matikan suara' : 'Aktifkan suara'} aria-label="Suara"
            className={`grid h-[44px] w-[44px] shrink-0 place-items-center rounded-xl border transition ${voiceOut ? 'border-brand bg-brand-50 text-brand-dark' : 'border-neutral-200 bg-white text-neutral-500 hover:text-brand-dark'}`}
          >{voiceOut ? '🔊' : '🔈'}</button>
          <Button onClick={send} disabled={busy || !input.trim()} className="h-[44px]"><IconSend size={16} /> Kirim</Button>
        </div>
      </Card>

      <p className="px-1 text-xs text-neutral-400">⚕️ AI mendukung, bukan menggantikan, klinisi berlisensi.</p>

      {/* ═══════════════════════════════════════════
          HISTORY SIDEBAR
          ═══════════════════════════════════════════ */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex">
          {/* Sidebar */}
          <div className="w-80 max-w-[85vw] flex flex-col border-r border-neutral-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
              <h3 className="font-bold text-sm">📜 Riwayat Chat</h3>
              <button onClick={() => setShowHistory(false)} className="text-neutral-400 hover:text-neutral-700 text-lg leading-none" aria-label="Tutup">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {/* New chat from sidebar */}
              <button onClick={startNewChat} disabled={messages.length === 0}
                className="w-full rounded-xl border-2 border-dashed border-brand/30 px-4 py-3 text-left text-sm font-bold text-brand-dark transition hover:border-brand hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >➕ Simpan & mulai chat baru</button>

              {groupByDate(history).map(group => (
                <div key={group.label} className="mt-3">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">{group.label}</div>
                  {group.items.map(session => (
                    <div
                      key={session.id}
                      onClick={() => loadSession(session)}
                      className="group/session flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition hover:bg-neutral-50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-ink">{session.title}</div>
                        <div className="text-[11px] text-neutral-400">
                          {new Date(session.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          <span className="ml-2">· {session.messages.length} pesan</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteSession(session.id, e)}
                        className="shrink-0 text-neutral-300 opacity-0 transition group-hover/session:opacity-100 hover:text-red-500"
                        title="Hapus"
                      >🗑️</button>
                    </div>
                  ))}
                </div>
              ))}
              {history.length === 0 && (
                <p className="py-10 text-center text-xs text-neutral-400">Belum ada riwayat chat.</p>
              )}
            </div>
          </div>
          {/* Overlay */}
          <div className="flex-1 bg-black/25 backdrop-blur-[2px]" onClick={() => setShowHistory(false)} />
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   WELCOME
   ═══════════════════════════════════════════ */
function Welcome({ name, keyed }: { name: string; keyed: boolean }) {
  const suggestions = ['Saya merasa nyeri dada sejak 2 hari', 'Akhir-akhir ini sering pusing dan lemas', 'Sesak napas saat aktivitas ringan']
  return (
    <div className="rise mx-auto max-w-lg rounded-2xl bg-brand-50/60 p-6 text-center">
      <LogoMark size={48} className="mx-auto" />
      <h3 className="mt-3 text-lg font-bold">Selamat datang / Welcome</h3>
      <p className="mt-1 text-sm text-neutral-600">Asisten klinis untuk <span className="font-semibold">{name}</span>. Mulai anamnesis dengan menulis keluhan utama.</p>
      {!keyed && <p className="mt-2 text-xs text-accent">AI terbatas — sambungkan server atau tambah API key di Pengaturan.</p>}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {suggestions.map((s) => (<span key={s} className="rounded-full bg-white px-3 py-1 text-xs text-neutral-500 ring-1 ring-black/5">"{s}"</span>))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   MERMAID DIAGRAM
   ═══════════════════════════════════════════ */
function MermaidBlock({ code }: { code: string }) {
  const [svg, setSvg] = useState('')
  const [err, setErr] = useState('')
  useEffect(() => {
    let cancelled = false
    import('mermaid').then((m) => {
      m.default.initialize({ startOnLoad: false, theme: 'base', themeVariables: { primaryColor: '#e0f2fe', primaryTextColor: '#1e293b', primaryBorderColor: '#7dd3fc', fontFamily: 'inherit' } })
      const id = 'mmd-' + Math.random().toString(36).slice(2, 10)
      m.default.render(id, code.trim()).then(({ svg }) => { if (!cancelled) setSvg(svg) }).catch((e: any) => { if (!cancelled) setErr(e?.message || String(e)) })
    }).catch(() => { if (!cancelled) setErr('Gagal memuat Mermaid') })
    return () => { cancelled = true }
  }, [code])
  if (err) return <div className="my-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">⚠️ Diagram gagal: {err}</div>
  if (!svg) return <div className="my-2 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-400">⏳ Mem
