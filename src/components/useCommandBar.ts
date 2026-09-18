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

  useEffect(() => {
    // Gerak dikumpulkan dalam satu bingkai: gulir dan gerak penunjuk keduanya
    // menyala puluhan kali per detik, dan menyetel state pada tiap peristiwa
    // membuat React merender jauh lebih sering daripada layar menggambar.
    let dijadwalkan = false

    const nilai = () => {
      dijadwalkan = false
      const scrollY = Math.max(0, window.scrollY)
      const focusWithin = !!ref.current && ref.current.contains(document.activeElement)
      setState((current) => nextCommandBarState(current, {
        scrollY,
        previousScrollY: previousScrollY.current,
        pointerY: pointerY.current,
        focusWithin,
      }, thresholds))
      previousScrollY.current = scrollY
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

    window.addEventListener('scroll', jadwalkan, { passive: true })
    window.addEventListener('pointermove', padaPenunjuk, { passive: true })
    window.addEventListener('pointerleave', padaPenunjukKeluar, { passive: true })
    window.addEventListener('focusin', jadwalkan)
    window.addEventListener('focusout', jadwalkan)
    jadwalkan()

    return () => {
      window.removeEventListener('scroll', jadwalkan)
      window.removeEventListener('pointermove', padaPenunjuk)
      window.removeEventListener('pointerleave', padaPenunjukKeluar)
      window.removeEventListener('focusin', jadwalkan)
      window.removeEventListener('focusout', jadwalkan)
    }
  }, [ref, thresholds])

  return state
}
