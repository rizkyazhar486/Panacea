import { useState } from 'react'

/**
 * Mindmap penyakit: satu simpul pusat, cabang berpanah, kotak berwarna.
 *
 * Menggantikan tumpukan paragraf. Yang dihafal orang adalah BENTUK dan WARNA,
 * bukan kalimat — cabang merah selalu bahaya, cabang hijau selalu obat, di
 * penyakit mana pun. Pola yang sama di 600+ penyakit jadi bisa dikenali sekali
 * dan dipakai seterusnya.
 *
 * Disusun menurun, bukan menyebar radial: pada layar 390 px cabang radial
 * menyisakan lebar ±170 px per kotak, terlalu sempit untuk nama obat dan dosis.
 */

export type Cabang = {
  kunci: string
  label: string
  warna: string
  butir: string[]
  /**
   * Berapa butir yang tampak saat cabang tertutup. Untuk cabang FASE prosedur
   * nilainya 1: yang perlu terlihat di peta hanyalah nama fasenya — urutan fase
   * itulah yang dihafal, langkah-langkahnya dipanggil saat fase itu diketuk.
   * Tanpa ini APN memakai 2.172 px hanya untuk keadaan tertutup.
   */
  pratinjau?: number
}

/** Warna cabang — tetap sama di seluruh penyakit supaya jadi kode visual. */
export const WARNA = {
  etio: 'bg-rose-500',
  klinis: 'bg-sky-500',
  dx: 'bg-violet-500',
  px: 'bg-amber-500',
  tx: 'bg-emerald-500',
  dd: 'bg-neutral-400',
  awas: 'bg-red-600',
} as const

/**
 * Pemendekan dilakukan lewat CSS (line-clamp), BUKAN dengan memotong teksnya.
 *
 * Percobaan sebelumnya memotong di batas kalimat. Itu gagal pada korpus ini:
 * banyak butir adalah paragraf yang titik pertamanya baru muncul setelah 300
 * karakter, sehingga butir itu lolos utuh dan mindmap-nya kembali jadi
 * paragraf. Memaksa potong di tengah kalimat lebih buruk lagi — "Amoksisilin
 * 500 mg tiap 8 jam selama 5 hari" menjadi "Amoksisilin 500 mg tiap 8 jam…"
 * menghapus lama terapi dan sisanya tetap terbaca wajar, salah yang tidak
 * kelihatan.
 *
 * Dengan line-clamp, teks di DOM selalu utuh: yang dipotong hanya tampilannya,
 * pemotongannya terlihat jelas sebagai elipsis, dan satu ketuk membukanya.
 */
const KLAMP = 2

function Kotak({ c, buka, onToggle }: { c: Cabang; buka: boolean; onToggle: () => void }) {
  const tampil = buka ? c.butir : c.butir.slice(0, c.pratinjau ?? 3)
  const sisa = c.butir.length - tampil.length
  return (
    <div className="relative pl-6">
      {/* panah dari tulang punggung ke kotak */}
      <span className="absolute left-0 top-[14px] h-px w-4 bg-neutral-300 dark:bg-white/20" />
      <span className="absolute left-[13px] top-[11px] text-[9px] leading-none text-neutral-400">▶</span>
      <button
        onClick={onToggle}
        aria-expanded={buka}
        className="w-full rounded-lg border border-neutral-200 bg-white p-2 text-left dark:border-white/10 dark:bg-white/5"
      >
        <div className="flex items-center gap-1.5">
          <span className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white ${c.warna}`}>
            {c.label}
          </span>
          <span className="ml-auto text-[10px] font-bold text-brand">
            {buka ? '− tutup' : sisa > 0 ? `+${sisa}` : '⤢'}
          </span>
        </div>
        <ul className="mt-1 space-y-0.5">
          {tampil.map((t, i) => (
            <li key={i} className="flex gap-1.5 text-[12px] leading-[1.4] text-ink dark:text-neutral-200">
              <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-neutral-400" />
              <span style={buka ? undefined : {
                display: '-webkit-box', WebkitLineClamp: KLAMP, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>{t}</span>
            </li>
          ))}
        </ul>
      </button>
    </div>
  )
}

export function Mindmap({ pusat, sub, cabang }: { pusat: string; sub?: string; cabang: Cabang[] }) {
  const [buka, setBuka] = useState<string | null>(null)
  const isi = cabang.filter((c) => c.butir.length > 0)
  if (!isi.length) return null
  return (
    <div>
      {/* simpul pusat */}
      <div className="mb-2 inline-block rounded-lg bg-yellow-300 px-3 py-1.5 dark:bg-yellow-400">
        <div className="text-[13px] font-black uppercase tracking-wide text-neutral-900">{pusat}</div>
        {sub && <div className="text-[10px] font-bold text-neutral-700">{sub}</div>}
      </div>
      {/* tulang punggung + cabang */}
      <div className="relative space-y-1.5 border-l border-neutral-300 pl-0 dark:border-white/20">
        {isi.map((c) => (
          <Kotak key={c.kunci} c={c} buka={buka === c.kunci} onToggle={() => setBuka(buka === c.kunci ? null : c.kunci)} />
        ))}
      </div>
    </div>
  )
}
