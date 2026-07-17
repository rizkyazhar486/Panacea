import { useEffect, useRef, useState } from 'react'
import { IconPhone } from './icons'

interface Msg { from: 'user' | 'admin'; text: string }

const POS_KEY = 'panacea_contact_btn_pos_v1'
const MIN_KEY = 'panacea_contact_btn_minimized_v1'

function clampBottom(v: number): number {
  const maxBottom = window.innerHeight - 80
  return Math.min(Math.max(v, 90), maxBottom)
}

// Floating contact-service button present on every page. Admin support is an
// automated AI chatbot (with human escalation) for complaints & problems.
// Draggable vertically and collapsible to a small dot, since on some pages
// (long lists, the weather forecast, bottom sheets) it can sit over content
// the user wants to see.
export function ContactService() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      from: 'admin',
      text: 'Hello, this is Panaceamed Support (AI + human team). Tell us about your complaint or issue — your report helps us improve our system and service.',
    },
  ])

  const [bottom, setBottom] = useState<number>(() => {
    try { const v = Number(localStorage.getItem(POS_KEY)); return v > 0 ? clampBottom(v) : 112 } catch { return 112 }
  })
  const [minimized, setMinimized] = useState<boolean>(() => {
    try { return localStorage.getItem(MIN_KEY) === '1' } catch { return false }
  })
  const dragRef = useRef<{ startY: number; startBottom: number; dragged: boolean } | null>(null)

  useEffect(() => {
    const onResize = () => setBottom((b) => clampBottom(b))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  function persistBottom(v: number) {
    setBottom(v)
    try { localStorage.setItem(POS_KEY, String(v)) } catch { /* ignore */ }
  }

  function toggleMinimized(next: boolean) {
    setMinimized(next)
    try { localStorage.setItem(MIN_KEY, next ? '1' : '0') } catch { /* ignore */ }
  }

  function onPointerDown(e: React.PointerEvent) {
    dragRef.current = { startY: e.clientY, startBottom: bottom, dragged: false }
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return
    const dy = e.clientY - dragRef.current.startY
    if (Math.abs(dy) > 4) dragRef.current.dragged = true
    persistBottom(clampBottom(dragRef.current.startBottom - dy))
  }
  function onPointerUp() {
    const wasDragged = dragRef.current?.dragged
    dragRef.current = null
    return wasDragged
  }

  function send() {
    const t = input.trim()
    if (!t) return
    const next: Msg[] = [...msgs, { from: 'user', text: t }]
    const reply =
      'Thank you, your complaint has been recorded (ticket #' +
      Math.floor(1000 + Math.random() * 9000) +
      '). For scheduling surgery or procedures, our admin team will contact you. Is there anything else we can help with?'
    setMsgs([...next, { from: 'admin', text: reply }])
    setInput('')
  }

  if (minimized) {
    return (
      <button
        onClick={() => toggleMinimized(false)}
        style={{ bottom }}
        className="fixed left-2 z-40 flex h-7 w-7 items-center justify-center rounded-full text-white opacity-70 shadow-md transition hover:opacity-100 active:scale-90 lg:left-auto lg:right-2"
        title="Expand support button"
        aria-label="Expand support button"
      >
        <span className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }} />
        <IconPhone size={12} className="relative" />
      </button>
    )
  }

  return (
    <>
      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => { if (!onPointerUp()) setOpen((o) => !o) }}
        onDoubleClick={() => toggleMinimized(true)}
        style={{ bottom, background: 'linear-gradient(135deg, #00BF63, #0B7A4B)', boxShadow: '0 10px 26px -6px rgba(0,191,99,0.55)', touchAction: 'none' }}
        className="group fixed left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full text-white transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-95 lg:left-auto lg:right-5 lg:h-14 lg:w-14"
        title="Support / Contact Service — drag to move, double-tap to minimize"
        aria-label="Contact Service"
      >
        <span className="absolute inset-0 rounded-full bg-brand/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:animate-ping" />
        <IconPhone size={24} className="relative" />
      </button>

      {open && (
        <div style={{ bottom: bottom + 64 }} className="fixed left-4 z-40 flex h-[26rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 lg:left-auto lg:right-5">
          <div className="flex items-center gap-2 bg-ink px-4 py-3 text-white">
            <IconPhone size={18} className="text-brand" />
            <div className="text-sm font-bold">Panaceamed Support</div>
            <span className="ml-auto flex items-center gap-1 text-[10px] text-white/60">
              <span className="h-2 w-2 rounded-full bg-brand vital-dot" /> online
            </span>
            <button onClick={() => toggleMinimized(true)} title="Minimize" aria-label="Minimize" className="ml-2 text-white/70 hover:text-white">–</button>
            <button onClick={() => setOpen(false)} className="ml-1 text-white/70 hover:text-white">✕</button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : ''}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.from === 'user' ? 'bg-brand text-white' : 'bg-neutral-100 text-ink'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-neutral-100 p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Write your complaint / question…"
              className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <button onClick={send} className="rounded-xl bg-brand px-3 text-sm font-semibold text-white">
              Send
            </button>
          </div>
        </div>
      )}
    </>
  )
}
