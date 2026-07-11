import { useEffect, useRef, useState } from 'react'
import { useStore, uid } from '../lib/store'
import { uploadOrLocal } from '../lib/upload'
import { IconShare2, IconX, IconDownload } from './icons'
import type { Role } from '../lib/types'

const CARD_W = 1080
const CARD_H = 1350
const logoUrl = import.meta.env.BASE_URL + 'logo-mark.png'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height)
  const sw = w / scale
  const sh = h / scale
  const sx = (img.width - sw) / 2
  const sy = (img.height - sh) / 2
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

export interface StatCardProps {
  activity: string        // e.g. "🏃 Performa Atlet"
  metricLabel: string     // e.g. "VO₂max Estimasi"
  metricValue: string     // e.g. "47.0"
  metricUnit?: string     // e.g. "ml/kg/min"
  badge?: string          // e.g. "Baik"
  secondary?: string      // e.g. "Nadi Maks 178 bpm"
}

// Renders the user's actual stat (the number they want to promote — not just
// a bare photo) onto a branded, shareable card with a small panaceamed.id
// watermark in the bottom-left, then lets them post it in-app AND push it out
// to WhatsApp/Instagram/etc. via the OS share sheet (or download as a fallback).
export function ShareStatCard(props: StatCardProps) {
  const { account, addPost, addStory } = useStore()
  const [open, setOpen] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState(`${props.metricLabel}: ${props.metricValue}${props.metricUnit ? ' ' + props.metricUnit : ''} 💪`)
  const [busy, setBusy] = useState(false)
  const [dataUrl, setDataUrl] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    async function draw() {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = CARD_W
      canvas.height = CARD_H
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      if (photoUrl) {
        try {
          const img = await loadImage(photoUrl)
          drawCover(ctx, img, 0, 0, CARD_W, CARD_H)
        } catch { /* ignore, fall through to solid bg */ }
        const g = ctx.createLinearGradient(0, 0, 0, CARD_H)
        g.addColorStop(0, 'rgba(5,46,28,0.15)')
        g.addColorStop(0.5, 'rgba(5,46,28,0.55)')
        g.addColorStop(1, 'rgba(5,46,28,0.94)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, CARD_W, CARD_H)
      } else {
        const g = ctx.createLinearGradient(0, 0, 0, CARD_H)
        g.addColorStop(0, '#0B7A4B')
        g.addColorStop(1, '#052E1C')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, CARD_W, CARD_H)
      }
      if (cancelled) return

      // Activity label, top.
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.font = '700 34px "Plus Jakarta Sans", sans-serif'
      ctx.fillText(props.activity, 60, 110)

      // Metric label.
      ctx.fillStyle = 'rgba(255,255,255,0.65)'
      ctx.font = '800 30px "Plus Jakarta Sans", sans-serif'
      ctx.fillText(props.metricLabel.toUpperCase(), 60, CARD_H - 480)

      // Big value + unit.
      ctx.fillStyle = '#7CF5B8'
      ctx.font = '900 160px "Plus Jakarta Sans", sans-serif'
      ctx.fillText(props.metricValue, 60, CARD_H - 370)
      const valWidth = ctx.measureText(props.metricValue).width
      if (props.metricUnit) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.font = '700 40px "Plus Jakarta Sans", sans-serif'
        ctx.fillText(props.metricUnit, 60 + valWidth + 18, CARD_H - 370)
      }

      // Tier badge.
      if (props.badge) {
        ctx.font = '800 32px "Plus Jakarta Sans", sans-serif'
        const bw = ctx.measureText(props.badge).width + 64
        roundRect(ctx, 60, CARD_H - 330, bw, 64, 32)
        ctx.fillStyle = 'rgba(124,245,184,0.18)'
        ctx.fill()
        ctx.fillStyle = '#7CF5B8'
        ctx.fillText(props.badge, 92, CARD_H - 286)
      }

      // Secondary line.
      if (props.secondary) {
        ctx.fillStyle = 'rgba(255,255,255,0.75)'
        ctx.font = '600 30px "Plus Jakarta Sans", sans-serif'
        ctx.fillText(props.secondary, 60, CARD_H - 210)
      }

      // Bottom-left brand watermark — always present so shares off-platform
      // are recognizable as coming from Panaceamed.id.
      const chipX = 60, chipY = CARD_H - 70 - 84, chipH = 84
      ctx.fillStyle = 'rgba(255,255,255,0.14)'
      roundRect(ctx, chipX, chipY, 380, chipH, 42)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(chipX + 42, chipY + chipH / 2, 28, 0, Math.PI * 2)
      ctx.fill()
      try {
        const logo = await loadImage(logoUrl)
        ctx.drawImage(logo, chipX + 42 - 20, chipY + chipH / 2 - 20, 40, 40)
      } catch { /* logo optional */ }
      ctx.fillStyle = '#ffffff'
      ctx.font = '800 34px "Plus Jakarta Sans", sans-serif'
      ctx.fillText('panaceamed.id', chipX + 90, chipY + chipH / 2 + 12)

      if (!cancelled) setDataUrl(canvas.toDataURL('image/png'))
    }
    draw()
    return () => { cancelled = true }
  }, [open, photoUrl, props.activity, props.metricLabel, props.metricValue, props.metricUnit, props.badge, props.secondary])

  if (!account) return null
  const acc = account

  const pickPhoto = async (file?: File) => {
    if (!file) return
    setBusy(true)
    const url = await uploadOrLocal(file).catch(() => '')
    setBusy(false)
    if (url) setPhotoUrl(url)
  }

  async function getBlob(): Promise<Blob | null> {
    const canvas = canvasRef.current
    if (!canvas) return null
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png', 0.95))
  }

  // Real external sharing — pushes the rendered card (with the actual number
  // on it, not a bare photo) to WhatsApp/Instagram/etc. via the OS share
  // sheet; falls back to a plain download when Web Share isn't available.
  async function shareExternally() {
    const blob = await getBlob()
    if (!blob) return
    const file = new File([blob], 'panaceamed-stat.png', { type: 'image/png' })
    const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean }
    if (nav.share && nav.canShare?.({ files: [file] })) {
      try { await nav.share({ files: [file], title: 'Panaceamed.id', text: caption }); return } catch { /* user cancelled or unsupported — fall through */ }
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'panaceamed-stat.png'
    document.body.appendChild(a)
    a.click()
    a.remove()
    // Revoking immediately can kill the download mid-flight (the actual
    // file write happens async after click()) — Safari/iOS in particular
    // then shows the download stuck forever instead of completing. Give it
    // a few seconds of headroom before freeing the object URL.
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  async function publishInApp(as: 'post' | 'story') {
    setBusy(true)
    const blob = await getBlob()
    setBusy(false)
    if (!blob) return
    const file = new File([blob], 'panaceamed-stat.png', { type: 'image/png' })
    const url = await uploadOrLocal(file).catch(() => dataUrl)
    if (as === 'post') {
      addPost({
        id: uid(), authorEmail: acc.email, authorName: acc.name, role: acc.role as Role,
        kind: 'image', postType: 'aktivitas', activity: props.activity, caption: caption.trim(),
        mediaColor: '#00BF63', photos: [url], likes: 0, comments: 0, commentList: [], reposts: 0,
        at: new Date().toISOString(),
      })
    } else {
      addStory({ id: uid(), authorEmail: acc.email, authorName: acc.name, mediaColor: '#00BF63', image: url, caption: caption.trim(), at: new Date().toISOString() })
    }
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Bagikan hasil"
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition active:scale-95"
        style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}
      >
        <IconShare2 size={16} /> Bagikan Hasil
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/50 sm:items-center" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-black text-ink">Bagikan Hasil</h3>
              <button onClick={() => setOpen(false)} aria-label="Tutup" className="grid h-8 w-8 place-items-center rounded-full text-neutral-400 hover:bg-neutral-100"><IconX size={18} /></button>
            </div>

            <div className="mb-3 overflow-hidden rounded-2xl bg-neutral-100">
              <canvas ref={canvasRef} className="block w-full" style={{ aspectRatio: `${CARD_W}/${CARD_H}` }} />
            </div>

            <button onClick={() => fileRef.current?.click()} disabled={busy}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand/40 bg-brand-50 py-2.5 text-sm font-bold text-brand-dark">
              📷 {busy ? 'Mengunggah…' : photoUrl ? 'Ganti Foto Latar' : 'Tambah Foto Latar (opsional)'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} />

            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Tulis sesuatu…"
              className="mb-3 min-h-[60px] w-full rounded-xl border border-neutral-200 p-3 text-sm outline-none focus:border-brand" />

            <button onClick={shareExternally} disabled={busy || !dataUrl}
              className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)' }}>
              <IconShare2 size={16} /> Bagikan ke Aplikasi Lain (WA, IG, dll.)
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => publishInApp('story')} disabled={busy || !dataUrl}
                className="flex items-center justify-center gap-2 rounded-xl bg-neutral-100 py-3 text-sm font-bold text-neutral-700 disabled:opacity-40">
                🟢 Story (24 jam)
              </button>
              <button onClick={() => publishInApp('post')} disabled={busy || !dataUrl}
                className="flex items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-bold text-white disabled:opacity-40">
                📣 Posting di Panaceamed
              </button>
            </div>
            <a href={dataUrl} download="panaceamed-stat.png" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-neutral-400 hover:text-neutral-600">
              <IconDownload size={14} /> Unduh gambar
            </a>
          </div>
        </div>
      )}
    </>
  )
}
