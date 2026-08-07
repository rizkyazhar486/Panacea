import { useEffect, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Jam yang ikut berjalan.
//
// Kebugaran, kelelahan, dan kesegaran dihitung terhadap WAKTU SEKARANG, bukan
// terhadap tanggal sesi terakhir. Jadi angkanya memang berubah walau tidak ada
// latihan baru — kelelahan meluruh dengan τ 7 hari, kebugaran dengan τ 42 hari.
//
// Masalahnya bukan di rumusnya, melainkan di React: useMemo([workouts, konteks])
// hanya menghitung ulang bila salah satu berubah. Halaman yang dibiarkan terbuka
// — atau tab yang di-restore dari bfcache di iOS, yang lazim terjadi di ponsel —
// akan menampilkan angka yang dihitung berhari-hari lalu dan terlihat "macet".
//
// Hook ini memberi nilai `sekarang` yang ikut berubah, sehingga perhitungan
// menyegarkan diri tanpa perlu memuat ulang halaman:
//   • setiap beberapa menit selama tab terlihat,
//   • dan segera saat tab kembali dilihat atau jendela mendapat fokus — inilah
//     jalur yang menyelamatkan kasus "dibuka lagi hari Senin".
//
// Timer dihentikan saat tab tersembunyi supaya tidak membangunkan ponsel
// percuma; nilai disegarkan sekali ketika tab muncul kembali.
// ─────────────────────────────────────────────────────────────────────────────

/** Waktu sekarang (ms) yang menyegarkan diri. `jedaMenit` = selang penyegaran. */
export function useJam(jedaMenit = 5): number {
  const [sekarang, setSekarang] = useState(() => Date.now())

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined

    const jalan = () => {
      if (timer !== undefined) return
      timer = setInterval(() => setSekarang(Date.now()), jedaMenit * 60_000)
    }
    const berhenti = () => {
      if (timer === undefined) return
      clearInterval(timer)
      timer = undefined
    }
    const segarkan = () => {
      setSekarang(Date.now())
      if (document.visibilityState === 'visible') jalan()
      else berhenti()
    }

    if (document.visibilityState === 'visible') jalan()
    document.addEventListener('visibilitychange', segarkan)
    window.addEventListener('focus', segarkan)
    // Kembali dari bfcache tidak memicu visibilitychange di sebagian Safari.
    window.addEventListener('pageshow', segarkan)

    return () => {
      berhenti()
      document.removeEventListener('visibilitychange', segarkan)
      window.removeEventListener('focus', segarkan)
      window.removeEventListener('pageshow', segarkan)
    }
  }, [jedaMenit])

  return sekarang
}

export default useJam
