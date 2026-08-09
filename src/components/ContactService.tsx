import { useEffect, useRef, useState } from 'react'
import { IconPhone } from './icons'

interface Msg { from: 'user' | 'admin'; text: string }

// v2: bumped so any previously-saved position that had drifted up over the
// header is discarded and everyone resets to the safe lower-corner default.
const POS_KEY = 'panacea_contact_btn_pos_v2'
const MIN_KEY = 'panacea_contact_btn_minimized_v1'

// Keep the floating button confined to the LOWER portion of the screen so it
// can never be dragged up into the header or over the top of page content
// (the "phone logo blocking the view" complaint). Range: just above the bottom
// nav (90px) up to ~38% of the viewport height.
function clampBottom(v: number): number {
  const maxBottom = Math.max(160, Math.round(window.innerHeight * 0.38))
  return Math.min(Math.max(v, 90), maxBottom)
}

// Floating contact-service button present on every page. Admin support is an
// automated AI chatbot (with human escalation) for complaints & problems.
// Draggable vertically and collapsible to a small dot, since on some pages
// (long lists, the weather forecast, bottom sheets) it can sit over content
// the user wants to see.
//
// Stays bottom-LEFT at every viewport size (desktop included) — deliberately
// NOT bottom-right, because the Feed page has its own always-on-desktop
// floating "+" compose button fixed at bottom-8/right-5 (see Feed.tsx). The
// two used to both sit bottom-right on desktop with only ~8px of vertical
// clearance between their default resting spots, so a user-dragged position
// (this button is draggable and persists to localStorage) could land right
// on top of the "+" and block it entirely.
/**
 * Pemicu dukungan sekarang berupa ikon di bilah atas, bukan tombol mengambang.
 *
 * Dulu ada DUA tombol mengambang sekaligus: yang ini di kiri bawah dan tombol
 * "+" di bilah bawah. Keduanya menutupi isi halaman -- pada peta penyakit yang
 * ini menimpa baris cabang, dan pemakai harus menyeretnya dulu untuk membaca
 * apa yang tertutup. Satu ikon di bilah atas tidak menutupi apa pun dan tetap
 * ada di setiap halaman.
 *
 * Panel percakapannya tidak berubah; hanya cara membukanya.
 */
export function ContactService({ hidden, buka, onTutup }: {
  hidden?: boolean
  buka?: boolean
  onTutup?: () => void
} = {}) {
  const [openLokal, setOpenLokal] = useState(false)
  const open = buka ?? openLokal
  const setOpen = (v: boolean | ((x: boolean) => boolean)) => {
    const next = typeof v === 'function' ? v(open) : v
    if (buka !== undefined) { if (!next) onTutup?.() } else setOpenLokal(next)
  }
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      from: 'admin',
      text: 'Hello, this is Panaceamed Support (AI + human team). Tell us about your complaint or issue — your report helps us improve our system and service.',
    },
  ])

  const [bottom, setBottom] = useState<number>(() => {
    try { const v = Number(localStorage.getItem(POS_KEY)); return v > 0 ? clampBottom(v) : 96 } catch { return 96 }
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

  // Dikendalikan dari bilah atas: tidak ada lagi tombol mengambang di sini,
  // jadi ketika tertutup komponen ini tidak menggambar apa pun.
  if (!open) return null

  return (
    <>
      {open && (
        <div className="fixed bottom-24 left-1/2 z-[60] flex h-[26rem] w-[22rem] max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
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
