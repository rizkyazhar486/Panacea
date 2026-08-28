import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, backendEnabled, type Notif } from '../lib/api'

// ─────────────────────────────────────────────────────────────────────────────
// Umpan pemberitahuan di beranda — bukan saklarnya, melainkan ISINYA.
//
// Ubin "Reminders" yang sudah ada hanya memuat saklar: menyalakan kategori,
// memilih jam, memberi izin. Yang TIDAK ada sampai sekarang adalah tempat
// membaca apa yang sebenarnya sudah dikirim. Akibatnya nyata dan sering
// dilaporkan: pemberitahuan datang di layar kunci, tersapu sebelum sempat
// dibaca, dan sesudah itu tidak ada satu pun tempat di dalam aplikasi untuk
// menemukannya lagi. Lonceng di kepala halaman memang menyimpannya, tetapi
// lonceng harus ditekan lebih dulu — dan yang tidak terlihat tidak dibuka.
//
// Bentuknya mengikuti apa yang sudah terbukti bekerja pada aplikasi sejenis:
// beberapa kabar TERAKHIR saja, masing-masing satu baris judul dan satu-dua
// baris isi, waktunya relatif, dan yang belum dibaca ditandai satu titik.
// Bukan kotak masuk lengkap — kotak masuk lengkap sudah ada di lonceng, dan
// menyalinnya ke beranda hanya memindahkan gulungan panjang ke tempat yang
// lebih sempit.
//
// YANG TIDAK DILAKUKAN, DAN ALASANNYA:
//   · Tidak ada kabar contoh saat kotaknya kosong. Umpan berisi contoh membuat
//     orang mengira pengingatnya sudah menyala padahal belum, dan itu kegagalan
//     yang baru diketahui berminggu-minggu kemudian — tepat ketika pengingatnya
//     paling dibutuhkan. Kosong ditulis kosong, beserta sebabnya.
//   · Tidak ada angka merah besar. Jumlah yang belum dibaca ditulis sebagai
//     angka biasa; lencana merah mengubah pemberitahuan kesehatan menjadi
//     utang yang harus dilunasi.
//   · Tidak ada penghapusan per kabar. Menandai terbaca sudah cukup, dan
//     tombol hapus di daftar sesempit ini akan tertekan tanpa disengaja.
// ─────────────────────────────────────────────────────────────────────────────

/** Ikon dan label dari judulnya. Server belum mengirim kategori. */
function jenis(n: Notif): { ikon: string; label: string } {
  const t = `${n.title} ${n.body}`.toLowerCase()
  if (/recovery|pemulihan|hrv|readiness/.test(t)) return { ikon: '🔋', label: 'Recovery' }
  if (/sleep|tidur/.test(t)) return { ikon: '😴', label: 'Sleep' }
  if (/train|latihan|workout|exertion|beban|langkah|steps/.test(t)) return { ikon: '🏃', label: 'Training' }
  if (/dive|selam|terbang|flight/.test(t)) return { ikon: '🤿', label: 'Diving' }
  if (/drug|obat|medic|dose/.test(t)) return { ikon: '💊', label: 'Medication' }
  if (/water|hidrasi|protein|gizi|nutrition|calorie/.test(t)) return { ikon: '🥗', label: 'Nutrition' }
  if (/heart|denyut|tekanan|pressure|vital|suhu/.test(t)) return { ikon: '❤️', label: 'Vitals' }
  if (/prayer|salat|adzan/.test(t)) return { ikon: '🕌', label: 'Prayer' }
  return { ikon: '🔔', label: 'Notice' }
}

