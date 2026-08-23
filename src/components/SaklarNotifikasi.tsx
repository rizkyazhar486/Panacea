import { useEffect, useState } from 'react'
import { api, backendEnabled } from '../lib/api'
import { enablePush, pushStatus, pushSupported, type PushStatus } from '../lib/push'

// ─────────────────────────────────────────────────────────────────────────────
// SATU TOMBOL untuk menghidupkan notifikasi, dari mana pun.
//
// MENGAPA DIBUAT. Menghidupkan notifikasi sebelumnya menuntut TIGA langkah yang
// tidak pernah disebutkan berurutan: menyalakan widget "Pengingat" di beranda,
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
          ? 'Notifikasi aktif. Jenis pengingat yang sudah Anda pilih tetap seperti semula.'
          : 'Notifikasi aktif, dan empat jenis pengingat dinyalakan: pemulihan & tidur, latihan, vital, dan kebiasaan mencatat. Semuanya dapat diubah kapan saja.')
      } catch {
        setKabar('Notifikasi aktif di perangkat ini, tetapi jenis pengingatnya belum tersimpan di server. Coba lagi sebentar.')
      }
    } else if (hasil === 'denied') {
      setKabar('Izin ditolak. Tombol ini tidak dapat membatalkannya — bukalah pengaturan situs di peramban Anda, izinkan notifikasi, lalu kembali ke sini.')
    } else if (hasil === 'unsupported') {
      setKabar('Peramban ini belum mendukungnya. Di iPhone, pasang dahulu aplikasi ini ke Layar Utama lewat menu Bagikan, lalu buka dari ikonnya.')
    } else if (hasil === 'unavailable') {
      setKabar('Server belum siap mengirim notifikasi. Buka “Notifikasi tidak berbunyi?” di widget Pengingat untuk melihat bagian mana yang belum siap.')
    } else {
      setKabar('Belum aktif — izin belum diberikan.')
    }

    setSibuk(false)
    onSelesai?.()
  }

  if (!backendEnabled) return null
  if (keadaan === 'enabled') {
    if (ringkas) return null
    return (
      <p className="t-mikro flex items-center gap-1.5 text-neutral-500">
        <span aria-hidden>✓</span> Notifikasi aktif di perangkat ini.
      </p>
    )
  }

  const bisaDitekan = keadaan !== 'denied' && keadaan !== 'unsupported' && pushSupported()

  return (
    <div className="rounded-2xl bg-brand/10 p-3 dark:bg-brand/15">
      <p className="t-kecil font-bold text-ink dark:text-white">Notifikasi belum aktif</p>
      <p className="t-mikro mt-0.5 leading-snug text-neutral-600 dark:text-neutral-300">
        Satu ketukan menyalakan izin, mendaftarkan perangkat ini, sekaligus memilih jenis pengingat bawaan.
      </p>
      <button
        onClick={nyalakan}
        disabled={sibuk || !bisaDitekan}
        className="t-sedang mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-brand px-4 font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
      >
        {sibuk ? 'Menyiapkan…' : 'Nyalakan notifikasi'}
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
