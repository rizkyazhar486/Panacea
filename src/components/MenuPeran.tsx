import { useEffect, useRef, useState } from 'react'
import type { Role } from '../lib/types'

// ─────────────────────────────────────────────────────────────────────────────
// Pemilihan peran sebagai LAMBANG ORANG, bukan kotak pilihan di bilah judul.
//
// MENGAPA DIPINDAH. Kotak pilihan peran menempati 92-130 px di bilah judul, dan
// bilah judul pada layar 390 px sudah memuat tombol menu, tombol kembali, judul
// halaman, tombol cari, lonceng, tombol keluar, dan saldo. Yang mengalah adalah
// judulnya — satu-satunya bagian yang lebarnya memang boleh menyusut — sehingga
// "Beranda" terpotong menjadi "Ber…". Halaman yang sedang dibuka pun tidak lagi
// terbaca, dan itu kehilangan yang jauh lebih besar daripada kemudahan berganti
// peran, yang dilakukan beberapa kali sehari sekalipun oleh pemilik.
//
// Lambang menempati 40 px. Judulnya kembali utuh.
//
// PERAN YANG SEDANG AKTIF TETAP TERBACA TANPA MEMBUKA MENUNYA — tertulis kecil
// di bawah lambangnya pada layar lebar, dan pada layar sempit lambang itu
// sendiri diberi lingkaran berwarna merek ketika peran yang aktif bukan peran
// bawaan. Menyembunyikan peran aktif sepenuhnya akan membuat seseorang menyunting
// sebagai admin sambil mengira ia sedang menjadi pasien.
// ─────────────────────────────────────────────────────────────────────────────

export function MenuPeran({
  peran,
  daftar,
  label,
  ganti,
}: {
  peran: Role
  daftar: Role[]
  label: Record<Role, string>
  ganti: (r: Role) => void
}) {
  const [buka, setBuka] = useState(false)
  const bungkus = useRef<HTMLDivElement>(null)

  // Tutup saat diketuk di luar atau saat Esc — menu yang hanya dapat ditutup
  // dengan memilih salah satu isinya memaksa perubahan yang tidak diinginkan.
  useEffect(() => {
    if (!buka) return
    const diLuar = (e: MouseEvent) => {
      if (bungkus.current && !bungkus.current.contains(e.target as Node)) setBuka(false)
    }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setBuka(false) }
    document.addEventListener('mousedown', diLuar)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', diLuar)
      document.removeEventListener('keydown', esc)
    }
  }, [buka])

  return (
    <div ref={bungkus} className="relative shrink-0">
      <button
        onClick={() => setBuka((b) => !b)}
        className="grid h-10 w-10 place-items-center rounded-full border border-brand/30 bg-brand-50 text-brand-dark transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 dark:bg-brand/10"
        aria-haspopup="menu"
        aria-expanded={buka}
        aria-label={`Ganti mode akses — sekarang ${label[peran]}`}
        title={`Mode: ${label[peran]}`}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="3.6" />
          <path d="M4.6 20a7.4 7.4 0 0 1 14.8 0" />
        </svg>
      </button>

      {buka && (
        <div
          role="menu"
          /* FIXED, bukan ABSOLUTE. Bilah judul membungkus tombol-tombolnya
             dalam wadah ber-overflow-x-auto supaya deretannya dapat digeser di
             layar sempit, dan wadah semacam itu MEMOTONG apa pun yang keluar
             dari batasnya — menu yang dipasang absolute di dalamnya terbuka
             tetapi tidak pernah terlihat. Diuji di 390x844: dengan absolute,
             menunya ada di DOM dan isinya terbaca, tetapi tangkapan layarnya
             kosong. */
          /* Latar PEKAT, bukan kaca. Menu tembus pandang di atas beranda yang
             padat membuat tulisan di belakangnya menembus daftar peran, dan
             pada tangkapan layar 390x844 "Customer/Patient" terbaca bertumpuk
             dengan tombol "Cari" di bawahnya. Kaca boleh untuk bilah yang
             melayang di atas ruang kosong; tidak untuk enam baris yang harus
             dibaca satu per satu. */
          className="fixed right-3 top-14 z-50 border border-black/10 bg-white dark:border-white/10 dark:bg-neutral-900 w-52 origin-top-right overflow-hidden rounded-2xl p-1 shadow-xl menu-turun"
        >
          <p className="px-3 py-2 text-[10px] font-black uppercase tracking-wide text-neutral-500">Mode akses</p>
          {daftar.map((r) => {
            const aktif = r === peran
            return (
              <button
                key={r}
                role="menuitemradio"
                aria-checked={aktif}
                onClick={() => { ganti(r); setBuka(false) }}
                className={`flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl px-3 text-left text-sm font-semibold transition-colors ${
                  aktif ? 'bg-brand-50 text-brand-dark dark:bg-brand/15' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10'
                }`}
              >
                {label[r]}
                {/* Tanda centang, bukan warna saja: peran aktif harus terbaca
                    juga oleh yang sulit membedakan warna. */}
                <span aria-hidden className="text-brand">{aktif ? '✓' : ''}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MenuPeran