function sejak(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (!Number.isFinite(m)) return ''
  if (m < 1) return 'now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d < 7 ? `${d}d ago` : new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const BATAS = 4

export function UbinKabar() {
  const [kabar, setKabar] = useState<Notif[] | null>(null)
  const [gagal, setGagal] = useState(false)

  const muat = useCallback(() => {
    if (!backendEnabled) { setKabar([]); return }
    api.notifications()
      .then((n) => { setKabar(n); setGagal(false) })
      .catch(() => { setKabar([]); setGagal(true) })
  }, [])

  useEffect(() => {
    muat()
    // Disegarkan saat halaman kembali ke depan, bukan dengan pewaktu berkala.
    // Pewaktu membangunkan jaringan setiap beberapa menit sepanjang hari untuk
    // sesuatu yang hanya dibaca ketika layarnya benar-benar dilihat.
    const bangun = () => { if (document.visibilityState === 'visible') muat() }
    document.addEventListener('visibilitychange', bangun)
    return () => document.removeEventListener('visibilitychange', bangun)
  }, [muat])

  if (kabar === null) return null

  const belum = kabar.filter((n) => !n.read).length
  const tampil = kabar.slice(0, BATAS)

  const tandaiSemua = () => {
    setKabar((k) => (k ? k.map((n) => ({ ...n, read: true })) : k))
    api.markNotificationsRead().catch(() => muat())
  }

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">
          Notifications{belum > 0 ? ` · ${belum} new` : ''}
        </h2>
        {belum > 0 ? (
          <button onClick={tandaiSemua} className="t-kecil flex min-h-[40px] items-center font-bold text-brand">
            Mark all read
          </button>
        ) : (
          <Link to="/settings" className="t-kecil flex min-h-[40px] items-center font-bold text-brand">Settings →</Link>
        )}
      </div>

      <div className="kaca rounded-3xl p-3">
        {tampil.length === 0 ? (
          <p className="t-kecil leading-snug text-neutral-500">
            {gagal
              ? 'Could not reach the server just now, so nothing is listed rather than a stale list. Anything already sent is still in the bell at the top of the screen.'
              : backendEnabled
                ? 'Nothing yet. Recovery, training load, sleep, vitals and medication reminders appear here once you turn a category on in Settings — and each one stays readable here after it has left the lock screen.'
                : 'This device is running without the server, so nothing can be delivered. Reminders that run inside the app — the call to prayer, timers — still work from their own screens.'}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {tampil.map((n) => {
              const j = jenis(n)
              const baris = (
                <>
                  <span aria-hidden className="mt-px shrink-0 text-[15px]">{j.ikon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-1.5">
                      <span className="t-kecil min-w-0 flex-1 truncate font-bold text-ink dark:text-white">
                        {n.title}
                      </span>
                      <span className="t-mikro shrink-0 tabular-nums text-neutral-400">{sejak(n.at)}</span>
                    </span>
                    <span className="t-mikro mt-0.5 line-clamp-2 block leading-[1.5] text-neutral-600 dark:text-neutral-300">
                      {n.body}
                    </span>
                    <span className="t-mikro mt-0.5 block font-black uppercase tracking-wide text-neutral-400">
                      {j.label}
                    </span>
                  </span>
                  {/* Titik, bukan lencana merah: penanda "belum dibaca" tidak
                      perlu terlihat seperti peringatan. */}
                  {!n.read && <span aria-label="unread" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />}
                </>
              )
              return (
                <li key={n.id}>
                  {n.url ? (
                    <Link to={n.url} className="flex min-h-[44px] gap-2 rounded-2xl bg-white/60 p-2.5 dark:bg-white/5">
                      {baris}
                    </Link>
                  ) : (
                    <div className="flex min-h-[44px] gap-2 rounded-2xl bg-white/60 p-2.5 dark:bg-white/5">{baris}</div>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {kabar.length > BATAS && (
          <p className="t-mikro mt-2 leading-snug text-neutral-400">
            {kabar.length - BATAS} older {kabar.length - BATAS === 1 ? 'notice' : 'notices'} in the bell at the top of
            the screen.
          </p>
        )}
      </div>
    </section>
  )
}

export default UbinKabar
