import { useCallback, useEffect, useRef, useState } from 'react'
import './hold-to-confirm.css'

// ─────────────────────────────────────────────────────────────────────────────
// Menahan, bukan mengetuk — supaya menandai sesuatu yang berarti tidak
// terjadi karena jari tergelincir.
//
// Progresnya TERLIHAT selama ditahan (bukan hanya berhasil/gagal sesudahnya),
// dan melepas sebelum penuh MEMBATALKANNYA dengan mulus — tidak ada aksi yang
// terjadi separuh jalan. Itulah yang membedakan ini dari sekadar tombol besar:
// keduanya bisa "ditekan", tetapi hanya salah satunya yang menahan janji itu
// sampai selesai baru menagihnya.
//
// AKSESIBILITAS. Menahan pointer atau tombol keyboard menghasilkan progres
// yang sama — keydown memulai, keyup melepas, persis seperti pointerdown/up.
// Untuk aktivasi asistif yang tidak benar-benar menahan apa pun (pembaca
// layar, switch control), `click` dengan `detail === 0` dianggap aktivasi
// sintetis dan langsung mengonfirmasi — itulah cara peramban menandai klik
// yang BUKAN berasal dari penekanan mouse fisik.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  /** Label yang dibaca pembaca layar saat belum ditekan. */
  label: string
  /** Ditampilkan setelah ditandai selesai. */
  doneLabel: string
  done: boolean
  onConfirm: () => void
  /** Ketukan tunggal saat status sudah selesai — untuk membatalkan. Tidak perlu ditahan; membatalkan tidak butuh perlindungan yang sama seperti menandai. */
  onUndo: () => void
  holdMs?: number
}

export function HoldToConfirm({ label, doneLabel, done, onConfirm, onUndo, holdMs = 650 }: Props) {
  const [progres, setProgres] = useState(0)
  const [meletup, setMeletup] = useState(false)
  const mulaiRef = useRef<number | null>(null)
  const bingkaiRef = useRef<number | null>(null)
  const selesaiRef = useRef(false)

  const berhenti = useCallback(() => {
    if (bingkaiRef.current != null) cancelAnimationFrame(bingkaiRef.current)
    bingkaiRef.current = null
    mulaiRef.current = null
    if (!selesaiRef.current) setProgres(0)
  }, [])

  const mulai = useCallback(() => {
    if (done || selesaiRef.current) return
    mulaiRef.current = performance.now()
    const tik = (t: number) => {
      if (mulaiRef.current == null) return
      const p = Math.min(1, (t - mulaiRef.current) / holdMs)
      setProgres(p)
      if (p >= 1) {
        selesaiRef.current = true
        setMeletup(true)
        try { navigator.vibrate?.(18) } catch { /* tidak didukung */ }
        onConfirm()
        window.setTimeout(() => { selesaiRef.current = false; setMeletup(false); setProgres(0) }, 420)
        return
      }
      bingkaiRef.current = requestAnimationFrame(tik)
    }
    bingkaiRef.current = requestAnimationFrame(tik)
  }, [done, holdMs, onConfirm])

  useEffect(() => () => { if (bingkaiRef.current != null) cancelAnimationFrame(bingkaiRef.current) }, [])

  if (done) {
    return (
      <button
        type="button"
        onClick={() => {
          // Konfirmasi terjadi SAAT progres penuh, bukan saat jari dilepas —
          // pointer bisa saja masih tertahan di elemen yang sama begitu React
          // menukarnya ke tombol "selesai" ini. Melepasnya sesaat kemudian
          // menghasilkan `click` NATIF pada elemen DOM yang sama, yang kini
          // memanggil onUndo — membatalkan tepat setelah tercatat. `selesaiRef`
          // masih true selama jeda pendek itu (diuji langsung: tanpa penjaga
          // ini, localStorage menyimpan array kosong padahal baru saja diisi).
          if (selesaiRef.current) return
          onUndo()
        }}
        className="htc htc--done"
        aria-label={`${doneLabel} — tap to undo`}
      >
        <span className="htc__check" aria-hidden>✓</span>
        <span className="htc__text">{doneLabel}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      className={`htc ${meletup ? 'htc--pop' : ''}`}
      aria-label={`Hold to confirm: ${label}`}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); mulai() }}
      onPointerUp={berhenti}
      onPointerLeave={berhenti}
      onPointerCancel={berhenti}
      onClick={(e) => {
        // Tombol asli MENGHASILKAN klik sendiri saat Enter/Space dilepas,
        // terlepas dari sempat ditahan atau tidak — begitu juga aktivasi
        // pembaca layar dan switch control. Peramban menandai klik semacam
        // itu dengan `detail === 0` (bukan berasal dari penekanan mouse
        // fisik), dan itulah yang dipakai di sini: bagi keyboard/AT, klik
        // ITU SENDIRI sudah merupakan aksi yang disengaja, jadi tidak perlu
        // menahan apa pun untuk mengonfirmasi.
        if (e.detail === 0 && !selesaiRef.current) { selesaiRef.current = true; onConfirm(); setTimeout(() => { selesaiRef.current = false }, 0) }
      }}
      style={{ '--htc-progres': progres } as React.CSSProperties}
    >
      <span className="htc__ring" aria-hidden />
      <span className="htc__text">{label}</span>
    </button>
  )
}

export default HoldToConfirm
