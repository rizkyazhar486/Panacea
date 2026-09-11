import { useState, type RefObject } from 'react'
import html2canvas from 'html2canvas-pro'
import { simpanBerkas } from '../lib/unduh'
import { IconShare2 } from './icons'

// Generic "make this card shareable" button — attach a ref to any card and
// drop this in a corner. Captures the card as-is (whatever chart, gradient,
// or text it holds), stamps a small Panaceamed watermark in the bottom-right
// corner of the exported image only (never on the live card), then hands the
// PNG to the same share/download fallback chain used by the GPS activity
// share card (Web Share sheet → download → open in tab).
//
// Kenapa html2canvas-pro dan bukan html2canvas: Tailwind v4 menulis warnanya
// sebagai oklch()/oklab(), dan html2canvas 1.4.1 lebih tua daripada fungsi
// warna itu. Ia melempar
//
//     Attempting to parse an unsupported color function "oklab"
//
// pada kartu mana pun yang memakai warna tema — yaitu semuanya. Terukur di
// peramban sungguhan pada bundel produksi: 186 aturan oklch di satu berkas
// CSS. Jadi tombol ini tidak pernah bisa bekerja sejak Tailwind v4 dipakai;
// bukan kadang-kadang gagal, tetapi tidak pernah berhasil.
//
// Galatnya dulu ditelan `catch {}` kosong, sehingga tombolnya diam saja:
// tidak ada berkas, tidak ada pesan, tidak ada yang tercatat. Itu sebabnya
// laporannya berbunyi "tombol share tidak berfungsi" dan bukan "share gagal".
// Kegagalan sekarang harus terlihat — lihat `galat` di bawah.

const LOGO = '/logo-mark.png'

async function stampWatermark(source: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const out = document.createElement('canvas')
  out.width = source.width
  out.height = source.height
  const ctx = out.getContext('2d')!
  ctx.drawImage(source, 0, 0)

  const mark = new Image()
  mark.src = LOGO
  await new Promise<void>((resolve) => {
    mark.onload = () => resolve()
    mark.onerror = () => resolve() // watermark is a nice-to-have, never blocks the share
  })

  const size = Math.max(28, Math.round(source.width * 0.055))
  const pad = Math.round(size * 0.55)
  const x = source.width - size - pad
  const y = source.height - size - pad

  if (mark.width > 0) {
    ctx.save()
    ctx.globalAlpha = 0.85
    ctx.shadowColor = 'rgba(0,0,0,0.45)'
    ctx.shadowBlur = size * 0.25
    ctx.drawImage(mark, x, y, size, size)
    ctx.restore()
  }

  // "Panaceamed.id" in small caps just to the left of the mark — legible on
  // any background since it carries its own dark pill.
  ctx.save()
  ctx.font = `700 ${Math.round(size * 0.34)}px "Plus Jakarta Sans", sans-serif`
  const label = 'Panaceamed.id'
  const textW = ctx.measureText(label).width
  const pillPad = size * 0.22
  const pillH = size * 0.62
  const pillX = x - textW - pillPad * 2 - size * 0.15
  const pillY = y + (size - pillH) / 2
  ctx.fillStyle = 'rgba(0,0,0,0.4)'
  ctx.beginPath()
  const r = pillH / 2
  ctx.roundRect(pillX, pillY, textW + pillPad * 2, pillH, r)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, pillX + pillPad, pillY + pillH / 2 + 1)
  ctx.restore()

  return out
}

export function ShareCardButton({
  targetRef,
  fileName,
  title,
  className = '',
}: {
  targetRef: RefObject<HTMLElement>
  fileName: string
  title?: string
  className?: string
}) {
  const [busy, setBusy] = useState(false)
  const [galat, setGalat] = useState(false)

  async function handleShare() {
    if (!targetRef.current || busy) return
    setBusy(true)
    setGalat(false)
    try {
      const rendered = await html2canvas(targetRef.current, {
        backgroundColor: null,
        scale: Math.min(2, window.devicePixelRatio || 1.5),
        useCORS: true,
      })
      const stamped = await stampWatermark(rendered)
      const blob: Blob | null = await new Promise((resolve) => stamped.toBlob((b) => resolve(b), 'image/png'))
      if (blob) await simpanBerkas(blob, fileName, title)
    } catch (e) {
      // Tidak ada jalan pulih otomatis, tetapi diam bukan pilihan: tombol yang
      // gagal tanpa jejak tidak bisa dibedakan dari tombol yang mati.
      console.error('[share] capture failed', e)
      setGalat(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={busy}
      aria-label={galat ? 'Sharing failed — tap to try again' : 'Share this card'}
      title={galat ? 'Sharing failed — tap to try again' : 'Share this card'}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/75 disabled:opacity-50 ${className}`}
    >
      {busy
        ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        : galat
          ? <span aria-hidden className="text-[13px] font-black leading-none text-rose-300">!</span>
          : <IconShare2 size={15} />}
    </button>
  )
}

export default ShareCardButton
