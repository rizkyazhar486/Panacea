import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { pratinjauBeranda } from '../lib/pratinjauBeranda'
import { ageFromDob } from '../lib/anthro'
import '../styles/rel-widget-rumah.css'

// Papan widget yang bisa digeser, kembali ke Home.
//
// Papan ini tidak pernah dihapus — ia hanya kehilangan pintunya. PapanWidget
// dan Tumpukan masih utuh di repositori, lengkap dengan pemuatan malas,
// pengukuran tinggi per slide, penghormatan pada prefers-reduced-motion dan
// penyunting pilihan widget. Yang hilang adalah halaman yang memasangnya:
// Beranda tidak lagi punya rute sejak Home disusun ulang, jadi seluruh papan
// itu ikut menghilang dari layar tanpa satu pun berkas dihapus.
//
// Berkas ini mengembalikan pintunya, bukan membangun papan kedua. Datanya
// disiapkan persis seperti dulu: dari state pengguna sendiri, bukan dari nilai
// contoh.

const LazyPapanWidget = lazy(() => import('./PapanWidget').then((m) => ({ default: m.PapanWidget })))

function RangkaMuat() {
  return (
    <div
      className="h-[184px] w-full animate-pulse rounded-[26px] border border-black/[.06] bg-black/[.02] dark:border-white/10 dark:bg-white/[.03]"
      role="status"
      aria-label="Loading widgets"
    />
  )
}

export function RelWidgetRumah() {
  const { account, state } = useStore()
  const [segar, setSegar] = useState(0)

  // Widget membaca catatan harian; kalau ada tab lain yang menulis, papan ini
  // ikut menyegarkan diri. Tanpa ini, angkanya benar pada saat dimuat saja.
  useEffect(() => {
    const perbarui = () => setSegar((x) => x + 1)
    window.addEventListener('panacea:health-updated', perbarui)
    window.addEventListener('focus', perbarui)
    return () => {
      window.removeEventListener('panacea:health-updated', perbarui)
      window.removeEventListener('focus', perbarui)
    }
  }, [])

  const makanan = state.foods ?? []
  const tidur = state.sleepLogs ?? []
  const kesehatan = state.wellness ?? {}

  const tanggalCatatan = useMemo(() => {
    const tanggal = new Set<string>()
    for (const t of tidur) if (t?.date) tanggal.add(t.date)
    for (const t of Object.keys(kesehatan)) tanggal.add(t)
    return [...tanggal]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tidur, kesehatan, segar])

  const pratinjau = useMemo(
    () => pratinjauBeranda({
      foods: makanan,
      sleepLogs: tidur,
      umur: account?.dob ? ageFromDob(account.dob) : undefined,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [makanan, tidur, account?.dob, segar],
  )

  return (
    <section aria-label="Your widgets" className="rel-widget-rumah mt-6">
      <Suspense fallback={<RangkaMuat />}>
        <LazyPapanWidget pratinjau={pratinjau} tanggalCatatan={tanggalCatatan} />
      </Suspense>
    </section>
  )
}

export default RelWidgetRumah
