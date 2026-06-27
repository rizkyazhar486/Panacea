import { useState } from 'react'
import { useStore } from '../lib/store'
import { ConsultChat } from '../components/ConsultChat'
import { backendEnabled } from '../lib/api'
import { IconSend, IconX } from '../components/icons'

const THREADS_KEY = 'panacea_dm_threads_v1'

interface Thread { id: string; peer: string } // peer = display name / room code shared between two users

function loadThreads(): Thread[] {
  try { return JSON.parse(localStorage.getItem(THREADS_KEY) || '[]') } catch { return [] }
}
function saveThreads(t: Thread[]) {
  try { localStorage.setItem(THREADS_KEY, JSON.stringify(t)) } catch { /* ignore */ }
}

// Build a stable DM room shared by both participants: sort the two identities so
// A→B and B→A resolve to the same room.
function dmRoom(a: string, b: string): string {
  const key = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return 'dm-' + [key(a), key(b)].sort().join('--')
}

// Direct messages between users — realtime text + video over the same WebSocket
// rooms used for consultations. Two people open a chat using the SAME room code
// (e.g. each other's name/handle) and connect instantly.
export function Messages() {
  const { account } = useStore()
  const [threads, setThreads] = useState<Thread[]>(loadThreads)
  const [open, setOpen] = useState<Thread | null>(null)
  const [draft, setDraft] = useState('')

  if (!account) return null
  const me = account.name

  const start = () => {
    const peer = draft.trim()
    if (!peer) return
    const existing = threads.find((t) => t.peer.toLowerCase() === peer.toLowerCase())
    const thread = existing ?? { id: Math.random().toString(36).slice(2), peer }
    if (!existing) { const next = [thread, ...threads]; setThreads(next); saveThreads(next) }
    setDraft('')
    setOpen(thread)
  }
  const remove = (id: string) => {
    const next = threads.filter((t) => t.id !== id)
    setThreads(next); saveThreads(next)
    if (open?.id === id) setOpen(null)
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-2xl">💬</span>
        <div>
          <h1 className="text-lg font-black text-ink">Pesan</h1>
          <p className="text-xs text-neutral-400">Kirim pesan & panggilan video antar pengguna</p>
        </div>
      </div>

      {!backendEnabled && (
        <div className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
          Pesan realtime aktif saat server tersambung. Tanpa server, percakapan hanya tampil di perangkat ini.
        </div>
      )}

      {/* Start a conversation */}
      <div className="mb-4 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && start()}
          placeholder="Nama/kode teman untuk mulai chat…"
          className="flex-1 rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
        <button onClick={start} disabled={!draft.trim()} aria-label="Mulai percakapan"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>
          <IconSend size={18} />
        </button>
      </div>

      {/* Open conversation */}
      {open ? (
        <div className="space-y-2">
          <button onClick={() => setOpen(null)} className="text-xs font-bold text-brand-dark">← Semua pesan</button>
          <ConsultChat room={dmRoom(me, open.peer)} name={me} title={`💬 ${open.peer}`} />
          <p className="text-center text-[10px] text-neutral-400">Minta teman membuka chat dengan kode/nama <b>{me}</b> agar terhubung ke ruang yang sama.</p>
        </div>
      ) : threads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 p-8 text-center text-xs text-neutral-400">
          Belum ada percakapan. Masukkan nama/kode teman di atas untuk memulai.
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 shadow-sm ring-1 ring-black/5">
              <button onClick={() => setOpen(t)} className="flex flex-1 items-center gap-3 text-left">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-dark">
                  {t.peer.slice(0, 2).toUpperCase()}
                </span>
                <span className="flex-1 truncate text-sm font-semibold text-ink">{t.peer}</span>
              </button>
              <button onClick={() => remove(t.id)} aria-label="Hapus percakapan" className="grid h-8 w-8 place-items-center rounded-full text-neutral-300 hover:bg-neutral-100 hover:text-red-400">
                <IconX size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
