import { useMemo, useState } from 'react'
import type { BandingPekan } from '../lib/progresPekanan'

// Grafik kecil untuk satu ukuran, satu per panel.
//
// KENAPA BUKAN SATU GRAFIK BERISI SEMUANYA. Berat dalam kilogram, tidur dalam
// jam, protein dalam gram: menumpuknya pada satu sumbu membuat yang berangka
// besar menelan yang berangka kecil, dan menaruhnya pada dua sumbu membuat
// dua garis bisa dipaksa berpotongan di mana saja penulisnya mau. Skala
// sendiri-sendiri, satu panel satu ukuran.
//
// Warnanya diperiksa dengan alat, bukan dikira-kira: pasangan hijau/merah di
// mode terang berjarak deutan dE 6,0 -- di dalam ambang yang HANYA sah bila
// ada penanda kedua. Karena itu setiap arah selalu membawa PANAH DAN KATA,
// dan tidak pernah warna saja.

const WARNA = {
  terang: { membaik: '#047857', memburuk: '#be123c', datar: '#6b7280' },
  gelap: { membaik: '#059669', memburuk: '#f43f5e', datar: '#9ca3af' },
} as const

// Panah mengikuti ANGKANYA, kata membawa PENILAIANNYA.
//
// Semula panah mengikuti penilaian, sehingga berat yang turun 0,8 kg tampil
// sebagai "▲ -0,8 kg · improving": panah naik di sebelah angka negatif.
// Pembaca melihat panahnya lebih dulu, dan panah yang melawan angkanya
// membuat keduanya harus dibaca ulang.
export const GLIF: Record<string, { kata: string }> = {
  membaik: { kata: 'improving' },
  memburuk: { kata: 'worse' },
  datar: { kata: 'flat' },
}

export function panahDelta(delta: number, datar: boolean): string {
  if (datar) return '—'
  return delta > 0 ? '▲' : delta < 0 ? '▼' : '—'
}

function gelapAktif(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('dark')
}

export function GrafikProgres({ banding }: { banding: BandingPekan }) {
  const [sorot, setSorot] = useState<number | null>(null)
  const { deret, ukuran, arah, delta } = banding
  const gelap = gelapAktif()
  const warna = gelap ? WARNA.gelap : WARNA.terang
  const garis = arah ? warna[arah] : warna.datar

  const L = 260, T = 64, pad = { atas: 10, bawah: 16, kiri: 6, kanan: 34 }

  const titik = useMemo(() => {
    if (deret.length === 0) return []
    const nilai = deret.map((d) => d.nilai)
    const min = Math.min(...nilai), maks = Math.max(...nilai)
    const rentang = maks - min || 1
    const lebar = L - pad.kiri - pad.kanan
    const tinggi = T - pad.atas - pad.bawah
    return deret.map((d, i) => ({
      ...d,
      x: pad.kiri + (deret.length === 1 ? lebar / 2 : (i / (deret.length - 1)) * lebar),
      y: pad.atas + tinggi - ((d.nilai - min) / rentang) * tinggi,
    }))
  }, [deret])

  if (deret.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200/70 p-3 dark:border-white/10">
        <div className="text-[11px] font-black text-ink dark:text-white">{ukuran.label}</div>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
          Nothing recorded yet. Left blank rather than charted as zero — a zero here would draw a line at the
          bottom of the axis and read as a measurement.
        </p>
      </div>
    )
  }

  const d = titik.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const akhir = titik[titik.length - 1]
  const aktif = sorot !== null ? titik[sorot] : null

  return (
    <div className="rounded-2xl border border-neutral-200/70 p-3 dark:border-white/10">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-[11px] font-black text-ink dark:text-white">{ukuran.label}</div>
        {arah && delta !== null && (
          // Panah + kata + angka. Warna hanya mengulang apa yang sudah terbaca.
          <div className="text-[10.5px] font-bold" style={{ color: garis }}>
            <span aria-hidden>{panahDelta(delta, arah === 'datar')}</span>{' '}
            {delta > 0 ? '+' : ''}{delta} {ukuran.satuan} · {GLIF[arah].kata}
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${L} ${T}`} width="100%" height={T}
        className="mt-1.5 touch-none"
        role="img"
        aria-label={`${ukuran.label}: ${deret.length} weeks, latest ${akhir.nilai} ${ukuran.satuan}${arah ? `, ${GLIF[arah].kata}` : ''}`}
        onMouseLeave={() => setSorot(null)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          const x = ((e.clientX - r.left) / r.width) * L
          let dekat = 0
          for (let i = 1; i < titik.length; i++) if (Math.abs(titik[i].x - x) < Math.abs(titik[dekat].x - x)) dekat = i
          setSorot(dekat)
        }}
      >
        {/* Garis dasar recessive: sumbu tidak boleh bersaing dengan datanya. */}
        <line x1={pad.kiri} y1={T - pad.bawah} x2={L - pad.kanan} y2={T - pad.bawah}
          stroke="currentColor" strokeWidth={1} className="text-neutral-200 dark:text-white/10" />
        {titik.length > 1 && <path d={d} fill="none" stroke={garis} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
        {aktif && (
          <line x1={aktif.x} y1={pad.atas} x2={aktif.x} y2={T - pad.bawah}
            stroke="currentColor" strokeWidth={1} className="text-neutral-300 dark:text-white/20" />
        )}
        {/* Penanda cukup besar untuk disentuh, dengan cincin permukaan 2px. */}
        <circle cx={akhir.x} cy={akhir.y} r={4.5} fill={garis} stroke="var(--warna-permukaan, #fff)" strokeWidth={2} />
        {aktif && aktif !== akhir && (
          <circle cx={aktif.x} cy={aktif.y} r={4} fill={garis} stroke="var(--warna-permukaan, #fff)" strokeWidth={2} />
        )}
        {/* Label langsung HANYA pada titik terakhir, bukan pada setiap titik. */}
        <text x={L - pad.kanan + 5} y={akhir.y + 3.5} fontSize={10} fontWeight={800}
          fill="currentColor" className="text-neutral-700 dark:text-neutral-200">
          {akhir.nilai}
        </text>
      </svg>

      <div className="mt-0.5 flex items-baseline justify-between text-[9.5px] font-semibold text-neutral-400">
        <span>{deret.length === 1 ? 'one week' : `${deret.length} weeks`}</span>
        <span>{aktif ? `${aktif.pekan} · ${aktif.nilai} ${ukuran.satuan}` : ukuran.satuan}</span>
      </div>
    </div>
  )
}
