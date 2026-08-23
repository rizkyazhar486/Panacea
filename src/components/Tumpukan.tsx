import { useEffect, useRef, useState, type ReactNode } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Tumpukan widget — beberapa widget menempati SATU petak, digeser mendatar.
//
// MENGAPA DITUMPUK. Widget lebar memakan tinggi layar yang sama besar satu per
// satu, dan beranda yang berisi empat widget lebar menjadi empat layar sebelum
// sampai ke bagian lain. Ditumpuk, keempatnya memakai tinggi satu widget dan
// yang lain tinggal digeser.
//
// GESER, BUKAN GANTI OTOMATIS. Widget yang berganti sendiri membuat orang
// kehilangan yang sedang dibacanya, dan lebih buruk lagi: menekan sesuatu yang
// baru saja berganti. Pergantian hanya terjadi karena tangan.
//
// SCROLL-SNAP, BUKAN ANIMASI SENDIRI. Peramban sudah menangani lekatan,
// kelembaman, dan arah kanan-ke-kiri; menulis ulang semuanya dengan JavaScript
// menghasilkan gerak yang selalu sedikit berbeda dari gerak asli sistem, dan
// perbedaan kecil itulah yang membuat sebuah aplikasi terasa bukan bagian dari
// ponselnya.
// ─────────────────────────────────────────────────────────────────────────────

