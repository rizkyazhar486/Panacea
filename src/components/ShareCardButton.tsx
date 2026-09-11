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

// Tinggi pita watermark di bagian bawah gambar ekspor. Tanpa ruang khusus,
// stempel digambar DI ATAS baris teks terakhir kartu -- terlihat pada laporan
// pengguna: "Panaceamed.id" menimpa kata "finishing".
const PITA_WATERMARK = 84

// Kulit ekspor: hanya hidup di dalam klon html2canvas, tidak pernah pada kartu
// yang tampil di layar.
//
// Dua hal diperbaiki sekaligus di sini.
//
// 1. HURUF. Aplikasi menaruh huruf di `body { font-family: var(--font-sans) }`.
//    html2canvas-pro menyalin simpul kartunya saja ke dalam dokumen lain, jadi
//    pewarisan dari <body> hilang dan peramban jatuh ke huruf bawaannya --
//    serif. Itulah sebabnya gambar yang dibagikan keluar bergaya Times padahal
//    layarnya Inter. Maka tumpukan hurufnya ditulis literal di sini; var() CSS
//    tidak dipakai karena variabelnya pun tinggal di :root yang tidak ikut.
//
// 2. NADA. Permintaannya: sporty, futuristik, modern. Judul memakai Oxanium
//    (huruf geometris yang sudah jadi --font-hero aplikasi), angka memakai
//    JetBrains Mono dengan lebar tetap supaya kolom metrik lurus, dan label
//    mikro ditulis kapital dengan jarak huruf lebar seperti panel telemetri.
const SANS = "'Inter', ui-sans-serif, system-ui, sans-serif"
const HERO = "'Oxanium', 'Space Grotesk', 'Inter', ui-sans-serif, system-ui, sans-serif"
const ANGKA = "'JetBrains Mono', ui-monospace, 'SF Mono', monospace"

const GAYA_EKSPOR = `
.pmd-share-export, .pmd-share-export * {
  font-family: ${SANS} !important;
  -webkit-font-smoothing: antialiased;
}
.pmd-share-export {
  position: relative;
  padding-bottom: ${PITA_WATERMARK}px;
  overflow: hidden;
}
/* Garis sudut diagonal -- satu isyarat kecepatan, bukan hiasan bertumpuk. */
.pmd-share-export::after {
  content: '';
  position: absolute;
  top: 0; right: 0;
  width: 168px; height: 4px;
  background: linear-gradient(90deg, rgba(0,191,99,0) 0%, #00BF63 55%, #FF5A1F 100%);
  transform: translate(38px, 34px) rotate(38deg);
  transform-origin: 100% 0;
}
.pmd-share-export h1,
.pmd-share-export h2,
.pmd-share-export h3 {
  font-family: ${HERO} !important;
  font-weight: 800 !important;
  text-transform: uppercase;
  letter-spacing: 0.015em !important;
}
/* Angka apa pun yang berdiri sendiri dalam sebuah lencana atau metrik. */
.pmd-share-export [data-share-metric],
.pmd-share-export [data-share-metric] * {
  font-family: ${ANGKA} !important;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em !important;
}
.pmd-share-export [data-share-eyebrow] {
  font-family: ${HERO} !important;
  text-transform: uppercase;
  letter-spacing: 0.16em !important;
  font-weight: 700 !important;
}
`

// Latar kartu yang sebenarnya.
//
// Simpul yang dipotret adalah isi kartu; warna permukaannya dipasang oleh
// pembungkus <Card> di atasnya. Dengan backgroundColor: null, gambar yang
// dihasilkan karena itu TEMBUS PANDANG. Di Instagram Stories yang latarnya
// hitam hasilnya kebetulan terbaca, tetapi disimpan ke galeri atau dikirim ke
// pengirim pesan berlatar terang, teks abu-abu muda itu nyaris hilang.
//
// Maka permukaannya diukur, bukan ditebak: leluhur pertama yang benar-benar
// punya warna buram dipakai apa adanya. Mode terang dan gelap sama-sama benar
// tanpa satu pun warna ditulis keras di sini.
function urai(warna: string): { r: number; g: number; b: number; a: number } | null {
  const m = /^rgba?\(([^)]+)\)$/.exec(warna)
  if (!m) return null
  const p = m[1].split(',').map((x) => parseFloat(x))
  if (p.length < 3 || p.some((x) => Number.isNaN(x))) return null
  return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }
}

function luma({ r, g, b }: { r: number; g: number; b: number }): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// Tanah terang dan gelap aplikasi, dipakai hanya sebagai cadangan terakhir.
const TANAH_TERANG = '#ffffff'
const TANAH_GELAP = '#0c1410'

function latarKartu(el: HTMLElement): string {
  // Leluhur pertama yang benar-benar buram. Permukaan kartu dipasang oleh
  // pembungkus <Card> di atas simpul yang dipotret, jadi harus ditelusuri ke
  // atas, bukan dibaca dari simpulnya sendiri.
  let terukur: string | null = null
  for (let n: HTMLElement | null = el; n && n !== document.documentElement; n = n.parentElement) {
    const w = getComputedStyle(n).backgroundColor
    const c = urai(w)
    if (c && c.a >= 0.95) { terukur = w; break }
  }

  // Warna teks kartu menentukan sisi mana yang benar. Di mode gelap, kartunya
  // memakai warna teks terang sementara <body> tetap putih: mengambil putih itu
  // menghasilkan teks putih di atas putih -- terukur, bukan dugaan. Maka hasil
  // ukuran hanya dipakai bila ia benar-benar berlawanan dengan teksnya.
  const teks = urai(getComputedStyle(el).color)
  const lumaTeks = teks ? luma(teks) : 0
  const inginGelap = lumaTeks > 140

  if (terukur) {
    const c = urai(terukur)
    if (c) {
      const kontras = Math.abs(luma(c) - lumaTeks)
      if (kontras >= 70) return terukur
    }
  }
  return inginGelap ? TANAH_GELAP : TANAH_TERANG
}

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
      // Huruf web harus sudah termuat SEBELUM potret diambil. Kalau tidak,
      // klon dirender dengan huruf pengganti dan hasilnya tidak sama dengan
      // layar -- persis kegagalan yang membuat kartu keluar bergaya serif.
      if (document.fonts?.ready) await document.fonts.ready

      const rendered = await html2canvas(targetRef.current, {
        backgroundColor: latarKartu(targetRef.current),
        scale: Math.min(2, window.devicePixelRatio || 1.5),
        useCORS: true,
        onclone: (doc, node) => {
          // Tombol share sendiri berada di dalam simpul yang dipotret, jadi
          // ia ikut tercetak di gambar. Ditandai `data-share-hide` dan
          // dibuang dari klon, bukan disembunyikan di layar.
          node.querySelectorAll('[data-share-hide]').forEach((el) => el.remove())
          const gaya = doc.createElement('style')
          gaya.textContent = GAYA_EKSPOR
          doc.head.appendChild(gaya)
          node.classList.add('pmd-share-export')
        },
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
      data-share-hide
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
