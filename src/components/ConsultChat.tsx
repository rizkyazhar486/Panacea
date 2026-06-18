import { useEffect, useRef, useState } from 'react'
import { wsUrl } from '../lib/api'
import { Button } from './ui'
import { IconStethoscope } from './icons'

interface Line { from?: string; text?: string; type: string; at?: string }

// Real-time consultation room over WebSocket (doctor ↔ patient join the same room).
export function ConsultChat({ room, name }: { room: string; name: string }) {
  const [lines, setLines] = useState<Line[]>([])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const [count, setCount] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ws = new WebSocket(wsUrl())
    wsRef.current = ws
    ws.onopen = () => {
      setConnected(true)
      ws.send(JSON.stringify({ type: 'join', room, from: name }))
    }
    ws.onmessage = (ev) => {
      try {
        const m = JSON.parse(ev.data) as Line & { count?: number }
        if (m.type === 'presence') setCount(m.count ?? 0)
        else setLines((l) => [...l, m])
      } catch {
        /* ignore */
      }
    }
    ws.onclose = () => setConnected(false)
    return () => ws.close()
  }, [room, name])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [lines])

  function send() {
    const t = input.trim()
    if (!t || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify({ type: 'msg', room, text: t, from: name }))
    setInput('')
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200">
      <div className="flex items-center gap-2 bg-ink px-4 py-2.5 text-white">
        <IconStethoscope size={18} className="text-brand" />
        <span className="text-sm font-bold">Ruang: {room}</span>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-white/70">
          <span className={`h-2 w-2 rounded-full ${connected ? 'bg-brand vital-dot' : 'bg-neutral-500'}`} />
          {connected ? `${count} online` : 'menyambung…'}
        </span>
      </div>
      <div ref={scrollRef} className="h-56 space-y-2 overflow-y-auto bg-neutral-50 p-3">
        {lines.length === 0 && <p className="text-center text-xs text-neutral-400">Mulai percakapan…</p>}
        {lines.map((l, i) =>
          l.type === 'system' ? (
            <div key={i} className="text-center text-[11px] text-neutral-400">{l.text}</div>
          ) : (
            <div key={i} className={`flex ${l.from === name ? 'justify-end' : ''}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm ${l.from === name ? 'bg-brand text-white' : 'bg-white ring-1 ring-black/5'}`}>
                {l.from !== name && <div className="text-[10px] font-bold text-brand-dark">{l.from}</div>}
                {l.text}
              </div>
            </div>
          ),
        )}
      </div>
      <div className="flex gap-2 border-t border-neutral-100 p-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ketik pesan…"
          className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <Button onClick={send} disabled={!connected}>Kirim</Button>
      </div>
    </div>
  )
}