export function Tumpukan({ judul, anak, aksi }: { judul?: string; anak: { kunci: string; isi: ReactNode }[]; aksi?: ReactNode }) {
  const wadah = useRef<HTMLDivElement>(null)
  const [aktif, setAktif] = useState(0)
  /* TINGGI MENGIKUTI HALAMAN YANG SEDANG TAMPAK.
     Wadah geser mengambil tinggi halaman TERTINGGI, sehingga halaman pendek
     menyisakan ruang kosong sebesar selisihnya — pada layar 390 px selisih itu
     mencapai 200 px, dan di layar ia terbaca sebagai bagian yang gagal dimuat.
     Tingginya diukur dari halaman yang tampak, dan diukur ulang saat isinya
     berubah (angka baru, jadwal salat yang datang belakangan). */
  const halaman = useRef<(HTMLDivElement | null)[]>([])
  const [tinggi, setTinggi] = useState<number | undefined>(undefined)

  /* HALAMAN KOSONG DISEMBUNYIKAN, TERMASUK TITIKNYA.
     Widget berhak mengembalikan null bila datanya belum ada — itu aturan yang
     dipegang seluruh berkas ubin. Tetapi di dalam tumpukan, widget yang tidak
     menggambar apa pun tetap menyisakan satu halaman yang dapat digeser ke
     sana lalu kosong, lengkap dengan titik penanda yang menjanjikan ada
     isinya. Karena isi widget baru diketahui SESUDAH digambar (skor menunggu
     jawaban server), yang kosong dikenali dengan mengukur tingginya, bukan
     dengan menebak dari luar. */
  const [kosong, setKosong] = useState<Record<number, boolean>>({})

  /* HALAMAN DIPASANG BERTAHAP.
     Satu tumpukan dapat berisi dua puluh lebih widget, dan setiap widget
     membaca simpanan, memasang pewaktu, kadang menanyakan sesuatu ke server.
     Memasang semuanya pada gambar pertama membuat beranda tersendat beberapa
     ratus milidetik — terasa sebagai "widget ngelag" saat digeser. Yang
     dipasang lebih dulu hanya halaman pertama beserta tetangganya; sisanya
     menyusul saat peramban sedang senggang, beberapa halaman tiap giliran.
     Halaman yang belum dipasang TIDAK dianggap kosong, supaya titiknya tidak
     berkedip hilang-muncul. */
  const [siap, setSiap] = useState(() => Math.min(anak.length, 3))
  useEffect(() => { setSiap((s) => Math.max(s, Math.min(anak.length, 3))) }, [anak.length])
  useEffect(() => {
    if (siap >= anak.length) return
    const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }
    const lanjut = () => setSiap((s) => Math.min(anak.length, s + 3))
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(lanjut, { timeout: 400 })
      return () => (window as unknown as { cancelIdleCallback?: (i: number) => void }).cancelIdleCallback?.(id)
    }
    const id = window.setTimeout(lanjut, 120)
    return () => window.clearTimeout(id)
  }, [siap, anak.length])
  // Digeser lebih cepat daripada pemasangan bertahap: halaman yang dituju
  // dipasang segera, jangan sampai orang menemukan halaman kosong.
  useEffect(() => { setSiap((s) => Math.max(s, Math.min(anak.length, aktif + 3))) }, [aktif, anak.length])

  useEffect(() => {
    const periksa = () => {
      setKosong((lama) => {
        const baru: Record<number, boolean> = {}
        let berubah = false
        anak.forEach((_, i) => {
          // Kosong dikenali dari ADA-TIDAKNYA SIMPUL ANAK, bukan dari tinggi.
          // Tinggi halaman yang sudah disembunyikan selalu nol, sehingga
          // mengukur tinggi akan mengunci halaman itu tersembunyi selamanya —
          // termasuk sesudah jawaban server datang dan isinya muncul.
          const nihil = i < siap && !halaman.current[i]?.firstElementChild
          baru[i] = nihil
          if (lama[i] !== nihil) berubah = true
        })
        return berubah ? baru : lama
      })
    }
    periksa()
    const mo = new MutationObserver(periksa)
    for (const el of halaman.current) if (el) mo.observe(el, { childList: true })
    return () => mo.disconnect()
  }, [anak, siap])

  const tampil = anak.map((a, i) => ({ ...a, i })).filter((a) => !kosong[a.i])

  useEffect(() => {
    const el = halaman.current[tampil[aktif]?.i ?? 0]
    if (!el) return
    const ukur = () => setTinggi(el.scrollHeight || undefined)
    ukur()
    const po = new ResizeObserver(ukur)
    po.observe(el)
    return () => po.disconnect()
  }, [aktif, tampil])

  useEffect(() => {
    const el = wadah.current
    if (!el) return
    let jalan = false
    const gulir = () => {
      if (jalan) return
      jalan = true
      requestAnimationFrame(() => {
        const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth))
        setAktif(Math.max(0, i))
        jalan = false
      })
    }
    el.addEventListener('scroll', gulir, { passive: true })
    return () => el.removeEventListener('scroll', gulir)
  }, [anak.length])

  if (!anak.length) return null

  const ke = (i: number) => {
    const el = wadah.current
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <section>
      {judul && (
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">{judul}</h2>
          {aksi}
          {/* Titik halaman: penanda letak DAN tombol. Pada iOS titik ini hanya
              penanda, tetapi di sini ia juga dapat ditekan — pada layar sentuh
              yang lebar, menggeser empat kali lebih lelah daripada menekan
              titik keempat. */}
          {/* TITIK BERUBAH MENJADI BILAH SAAT HALAMANNYA BANYAK.
              Dua puluh lima titik pada layar 390 px meluber keluar tepi dan
              tidak lagi dapat ditekan satu per satu — terlihat pada tangkapan
              layar. Di atas sepuluh halaman, penandanya menjadi bilah kemajuan
              beserta nomornya: satu benda kecil yang tetap terbaca berapa pun
              banyaknya. */}
          {tampil.length > 10 ? (
            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              <span className="t-mikro tabular-nums text-neutral-400">{aktif + 1}/{tampil.length}</span>
              <span className="block h-1.5 w-16 rounded-full bg-neutral-300 dark:bg-white/25" aria-hidden>
                <span
                  className="block h-full rounded-full bg-brand transition-all"
                  style={{ width: `${((aktif + 1) / tampil.length) * 100}%` }}
                />
              </span>
            </div>
          ) : (
            <div className="ml-auto flex items-center gap-1.5">
              {tampil.length > 1 && tampil.map((a, i) => (
                <button
                  key={a.kunci}
                  onClick={() => ke(i)}
                  aria-label={`Widget ${i + 1} dari ${tampil.length}`}
                  aria-current={i === aktif}
                  className={`h-1.5 rounded-full transition-all ${i === aktif ? 'w-4 bg-brand' : 'w-1.5 bg-neutral-300 dark:bg-white/25'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* geser-aman: gerakan menyamping tidak bertabrakan dengan gerakan
          kembali milik sistem di tepi layar. */}
      <div
        ref={wadah}
        className="geser-halaman items-start"
        /* FIRM, TETAPI TETAP MENGALIR.
           Tingginya mengikuti halaman yang tampak — itu yang membuat tiap
           halaman terasa pas. Yang membuatnya tadinya terasa "loss" adalah dua
           hal lain: petak yang dapat menyusut sampai setinggi satu baris
           sehingga bingkainya seakan hilang, dan geseran yang dapat meluncur
           melewati dua-tiga halaman sekaligus. Sekarang ada tinggi minimum,
           dan tiap geseran berhenti tepat satu halaman. */
        style={{ scrollbarWidth: 'none', height: tinggi, minHeight: 120, transition: 'height 0.22s ease' }}
      >
        {anak.map((a, i) => (
          <div
            key={a.kunci}
            ref={(el) => { halaman.current[i] = el }}
            className={kosong[i] ? 'hidden' : ''}
          >
            {i < siap ? a.isi : null}
          </div>
        ))}
      </div>
    </section>
  )
}

export default Tumpukan
