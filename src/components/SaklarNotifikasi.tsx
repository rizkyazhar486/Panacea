import { useEffect, useState } from 'react'
import { api, backendEnabled } from '../lib/api'
import { enablePush, pushStatus, pushSupported, type PushStatus } from '../lib/push'

// ─────────────────────────────────────────────────────────────────────────────
// SATU TOMBOL untuk menghidupkan notifikasi, dari mana pun.
//
// MENGAPA DIBUAT. Menghidupkan notifikasi sebelumnya menuntut TIGA langkah yang
// tidak pernah disebutkan berurutan: menyalakan widget "Reminders" di beranda,
// menekan Nyalakan di sana, LALU menyalakan sedikitnya satu jenis pengingat.
// Yang melewatkan langkah ketiga mendapat izin peramban, lencana hijau, dan
// kesunyian — karena mesin aturan tidak punya satu pun jenis yang boleh
// dikirim. Itu bukan setelan yang sulit, melainkan setelan yang MENYESATKAN.
//
// Tombol ini mengerjakan ketiganya sekaligus: meminta izin, mendaftarkan
// langganan, dan menyalakan jenis pengingat bawaan bila BELUM ADA SATU PUN yang
// menyala. Yang sudah pernah mengatur jenisnya sendiri tidak diubah — mematikan
// pilihan orang atas nama kemudahan adalah bentuk lain dari merusaknya.
//
// AKSESIBILITAS. Tombolnya setinggi 48 px (di atas 44 px yang dianjurkan untuk
// sasaran sentuh), keadaannya tidak pernah disampaikan lewat warna saja —
// selalu ada kata-katanya — dan hasilnya diumumkan lewat aria-live supaya
// pembaca layar menyebutkannya tanpa perlu berpindah fokus.
// ─────────────────────────────────────────────────────────────────────────────

const JENIS_BAWAAN = {
  notifPemulihan: true,
  notifLatihanPintar: true,
  notifVital: true,
  notifKebiasaan: true,
}
const SEMUA_JENIS = ['notifPemulihan', 'notifLatihanPintar', 'notifVital', 'notifLingkungan', 'notifGizi', 'notifKebiasaan'] as const

export function SaklarNotifikasi({ ringkas = false, onSelesai }: { ringkas?: boolean; onSelesai?: () => void }) {
  const [keadaan, setKeadaan] = useState<PushStatus>('disabled')
  const [sibuk, setSibuk] = useState(false)
  const [kabar, setKabar] = useState('')

  useEffect(() => { void pushStatus().then(setKeadaan) }, [])

  const nyalakan = async () => {
    setSibuk(true)
    setKabar('')
    const hasil = await enablePush()
    setKeadaan(hasil)

    if (hasil === 'enabled' && backendEnabled) {
      try {
        const s = (await api.getSettings().catch(() => ({}))) as Record<string, unknown> | null
        const adaYangNyala = SEMUA_JENIS.some((k) => (s ?? {})[k] === true)
        // Selisih zona waktu ikut dikirim: pengingat pukul 17.00 yang berbunyi
        // pukul 20.00 sesudah terbang adalah pengingat yang rusak.
        await api.saveSettings({
          ...(adaYangNyala ? {} : JENIS_BAWAAN),
          tzOffsetMin: -new Date().getTimezoneOffset(),
        })
        setKabar(adaYangNyala
          ? 'Notifications are on. The reminder types you already chose are left exactly as they were.'
          : 'Notifications are on, and four reminder types were switched on: recovery & sleep, training, vitals, and logging habits. All of them can be changed at any time.')
      } catch {
        setKabar('Notifications are on for this device, but the reminder types were not saved on the server. Try again in a moment.')
      }
    } else if (hasil === 'denied') {
      setKabar('Permission denied. This button cannot undo that — open your browser\'s site settings, allow notifications, then come back here.')
    } else if (hasil === 'unsupported') {
      setKabar('This browser does not support them yet. On iPhone, add this app to the Home Screen from the Share menu first, then open it from that icon.')
    } else if (hasil === 'unavailable') {
      setKabar('The server is not ready to send notifications. Open “Notifications not arriving?” in the Reminders widget to see which part is missing.')
    } else {
      setKabar('Still off — permission has not been granted.')
    }

    setSibuk(false)
    onSelesai?.()
  }

  if (!backendEnabled) return null
  if (keadaan === 'enabled') {
    if (ringkas) return null
    return (
      <p className="t-mikro flex items-center gap-1.5 text-neutral-500">
        <span aria-hidden>✓</span> Notifications are on for this device.
      </p>
    )
  }

  const bisaDitekan = keadaan !== 'denied' && keadaan !== 'unsupported' && pushSupported()

  return (
    <div className="rounded-2xl bg-brand/10 p-3 dark:bg-brand/15">
      <p className="t-kecil font-bold text-ink dark:text-white">Notifications are off</p>
      <p className="t-mikro mt-0.5 leading-snug text-neutral-600 dark:text-neutral-300">
        One tap grants permission, registers this device, and picks the default reminder types.
      </p>
      <button
        onClick={nyalakan}
        disabled={sibuk || !bisaDitekan}
        className="t-sedang mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-brand px-4 font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
      >
        {sibuk ? 'Setting up…' : 'Turn on notifications'}
      </button>
      {/* Hasilnya diumumkan, bukan hanya ditampilkan: yang memakai pembaca
          layar tidak melihat perubahan warna atau munculnya baris baru. */}
      <p role="status" aria-live="polite" className="t-mikro mt-2 leading-snug text-neutral-600 empty:hidden dark:text-neutral-300">
        {kabar}
      </p>
    </div>
  )
}

export default SaklarNotifikasi
