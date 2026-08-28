import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ambilPantauan, hapusPantauan, type Pantauan } from '../lib/pantauan'

// ─────────────────────────────────────────────────────────────────────────────
// Ubin daftar pantauan — isinya ditentukan pemakainya sendiri.
//
// BENTUKNYA DERET MENDATAR, bukan kisi. Daftar ini boleh panjang (sampai 40),
// dan kisi sepanjang itu akan mendorong seluruh beranda ke bawah. Deret
// mendatar memakai tinggi tetap berapa pun isinya.
//
// TANDA GESER YANG JUJUR: kartu terakhir sengaja dipotong tepinya oleh tepi
// layar. Deret yang berakhir rapi persis di tepi terbaca sebagai deret yang
// sudah habis, dan orang tidak akan pernah menggesernya.
// ─────────────────────────────────────────────────────────────────────────────

const WARNA: Record<string, string> = {
  penyakit: 'bg-rose-500',
  obat: 'bg-amber-500',
  kalkulator: 'bg-sky-500',
  stasiun: 'bg-violet-500',
  fitur: 'bg-brand',
}

export function UbinPantauan() {
  const [daftar, setDaftar] = useState<Pantauan[]>(ambilPantauan)
  const [sunting, setSunting] = useState(false)

  useEffect(() => {
    const on = () => setDaftar(ambilPantauan())
    window.addEventListener('panacea:pantauan', on)
    window.addEventListener('focus', on)
    return () => {
      window.removeEventListener('panacea:pantauan', on)
      window.removeEventListener('focus', on)
    }
  }, [])

  if (!daftar.length) {
    return (
      <section>
        <h2 className="t-kecil mb-2 font-black uppercase tracking-wide text-neutral-500">Watching</h2>
        <button
          onClick={() => window.dispatchEvent(new Event('panacea:cari'))}
          className="t-kecil flex min-h-[64px] w-full items-center justify-center rounded-3xl border border-dashed border-neutral-300 px-3 text-center leading-snug text-neutral-500 dark:border-white/20"
        >
          Nothing yet. Search for a disease, drug, or score, then tap ★ to watch it here.
        </button>
      </section>
    )
  }

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">
          Watching <span className="tabular-nums opacity-60">{daftar.length}</span>
        </h2>
        <button onClick={() => setSunting((v) => !v)} className="t-kecil flex min-h-[40px] items-center font-bold text-brand">
          {sunting ? 'Done' : 'Edit'}
        </button>
      </div>

      {/* geser-aman: gerakan menyamping tidak bertabrakan dengan gerakan
          kembali milik sistem di tepi layar. */}
      <div className="geser-aman geser-kartu -mx-fluid flex gap-2 overflow-x-auto px-fluid pb-1">
        {daftar.map((p) => (
          <div key={p.ke} className="kaca relative w-[148px] shrink-0 rounded-2xl p-2.5">
            <span className={`mb-1.5 block h-1 w-6 rounded-full ${WARNA[p.jenis] ?? 'bg-neutral-400'}`} />
            <Link to={p.ke} className="block">
              <span className="t-kecil line-clamp-2 font-bold leading-snug text-ink dark:text-white">{p.judul}</span>
              <span className="t-mikro mt-0.5 block truncate capitalize text-neutral-500">{p.jenis}</span>
            </Link>
            {sunting && (
              <button
                onClick={() => setDaftar(hapusPantauan(p.ke))}
                aria-label={`Hapus ${p.judul} dari pantauan`}
                className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-rose-500 text-[13px] font-black leading-none text-white"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => window.dispatchEvent(new Event('panacea:cari'))}
          className="t-mikro flex w-[92px] shrink-0 items-center justify-center rounded-2xl border border-dashed border-neutral-300 text-center font-bold text-neutral-500 dark:border-white/20"
        >
          + tambah
        </button>
      </div>
    </section>
  )
}

export default UbinPantauan
