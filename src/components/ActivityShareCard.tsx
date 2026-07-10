import { useEffect, useRef, useState } from 'react'
import { IconX } from './icons'

// Strava-style shareable activity image — dark card, route line traced from
// the real GPS points, big stat row (Distance/Pace/Time), Panaceamed
// watermark. Rendered with plain Canvas2D (no extra dependency), downloadable
// or shared via the Web Share API (falls back to download when unsupported).

interface Point { lat: number; lng: number }

export interface ActivityShareData {
  points: Point[]
  distKm: number
  durSec: number
  sportEmoji: string
  sportName: string
  authorName: string
}

function fmtDur(sec: number): string {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60)
  return h > 0 ? `${h}j ${m}m` : `${m}m ${String(s).padStart(2, '0')}s`
}
function fmtPace(sec: number, km: number): string {
  if (km <= 0) return '—'
  const paceSec = sec / km
  const m = Math.floor(paceSec / 60), s = Math.round(paceSec % 60)
  return `${m}:${String(s).padStart(2, '0')} /km`
}

function drawRoute(ctx: CanvasRenderingContext2D, points: Point[], x: number, y: number, w: number, h: number) {
  if (points.length < 2) return
  const lats = points.map((p) => p.lat), lngs = points.map((p) => p.lng)
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
  const latRange = Math.max(maxLat - minLat, 0.0005)
  const lngRange = Math.max(maxLng - minLng, 0.0005)
  const pad = 24
  const scale = Math.min((w - pad * 2) / lngRange, (h - pad * 2) / latRange)
  const offX = x + (w - lngRange * scale) / 2
  const offY = y + (h - latRange * scale) / 2

  ctx.save()
  ctx.strokeStyle = '#FF5A1F'
  ctx.lineWidth = 5
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.shadowColor = 'rgba(255,90,31,0.6)'
  ctx.shadowBlur = 8
  ctx.beginPath()
  points.forEach((p, i) => {
    const px = offX + (p.lng - minLng) * scale
    const py = offY + h - (p.lat - minLat) * scale
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
  })
  ctx.stroke()
  ctx.restore()
}

async function renderCard(canvas: HTMLCanvasElement, data: ActivityShareData) {
  const W = 1080, H = 1350
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!

  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, '#0c1410')
  grad.addColorStop(1, '#060606')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Author + timestamp header
  ctx.fillStyle = '#ffffff'
  ctx.font = '600 34px "Plus Jakarta Sans", sans-serif'
  ctx.fillText(data.authorName, 56, 90)
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = '400 26px "Plus Jakarta Sans", sans-serif'
  ctx.fillText(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), 56, 130)

  drawRoute(ctx, data.points, 40, 180, W - 80, 620)

  // Panaceamed watermark (bottom-left, Strava-style)
  ctx.fillStyle = '#00BF63'
  ctx.font = '800 32px "Plus Jakarta Sans", sans-serif'
  ctx.fillText('Panaceamed', 56, 860)
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '400 22px "Plus Jakarta Sans", sans-serif'
  ctx.fillText(`${data.sportEmoji} ${data.sportName}`, 56, 895)

  // Stat row
  const stats: [string, string][] = [
    [data.distKm.toFixed(2) + ' km', 'Jarak'],
    [fmtPace(data.durSec, data.distKm), 'Pace'],
    [fmtDur(data.durSec), 'Waktu'],
  ]
  const colW = (W - 112) / 3
  stats.forEach(([val, label], i) => {
    const cx = 56 + colW * i
    ctx.fillStyle = '#ffffff'
    ctx.font = '800 46px "Plus Jakarta Sans", sans-serif'
    ctx.fillText(val, cx, 1010)
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '600 22px "Plus Jakarta Sans", sans-serif'
    ctx.fillText(label, cx, 1045)
  })

  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(56, 1080); ctx.lineTo(W - 56, 1080); ctx.stroke()

  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.font = '400 20px "Plus Jakarta Sans", sans-serif'
  ctx.fillText('Dilacak & dianalisis lewat Panaceamed.id', 56, 1140)
}

export function ActivityShareCard({ data, onClose }: { data: ActivityShareData; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (canvasRef.current) renderCard(canvasRef.current, data) }, [data])

  async function toBlob(): Promise<Blob | null> {
    return new Promise((resolve) => canvasRef.current?.toBlob((b) => resolve(b), 'image/png'))
  }

  async function share() {
    setBusy(true)
    try {
      const blob = await toBlob()
      if (!blob) return
      const file = new File([blob], 'panaceamed-aktivitas.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Aktivitas Panaceamed', text: `${data.sportEmoji} ${data.sportName} — ${data.distKm.toFixed(2)} km` })
      } else {
        download(blob)
      }
    } catch { /* user cancelled share sheet — not an error */ }
    setBusy(false)
  }

  function download(blob: Blob) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'panaceamed-aktivitas.png'; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  async function handleDownload() {
    setBusy(true)
    const blob = await toBlob()
    if (blob) download(blob)
    setBusy(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-sm rounded-3xl bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-black text-ink">Bagikan Aktivitas</h3>
          <button onClick={onClose} aria-label="Tutup" className="grid h-8 w-8 place-items-center rounded-full text-neutral-400 hover:bg-neutral-100"><IconX size={18} /></button>
        </div>
        <canvas ref={canvasRef} className="w-full rounded-2xl" style={{ aspectRatio: '1080/1350' }} />
        <div className="mt-3 flex gap-2">
          <button onClick={handleDownload} disabled={busy} className="liquid-glass-btn liquid-glass-btn--outline flex-1 rounded-full py-2.5 text-xs font-bold text-brand-dark disabled:opacity-50">Unduh Gambar</button>
          <button onClick={share} disabled={busy} className="liquid-glass-btn liquid-glass-btn--primary flex-1 rounded-full py-2.5 text-xs font-bold text-white disabled:opacity-50">Bagikan →</button>
        </div>
      </div>
    </div>
  )
}

export default ActivityShareCard
