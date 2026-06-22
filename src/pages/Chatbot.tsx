import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, uid } from '../lib/store'
import { Card, Button, Badge } from '../components/ui'
import { IconSend, IconSparkle, IconChat } from '../components/icons'
import { LogoMark } from '../components/Logo'
import { sendChat, draftEMR, aiAvailable, type PatientContext } from '../lib/ai'
import { api, backendEnabled } from '../lib/api'
import { compressImage, readAsDataUrl } from '../lib/upload'
import type { ChatMessage, EMRRecord, PlanItem } from '../lib/types'

interface ChatSession { id: string; title: string; messages: ChatMessage[]; createdAt: string }
function getHistory(pid: string): ChatSession[] { try { const r = localStorage.getItem(`ph_${pid}`); return r ? JSON.parse(r) : [] } catch { return [] } }
function saveHistory(pid: string, s: ChatSession[]) { localStorage.setItem(`ph_${pid}`, JSON.stringify(s)) }
function makeTitle(msgs: ChatMessage[]): string { const f = msgs.find(m => m.role === 'user'); return f ? (f.content.length > 50 ? f.content.slice(0, 50) + '…' : f.content) : 'Percakapan baru' }
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

function Inline({ text }: { text: string }) {
  const parts: any[] = []
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\))/g
  let last = 0, m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    if (m[2]) parts.push(<strong key={m.index} className="font-bold">{m[2]}</strong>)
    else if (m[3]) parts.push(<em key={m.index}>{m[3]}</em>)
    else if (m[4]) parts.push(<code key={m.index} className="rounded bg-black/[.06] px-1.5 py-0.5 text-[13px] font-mono">{m[4]}</code>)
    else if (m[5]) {
      const url = m[6]
      const safe = /^https?:\/\//i.test(url)
      parts.push(<a key={m.index} href={safe ? url : '#'} target="_blank" rel="noopener noreferrer" className="text-brand underline">{m[5]}</a>)
    }
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

function isTableBlock(lines: string[]): boolean {
  if (lines.length < 2) return false
  if (!lines[0].includes('|')) return false
  return lines.some(l => /^\|[\s\-:|]+\|$/.test(l.trim()))
}

