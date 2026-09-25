import { useLayoutEffect, useRef } from 'react'
import { keadaanAwal, langkahPegas, sudahDiam, type Kotak, type KeadaanPegas } from '../lib/oneShapeSpring'
import '../styles/one-shape.css'

// Satu bentuk di belakang kelompok pilihan. Ia mencari anak aktif
// (aria-selected / aria-current / data-one-shape-active), lalu meluncur dan
// berubah ukuran serta radiusnya ke sana. Saat anak aktif ditekan, bentuk yang
// sama sedikit memampat — satu objek, bukan banyak latar yang menyala-mati.
//
// Hanya presentasi: tidak memegang keadaan fitur, tidak menangkap klik
// (pointer-events: none), dan pada prefers-reduced-motion langsung melompat.

const AKTIF = '[aria-selected="true"],[aria-current="page"],[data-one-shape-active="true"]'

// Wadahnya adalah elemen induk langsung (yang bertanda data-one-shape). Ref
// induk belum terpasang saat efek anak berjalan, jadi induk dibaca dari DOM.
export function OneShape({ tone = 'light' }: { tone?: 'light' | 'green' }) {
  const bentuk = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const el = bentuk.current
    const akar = el?.parentElement
    if (!akar || !el) return
    const hemat = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    let keadaan: KeadaanPegas | null = null
    let target: Kotak | null = null
    let raf = 0
    let lalu = 0
    let tekan = 1

    const ukur = (): Kotak | null => {
      // Wadah "explicit" hanya mempercayai data-one-shape-active: NavLink menandai
      // '/?t=for-you' aria-current di beranda walau tab For You tidak dipilih.
      const a = akar.querySelector<HTMLElement>(akar.dataset.oneShape === 'explicit' ? '[data-one-shape-active="true"]' : AKTIF)
      if (!a) return null
      const r = a.getBoundingClientRect()
      const w = akar.getBoundingClientRect()
      const radius = parseFloat(getComputedStyle(a).borderTopLeftRadius) || r.height / 2
      return { x: r.left - w.left + akar.scrollLeft, y: r.top - w.top + akar.scrollTop, w: r.width, h: r.height, r: Math.min(radius, r.height / 2) }
    }

    const gambar = (k: Kotak) => {
      el.style.transform = `translate3d(${k.x}px, ${k.y}px, 0) scale(${tekan})`
      el.style.width = `${Math.max(0, k.w)}px`
      el.style.height = `${Math.max(0, k.h)}px`
      el.style.borderRadius = `${Math.max(0, k.r)}px`
      el.style.opacity = '1'
    }

    const jalan = (t: number) => {
      raf = 0
      if (!keadaan || !target) return
      const dt = lalu ? (t - lalu) / 1000 : 1 / 60
      lalu = t
      keadaan = langkahPegas(keadaan, target, dt)
      gambar(keadaan.pos)
      if (!sudahDiam(keadaan, target)) raf = requestAnimationFrame(jalan)
      else { keadaan = keadaanAwal(target); gambar(target); lalu = 0 }
    }

    const sasar = () => {
      const k = ukur()
      if (!k) { el.style.opacity = '0'; return }
      target = k
      if (!keadaan || hemat) { keadaan = keadaanAwal(k); gambar(k); return }
      if (!raf) { lalu = 0; raf = requestAnimationFrame(jalan) }
    }

    const ditekan = (e: Event) => {
      if (hemat || !(e.target instanceof Element) || !e.target.closest(akar.dataset.oneShape === 'explicit' ? '[data-one-shape-active="true"]' : AKTIF)) return
      tekan = 0.96
      if (keadaan) gambar(keadaan.pos)
    }
    const dilepas = () => { if (tekan !== 1) { tekan = 1; if (keadaan) gambar(keadaan.pos) } }

    sasar()
    const mo = new MutationObserver(sasar)
    mo.observe(akar, { subtree: true, attributes: true, attributeFilter: ['aria-selected', 'aria-current', 'data-one-shape-active', 'class'] })
    const ro = new ResizeObserver(sasar)
    ro.observe(akar)
    akar.addEventListener('pointerdown', ditekan)
    window.addEventListener('pointerup', dilepas)
    window.addEventListener('pointercancel', dilepas)
    return () => {
      mo.disconnect(); ro.disconnect()
      akar.removeEventListener('pointerdown', ditekan)
      window.removeEventListener('pointerup', dilepas)
      window.removeEventListener('pointercancel', dilepas)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return <span ref={bentuk} aria-hidden className={`pmd-one-shape pmd-one-shape--${tone}`} />
}

export default OneShape
