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

export function Tumpukan({ judul, anak }: { judul?: string; anak: { kunci: string; isi: ReactNode }[] }) {
  const wadah = useRef<HTMLDivElement>(null)
  const [aktif, setAktif] = useState(0)

  useEffect(() => {
    const el = wadah.current
    if (!el) return
    let jalan = false
    const gulir = () => {
      if (jalan) return
      jalan = true
      requestAnimationFrame(() => {
        const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth))
        setAktif(Math.min(anak.length - 1, Math.max(0, i)))
        jalan = false
      })
    }
    el.addEventListener('scroll', gulir, { passive: true })
    return () => el.removeEventListener('scroll', gulir)
  }, [anak.length])

  if (!anak.length) return null
  if (anak.length === 1) return <section>{anak[0].isi}</section>

  const ke = (i: number) => {
    const el = wadah.current
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <section>
      {judul && (
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">{judul}</h2>
          {/* Titik halaman: penanda letak DAN tombol. Pada iOS titik ini hanya
              penanda, tetapi di sini ia juga dapat ditekan — pada layar sentuh
              yang lebar, menggeser empat kali lebih lelah daripada menekan
              titik keempat. */}
          <div className="flex items-center gap-1.5">
            {anak.map((a, i) => (
              <button
                key={a.kunci}
                onClick={() => ke(i)}
                aria-label={`Widget ${i + 1} dari ${anak.length}`}
                aria-current={i === aktif}
                className={`h-1.5 rounded-full transition-all ${i === aktif ? 'w-4 bg-brand' : 'w-1.5 bg-neutral-300 dark:bg-white/25'}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* geser-aman: gerakan menyamping tidak bertabrakan dengan gerakan
          kembali milik sistem di tepi layar. */}
      <div
        ref={wadah}
        className="geser-aman flex snap-x snap-mandatory overflow-x-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        {anak.map((a) => (
          <div key={a.kunci} className="w-full shrink-0 snap-center pr-[1px]">
            {a.isi}
          </div>
        ))}
      </div>
    </section>
  )
}

export default Tumpukan
