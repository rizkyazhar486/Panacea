import { useEffect, useState } from 'react'
import { api, backendEnabled } from '../lib/api'

// ─────────────────────────────────────────────────────────────────────────────
// Peringatan: server berjalan TANPA basis data tetap.
//
// APA YANG SEBENARNYA TERJADI. Bila MONGODB_URI belum diisi, seluruh keadaan
// server hanya hidup di satu berkas pada cakram instansnya. Cakram itu bersifat
// sementara: setiap deploy ulang dan setiap restart menghapusnya. Yang dialami
// pemakainya bukan "penyimpanan sementara" melainkan AKUN YANG HILANG — surel
// yang sama tidak lagi dikenali, dan catatan yang sudah tersinkron lenyap.
//
// MENGAPA HARUS DIKATAKAN DI DALAM APLIKASI. Selama ini keadaan itu hanya
// tertulis di catatan log server, yang tidak pernah dilihat siapa pun. Yang
// terlihat hanyalah "gagal masuk" pada suatu hari, tanpa sebab — dan tidak ada
// satu pun cara bagi pemakainya untuk mengetahui bahwa datanya memang sudah
// tidak ada, bukan sedang gagal dibaca.
//
// DITUTUP SEKALI, DIINGAT. Peringatan yang muncul terus-menerus pada keadaan
// yang tidak dapat diubah pemakainya hanya berubah menjadi hiasan.
// ─────────────────────────────────────────────────────────────────────────────

const KUNCI = 'pmd_peringatan_penyimpanan_v1'

export function PeringatanPenyimpanan() {
  const [tampil, setTampil] = useState(false)

  useEffect(() => {
    if (!backendEnabled) return
    try { if (localStorage.getItem(KUNCI) === 'tutup') return } catch { /* abaikan */ }
    let hidup = true
    api.health()
      .then((h) => { if (hidup && h.penyimpanan === 'berkas') setTampil(true) })
      .catch(() => { /* server tidak terhubung bukan urusan peringatan ini */ })
    return () => { hidup = false }
  }, [])

  if (!tampil) return null

  return (
    <div className="mx-auto mb-2 flex max-w-3xl items-start gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-3 py-2 dark:border-amber-500/40 dark:bg-amber-500/10">
      <span aria-hidden>⚠️</span>
      <p className="t-mikro flex-1 leading-snug text-amber-900 dark:text-amber-200">
        <strong>Server berjalan tanpa basis data tetap.</strong> Akun dan data yang tersimpan di server akan hilang
        pada deploy ulang berikutnya — itulah sebabnya sebuah akun bisa mendadak gagal masuk. Catatan di perangkat
        ini sendiri tetap aman. Perbaikannya satu langkah di sisi server: isi <code>MONGODB_URI</code> (MongoDB Atlas
        punya tingkat gratis) lalu deploy ulang.
      </p>
      <button
        onClick={() => { setTampil(false); try { localStorage.setItem(KUNCI, 'tutup') } catch { /* kuota */ } }}
        aria-label="Tutup peringatan"
        className="t-mikro shrink-0 font-black text-amber-900 dark:text-amber-200"
      >
        ✕
      </button>
    </div>
  )
}

export default PeringatanPenyimpanan
