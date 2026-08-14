import { useId, useState, type ReactNode } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Primitif penyederhanaan — sedikit tulisan di depan, selengkapnya bila diminta.
//
// Menyederhanakan halaman bukan berarti MEMBUANG penjelasan. Di aplikasi
// kesehatan, penjelasan itulah yang membedakan angka yang bisa dipercaya dari
// angka yang harus ditebak sendiri artinya. Yang salah bukan adanya penjelasan,
// melainkan penjelasan yang dipaksa dibaca semua orang sekaligus.
//
// Karena itu polanya sama di seluruh berkas ini: SATU BARIS YANG BISA DIPAHAMI
// SENDIRIAN di depan, sisanya sedepa jari jauhnya. Pembaca yang buru-buru
// selesai dalam sedetik; pembaca yang ragu tetap bisa sampai ke alasannya.
//
// Tiga hal yang sengaja tidak dilakukan:
//
//   * Teks tidak dipotong dengan elipsis. Kalimat yang terputus di tengah
//     membuat orang mengarang sisanya, dan di konteks kesehatan tebakan itu
//     berbahaya. Yang disembunyikan adalah blok utuh, bukan separuh kalimat.
//   * Ikon tidak menggantikan kata pada informasi yang menentukan keputusan.
//     Emoji bagus sebagai penanda dan jangkar ingatan, buruk sebagai satu-
//     satunya pembawa makna — artinya berbeda antarbudaya dan tidak terbaca
//     pembaca layar. Setiap ikon di sini selalu berdampingan dengan teks.
//   * Detailnya tidak dimuat di halaman lain. Berpindah halaman untuk satu
//     paragraf membuat orang kehilangan tempatnya dan tidak kembali.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Satu baris ringkas yang bisa dibuka. `judul` harus lengkap sendiri — bila
 * pembaca berhenti di situ, ia tetap mendapat jawabannya.
 */
export function Ringkas({
  ikon, judul, anak, bukaAwal = false, nada = 'netral',
}: {
  ikon?: ReactNode
  judul: string
  anak: ReactNode
  bukaAwal?: boolean
  nada?: 'netral' | 'hati-hati'
}) {
  const [buka, setBuka] = useState(bukaAwal)
  const id = useId()
  const warna = nada === 'hati-hati'
    ? 'border-amber-500/30 bg-amber-500/[0.06]'
    : 'border-black/5 bg-white/50'

  return (
    <div className={`rounded-xl border ${warna}`}>
      <button
        onClick={() => setBuka((b) => !b)}
        aria-expanded={buka}
        aria-controls={id}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        {ikon && <span className="shrink-0 text-base" aria-hidden="true">{ikon}</span>}
        <span className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-ink">{judul}</span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          className={`shrink-0 text-neutral-500 transition-transform duration-300 ${buka ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {/* Selalu dirender, tingginya yang dianimasikan. Merender bersyarat
          membuat isinya muncul mendadak tanpa gerak — dan itulah yang membuat
          buka-tutup terasa patah. */}
      <div id={id} className="buka-halus" data-buka={buka} aria-hidden={!buka}>
        <div>
          <div className="px-3 pb-3 text-[12px] leading-relaxed text-neutral-600">{anak}</div>
        </div>
      </div>
    </div>
  )
}

/**
 * Butir berikon. Menggantikan paragraf yang sebenarnya berisi daftar — daftar
 * yang ditulis sebagai paragraf memaksa pembaca memisahkannya sendiri.
 */
export function Poin({ ikon, children }: { ikon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0 text-sm" aria-hidden="true">{ikon}</span>
      <span className="min-w-0 flex-1 text-[12px] leading-relaxed text-neutral-600">{children}</span>
    </div>
  )
}

/**
 * Angka besar dengan label pendek. Satu angka yang terbaca sekilas
 * menggantikan satu kalimat yang harus diurai.
 */
export function Sorot({
  nilai, label, satuan, warna = '#0b7a4b', ikon,
}: {
  nilai: string | number
  label: string
  satuan?: string
  warna?: string
  ikon?: ReactNode
}) {
  return (
    <div className="rounded-xl bg-white/60 p-2.5 text-center">
      {ikon && <div className="text-base" aria-hidden="true">{ikon}</div>}
      <div className="text-lg font-black leading-none tabular-nums" style={{ color: warna }}>
        {nilai}
        {satuan && <span className="ml-0.5 text-[10px] font-bold text-neutral-500">{satuan}</span>}
      </div>
      <div className="mt-1 text-[10px] font-bold uppercase leading-tight tracking-wide text-neutral-500">
        {label}
      </div>
    </div>
  )
}

export default Ringkas