function TableBlock({ lines }: { lines: string[] }) {
  const rows = lines.filter(l => l.trim()).map(l => l.split('|').map(c => c.trim()).filter((_: any, i: number, arr: any[]) => i > 0 && i < arr.length - 1))
  const sepIdx = lines.findIndex(l => /^\|[\s\-:|]+\|$/.test(l.trim()))
  if (sepIdx < 1) return null
  const headers = rows[sepIdx - 1]
  const body = rows.filter((_: any, i: number) => i !== sepIdx - 1 && i !== sepIdx)
  return (
    <div className="my-3 overflow-x-auto rounded-xl border border-black/5">
      <table className="w-full text-xs">
        <thead className="bg-brand/10">
          <tr>{headers.map((h: string, i: number) => <th key={i} className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-brand-dark"><Inline text={h} /></th>)}</tr>
        </thead>
        <tbody>
          {body.map((row: string[], ri: number) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}>
              {row.map((cell: string, ci: number) => <td key={ci} className="border-t border-neutral-100 px-3 py-2 text-xs"><Inline text={cell} /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function isCodeBlock(lines: string[]): { is: boolean; lang?: string } {
  const first = lines[0]?.trim()
  if (first?.startsWith('```')) return { is: true, lang: first.slice(3).trim() || undefined }
  return { is: false }
}

function RenderContent({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/)
  const elements: any[] = []

  for (let bi = 0; bi < blocks.length; bi++) {
    const block = blocks[bi]
    const lines = block.split('\n')

    const cb = isCodeBlock(lines)
    if (cb.is) {
      const endIdx = lines.findIndex((l: string, i: number) => i > 0 && l.trim() === '```')
      const codeLines = endIdx === -1 ? lines.slice(1) : lines.slice(1, endIdx)
      elements.push(
        <pre key={bi} className="my-2 overflow-x-auto rounded-xl bg-ink p-3 text-xs leading-relaxed text-white">
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
      continue
    }

    if (isTableBlock(lines)) {
      elements.push(<TableBlock key={bi} lines={lines} />)
      continue
    }

    const listItems: string[] = []
    const listType = lines[0]?.match(/^[\s]*[-*]\s/) ? 'ul' : lines[0]?.match(/^[\s]*\d+\.\s/) ? 'ol' : null
    if (listType) {
      for (const l of lines) {
        const m = l.match(/^[\s]*[-*]\s(.*)$/) || l.match(/^[\s]*\d+\.\s(.*)$/)
        if (m) listItems.push(m[1])
      }
      if (listType === 'ul') {
        elements.push(<ul key={bi} className="my-1.5 ml-4 list-disc space-y-0.5 text-sm">{listItems.map((li: string, i: number) => <li key={i}><Inline text={li} /></li>)}</ul>)
      } else {
        elements.push(<ol key={bi} className="my-1.5 ml-4 list-decimal space-y-0.5 text-sm">{listItems.map((li: string, i: number) => <li key={i}><Inline text={li} /></li>)}</ol>)
      }
      continue
    }

    const hMatch = lines[0]?.match(/^(#{1,3})\s+(.+)/)
    if (hMatch && lines.length <= 2) {
      const lvl = hMatch[1].length
      const cls = lvl === 1 ? 'my-2 text-base font-bold' : lvl === 2 ? 'my-2 text-[15px] font-bold' : 'my-1.5 text-sm font-bold'
      elements.push(<h3 key={bi} className={cls}><Inline text={hMatch[2]} /></h3>)
      continue
    }

    if (lines.every(l => /^>\s?/.test(l))) {
      elements.push(
        <blockquote key={bi} className="my-2 border-l-[3px] border-brand/30 pl-3 italic text-neutral-600">
          {lines.map((l: string, i: number) => <p key={i} className="text-sm"><Inline text={l.replace(/^>\s?/, '')} /></p>)}
        </blockquote>
      )
      continue
    }

    elements.push(
      <p key={bi} className="my-1.5 text-sm leading-relaxed">
        {block.split('\n').map((line: string, li: number) => (
          <span key={li}>{li > 0 && <br />}<Inline text={line} /></span>
        ))}
      </p>
    )
  }

  return <>{elements}</>
}

function ctxOf(store: ReturnType<typeof useStore>): PatientContext {
  const p = store.activePatient
  const vitals = store.state.vitals[p.id] ?? []
  return { patient: p, latestVitals: vitals[vitals.length - 1], supportive: store.state.supportive[p.id] ?? [] }
}

function autoObjective(messages: ChatMessage[], latest?: PatientContext['latestVitals']): string {
  const lines: string[] = []
  if (latest) { lines.push(`[Auto-vital] TD ${latest.systolic}/${latest.diastolic} mmHg · Nadi ${latest.heartRate}x/mnt · RR ${latest.respRate}x/mnt · Suhu ${latest.tempC}°C · SpO₂ ${latest.spo2}%` + (latest.glucose ? ` · GDS ${latest.glucose} mg/dL` : '')) }
  const re = /[^.!?\n]*\b(\d{2,3}\/\d{2,3}|\d+(?:[.,]\d+)?\s?(?:mmhg|mg\/dl|°c|celsius|kg|cm|%|x\/menit|bpm|mmol))\b[^.!?\n]*/gi
  const seen = new Set<string>()
  for (const m of messages) { if (m.role !== 'user') continue; const found = m.content.match(re); if (found) found.forEach((f) => seen.add(f.trim())) }
  seen.forEach((l) => lines.push(`[Auto-Objektif] ${l}`))
  return lines.join('\n')
}

const QUICK_REPLIES = ['Jelaskan lebih detail', 'Berikan alternatif tata laksana', 'Pemeriksaan penunjang apa yang disarankan?', 'Apa red flag yang perlu diwaspadai?']

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
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<ChatSession[]>([])
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'up' | 'down'>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [price, setPrice] = useState(5)
  const [topup, setTopup] = useState(false)

  useEffect(() => { setHistory(getHistory(activePatient.id)) }, [activePatient.id])
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }, [messages, busy, consulting])
  useEffect(() => { if (backendEnabled) api.health().then((h) => h.aiConsultPnc && setPrice(h.aiConsultPnc)).catch(() => {}) }, [])
  useEffect(() => { return () => { window.speechSynthesis?.cancel() } }, [])

  function handleScroll() { const el = scrollRef.current; if (!el) return; setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120) }

  function speak(text: string) {
    if (!voiceOut || typeof window === 'undefined' || !window.speechSynthesis) return
    const clean = text.replace(/[*_#>`~]/g, '')
    const u = new SpeechSynthesisUtterance(clean); u.lang = 'id-ID'; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u)
  }

  function toggleMic() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setError('Browser belum mendukung input suara.'); return }
    if (listening) { recogRef.current?.stop(); return }
    const r = new SR(); r.lang = 'id-ID'; r.interimResults = false; r.continuous = false
    r.onresult = (e: any) => setInput((p) => (p ? p + ' ' : '') + e.results[0][0].transcript)
    r.onend = () => setListening(false); r.onerror = () => setListening(false)
    recogRef.current = r; setListening(true); r.start()
  }

  async function analyzeImage(file?: File) {
    if (!file) return; setAnalyzing(true); setError('')
    try {
      const dataUrl = await readAsDataUrl(await compressImage(file, 1280, 0.85))
      setChat(activePatient.id, [...messages, { id: uid(), role: 'user', content: `🩻 Mengunggah citra: ${file.name}`, at: new Date().toISOString() }])
      const r = await api.aiVision(dataUrl, 'Analisis citra pemeriksaan penunjang ini.')
      setChat(activePatient.id, (state.chats[activePatient.id] ?? messages).concat({ id: uid(), role: 'assistant', content: `🩻 **Analisis Penunjang**\n\n${r.text}`, at: new Date().toISOString() }))
    } catch { setError('Gagal menganalisis citra.') } finally { setAnalyzing(false) }
  }

  async function deepConsult() {
    if (messages.length === 0) return; setConsulting(true); setError(''); setTopup(false)
    try {
      const r = await api.aiConsult(messages.map((m) => ({ role: m.role, content: m.content })))
      store.syncWalletBalance(r.balance)
      setChat(activePatient.id, [...messages, { id: uid(), role: 'assistant', content: `🩺 **Konsultasi Mendalam** _(−${r.charged} PNC · sisa ${r.balance})_\n\n${r.text}`, at: new Date().toISOString() }])
    } catch (e) { if (String(e instanceof Error ? e.message : e).includes('insufficient_balance')) setTopup(true); else setError('Gagal konsultasi mendalam.') } finally { setConsulting(false) }
  }

  async function send() {
    const text = input.trim(); if (!text || busy) return; setError('')
    const userMsg: ChatMessage = { id: uid(), role: 'user', content: text, at: new Date().toISOString() }
    const next = [...messages, userMsg]; setChat(activePatient.id, next); setInput(''); setBusy(true)
    try { const reply = await sendChat(state.settings, next, ctxOf(store)); setChat(activePatient.id, [...next, { id: uid(), role: 'assistant', content: reply, at: new Date().toISOString() }]); speak(reply) }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal menghubungi AI.') } finally { setBusy(false) }
  }

  async function regenerate() {
    if (busy) return
    const lastAiIdx = [...messages].reverse().findIndex(m => m.role === 'assistant')
    if (lastAiIdx === -1) return
    const cutAt = messages.length - 1 - lastAiIdx; const context = messages.slice(0, cutAt)
    setChat(activePatient.id, context); setBusy(true); setError('')
    try { const reply = await sendChat(state.settings, context, ctxOf(store)); setChat(activePatient.id, [...context, { id: uid(), role: 'assistant', content: reply, at: new Date().toISOString() }]); speak(reply) }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal menghubungi AI.') } finally { setBusy(false) }
  }

  async function makeDraft() {
    if (drafting) return; setError(''); setDrafting(true)
    try {
      const d = await draftEMR(state.settings, messages, ctxOf(store)); const now = new Date().toISOString()
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

  function copyText(text: string, msgId: string) {
    const clean = text.replace(/[*_#>`~]/g, '')
    if (navigator.clipboard) navigator.clipboard.writeText(clean)
    else { const ta = document.createElement('textarea'); ta.value = clean; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta) }
    setCopiedId(msgId); setTimeout(() => setCopiedId(null), 2000)
  }

  function toggleFeedback(msgId: string, type: 'up' | 'down') {
    setFeedbackMap(prev => {
      const next = { ...prev }
      if (prev[msgId] === type) { delete next[msgId] } else { next[msgId] = type }
      return next
    })
  }

  function exportChat() {
    if (messages.length === 0) return
    let text = `Chat Anamnesis — ${activePatient.name}\nTanggal: ${new Date().toLocaleDateString('id-ID')}\n${'═'.repeat(50)}\n\n`
    for (const m of messages) { const t = m.at ? new Date(m.at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''; text += `[${t}] ${m.role === 'user' ? '👤 Pasien' : '🤖 AI'}:\n${m.content.replace(/[*_#>`~]/g, '')}\n\n` }
    const blob = new Blob([text], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `chat-${activePatient.name}-${new Date().toISOString().slice(0, 10)}.txt`; a.click()
    setTimeout(() => { URL.revokeObjectURL(a.href) }, 1000)
  }

  function startNewChat() {
    if (messages.length === 0) return
    const session: ChatSession = { id: uid(), title: makeTitle(messages), messages, createdAt: new Date().toISOString() }
    const updated = [session, ...getHistory(activePatient.id)]; saveHistory(activePatient.id, updated); setHistory(updated)
    setChat(activePatient.id, []); setShowHistory(false)
  }

  function loadSession(session: ChatSession) { setChat(activePatient.id, session.messages); setShowHistory(false) }
  function deleteSession(sid: string, e: React.MouseEvent) { e.stopPropagation(); const updated = getHistory(activePatient.id).filter(s => s.id !== sid); saveHistory(activePatient.id, updated); setHistory(updated) }

  const keyed = aiAvailable(state.settings)
  const lastMsgIsAi = messages.length > 0 && messages[messages.length - 1].role === 'assistant'

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] leading-snug text-amber-800">
        <span className="mt-0.5 shrink-0">⚕️</span>
        <span><b>Penting:</b> AI ini bersifat <b>edukatif &amp; pendukung</b>, bukan pengganti dokter. Untuk keadaan darurat, segera gunakan <b>Darurat SOS</b>.</span>
      </div>
      {topup && (<div className="flex items-center justify-between gap-2 rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm"><span className="text-accent">Saldo PNC tidak cukup ({price} PNC).</span><Button onClick={() => nav('/billing')} className="!px-4 !py-1.5 text-xs">Top up</Button></div>)}

      <Card pad={false} className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <button onClick={() => setShowHistory(true)} title="Riwayat chat" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-neutral-200 text-neutral-500 transition hover:border-brand hover:text-brand-dark">📜</button>
            <IconChat className="text-brand" size={20} />
            <div><div className="font-bold">Anamnesis Co-Physician</div><div className="text-xs text-neutral-500">AI mewawancara pasien & merekomendasikan penunjang</div></div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone={keyed ? 'brand' : 'high'}>{keyed ? 'AI Aktif' : 'AI Terbatas'}</Badge>
            <Button variant="outline" onClick={startNewChat} disabled={messages.length === 0}>➕ Chat Baru</Button>
            <Button variant="outline" onClick={exportChat} disabled={messages.length === 0}>📥 Export</Button>
            {backendEnabled && (<Button variant="outline" onClick={deepConsult} disabled={consulting || messages.length === 0}><IconSparkle size={16} />{consulting ? 'Menganalisis…' : `${price} PNC`}</Button>)}
            {store.account?.role === 'dokter' ? (<Button onClick={makeDraft} disabled={drafting || messages.length === 0}><IconSparkle size={16} />{drafting ? 'Menyusun…' : 'Susun Draft AI-EMR'}</Button>) : (<Badge tone="neutral">Diteruskan ke dokter</Badge>)}
          </div>
        </div>

        <div className="relative">
          <div ref={scrollRef} onScroll={handleScroll} className="h-[52vh] space-y-6 overflow-y-auto px-5 py-6">
            {messages.length === 0 && <Welcome name={activePatient.name} keyed={keyed} />}
            {messages.map((m, idx) => {
              const isLastAi = m.role === 'assistant' && !messages.slice(idx + 1).some(mm => mm.role === 'assistant')
              return (<Bubble key={m.id} msg={m} isLastAi={isLastAi} copiedId={copiedId} feedback={feedbackMap[m.id]} onCopy={copyText} onFeedback={toggleFeedback} onRegenerate={regenerate} />)
            })}
            {busy && (<div className="flex items-center gap-2.5 text-sm text-neutral-400"><LogoMark size={22} /><span className="animate-pulse">AI sedang menganalisis…</span></div>)}
          </div>
          {showScrollBtn && (<button onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })} className="absolute bottom-3 right-5 z-10 grid h-9 w-9 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-lg transition hover:bg-brand hover:text-white" title="Ke bawah">↓</button>)}
        </div>

        {lastMsgIsAi && !busy && (<div className="flex flex-wrap gap-2 border-t border-black/5 px-5 pt-3">{QUICK_REPLIES.map(q => (<button key={q} onClick={() => setInput(q)} className="rounded-full border border-black/5 bg-neutral-50 px-3 py-1.5 text-[11px] text-neutral-500 transition hover:border-brand hover:text-brand-dark">{q}</button>))}</div>)}
        {error && (<div className="mx-5 mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-accent">{error}</div>)}

        {backendEnabled && (<div className="border-t border-black/5 px-3 pt-3">
          <label onDragOver={(e) => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); analyzeImage(e.dataTransfer.files?.[0]) }} className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-4 py-3 text-center transition ${dragging ? 'border-brand bg-brand-50' : 'border-brand/30 bg-brand-50/40 hover:bg-brand-50'}`}>
            <span className="text-lg">{analyzing ? '🔬' : '🩻'}</span><span className="text-[11px] font-bold text-brand-dark">{analyzing ? 'Menganalisis…' : 'Seret/ klik untuk unggah Penunjang'}</span>
            <input type="file" accept="image/*" className="hidden" disabled={analyzing} onChange={(e) => analyzeImage(e.target.files?.[0])} />
          </label>
        </div>)}

        <div className="flex items-end gap-2 border-t border-black/5 p-3">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} rows={1} placeholder="Tulis atau tekan 🎤… (Enter kirim)" className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
          <button onClick={toggleMic} title="Input suara" className={`grid h-[44px] w-[44px] shrink-0 place-items-center rounded-xl border transition ${listening ? 'animate-pulse border-accent bg-accent text-white' : 'border-neutral-200 bg-white text-neutral-500 hover:text-brand-dark'}`}>🎤</button>
          <button onClick={() => { setVoiceOut(v => { if (v) window.speechSynthesis?.cancel(); return !v }) }} title={voiceOut ? 'Matikan suara' : 'Aktifkan suara'} className={`grid h-[44px] w-[44px] shrink-0 place-items-center rounded-xl border transition ${voiceOut ? 'border-brand bg-brand-50 text-brand-dark' : 'border-neutral-200 bg-white text-neutral-500 hover:text-brand-dark'}`}>{voiceOut ? '🔊' : '🔈'}</button>
          <Button onClick={send} disabled={busy || !input.trim()} className="h-[44px]"><IconSend size={16} /> Kirim</Button>
        </div>
      </Card>

      <p className="px-1 text-xs text-neutral-400">⚕️ AI mendukung, bukan menggantikan, klinisi berlisensi.</p>

      {showHistory && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-80 max-w-[85vw] flex flex-col border-r border-neutral-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3"><h3 className="font-bold text-sm">📜 Riwayat Chat</h3><button onClick={() => setShowHistory(false)} className="text-neutral-400 hover:text-neutral-700 text-lg leading-none">✕</button></div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <button onClick={startNewChat} disabled={messages.length === 0} className="w-full rounded-xl border-2 border-dashed border-brand/30 px-4 py-3 text-left text-sm font-bold text-brand-dark transition hover:border-brand hover:bg-brand-50 disabled:opacity-40">➕ Simpan & mulai chat baru</button>
              {groupByDate(history).map(group => (
                <div key={group.label} className="mt-3">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">{group.label}</div>
                  {group.items.map(session => (
                    <div key={session.id} onClick={() => loadSession(session)} className="group/s flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition hover:bg-neutral-50">
                      <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-ink">{session.title}</div><div className="text-[11px] text-neutral-400">{new Date(session.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} · {session.messages.length} pesan</div></div>
                      <button onClick={(e) => deleteSession(session.id, e)} className="shrink-0 text-neutral-300 opacity-0 transition group-hover/s:opacity-100 hover:text-red-500">🗑️</button>
                    </div>
                  ))}
                </div>
              ))}
              {history.length === 0 && <p className="py-10 text-center text-xs text-neutral-400">Belum ada riwayat.</p>}
            </div>
          </div>
          <div className="flex-1 bg-black/25 backdrop-blur-[2px]" onClick={() => setShowHistory(false)} />
        </div>
      )}
    </div>
  )
}

function Welcome({ name, keyed }: { name: string; keyed: boolean }) {
  const suggestions = ['Saya merasa nyeri dada sejak 2 hari', 'Akhir-akhir ini sering pusing dan lemas', 'Sesak napas saat aktivitas ringan']
  return (
    <div className="mx-auto max-w-xl py-8 text-center">
      <LogoMark size={48} className="mx-auto" />
      <h3 className="mt-4 text-lg font-bold">Selamat datang{', '}{name}</h3>
      <p className="mt-2 text-sm text-neutral-500 max-w-md mx-auto">Mulai anamnesis dengan menulis keluhan utama, atau pilih salah satu saran di bawah.</p>
      {!keyed && <p className="mt-2 text-xs text-accent">AI terbatas — sambungkan server atau tambah API key di Pengaturan.</p>}
      <div className="mt-6 grid gap-2 sm:grid-cols-2 max-w-lg mx-auto">
        {suggestions.map((s) => (
          <button key={s} onClick={() => {}} className="group/s rounded-xl border border-black/5 bg-neutral-50/50 px-4 py-3 text-left text-xs text-neutral-600 transition hover:border-brand/40 hover:bg-brand-50/50 hover:text-brand-dark">
            <span className="block font-semibold">{s}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

interface BubbleProps {
  msg: ChatMessage
  isLastAi: boolean
  copiedId: string | null
  feedback: 'up' | 'down' | undefined
  onCopy: (text: string, id: string) => void
  onFeedback: (id: string, type: 'up' | 'down') => void
  onRegenerate: () => void
}

function Bubble({ msg, isLastAi, copiedId, feedback, onCopy, onFeedback, onRegenerate }: BubbleProps) {
  const isUser = msg.role === 'user'
  const time = msg.at ? new Date(msg.at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-brand px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm">
          {msg.content}
        </div>
      </div>
    )
  }

  return (
    <div className="group/b flex gap-3">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/10">
        <LogoMark size={16} />
      </span>
      <div className="flex-1 min-w-0 max-w-[85%]">
        <div className="text-sm leading-relaxed text-ink">
          <RenderContent text={msg.content} />
        </div>
        <div className="mt-1.5 flex items-center gap-0.5 opacity-0 transition-opacity group-hover/b:opacity-100">
          <span className="mr-1 text-[10px] text-neutral-400">{time}</span>
          <button onClick={() => onCopy(msg.content, msg.id)} className="rounded-md p-1 text-[10px] text-neutral-400 transition hover:bg-neutral-100 hover:text-ink">{copiedId === msg.id ? '✅' : '📋'}</button>
          <button onClick={() => onFeedback(msg.id, 'up')} className={`rounded-md p-1 text-xs transition ${feedback === 'up' ? 'text-brand' : 'text-neutral-400 hover:bg-neutral-100 hover:text-ink'}`}>👍</button>
          <button onClick={() => onFeedback(msg.id, 'down')} className={`rounded-md p-1 text-xs transition ${feedback === 'down' ? 'text-accent' : 'text-neutral-400 hover:bg-neutral-100 hover:text-ink'}`}>👎</button>
          {isLastAi && <button onClick={onRegenerate} className="rounded-md p-1 text-[10px] text-neutral-400 transition hover:bg-neutral-100 hover:text-ink">🔄</button>}
        </div>
      </div>
    </div>
  )
}
