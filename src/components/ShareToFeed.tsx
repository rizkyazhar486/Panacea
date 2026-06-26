import { useRef, useState } from 'react'
import { useStore, uid } from '../lib/store'
import { uploadOrLocal } from '../lib/upload'
import { IconShare2, IconX } from './icons'
import type { Role } from '../lib/types'

const MAX_VIDEO_SEC = 90

// Reusable "share to social" action: attach a photo or short video (≤90s) and
// publish it as a feed post or a 24-hour story. Icon-first, large tap targets.
export function ShareToFeed({ defaultCaption = '', activity = 'Update' }: { defaultCaption?: string; activity?: string }) {
  const { account, addPost, addStory } = useStore()
  const [open, setOpen] = useState(false)
  const [caption, setCaption] = useState(defaultCaption)
  const [media, setMedia] = useState<{ url: string; kind: 'image' | 'video'; sec?: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  if (!account) return null

  const pick = async (file?: File) => {
    if (!file) return
    setErr('')
    const isVideo = file.type.startsWith('video/')
    if (isVideo) {
      const sec = await videoDuration(file).catch(() => 0)
      if (sec > MAX_VIDEO_SEC) { setErr(`Video maksimal ${MAX_VIDEO_SEC} detik (video Anda ${Math.round(sec)} detik).`); return }
      setBusy(true)
      const url = await uploadOrLocal(file).catch(() => '')
      setBusy(false)
      if (url) setMedia({ url, kind: 'video', sec: Math.round(sec) })
    } else {
      setBusy(true)
      const url = await uploadOrLocal(file).catch(() => '')
      setBusy(false)
      if (url) setMedia({ url, kind: 'image' })
    }
  }

  const reset = () => { setCaption(defaultCaption); setMedia(null); setErr(''); setOpen(false) }

  const publishPost = () => {
    addPost({
      id: uid(),
      authorEmail: account.email,
      authorName: account.name,
      role: account.role as Role,
      kind: media?.kind ?? 'text',
      postType: 'aktivitas',
      activity,
      caption: caption.trim(),
      mediaColor: '#00BF63',
      photos: media?.kind === 'image' ? [media.url] : [],
      videoUrl: media?.kind === 'video' ? media.url : undefined,
      videoSec: media?.sec,
      likes: 0, comments: 0, commentList: [], reposts: 0,
      at: new Date().toISOString(),
    })
    reset()
  }

  const publishStory = () => {
    addStory({
      id: uid(),
      authorEmail: account.email,
      authorName: account.name,
      mediaColor: '#00BF63',
      image: media?.kind === 'image' ? media.url : undefined,
      video: media?.kind === 'video' ? media.url : undefined,
      caption: caption.trim(),
      at: new Date().toISOString(),
    })
    reset()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Bagikan ke beranda atau story"
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition active:scale-95"
        style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}
      >
        <IconShare2 size={16} /> Bagikan
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-black text-ink">Bagikan</h3>
              <button onClick={() => setOpen(false)} aria-label="Tutup" className="grid h-8 w-8 place-items-center rounded-full text-neutral-400 hover:bg-neutral-100"><IconX size={18} /></button>
            </div>

            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Tulis sesuatu…"
              className="mb-3 min-h-[70px] w-full rounded-xl border border-neutral-200 p-3 text-sm outline-none focus:border-brand" />

            {media ? (
              <div className="relative mb-3 overflow-hidden rounded-xl bg-neutral-100">
                {media.kind === 'image'
                  ? <img src={media.url} alt="" className="max-h-56 w-full object-cover" />
                  : <video src={media.url} controls className="max-h-56 w-full" />}
                <button onClick={() => setMedia(null)} aria-label="Hapus media" className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white"><IconX size={16} /></button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} disabled={busy}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand/40 bg-brand-50 py-5 text-brand-dark">
                <span className="text-2xl">📷</span><span className="text-2xl">🎥</span>
                <span className="text-sm font-bold">{busy ? 'Mengunggah…' : `Tambah Foto / Video (maks ${MAX_VIDEO_SEC}s)`}</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />

            {err && <p className="mb-2 text-xs font-semibold text-red-500">{err}</p>}

            <div className="grid grid-cols-2 gap-2">
              <button onClick={publishStory} disabled={busy || (!media && !caption.trim())}
                className="flex items-center justify-center gap-2 rounded-xl bg-neutral-100 py-3 text-sm font-bold text-neutral-700 disabled:opacity-40">
                🟢 Story (24 jam)
              </button>
              <button onClick={publishPost} disabled={busy || (!media && !caption.trim())}
                className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>
                📣 Posting
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function videoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); resolve(v.duration) }
    v.onerror = () => reject(new Error('bad video'))
    v.src = URL.createObjectURL(file)
  })
}
