import { useEffect, useRef, useState } from 'react'
import {
  DEFAULT_COMMAND_BAR_THRESHOLDS,
  nextCommandBarState,
  type CommandBarState,
  type CommandBarThresholds,
} from '../lib/interaction/commandBar'

/**
 * Menyambungkan aturan bilah perintah ke peristiwa peramban.
 *
 * Keputusannya sendiri tinggal di lib/interaction/commandBar supaya dapat
 * diuji tanpa DOM; di sini hanya pembacaan gulir, penunjuk dan fokus.
 *
 * Penunjuk dibaca dari `window`, BUKAN dari elemen bilahnya. Bilah yang sudah
 * menyingkir tidak lagi berada di bawah kursor, jadi mendengarkan hover pada
 * bilah membuatnya tidak akan pernah kembali — pita tangkap di tepi atas
 * viewport-lah yang memanggilnya.
 */
export function useCommandBar(
  ref: React.RefObject<HTMLElement | null>,
  thresholds: CommandBarThresholds = DEFAULT_COMMAND_BAR_THRESHOLDS,
): CommandBarState {
  const [state, setState] = useState<CommandBarState>('shown')
  const previousScrollY = useRef(0)
  const pointerY = useRef<number | null>(null)
  const ketukanAtas = useRef(false)

  useEffect(() => {
    // Gerak dikumpulkan dalam satu bingkai: gulir dan gerak penunjuk keduanya
    // menyala puluhan kali per detik, dan menyetel state pada tiap peristiwa
    // membuat React merender jauh lebih sering daripada layar menggambar.
    let dijadwalkan = false

    const nilai = () => {
      dijadwalkan = false
      const scrollY = Math.max(0, window.scrollY)
      const focusWithin = !!ref.current && ref.current.contains(document.activeElement)
      const tapAtTop = ketukanAtas.current
      ketukanAtas.current = false

      /* MASUKANNYA DIPOTRET DULU, BARU REF-nya DIPERBARUI.
         Sebelum ini `previousScrollY.current` dibaca DI DALAM updater
         setState, sementara barisnya diperbarui tepat sesudah setState
         dipanggil. Updater React 18 berjalan belakangan — kerap SESUDAH
         baris itu — sehingga yang terbaca `previousScrollY` adalah scrollY
         yang sama persis. Selisihnya nol, nol lebih kecil dari ambang getar,
         dan fungsinya mengembalikan keadaan yang sedang berjalan.
         Akibatnya arah gulir tidak terbaca sama sekali: menggulir ke ATAS
         tidak memanggil bilah kembali. Terukur di peramban 390x844 — dari
         y=800 ke y=500 bilahnya tetap 'hidden'; sesudah potret ini dipakai,
         'shown'. Tidak satu pun uji logika murni bisa melihatnya, karena
         yang rusak bukan aturannya melainkan masukan yang diberikan padanya. */
      const masukan = {
        scrollY,
        previousScrollY: previousScrollY.current,
        pointerY: pointerY.current,
        focusWithin,
        tapAtTop,
      }
      previousScrollY.current = scrollY
      setState((current) => nextCommandBarState(current, masukan, thresholds))
    }

    const jadwalkan = () => {
      if (dijadwalkan) return
      dijadwalkan = true
      window.requestAnimationFrame(nilai)
    }

    const padaPenunjuk = (event: PointerEvent) => {
      // Sentuhan tidak punya "dekat tepi atas" yang bermakna: jarinya berada di
      // tempat ia menekan, bukan tempat ia melihat. Hanya penunjuk halus
      // (tetikus/trackpad) yang boleh memanggil bilah lewat kedekatan.
      pointerY.current = event.pointerType === 'mouse' ? event.clientY : null
      jadwalkan()
    }

    const padaPenunjukKeluar = () => {
      pointerY.current = null
      jadwalkan()
    }

    /**
     * Ketukan di pita tepi atas — jalur sentuh untuk memanggil bilah kembali.
     *
     * TIDAK menelan ketukannya: pendengarnya pasif, di window, dan tidak
     * pernah memanggil preventDefault. Isi halaman di bawah 64px teratas
     * tetap menerima ketukan yang sama seperti biasa; yang diambil dari
     * peristiwa ini hanya posisinya.
     *
     * Penunjuk halus sengaja dikecualikan: tetikus sudah punya jalurnya
     * sendiri lewat kedekatan (`pointermove`), dan memakai klik untuk itu
     * akan membuat bilah muncul tiap kali seseorang mengklik apa pun di
     * bagian atas halaman.
     */
    const padaKetukan = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') return
      if (event.clientY > thresholds.revealZonePx) return
      ketukanAtas.current = true
      // Titik acuan gulir disetel ulang supaya guliran kecil yang menyusul
      // ketukan tidak langsung menyembunyikan bilah yang baru saja dipanggil.
      previousScrollY.current = Math.max(0, window.scrollY)
      jadwalkan()
    }

    window.addEventListener('scroll', jadwalkan, { passive: true })
    window.addEventListener('pointermove', padaPenunjuk, { passive: true })
    window.addEventListener('pointerleave', padaPenunjukKeluar, { passive: true })
    window.addEventListener('pointerdown', padaKetukan, { passive: true })
    window.addEventListener('focusin', jadwalkan)
    window.addEventListener('focusout', jadwalkan)
    jadwalkan()

    return () => {
      window.removeEventListener('scroll', jadwalkan)
      window.removeEventListener('pointermove', padaPenunjuk)
      window.removeEventListener('pointerleave', padaPenunjukKeluar)
      window.removeEventListener('pointerdown', padaKetukan)
      window.removeEventListener('focusin', jadwalkan)
      window.removeEventListener('focusout', jadwalkan)
    }
  }, [ref, thresholds])

  return state
}
