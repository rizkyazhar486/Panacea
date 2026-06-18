import { useState } from 'react'
import { IconPhone } from './icons'

interface Msg { from: 'user' | 'admin'; text: string }

// Floating contact-service button present on every page. Admin support is an
// automated AI chatbot (with human escalation) for complaints & problems.
export function ContactService() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      from: 'admin',
      text: 'Halo, ini Layanan Panaceamed (AI + tim manusia). Sampaikan keluhan atau kendala Anda — laporan ini membantu kami memperbaiki sistem & pelayanan.',
    },
  ])

  function send() {
    const t = input.trim()
    if (!t) return
    const next: Msg[] = [...msgs, { from: 'user', text: t }]
    const reply =
      'Terima kasih, keluhan Anda tercatat (tiket #' +
      Math.floor(1000 + Math.random() * 9000) +
      '). Untuk penjadwalan operasi/tindakan, tim admin akan menghubungi Anda. Ada lagi yang bisa kami bantu?'
    setMsgs([...next, { from: 'admin', text: reply }])
    setInput('')
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg transition hover:bg-brand-dark"
        title="Layanan / Contact Service"
        aria-label="Contact Service"
      >
        <IconPhone size={24} />
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-40 flex h-[26rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
          <div className="flex items-center gap-2 bg-ink px-4 py-3 text-white">
            <IconPhone size={18} className="text-brand" />
            <div className="text-sm font-bold">Layanan Panaceamed</div>
            <span className="ml-auto flex items-center gap-1 text-[10px] text-white/60">
              <span className="h-2 w-2 rounded-full bg-brand vital-dot" /> online
            </span>
            <button onClick={() => setOpen(false)} className="ml-2 text-white/70 hover:text-white">✕</button>
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
              placeholder="Tulis keluhan / pertanyaan…"
              className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <button onClick={send} className="rounded-xl bg-brand px-3 text-sm font-semibold text-white">
              Kirim
            </button>
          </div>
        </div>
      )}
    </>
  )
}
